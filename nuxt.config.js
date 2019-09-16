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
		'nuxt-payload-extractor'
	],
	build: {
		extend (config) {
			config.resolveLoader.modules.push(path.resolve(__dirname, 'loaders'))
			config.resolve.alias['albums'] = path.join(__dirname, 'events')
		}
	},
	serverMiddleware: [
		'~/album-api/index.js'
	],
	head: {
		script: [{src: 'https://kit.fontawesome.com/fc488a80da.js'}]
	},
	generate: {
		routes: async function () {
			const albumLib = require('./album-api/lib')
			const albums = await albumLib.getAlbums()
			return Promise.all(albums.map(async ({id}) => {
				const album = await albumLib.getAlbum(id)
				return {
					route: `/albums/${album.id}/`,
					payload: album
				}
			})).then(results => {
				results.flat()
				results.push({
					route: '/',
					payload: albums
				})
				return results
			})
		}
	}
}
