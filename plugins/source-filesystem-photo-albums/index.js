const path = require('path')
const fs = require('fs-extra')
const yaml = require('js-yaml')
const { mapValues } = require('lodash')

const isDev = process.env.NODE_ENV === 'development'

class FilesystemImageSource {
	static defaultOptions () {
		return {
			path: undefined,
			index: ['index'],
			albumTypeName: 'Event',
			photoTypeName: 'Photo'
		}
	}

	constructor (api, options) {
		this.api = api
		this.options = options
		this.store = api.store
		this.context = api.context

		api.loadSource(async () => {
			this.createContentTypes()
			await this.createNodes()
			// if (isDev) this.watchFiles()
		})
	}

	createContentTypes () {
		this.albumType = this.store.addContentType({
			typeName: this.options.albumTypeName
		})
		// this.albumType.addSchemaField('thumbnail', ({ graphql }) => ({
		// 	type: graphql.Image
		// }))
		this.photoType = this.store.addContentType({
			typeName: this.options.photoTypeName
		})
	}

	async createNodes () {
		const albumPaths = await fs.readdir(path.join(this.context, this.options.path))
		await Promise.all(albumPaths.map(async albumPath => {
			albumPath = path.join(this.options.path, albumPath)
			const absoluteAlbumPath = path.join(this.context, albumPath)
			const album = await this.createAlbum(albumPath, absoluteAlbumPath)
			const photos = await fs.readdir(absoluteAlbumPath)
			await Promise.all(photos.map(async photoPath => {
				if (!photoPath.endsWith('.jpg') && !photoPath.endsWith('.png')) return
				const options = await this.createNodeOptions(path.join(albumPath, photoPath))
				const node = this.photoType.addNode({
					album: this.store.createReference(album),
					...options,
				})
			}))

			//
			// this.createNodeRefs(node)
		}))
	}

	async createAlbum (albumPath, absoluteAlbumPath) {
		const config = yaml.safeLoad(await fs.readFile(path.join(absoluteAlbumPath, 'index.yml'), 'utf-8'))
		const routePath = this.createPath({ dir: albumPath, name: 'index' })
		return this.albumType.addNode({
			id: this.store.makeUid(albumPath),
			path: routePath,
			...config,
			thumbnail: path.join(absoluteAlbumPath, config.thumbnail)
		})
	}

	watchFiles () {
		const chokidar = require('chokidar')

		const watcher = chokidar.watch(this.options.path, {
			cwd: this.context,
			ignoreInitial: true
		})

		watcher.on('add', async file => {
			const options = await this.createNodeOptions(file)
			const node = this.contentType.addNode(options)
		})

		watcher.on('unlink', file => {
			const absPath = path.join(this.context, file)

			this.contentType.removeNode({
				'internal.origin': absPath
			})
		})

		watcher.on('change', async file => {
			const options = await this.createNodeOptions(file)
			const node = this.contentType.updateNode(options)
		})
	}

	// helpers

	async createNodeOptions (file) {
		const origin = path.join(this.context, file)
		const relPath = path.relative(this.context, file)
		const mimeType = this.store.mime.lookup(file)
		const id = this.store.makeUid(relPath)
		const { dir, name, ext = '' } = path.parse(file)
		const routePath = this.createPath({ dir, name })
		let metadata
		try {
			const rawMetadata = await fs.readFile(path.join(this.context, dir, name + '.yml'), 'utf-8')
			metadata = yaml.safeLoad(rawMetadata)
		} catch (e) {
			if (e.code !== 'ENOENT')
			throw e
		}
		return {
			id,
			path: routePath,
			imagePath: path.join(this.context, relPath),
			...metadata,
			fileInfo: {
				extension: ext,
				directory: dir,
				path: file,
				name
			},
			internal: {
				mimeType,
				origin
			}
		}
	}

	createPath ({ dir, name }) {
		if (this.options.route) return

		const segments = dir.split('/').map(s => this.store.slugify(s))

		if (!this.options.index.includes(name)) {
			segments.push(this.store.slugify(name))
		}

		return `/${segments.join('/')}`
	}
}

module.exports = FilesystemImageSource
