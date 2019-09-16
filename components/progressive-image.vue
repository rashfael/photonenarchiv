<template lang="pug">
img.c-progressive-image(:class="{loaded}", :src="src", @load="onLoad")
</template>
<script>
export default {
	props: {
		image: {
			type: Object,
			required: true
		}
	},
	data () {
		return {
			intersected: false,
			loaded: false
		}
	},
	computed: {
		src () {
			return this.intersected ? this.image.src : this.image.placeholderSrc
		}
	},
	created () {},
	mounted () {
		this._observer = new IntersectionObserver(entries => {
			const image = entries[0]
			if (image.isIntersecting) {
				this.intersected = true
				this._observer.disconnect()
			}
		})
		this._observer.observe(this.$el)
	},
	destroyed () {
		this._observer.disconnect()
	},
	methods: {
		onLoad () {
			if (this.$el.getAttribute('src') !== this.image.placeholderSrc) {
				this.loaded = true
			}
		}
	}
}
</script>
<style lang="stylus">
.c-progressive-image
	filter: blur(10px)
	overflow: hidden
	clip-path: polygon(0% 0%, 100% 0, 100% 100%, 0 100%)
	transition: filter .3s ease
	&.loaded
		filter: none
</style>
