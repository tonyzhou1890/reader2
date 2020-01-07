import Worker from '@/utils/utils.worker'

const quene = new Map()
const worker = new Worker()

worker.addEventListener('message', e => {
  if (!e.data || !e.data._sign) {
    console.error('worker 返回数据错误')
  } else {
    quene.get(e.data._sign).resolve({
      result: e.data.result,
      e
    })
    quene.delete(e.data._sign)
  }
})

export default (param) => {
  return new Promise((resolve, reject) => {
    const _sign = Date.now() * Math.random()
    quene.set(_sign, { resolve })
    worker.postMessage({
      ...param,
      _sign
    })
  })
}
