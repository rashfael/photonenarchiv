import Vue from 'vue'
import ProgressiveImage from '../components/progressive-image'
import MediaQueries from '../components/media-queries'

Vue.component('progressive-image', ProgressiveImage)
if (process.browser) {
	Vue.use(MediaQueries)
}
