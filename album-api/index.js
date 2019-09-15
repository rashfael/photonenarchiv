const path = require('path')
const fs = require('fs-extra')
const yaml = require('js-yaml')
const app = require('express')()
const router = require('express-promise-router')()
app.use(router)

module.exports = { path: '/album-api', handler: app }

const ALBUM_ROOT = path.join(__dirname, '../events')

router.get('/albums', async function (req, res) {
	const albumPaths = await fs.readdir(ALBUM_ROOT)
	const albums = await Promise.all(albumPaths.map(async albumPath => {
		const albumConfig = yaml.safeLoad(await fs.readFile(path.join(ALBUM_ROOT, albumPath, 'index.yml'), 'utf-8'))
		return {
			id: albumPath,
			...albumConfig,
			thumbnail: path.join(albumPath, albumConfig.thumbnail)
		}
	}))
	return res.json({albums})
})

router.get('/albums/:id', async function (req, res) {
	const albumPath = req.params.id
	const albumConfig = yaml.safeLoad(await fs.readFile(path.join(ALBUM_ROOT, albumPath, 'index.yml'), 'utf-8'))
	const photoPaths = await fs.readdir(path.join(ALBUM_ROOT, albumPath))
	const photos = await Promise.all(photoPaths.map(async photoPath => {
		const { dir, name, ext } = path.parse(path.join(albumPath, photoPath))
		if (!['.png', '.jpg'].includes(ext)) return
		let metadata
		try {
			const rawMetadata = await fs.readFile(path.join(ALBUM_ROOT, dir, name + '.yml'), 'utf-8')
			metadata = yaml.safeLoad(rawMetadata)
		} catch (e) {
			if (e.code !== 'ENOENT') throw e
		}
		return {
			id: name,
			image: path.join(albumPath, photoPath),
			...metadata
		}
	}))
	return res.json({
		id: albumPath,
		...albumConfig,
		thumbnail: path.join(albumPath, albumConfig.thumbnail),
		photos: photos.filter(photo => !!photo)
	})
})
