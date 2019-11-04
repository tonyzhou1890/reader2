// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'babel-polyfill'
import Vue from 'vue'
import App from './App'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import '@/styles/index.scss' // global css
import './icons' // icon

import '../theme/index.css'
import { Row, Col, Button, Input, Select, Option, Upload, Slider, ColorPicker, Message, MessageBox, Loading } from 'element-ui'

import ui from 'tiny-utils.js/UI'
import localforage from 'localforage'

import debounce from 'lodash/debounce'

window.localforage = localforage

Vue.use(Row)
Vue.use(Col)
Vue.use(Button)
Vue.use(Input)
Vue.use(Select)
Vue.use(Option)
Vue.use(Upload)
Vue.use(Slider)
Vue.use(ColorPicker)
Vue.use(Loading.directive)

Vue.prototype.$loading = Loading.service
Vue.prototype.$msgbox = MessageBox
Vue.prototype.$message = Message

Object.keys(ui).map(item => {
  Vue.component(item, ui[item])
})

Vue.prototype._ = {
  debounce
}

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
