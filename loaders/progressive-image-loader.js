// TODO:
// - replace probe image size with sharp metadata?
// - exif rotation?

const fs = require('fs-extra')
const path = require('path')
const loaderUtils = require('loader-utils')
const probeImageSize = require('probe-image-size')
const sharp = require('sharp')

const BLUR_WIDTH = 64

const SIZES = [
	{name: 'thumbnail', height: 300}, // thumbnail for image stream
	{width: 480},
	{width: 1024},
	{width: 1280},
	{width: 1920},
	{width: 2560}
]
module.exports.raw = true // get raw buffer
module.exports = async function (sourceBuffer) {
	const { ext } = path.parse(this.resourcePath)
	if (!['.png', '.jpeg', '.jpg', '.webp'].includes(ext)) return
	// const options = loaderUtils.getOptions(this)
	sourceBuffer = await fs.readFile(this.resourcePath) // no clue why I have to read the file again for this to work

	const sourceSize = probeImageSize.sync(sourceBuffer)

	const response = {
		sizes: []
	}
	for (const size of SIZES) {
		let sizedNamePart = ''
		let imageBuffer = sourceBuffer
		sizedNamePart += '.'
		const resizeOptions = {}
		if (size.height) {
			if (size.height >= sourceSize.height) continue
			sizedNamePart += `h${size.height}`
			resizeOptions.height = Number(size.height)
		}
		if (size.width) {
			if (size.width >= sourceSize.width) continue
			sizedNamePart += `w${size.width}`
			resizeOptions.width = Number(size.width)
		}
		imageBuffer = await sharp(sourceBuffer).resize(resizeOptions).toBuffer()
		const resizedSize = probeImageSize.sync(imageBuffer)
		const imagePath = path.join('album-images', loaderUtils.interpolateName(this, `[name]${sizedNamePart}.[sha1:hash].[ext]`, {content: imageBuffer}))
		this.emitFile(imagePath, imageBuffer)
		response.sizes.push({
			name: size.name,
			width: resizedSize.width,
			height: resizedSize.height,
			src: path.join('/_nuxt', imagePath)
		})
	}

	// full size
	const imagePath = path.join('album-images', loaderUtils.interpolateName(this, `[name].[sha1:hash].[ext]`, {content: sourceBuffer}))
	this.emitFile(imagePath, sourceBuffer)
	response.sizes.push({
		width: sourceSize.width,
		height: sourceSize.height,
		src: path.join('/_nuxt', imagePath)
	})

	// generate placeholder
	const placeholderBuffer = await sharp(sourceBuffer).resize({width: BLUR_WIDTH}).toBuffer()
	response.placeholderSrc = `data:${sourceSize.mime};base64,${placeholderBuffer.toString('base64')}`
	return 'module.exports = ' + JSON.stringify(response)
}
