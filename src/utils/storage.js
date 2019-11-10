import localforage from 'localforage'
const BOOKINFO = 'BOOKINFO'

/**
 * 获取缓存中的书籍信息
 * @param {*} key
 */
export function getBookInfo(key) {
  return new Promise((resolve, reject) => {
    localforage.getItem(BOOKINFO)
      .then(res => {
        if (res) {
          resolve(res.find(item => item.key === key))
        } else {
          resolve(null)
        }
      })
      .catch(e => {
        console.log(e)
        reject(e)
      })
  })
}

/**
 * 缓存书籍信息
 * @param {*} key
 * @param {*} value
 */
export function setBookInfo(key, value) {
  return new Promise((resolve, reject) => {
    if (!Object.keys(value).length) {
      reject(new Error('no data to store'))
    } else {
      localforage.getItem(BOOKINFO)
        .then(res => {
          if (res && Array.isArray(res)) {
            let book = res.find(book => book.key === key)
            if (book) {
              Object.keys(value).map(key => {
                book[key] = value[key]
              })
            } else {
              book = {
                key,
                ...value
              }
              res.push(book)
            }
            localforage.setItem(BOOKINFO, res)
              .then(storeRes => {
                resolve('success')
              })
              .catch(e => {
                reject(e)
              })
          } else {
            localforage.setItem(BOOKINFO, [
              {
                key,
                ...value
              }
            ])
              .then(storeRes => {
                resolve('success')
              })
              .catch(e => {
                reject(e)
              })
          }
        })
        .catch(e => {
          reject(e)
        })
    }
  })
}
