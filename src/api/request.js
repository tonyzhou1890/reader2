import request from '@/utils/request.js'

export function sample(data) {
  return request({
    url: '/api/sample',
    method: 'post',
    data
  })
}