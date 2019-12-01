import { textToPage } from '@/utils/pureUtils'

const utils = {
  textToPage
}

onmessage = (e) => {
  const { action, param, timestamp } = e.data
  if (typeof utils[action] === 'function') {
    const res = {
      action,
      result: utils[action](...param),
      timestamp
    }
    postMessage(res)
  } else {
    console.log('指定操作不存在')
  }
}
