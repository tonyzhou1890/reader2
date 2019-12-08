// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'babel-polyfill'
import Vue from 'vue'
import App from './App'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import '@/styles/index.less' // global css
import './icons' // icon

import '../theme/index.css'
import { Row, Col, Button, Input, InputNumber, Select, Option, Upload, Slider, ColorPicker, Message, MessageBox, Loading, Form, FormItem, Tabs, TabPane } from 'element-ui'

import localforage from 'localforage'

import debounce from 'lodash/debounce'

window.localforage = localforage

Vue.use(Row)
Vue.use(Col)
Vue.use(Button)
Vue.use(Input)
Vue.use(InputNumber)
Vue.use(Select)
Vue.use(Option)
Vue.use(Upload)
Vue.use(Slider)
Vue.use(ColorPicker)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Loading.directive)

Vue.prototype.$loading = Loading.service
Vue.prototype.$msgbox = MessageBox
Vue.prototype.$message = Message

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
