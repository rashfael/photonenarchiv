<template lang="pug">
.c-photo-detail(:class="{'info-open': infoIsOpen}")
	nuxt-link.nav-return(:to="{name: 'albums-album', params: {album: album.id}}", title="back to album"): i.far.fa-2x.fa-arrow-left
	nuxt-link.nav-previous(:to="!previousPhoto ? '#' :{name: 'albums-album-id', params: {album: album.id, id: previousPhoto && previousPhoto.id}}", :event="(!previousPhoto ? '' : 'click')", :class="{disabled: !previousPhoto}", title="previous picture"): i.far.fa-2x.fa-chevron-left
	nuxt-link.nav-next(:to="!nextPhoto ? '#' :{name: 'albums-album-id', params: {album: album.id, id: nextPhoto && nextPhoto.id}}", :event="(!nextPhoto ? '' : 'click')", :class="{disabled: !nextPhoto}", title="next picture"): i.far.fa-2x.fa-chevron-right
	progressive-image.thumbnail(:image="photo", :key="photo.image")
	a.download-fullsize(:href="photo.sizes[photo.sizes.length - 1].src", download, title="download full size image"): i.fas.fa-2x.fa-download
	.btn-open-info(v-if="!infoIsOpen", title="show metadata", @click="openInfo"): i.fas.fa-2x.fa-info
	transition(name="info")
		.info-sidebar(v-if="infoIsOpen")
			.btn-close-info(title="hide metadata", @click="closeInfo"): i.far.fa-2x.fa-times
			.metadata
				.metadata-set(v-for="[key, value] of metadata", :class="`metadata-${key}`")
					.key {{ key }}
					a.value(v-if="key === 'license' && value.startsWith('cc')", rel="license", :href="`https://creativecommons.org/licenses/${value.substring(3)}/4.0/`", :title="value")
						i.fab.fa-creative-commons
						i.fab(v-for="part of value.substring(3).split('-')", :class="`fa-creative-commons-${part}`")
					.value(v-else) {{ value }}
</template>
<script>

const METADATA_ORDER = [
	'artist',
	'date',
	'license'
]

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
			infoIsOpen: typeof sessionStorage !== 'undefined' && !!sessionStorage.infoIsOpen
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
		},
		metadata () {
			const metadataDict = Object.assign(this.album.defaults || {}, this.photo.metadata)
			const metadata = []
			for (const key of METADATA_ORDER) {
				if (!metadataDict[key]) continue
				metadata.push([key, metadataDict[key]])
				delete metadataDict[key]
			}
			metadata.push(...Object.entries(metadataDict))
			return metadata
		}
	},
	mounted () {
		document.addEventListener('keydown', this.globalKeyHandler)
	},
	destroyed () {
		document.removeEventListener('keydown', this.globalKeyHandler)
	},
	methods: {
		openInfo () {
			this.infoIsOpen = true
			sessionStorage.infoIsOpen = true
		},
		closeInfo () {
			this.infoIsOpen = false
			sessionStorage.removeItem('infoIsOpen')
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
	align-items: center
	img
		max-width: calc(100vw - 64px)
		max-height: calc(100vh - 80px)
		margin: 0 auto
		object-fit: contain
		transition: max-width .2s ease
		+below('m')
			max-width: calc(100vw - 16px)
			max-height: calc(100vh - 64px)
	.nav-next, .nav-previous, .nav-return, .download-fullsize, .btn-open-info, .btn-close-info
		width: 64px
		height: @width
		font-size: 18px
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
		transition: background-color .2s ease, right .2s ease
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
		+below('m')
			right: 8px
	.nav-previous
		left: 128px
		svg
			margin-right: 4px // counteract visual inbalance effect
		+below('m')
			left: 8px
	.nav-return
		top: 8px
		left: 16px
	.download-fullsize
		top: 8px
		right: 8px
		z-index: 80
	.btn-open-info
		top: 8px
		right: 88px
	.btn-close-info
		top: 8px
		left: 8px
	.info-sidebar
		display: flex
		width: 320px
		border-left: border-separator()
		background-color: $clr-white
		flex: none
		align-self: stretch
		position: relative
		padding: 80px 8px
		box-sizing: border-box
		+below('s')
			width: 100vw
			z-index: 70
			position: absolute
			height: "calc(100vh - %s)" % $navbar-height
		.metdata
			display: flex
			flex-direction: column
		.metadata-set
			display: flex
			align-items: center
			height: 24px
			flex: none
			.key
				width: 64px
				flex: none
				text-align: right
				margin-right: 8px
				text-transform: capitalize
				color: $clr-secondary-text-light
			&.metadata-license
				a
					font-size: 18px
					color: $clr-primary-text-light
					> *:not(:first-child)
						margin-left: 2px

	&.info-open
		+above('s')
			.nav-next
				right: 16px + 320px
			.nav-previous
				left: 16px
			img
				max-width: calc(100vw - 64px - 320px) // not working

	.info-enter-active, .info-leave-active
		transition: transform .2s ease
		.btn-close-info
			display: none
	.info-enter, .info-leave-to
		transform: translateX(320px)
		+below('s')
			transform: translateX(100vw)
</style>
