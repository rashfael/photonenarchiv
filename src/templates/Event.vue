<template lang="pug">
DefaultLayout
	.page-event
		.photo-stream
			.row(v-for="row of photoStream", :style="{'--stream-row-scale': row.scale}")
				g-link.photo(v-for="photo of row.photos", :to="photo.path")
					g-image.thumbnail(:src="photo.image")
</template>
<page-query>
query ($id: ID!) {
	event: event (id: $id) {
		name
		belongsTo {
			edges {
				node {
					... on Photo {
						id
						path
						image (height: 300, fit: inside)
					}
				}
			}
		}
	}
}
</page-query>
<script>
const STREAM_MARGIN = 64
const STREAM_GUTTER = 4
export default {
	components: {},
	data () {
		return {
			streamWidth: document.body.offsetWidth - STREAM_MARGIN * 2
		}
	},
	computed: {
		photoStream () {
			const photos = this.$page.event.belongsTo.edges
			const rows = [{
				photos: []
			}]
			let rowWidth = 0
			for (const photo of photos) {
				rows[rows.length - 1].photos.push(photo.node)
				rowWidth += photo.node.image.size.width
				if (rowWidth + (rows[rows.length - 1].photos.length - 1) * STREAM_GUTTER > this.streamWidth) {
					rows[rows.length - 1].scale = (this.streamWidth - (rows[rows.length - 1].photos.length - 1) * STREAM_GUTTER) / rowWidth
					rows.push({photos: []})
					rowWidth = 0
				}
			}
			return rows
		}
	},
	created () {
		window.addEventListener('resize', this.onResize)
	},
	destroyed () {
		window.removeEventListener('resize', this.onResize)
	},
	methods: {
		onResize () {
			this.streamWidth = document.body.offsetWidth - STREAM_MARGIN * 2
			console.log(this.streamWidth)
		}
	}
}
</script>
<style lang="stylus">
@import '../styles/variables'
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
					width: auto
</style>
