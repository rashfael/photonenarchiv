<template lang="pug">
DefaultLayout
	.page-image
		g-image(:src="$page.photo.image")
</template>
<page-query>
query ($id: ID!) {
	photo: photo (id: $id) {
		author
		image
	}
}
</page-query>
<script>
export default {
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
.page-image
	display: flex
	justify-content: center
	align-items: center
	img
		max-width: calc(100vw - 128px)
		max-height: calc(100vh - 72px)
		object-fit: contain
</style>
