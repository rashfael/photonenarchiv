<template lang="pug">
.c-photo-detail
	nuxt-link(:to="{name: 'albums-album-id', params: {album: album.id, id: previousPhoto && previousPhoto.id}}") prev
	nuxt-link(:to="{name: 'albums-album-id', params: {album: album.id, id: nextPhoto && nextPhoto.id}}") next
	progressive-image.thumbnail(:image="photo.fullSizeImage")
</template>
<script>
export default {
	props: {
		album: {
			type: Object,
			required: true
		},
		photo: {
			type: Object,
			required: true
		}
	},
	data () {
		return {
		}
	},
	computed: {
		index () {
			return this.album.photos.findIndex(photo => photo.id === this.$route.params.id)
		},
		previousPhoto () {
			return this.album.photos[this.index - 1]
		},
		nextPhoto () {
			return this.album.photos[this.index + 1]
		}
	},
	created () {
		const context = require.context('!!progressive-image-loader!albums/', true, /\.(jpg|png|webp)$/)
		this.photo.fullSizeImage = context('./' + this.photo.image)
	},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {}
}
</script>
<style lang="stylus">
.c-photo-detail
	display: flex
	justify-content: center
	img
		max-width: calc(100vw - 64px)
		max-height: calc(100vh - 80px)
</style>
