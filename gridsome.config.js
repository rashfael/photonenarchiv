// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
	siteName: 'Gridsome',
	plugins: [{
		use: 'gridsome-plugin-pug'
	}, {
		use: '~/plugins/source-filesystem-photo-albums',
		options: {
			path: './events'
		}
	// }, {
	// 	use: '@gridsome/source-filesystem',
	// 	options: {
	// 		typeName: 'Event',
	// 		path: './events/**/index.md'
	// 	}
	}],
	// css: {
	// 	loaderOptions: {
	// 		stylus: {
				// import: ['~src/styles/variables.styl']
		// 	}
		// }
	// }
}
