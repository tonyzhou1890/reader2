import { textToPage, splitChapter } from '@/utils/pureUtils'

const utils = {
  textToPage,
  splitChapter
}

onmessage = (e) => {
  const { action, param, timestamp, _sign } = e.data
  if (typeof utils[action] === 'function') {
    const res = {
      action,
      result: utils[action](...param),
      timestamp,
      _sign
    }
    postMessage(res)
  } else {
    console.log('指定操作不存在')
  }
}
