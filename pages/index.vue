<template lang="pug">
.landing-page
	.events
		nuxt-link.event(v-for="album of albums", :to="{name: 'albums-id', params: {id: album.id}}")
			img.thumbnail(:src="album.thumbnail")
			.name {{ album.name }}
</template>
<script>
export default {
	async asyncData ({ $axios, params }) {
		const {albums} = await $axios.$get(`/album-api/albums`)
		return {
			albums: albums.map(album => {
				album.thumbnail = require('!!progressive-image-loader!albums/' + album.id + '/thumbnail.jpg').source
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
			img
				width: 200px
			.name
				font-size: 24px
				text-align: center
				line-height: 40px // HACK
</style>
