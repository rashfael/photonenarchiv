class Transformer {
	static mimeTypes () {
		return ['image/png', 'image/jpeg']
	}

	parse (source) {
		return {
			// license: 'LIZENZ',
			// date: 'some date'
		}
	}

	extendNodeType ({ graphql }) {
		return {
			// custom GraphQL fields for transformed node
		}
	}
}

module.exports = Transformer
