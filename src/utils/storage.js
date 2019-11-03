import { isArray, isObject, isNumber, isString } from 'tiny-utils.js/base'
/**
 * localStorage存储
 * 1. 判断是否支持 localStorage
 * 2. 检测是否正确存入
 */
export function storage(key, val) {
  return new Promise((resolve, reject) => {
    if (!window.localStorage) {
      const e = {
        type: 1,
        message: '不支持localStorage'
      }
      reject(new Error(JSON.stringify(e)))
    } else {
      const temp = isArray(val) || isObject(val) ? JSON.stringify(val) : val
      window.localStorage.setItem(key, temp)
      if (((isArray(val) || isObject(val)) && window.localStorage.getItem(key).length === temp.length) ||
        (isNumber(val) && Number(window.localStorage.getItem(key)) === temp) ||
        (isString(val) && window.localStorage.getItem(key) === temp)) {
        resolve({key, val})
      } else {
        const e = {
          type: 2,
          message: 'localStorage空间不足'
        }
        window.localStorage.removeItem(key)
        reject(JSON.stringify(e))
      }
    }
  })
}
