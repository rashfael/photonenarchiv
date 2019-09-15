<template lang="pug">
.layout-root
	header.navbar
		a.home(href="/")
			img(src="../assets/logo.svg")
			| photonenarchiv
		nav
	main.content
		nuxt
	footer
</template>
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
<style lang="stylus" src="../styles/layout.styl" />
