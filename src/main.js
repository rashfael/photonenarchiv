import DefaultLayout from '~/layouts/Default.vue'

import './styles/global.styl'

export default function (Vue, { head, router, isServer }) {
  Vue.component('DefaultLayout', DefaultLayout)
}
