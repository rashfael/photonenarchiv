<template lang="pug">
.page-event
	.photo-stream
		.row(v-for="row of photoStream", :style="{'--stream-row-scale': row.scale || 1}")
			.photo(v-for="photo of row.photos", :to="'/'")
				progressive-image.thumbnail(:image="photo.image", :style="{'--scaled-width': photo.scaledWidth + 'px'}")
</template>
<script>
const STREAM_MARGIN = 64
const STREAM_GUTTER = 4
export default {
	async asyncData ({ $axios, params }) {
		const {photos} = await $axios.$get(`/album-api/albums/${params.id}`)
		const context = require.context('!!progressive-image-loader?height=300!albums/', true, /\.(jpg|png|webp)$/)
		return {
			photos: photos.filter(photo => !photo.image.endsWith('thumbnail.jpg')).map(photo => {
				photo.image = context('./' + photo.image)
				return photo
			})
		}
	},
	components: {},
	data () {
		return {
			streamWidth: 900
		}
	},
	computed: {
		photoStream () {
			const photos = this.photos
			const rows = [{
				photos: []
			}]
			let rowWidth = 0
			let row = rows[rows.length - 1]
			for (const photo of photos) {
				rows[rows.length - 1].photos.push(photo)
				rowWidth += photo.image.size.width
				if (rowWidth + (row.photos.length - 1) * STREAM_GUTTER > this.streamWidth) {
					const scale = (this.streamWidth - (row.photos.length - 1) * STREAM_GUTTER) / rowWidth
					rows[rows.length - 1].scale = scale
					for (const [index, rowPhoto] of row.photos.entries()) {
						if (index === row.photos.length - 1) { // compensate for off by one total width when computing with scale and whole pixels
							rowPhoto.scaledWidth = this.streamWidth - (rowWidth * scale + (row.photos.length - 1) * STREAM_GUTTER - rowPhoto.image.size.width * scale)
						} else {
							rowPhoto.scaledWidth = rowPhoto.image.size.width * scale
						}
					}
					rows.push({photos: []})
					row = rows[rows.length - 1]
					rowWidth = 0
				}
			}
			return rows
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
			this.streamWidth = document.body.offsetWidth - STREAM_MARGIN * 2
		}
	}
}
</script>
<style lang="stylus">
@import '../../styles/variables'
.page-event
	.photo-stream
		padding: 8px 64px
		display: flex
		flex-direction: column
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
