<template lang="pug">
.page-event
	transition
		nuxt-child(v-if="selectedPhoto", :album="album", :photo="selectedPhoto")
		.photo-stream(v-else)
			.row(v-for="row of photoStream", :style="{'--stream-row-scale': row.scale || 1}")
				template(v-for="photo of row.photos")
					nuxt-link.photo(:to="{name: 'albums-album-id', params: {album: album.id, id: photo.id}}")
						progressive-image.thumbnail(:image="photo", :fixedSize="{height: 300}", :style="{'--scaled-width': photo.scaledWidth + 'px'}")
</template>
<script>
const STREAM_GUTTER = 4
export default {
	async asyncData ({ $axios, params, payload, $payloadURL, route }) {
		let album
		if (process.static && process.client) {
			return $axios.$get($payloadURL(route))
		} else if (payload) {
			album = payload
		} else {
			album = await $axios.$get(`/album-api/albums/${params.album}`)
		}
		const context = require.context('!!progressive-image-loader!albums/', true, /\.(jpg|png|webp)$/)
		album.photos = album.photos.filter(photo => !photo.image.endsWith('thumbnail.jpg')).map(photo => {
			Object.assign(photo, context('./' + photo.image))
			return photo
		})
		return {album}
	},
	components: {},
	data () {
		return {
			bodyWidth: null
		}
	},
	computed: {
		streamMargin () {
			return this.$mq?.below['m'] ? 8 : 64
		},
		streamWidth () {
			return this.bodyWidth - this.streamMargin * 2
		},
		photoStream () {
			if (!this.bodyWidth) return [] // avoid flash of single row content
			const photos = this.album.photos
			const rows = [{
				photos: []
			}]
			let rowWidth = 0
			let row = rows[rows.length - 1]
			for (const photo of photos) {
				photo.thumbnailWidth = photo.sizes.find(size => size.name === 'thumbnail').width
				rows[rows.length - 1].photos.push(photo)
				rowWidth += photo.thumbnailWidth
				if (rowWidth + (row.photos.length - 1) * STREAM_GUTTER > this.streamWidth) {
					const scale = (this.streamWidth - (row.photos.length - 1) * STREAM_GUTTER) / rowWidth
					rows[rows.length - 1].scale = scale
					for (const [index, rowPhoto] of row.photos.entries()) {
						if (index === row.photos.length - 1) { // compensate for off by one total width when computing with scale and whole pixels
							rowPhoto.scaledWidth = this.streamWidth - (rowWidth * scale + (row.photos.length - 1) * STREAM_GUTTER - rowPhoto.thumbnailWidth * scale)
						} else {
							rowPhoto.scaledWidth = rowPhoto.thumbnailWidth * scale
						}
					}
					rows.push({photos: []})
					row = rows[rows.length - 1]
					rowWidth = 0
				}
			}
			return rows
		},
		selectedPhoto () {
			return this.album.photos.find(photo => photo.id === this.$route.params.id)
		}
	},
	mounted () {
		window.addEventListener('resize', this.onResize)
		this.onResize()
	},
	destroyed () {
		window.removeEventListener('resize', this.onResize)
	},
	methods: {
		onResize () {
			this.bodyWidth = document.body.offsetWidth
		}
	}
}
</script>
<style lang="stylus">
@import '../../styles/variables'
.page-event
	flex: auto
	display: flex
	flex-direction: column
	.photo-stream
		padding: 8px 64px
		display: flex
		flex-direction: column
		+below('m')
			padding: 8px
		.row
			height: calc(300px * var(--stream-row-scale))
			display: flex
			&:not(:first-child)
				margin: 4px 0 0 0
			.photo
				&:not(:first-child)
					margin: 0 0 0 4px
				img
					height: calc(300px * var(--stream-row-scale))
					width: var(--scaled-width)
					object-fit: cover
</style>
