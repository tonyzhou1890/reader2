// 阅读器类
class Reader {
  constructor(options) {
    // 选项赋值给 this.option
    this.option = options
    // 解析 query
    this.query = this._query(window.location.search || '')
  }

  // 解析 query
  _query(query) {
    // 解析正则
    let reg = /([^?=&#]+)=([^&#]*)/g
    let matches = query.match(reg)
    // 如果没有结果，赋值一个空数组，避免下面的 map 操作失败
    matches = matches || []
    let res = {}
    // 拆分 query 项。'id=1' => ['id', '1']
    matches.map((item, index) => {
      matches[index] = item.split('=')
    })
    // 填充 res
    matches.map(item => {
      res[item[0]] = item[1]
    })
    return res
  }
}

window.reader = new Reader()