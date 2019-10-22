// TODO:
// - replace probe image size with sharp metadata?
// - exif rotation?
// - loader gets called multiple times per image?

const crypto = require('crypto')
const fs = require('fs-extra')
const path = require('path')
const loaderUtils = require('loader-utils')
const probeImageSize = require('probe-image-size')
const sharp = require('sharp')
const ExifImage = require('exif').ExifImage
const yaml = require('js-yaml')
const findCacheDir = require('find-cache-dir')

const BLUR_WIDTH = 64

const SIZES = [
	{name: 'thumbnail', height: 300}, // thumbnail for image stream
	{width: 480},
	{width: 1024},
	{width: 1280},
	{width: 1920},
	{width: 2560}
]

const CACHE_DIRECTORY = findCacheDir({name: 'photonenarchiv'})

function digest (str) {
	return crypto
		.createHash('sha1')
		.update(str)
		.digest('hex')
}

function cacheKeyFn (resource) {
	const hash = digest(resource)
	return path.join(CACHE_DIRECTORY, `${hash}.json`)
}

async function cacheFile (filePath, content) {
	await fs.writeFile(path.join(CACHE_DIRECTORY, filePath), content)
}

async function loadCachedFile (filePath) {
	return fs.readFile(path.join(CACHE_DIRECTORY, filePath))
}

async function processSource (resource) {
	const sourceBuffer = await fs.readFile(resource) // TODO use this.fs ?
	const sourceSize = probeImageSize.sync(sourceBuffer)

	// assemble metadata
	const response = {
		metadata: {}
	}

	ExifImage({ image: sourceBuffer }, (error, exifData) => {
		if (error) return // console.error('EXIF ERROR' + error.message)
		response.metadata.artist = exifData.image.Artist
		response.metadata.date = exifData.image.DateTimeOriginal
	})
	const generateSizedImage = async (size) => {
		let sizedNamePart = ''
		let imageBuffer = sourceBuffer
		sizedNamePart += '.'
		const resizeOptions = {}
		if (size.height) {
			if (size.height >= sourceSize.height) return
			sizedNamePart += `h${size.height}`
			resizeOptions.height = Number(size.height)
		}
		if (size.width) {
			if (size.width >= sourceSize.width) return
			sizedNamePart += `w${size.width}`
			resizeOptions.width = Number(size.width)
		}
		imageBuffer = await sharp(sourceBuffer).resize(resizeOptions).toBuffer()
		const resizedSize = probeImageSize.sync(imageBuffer)
		const imagePath = path.join('album-images', loaderUtils.interpolateName(this, `[name]${sizedNamePart}.[sha1:hash].[ext]`, {content: imageBuffer}))
		this.emitFile(imagePath, imageBuffer)
		cacheFile(imagePath, imageBuffer)
		return {
			name: size.name,
			width: resizedSize.width,
			height: resizedSize.height,
			src: imagePath
		}
	}
	const [sizes, placeholderBuffer] = await Promise.all([await Promise.all(SIZES.map(generateSizedImage)), await sharp(sourceBuffer).resize({width: BLUR_WIDTH}).toBuffer()])
	response.sizes = sizes.filter(size => !!size)
	// generate placeholder
	response.placeholderSrc = `data:${sourceSize.mime};base64,${placeholderBuffer.toString('base64')}`
	// full size
	const imagePath = path.join('album-images', loaderUtils.interpolateName(this, `[name].[sha1:hash].[ext]`, {content: sourceBuffer}))
	this.emitFile(imagePath, sourceBuffer)
	response.sizes.push({
		width: sourceSize.width,
		height: sourceSize.height,
		src: imagePath
	})
	return response
}

module.exports = async function (resource) {
	const { dir, name, ext } = path.parse(resource)
	if (!['.png', '.jpeg', '.jpg', '.webp'].includes(ext)) return
	const cacheKey = cacheKeyFn(resource)
	let response
	try {
		const cached = await fs.readFile(cacheKey, 'utf8')
		response = JSON.parse(cached)
		for (const [index, size] of response.sizes.entries()) {
			if (index === response.sizes.length - 1) { // last one is source file, which is not cached
				this.emitFile(size.src, await fs.readFile(resource))
			} else {
				this.emitFile(size.src, await loadCachedFile(size.src))
			}
		}
	} catch (e) {
		if (e.code !== 'ENOENT') throw e
		response = await processSource.call(this, resource)
		await fs.mkdir(path.join(CACHE_DIRECTORY, 'album-images'), {recursive: true})
		await fs.writeFile(cacheKey, JSON.stringify(response), 'utf8')
	}
	// try reading FILENAME.yml, this is not cached
	try {
		const rawMetadata = await fs.readFile(path.join(dir, name + '.yml'), 'utf-8')
		const metadata = yaml.safeLoad(rawMetadata)
		Object.assign(response.metadata, metadata)
	} catch (e) {
		if (e.code !== 'ENOENT') throw e
	}
	return 'module.exports = ' + JSON.stringify(response)
}
module.exports.raw = true // get raw buffer
