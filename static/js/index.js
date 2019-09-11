// 阅读器类
class Reader {
  constructor(options) {
    // 生成配置项
    this.option = this._resolveOption(options || {})
    // 解析 query
    this.query = this._query(window.location.search || '')
    // 主要数据存放到 data 中
    this.data = {
      // 主界面加载
      loading: false,
      // 文本
      text: ''
    }
    // 书籍排版需要防抖
    this._drawBook = this._debounce(this._drawBook, 1000)
    // 监听 window resize 事件
    window.addEventListener('resize', this._resize)
  }
  
  /**
   * 解析 url 的 search 部分
   * @param {string} query 
   */
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

  /**
   * 默认配置项
   */
  defaultOption = {
    // 应用容器元素
    el: document.body,
    // 字体大小，单位像素
    fontSize: 16,
    // 字体
    fontFamily: 'Microsoft YaHei',
    // 行高
    lineHeight: 1.5,
    // 边距
    padding: [30, 30],
    // 宽高
    size: [210, 297],
    // 背景色
    backgroundColor: 'seashell',
    // 正文字体颜色
    color: '#333'
  }

  /**
   * 解析配置项，将传入和配置和默认配置结合生成可用配置
   * @param {object} options 
   */
  _resolveOption(options) {
    let temp = {}
    Object.keys(this.defaultOption).map(key => {
      temp[key] = options[key] || this.defaultOption[key]
    })
    return temp
  }

  /**
   * 计算/绘制书籍
   */
  _drawBook() {
    console.log('drawbook', arguments)
  }

  /**
   * 窗口大小改变
   */
  _resize = () => {
    // 窗口改变，重新计算/绘制书籍
    this._drawBook(1, 2, 3)
  }

  /**
   * 防抖函数
   * @param {function} func 
   * @param {number} time 
   */
  _debounce(func, time) {
    let flag = null
    let tempTime = typeof time === 'number' ? time : 0
    // 包装过的函数
    function debounced() {
      let params = arguments
      // 取消前一次的 setTimeout
      clearTimeout(flag)
      // 如果需要延时，则延时执行
      if (tempTime) {
        flag = setTimeout(function() {
          func(...params)
        }, tempTime)
      } else {
      // 如果不需要延时，直接执行
        func(...params)
      }
    }
    return debounced
  }
}

window.reader = new Reader()