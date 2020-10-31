import Worker from '@/utils/utils.worker'
import { appSetting } from '@/utils/setting'

const workerNum = appSetting.threads // 线程数量
const quene = new Map()
const waiting = []
const workers = new Array(workerNum).fill(null).map((_, index) => {
  return (
    {
      index,
      worker: new Worker(),
      idle: true // 是否空闲
    }
  )
})

workers.map(item => {
  item.worker.addEventListener('message', e => {
    if (!e.data || !e.data._sign) {
      console.error('worker 返回数据错误')
      quene.get(e.data._sign).reject('worker 返回数据错误')
    } else {
      quene.get(e.data._sign).resolve({
        result: e.data.result,
        e
      })
      quene.delete(e.data._sign)
      item.idle = true
      // 尝试接受新任务
      assignJob()
    }
  })
})

/**
 * 将等待队列中的任务加入空闲线程
 */
function assignJob() {
  let idleWorker = null
  let waitingJob = null
  if (waiting.length) {
    idleWorker = workers.find(item => item.idle)
    if (idleWorker) {
      idleWorker.idle = false
      waitingJob = waiting.shift()
      quene.set(waitingJob._sign, waitingJob.p)

      idleWorker.worker.postMessage({
        ...waitingJob.job,
        _sign: waitingJob._sign
      })
    }
  }
}

/**
 * @param job {
 *  action: '',
 *  param: {},
 *  timestamp // 可选
 * }
 */
export default (job) => {
  job.timestamp = job.timestamp || Date.now()
  return new Promise((resolve, reject) => {
    const _sign = Date.now() * Math.random()
    waiting.push({
      _sign,
      job,
      p: { resolve, reject }
    })
    // 分配线程
    assignJob()
  })
}
