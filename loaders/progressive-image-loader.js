const fs = require('fs-extra')
const path = require('path')
const loaderUtils = require('loader-utils')
const probeImageSize = require('probe-image-size')
const sharp = require('sharp')

const BLUR_WIDTH = 64

module.exports = async function (source) {
	const { ext } = path.parse(this.resourcePath)
	if (!['.png', '.jpeg', '.jpg', '.webp'].includes(ext)) return
	const options = loaderUtils.getOptions(this)
	const sourceBuffer = await fs.readFile(this.resourcePath)
	let sizedNamePart = ''
	let imageBuffer = sourceBuffer
	if (options) {
		sizedNamePart += '.'
		const resizeOptions = {}
		if (options.height) {
			sizedNamePart += `h${options.height}`
			resizeOptions.height = Number(options.height)
		}
		if (options.width) {
			sizedNamePart += `w${options.width}`
			resizeOptions.width = Number(options.width)
		}
		imageBuffer = await sharp(sourceBuffer).resize(resizeOptions).toBuffer()
	}
	const size = probeImageSize.sync(imageBuffer)
	const imagePath = path.join('album-images', loaderUtils.interpolateName(this, `[name]${sizedNamePart}.[sha1:hash].[ext]`, {content: sourceBuffer}))
	this.emitFile(imagePath, imageBuffer)

	// generate placeholder
	const placeholderBuffer = await sharp(sourceBuffer).resize({width: BLUR_WIDTH}).toBuffer()
	const placeholderPath = path.join('album-images', loaderUtils.interpolateName(this, '[name].placeholder.[sha1:hash].[ext]', {content: placeholderBuffer}))
	this.emitFile(placeholderPath, placeholderBuffer)
	return 'module.exports = ' + JSON.stringify({
		src: path.join('/_nuxt', imagePath), // because of reasons
		size,
		placeholderSrc: path.join('/_nuxt', placeholderPath)
	})
}
//
async function createDataUri (buffer, type, width, height, options = {}) {
  const blur = options.blur !== undefined ? parseInt(options.blur, 10) : 40
  const resizeOptions = {}

  if (options.fit) resizeOptions.fit = sharp.fit[options.fit]
  if (options.position) resizeOptions.position = sharp.position[options.position]
  if (options.background) resizeOptions.background = options.background

  return svgDataUri(
    `<svg fill="none" viewBox="0 0 ${width} ${height}" ` +
    `xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">` +
    (blur > 0 ? await createBlurSvg(buffer, type, width, height, blur, resizeOptions) : '') +
    `</svg>`
  )
}

async function createBlurSvg (buffer, mimeType, width, height, blur, resize = {}) {
  const blurWidth = 64
  const blurHeight = Math.round(height * (blurWidth / width))
  const warmSharp = await warmupSharp(sharp)
  const blurBuffer = await warmSharp(buffer).resize(blurWidth, blurHeight, resize).toBuffer()
  const base64 = blurBuffer.toString('base64')
  const id = `__svg-blur-${ImageProcessQueue.uid++}`

  return '' +
    '<defs>' +
    `<filter id="${id}">` +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}"/>` +
    `</filter>` +
    '</defs>' +
    `<image x="0" y="0" filter="url(#${id})" width="${width}" height="${height}" xlink:href="data:${mimeType};base64,${base64}" />`
}
