<template lang="pug">
DefaultLayout
	.page-event
		.photos
			g-link.photo(v-for="photo of $page.event.belongsTo.edges", :to="photo.node.path")
				g-image.thumbnail(:src="photo.node.imagePath")
</template>
<page-query>
query ($id: ID!) {
	event: event (id: $id) {
		name
		belongsTo {
			edges {
				node {
					... on Photo {
						id
						path
						imagePath (height: 200, fit: inside)
					}
				}
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
.page-event
	.photos
		display: flex
		justify-content: center
		.photo
			display: flex
			flex-direction: column
			height: 200px
			max-width: 300px
			margin: 16px
</style>
