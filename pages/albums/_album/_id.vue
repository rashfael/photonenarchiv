<template lang="pug">
.c-photo-detail
	nuxt-link.nav-return(:to="{name: 'albums-album', params: {album: album.id}}"): i.far.fa-arrow-left
	nuxt-link.nav-previous(:to="!previousPhoto ? '#' :{name: 'albums-album-id', params: {album: album.id, id: previousPhoto && previousPhoto.id}}", :event="(!previousPhoto ? '' : 'click')", :class="{disabled: !previousPhoto}"): i.far.fa-chevron-left
	nuxt-link.nav-next(:to="!nextPhoto ? '#' :{name: 'albums-album-id', params: {album: album.id, id: nextPhoto && nextPhoto.id}}", :event="(!nextPhoto ? '' : 'click')", :class="{disabled: !nextPhoto}"): i.far.fa-chevron-right
	progressive-image.thumbnail(:image="photo.fullSizeImage", :style="{height: `${photo.fullSizeImage.size.height}px`, width: `${photo.fullSizeImage.size.width}px`}", :key="photo.image")
</template>
<script>
const context = require.context('!!progressive-image-loader!albums/', true, /\.(jpg|png|webp)$/)

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
	watch: {
		$route: 'updatePhoto'
	},
	created () {
		this.updatePhoto()
	},
	mounted () {
		document.addEventListener('keydown', this.globalKeyHandler)
	},
	destroyed () {
		document.removeEventListener('keydown', this.globalKeyHandler)
	},
	methods: {
		updatePhoto () {
			this.photo.fullSizeImage = context('./' + this.photo.image)
		},
		globalKeyHandler (event) {
			switch (event.key) {
				case ' ':
				case 'PageDown':
				case 'ArrowRight': {
					event.preventDefault()
					if (!this.nextPhoto) return
					this.$router.push({name: 'albums-album-id', params: {album: this.album.id, id: this.nextPhoto.id}})
					break
				}
				case 'PageUp':
				case 'ArrowLeft': {
					event.preventDefault()
					if (!this.previousPhoto) return
					this.$router.push({name: 'albums-album-id', params: {album: this.album.id, id: this.previousPhoto.id}})
					break
				}
			}
		}
	}
}
</script>
<style lang="stylus">
@import '../../../styles/variables'
.c-photo-detail
	flex: auto
	position: relative
	display: flex
	justify-content: center
	align-items: center
	img
		max-width: calc(100vw - 64px)
		max-height: calc(100vh - 80px)
		object-fit: contain
	.nav-next, .nav-previous, .nav-return
		width: 64px
		height: @width
		font-size: 36px
		color: $clr-primary-text-light
		background-color: $clr-disabled-text-dark
		border-radius: 50%
		display: flex
		justify-content: center
		align-items: center
		position: absolute
		top: calc(50% - 32px)
		z-index: 50
		text-decoration: none
		transition: background-color .2s ease
		&:hover
			color: $clr-primary-text-dark
			background-color: $clr-disabled-text-light
		&.disabled
			color: $clr-disabled-text-light
			cursor: not-allowed
	.nav-next
		right: 128px
		svg
			margin-left: 4px // counteract visual inbalance effect
	.nav-previous
		left: 128px
		svg
			margin-right: 4px // counteract visual inbalance effect
	.nav-return
		top: 8px
		left: 16px
</style>
