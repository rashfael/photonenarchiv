<template lang="pug">
img.c-progressive-image(:class="{loaded}", :src="src", :srcset="srcset", :sizes="sizes", @load="onLoad", :style="style")
</template>
<script>
export default {
	props: {
		image: {
			type: Object,
			required: true
		},
		fixedSize: Object
	},
	data () {
		return {
			intersected: false,
			loaded: false
		}
	},
	computed: {
		src () {
			if (!this.intersected) return this.image.placeholderSrc
			if (!this.fixedSize) return this.image.sizes[this.image.sizes.length - 1].src
			return '/_nuxt/' + this.image.sizes.find(size => size.height >= this.fixedSize.height).src // TODO width
		},
		srcset () {
			if (!this.intersected || this.fixedSize) return
			return this.image.sizes.map(size => `/_nuxt/${size.src} ${size.width}w`)
		},
		sizes () {
			if (!this.intersected || this.fixedSize) return
			return this.image.sizes.map((size, index) => {
				if (index === this.image.sizes.length - 1) return `${size.width}px`
				return `(max-width: ${size.width}px) ${size.width}px` // image is not quite full screen but hey
			})
		},
		largestSize () {
			return this.image.sizes[this.image.sizes.length - 1]
		},
		style () {
			if (this.fixedSize) return
			return {
				height: this.largestSize.height + 'px',
				width: this.largestSize.width + 'px'
			}
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
