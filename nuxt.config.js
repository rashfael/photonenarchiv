import path from 'path'
import ProgressiveImagePlugin from './loaders/progressive-image-plugin'
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
		devMiddleware: {
			writeToDisk: (filePath) => {
				return /album-images/.test(filePath) // does not seem to work
			}
		},
		extend (config) {
			config.resolveLoader.modules.push(path.resolve(__dirname, 'loaders'))
			config.resolve.alias['albums'] = path.join(__dirname, 'albums')
			config.plugins.push(new ProgressiveImagePlugin())
		},
		babel: {
			plugins: ['@babel/plugin-proposal-optional-chaining']
		}
	},
	serverMiddleware: [
		'~/album-api/index.js'
	],
	head: {
		script: [{src: 'https://kit.fontawesome.com/fc488a80da.js'}],
		meta: [{name: 'viewport', content: 'width=device-width, initial-scale=1'}]
	},
	generate: {
		routes: async function () {
			const albumLib = require('./album-api/lib')
			const albums = await albumLib.getAlbums()
			return Promise.all(albums.map(async ({id}) => {
				const album = await albumLib.getAlbum(id)
				const albumRoute = {
					route: `/albums/${album.id}/`,
					payload: album
				}
				const photoRoutes = album.photos.map(photo => ({
					route: `/albums/${album.id}/${photo.id}`,
					payload: album
				}))
				photoRoutes.push(albumRoute)
				return photoRoutes
			})).then(results => {
				results = results.flat()
				results.push({
					route: '/',
					payload: albums
				})
				return results
			})
		}
	}
}
