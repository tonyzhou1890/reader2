'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  ENV_CONFIG: '"dev"',
  BASE_API: '"http://localhost:8080"',  // 请求地址
  STATIC_API: '"localhost:8081"'  // 静态资源地址
})
