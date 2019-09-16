const app = require('express')()
const router = require('express-promise-router')()
const albumLib = require('./lib')

app.use(router)
module.exports = { path: '/album-api', handler: app }

router.get('/albums', async function (req, res) {
	const albums = await albumLib.getAlbums()
	return res.json({albums})
})

router.get('/albums/:id', async function (req, res) {
	const album = await albumLib.getAlbum(req.params.id)
	return res.json(album)
})
