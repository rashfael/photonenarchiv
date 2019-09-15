import path from 'path'

export default {
	server: {
		port: 8080
	},
	plugins: ['~/plugins/global.js'],
	css: [
		'@/styles/global.styl'
	],
	modules: [
		'@nuxtjs/axios',
	],
	build: {
		extend (config) {
			config.resolveLoader.modules.push(path.resolve(__dirname, 'loaders'))
			config.resolve.alias['albums'] = path.join(__dirname, 'events')
		}
	},
	serverMiddleware: [
		'~/album-api/index.js'
	]
}
