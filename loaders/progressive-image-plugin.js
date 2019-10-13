// Mostly needed to not load all the images into RAM at once
// Replaces NormalModule with ImageModule for our progressive images
const path = require('path')
const ImageModule = require('./ImageModule')
const Scheduler = require('./Scheduler')
class ProgressiveImagePlugin {
	apply (compiler) {
		const scheduler = new Scheduler()
		compiler.hooks.normalModuleFactory.tap('ProgressiveImagePlugin', cmf => {
			cmf.hooks.createModule.tap('ProgressiveImagePlugin', result => {
				if (result.loaders && result.loaders[0] && result.loaders[0].loader === path.join(__dirname, 'progressive-image-loader.js')) {
					return new ImageModule(result, scheduler)
				}
			})
		})
	}
}

module.exports = ProgressiveImagePlugin
