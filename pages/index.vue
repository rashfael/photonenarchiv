<template lang="pug">
.landing-page
	.events
		nuxt-link.event(v-for="album of albums", :to="{name: 'albums-album', params: {album: album.id}}")
			img.thumbnail(:src="album.thumbnail")
			.name {{ album.name }}
</template>
<script>
export default {
	async asyncData ({ $axios, params, payload, $payloadURL, route }) {
		let albums
		if (process.static && process.client) {
			return $axios.$get($payloadURL(route))
		} else if (payload) {
			albums = payload
		} else {
			albums = (await $axios.$get(`/album-api/albums`)).albums
		}
		return {
			albums: albums.map(album => {
				album.thumbnail = require('!!progressive-image-loader!albums/' + album.id + '/thumbnail.jpg').src
				return album
			})
		}
	},
	components: {},
	data () {
		return {
		}
	},
	computed: {},
	created () {},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {}
}
</script>
<style lang="stylus">
@import '../styles/variables'
.landing-page
	.events
		display: flex
		justify-content: center
		.event
			display: flex
			flex-direction: column
			width: 200px
			height: 240px
			margin: 16px
			card()
			color: $clr-primary-text-light
			text-decoration: none
			img
				width: 200px
			.name
				font-size: 24px
				text-align: center
				line-height: 40px // HACK

</style>
