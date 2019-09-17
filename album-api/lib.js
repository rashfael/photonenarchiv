const path = require('path')
const fs = require('fs-extra')
const yaml = require('js-yaml')

const ALBUM_ROOT = path.join(__dirname, '../events')

module.exports = {
	async getAlbums () {
		const albumPaths = await fs.readdir(ALBUM_ROOT)
		return Promise.all(albumPaths.map(async albumPath => {
			const albumConfig = yaml.safeLoad(await fs.readFile(path.join(ALBUM_ROOT, albumPath, 'index.yml'), 'utf-8'))
			return {
				id: albumPath,
				...albumConfig,
			}
		}))
	},
	async getAlbum (id) {
		const albumPath = id
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
		return {
			id: albumPath,
			...albumConfig,
			photos: photos.filter(photo => !!photo)
		}
	}
}
