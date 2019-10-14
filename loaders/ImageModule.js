/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const {
	CachedSource,
	OriginalSource,
	RawSource,
	SourceMapSource
} = require('webpack-sources')
const { getContext } = require('loader-runner')

const WebpackError = require('webpack/lib/WebpackError')
const Module = require('webpack/lib/Module')
const ModuleParseError = require('webpack/lib/ModuleParseError')
const ModuleError = require('webpack/lib/ModuleError')
const ModuleWarning = require('webpack/lib/ModuleWarning')
const createHash = require('webpack/lib/util/createHash')
const contextify = require('webpack/lib/util/identifier').contextify

const processImage = require('./process-image')

class NonErrorEmittedError extends WebpackError {
	constructor (error) {
		super()

		this.name = 'NonErrorEmittedError'
		this.message = '(Emitted value instead of an instance of Error) ' + error

		Error.captureStackTrace(this, this.constructor)
	}
}

/**
 * @typedef {Object} CachedSourceEntry
 * @property {TODO} source the generated source
 * @property {string} hash the hash value
 */

class ImageModule extends Module {
	constructor ({
		type,
		request,
		userRequest,
		rawRequest,
		loaders,
		resource,
		matchResource,
		parser,
		generator,
		resolveOptions
	}, scheduler) {
		super(type, getContext(resource))

		// Info from Factory
		this.request = request
		this.userRequest = userRequest
		this.rawRequest = rawRequest
		this.binary = type.startsWith('webassembly')
		this.parser = parser
		this.generator = generator
		this.resource = resource
		this.matchResource = matchResource
		this.loaders = loaders
		if (resolveOptions !== undefined) this.resolveOptions = resolveOptions

		// Info from Build
		this.error = null
		this._source = null
		this._sourceSize = null
		this._buildHash = ''
		this.buildTimestamp = undefined
		/** @private @type {Map<string, CachedSourceEntry>} */
		this._cachedSources = new Map()

		// Options for the NormalModule set by plugins
		// TODO refactor this -> options object filled from Factory
		this.useSourceMap = false
		this.lineToLine = false

		// Cache
		this._lastSuccessfulBuildMeta = {}

		this._scheduler = scheduler
	}

	identifier () {
		return this.request
	}

	readableIdentifier (requestShortener) {
		return requestShortener.shorten(this.userRequest)
	}

	libIdent (options) {
		return contextify(options.context, this.userRequest)
	}

	nameForCondition () {
		const resource = this.matchResource || this.resource
		const idx = resource.indexOf('?')
		if (idx >= 0) return resource.substr(0, idx)
		return resource
	}

	updateCacheModule (module) {
		this.type = module.type
		this.request = module.request
		this.userRequest = module.userRequest
		this.rawRequest = module.rawRequest
		this.parser = module.parser
		this.generator = module.generator
		this.resource = module.resource
		this.matchResource = module.matchResource
		this.loaders = module.loaders
		this.resolveOptions = module.resolveOptions
	}

	createSourceForAsset (name, content, sourceMap) {
		if (!sourceMap) {
			return new RawSource(content)
		}

		if (typeof sourceMap === 'string') {
			return new OriginalSource(content, sourceMap)
		}

		return new SourceMapSource(content, name, sourceMap)
	}

	createLoaderContext (resolver, options, compilation, fs) {
		const requestShortener = compilation.runtimeTemplate.requestShortener
		const getCurrentLoaderName = () => {
			const currentLoader = this.getCurrentLoader(loaderContext)
			if (!currentLoader) return '(not in loader scope)'
			return requestShortener.shorten(currentLoader.loader)
		}
		const loaderContext = {
			version: 2,
			emitWarning: warning => {
				if (!(warning instanceof Error)) {
					warning = new NonErrorEmittedError(warning)
				}
				this.warnings.push(
					new ModuleWarning(this, warning, {
						from: getCurrentLoaderName()
					})
				)
			},
			emitError: error => {
				if (!(error instanceof Error)) {
					error = new NonErrorEmittedError(error)
				}
				this.errors.push(
					new ModuleError(this, error, {
						from: getCurrentLoaderName()
					})
				)
			},
			getLogger: name => {
				const currentLoader = this.getCurrentLoader(loaderContext)
				return compilation.getLogger(() =>
					[currentLoader && currentLoader.loader, name, this.identifier()]
						.filter(Boolean)
						.join('|')
				)
			},
			resolve (context, request, callback) {
				resolver.resolve({}, context, request, {}, callback)
			},
			getResolve (options) {
				const child = options ? resolver.withOptions(options) : resolver
				return (context, request, callback) => {
					if (callback) {
						child.resolve({}, context, request, {}, callback)
					} else {
						return new Promise((resolve, reject) => {
							child.resolve({}, context, request, {}, (err, result) => {
								if (err) reject(err)
								else resolve(result)
							})
						})
					}
				}
			},
			emitFile: (name, content, sourceMap, assetInfo) => {
				if (!this.buildInfo.assets) {
					this.buildInfo.assets = Object.create(null)
					this.buildInfo.assetsInfo = new Map()
				}
				this.buildInfo.assets[name] = this.createSourceForAsset(
					name,
					content,
					sourceMap
				)
				this.buildInfo.assetsInfo.set(name, assetInfo)
			},
			rootContext: options.context,
			webpack: true,
			sourceMap: !!this.useSourceMap,
			mode: options.mode || 'production',
			_module: this,
			_compilation: compilation,
			_compiler: compilation.compiler,
			fs: fs
		}

		compilation.hooks.normalModuleLoader.call(loaderContext, this)
		if (options.loader) {
			Object.assign(loaderContext, options.loader)
		}

		return loaderContext
	}

	getCurrentLoader (loaderContext, index = loaderContext.loaderIndex) {
		if (
			this.loaders &&
			this.loaders.length &&
			index < this.loaders.length &&
			index >= 0 &&
			this.loaders[index]
		) {
			return this.loaders[index]
		}
		return null
	}

	createSource (source) {
		// if there is no identifier return raw source
		if (!this.identifier) {
			return new RawSource(source)
		}

		// from here on we assume we have an identifier
		const identifier = this.identifier()

		return new OriginalSource(source, identifier)
	}

	markModuleAsErrored (error) {
		// Restore build meta from successful build to keep importing state
		this.buildMeta = Object.assign({}, this._lastSuccessfulBuildMeta)
		this.error = error
		this.errors.push(this.error)
		this._source = new RawSource(
			'throw new Error(' + JSON.stringify(this.error.message) + ')'
		)
		this._sourceSize = null
		this._ast = null
	}

	_initBuildHash (compilation) {
		const hash = createHash(compilation.outputOptions.hashFunction)
		if (this._source) {
			hash.update('source')
			this._source.updateHash(hash)
		}
		hash.update('meta')
		hash.update(JSON.stringify(this.buildMeta))
		this._buildHash = /** @type {string} */ (hash.digest('hex'))
	}

	build (options, compilation, resolver, fs, callback) {
		this.buildTimestamp = Date.now()
		this.built = true
		this._source = null
		this._sourceSize = null
		this._ast = null
		this._buildHash = ''
		this.error = null
		this.errors.length = 0
		this.warnings.length = 0
		this.buildMeta = {}
		this.buildInfo = {
			cacheable: false,
			fileDependencies: new Set(),
			contextDependencies: new Set(),
			assets: undefined,
			assetsInfo: undefined
		}
		const loaderContext = this.createLoaderContext(
			resolver,
			options,
			compilation,
			fs
		)
		loaderContext.resourcePath = this.resource
		return this._scheduler.queue(() => processImage.call(loaderContext, this.resource).then(source => {
			this._source = this.createSource(source)
			this._cachedSources.clear()

			const handleParseError = e => {
				const source = this._source.source()
				const loaders = this.loaders.map(item =>
					contextify(options.context, item.loader)
				)
				const error = new ModuleParseError(this, source, e, loaders)
				this.markModuleAsErrored(error)
				this._initBuildHash(compilation)
				return callback()
			}

			const handleParseResult = result => {
				this._lastSuccessfulBuildMeta = this.buildMeta
				this._initBuildHash(compilation)
				return callback()
			}

			try {
				const result = this.parser.parse(
					this._ast || this._source.source(),
					{
						current: this,
						module: this,
						compilation: compilation,
						options: options
					},
					(err, result) => {
						if (err) {
							handleParseError(err)
						} else {
							handleParseResult(result)
						}
					}
				)
				if (result !== undefined) {
					// parse is sync
					handleParseResult(result)
				}
			} catch (e) {
				handleParseError(e)
			}
		}).catch(err => {
			this._cachedSources.clear()

			// if we have an error mark module as failed and exit
			if (err) {
				this.markModuleAsErrored(err)
				this._initBuildHash(compilation)
				return callback()
			}
			return Promise.resolve()
		}))
	}

	getHashDigest (dependencyTemplates) {
		// TODO webpack 5 refactor
		let dtHash = dependencyTemplates.get('hash')
		return `${this.hash}-${dtHash}`
	}

	source (dependencyTemplates, runtimeTemplate, type = 'javascript') {
		const hashDigest = this.getHashDigest(dependencyTemplates)
		const cacheEntry = this._cachedSources.get(type)
		if (cacheEntry !== undefined && cacheEntry.hash === hashDigest) {
			// We can reuse the cached source
			return cacheEntry.source
		}

		const source = this.generator.generate(
			this,
			dependencyTemplates,
			runtimeTemplate,
			type
		)

		const cachedSource = new CachedSource(source)
		this._cachedSources.set(type, {
			source: cachedSource,
			hash: hashDigest
		})
		return cachedSource
	}

	originalSource () {
		return this._source
	}

	needRebuild (fileTimestamps, contextTimestamps) {
		// always try to rebuild in case of an error
		if (this.error) return true

		// always rebuild when module is not cacheable
		if (!this.buildInfo.cacheable) return true

		// Check timestamps of all dependencies
		// Missing timestamp -> need rebuild
		// Timestamp bigger than buildTimestamp -> need rebuild
		for (const file of this.buildInfo.fileDependencies) {
			const timestamp = fileTimestamps.get(file)
			if (!timestamp) return true
			if (timestamp >= this.buildTimestamp) return true
		}
		for (const file of this.buildInfo.contextDependencies) {
			const timestamp = contextTimestamps.get(file)
			if (!timestamp) return true
			if (timestamp >= this.buildTimestamp) return true
		}
		// elsewise -> no rebuild needed
		return false
	}

	size () {
		if (this._sourceSize === null) {
			this._sourceSize = this._source ? this._source.size() : -1
		}
		return this._sourceSize
	}

	/**
	 * @param {Hash} hash the hash used to track dependencies
	 * @returns {void}
	 */
	updateHash (hash) {
		hash.update(this._buildHash)
		super.updateHash(hash)
	}
}

module.exports = ImageModule
