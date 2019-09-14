<template lang="pug">
.page-image
	g-image(:src="$page.photo.imagePath")
</template>
<page-query>
query ($id: ID!) {
	photo: photo (id: $id) {
		author
		imagePath
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
</style>
