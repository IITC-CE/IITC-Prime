import VueDevtools from 'nativescript-vue-devtools'
import Vue from 'nativescript-vue'
import Main from '~/components/Main'

Vue.use(VueDevtools, { host: '192.168.42.10' })
Vue.config.silent = false;

new Vue({
  render: (h) => h('frame', [h(Main)]),
}).$start()
