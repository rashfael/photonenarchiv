<template lang="pug">
DefaultLayout
	.landing-page
		.events
			g-link.event(v-for="event of $page.events.edges", :to="event.node.path")
				g-image.thumbnail(:src="event.node.thumbnail")
				.name {{ event.node.name }}
</template>
<page-query>
query {
	events: allEvent {
		edges {
			node {
				id
				path
				name
				thumbnail (width: 200, height: 200)
			}
		}
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
			.name
				font-size: 24px
				text-align: center
				line-height: 40px // HACK
</style>
