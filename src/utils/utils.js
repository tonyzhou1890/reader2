import { bookSetting } from '@/utils/setting'
import { textToPage as _textToPage, findSubArray, arrayCopy } from '@/utils/pureUtils'
/**
 * 测量字符
 * @param {Object} param // 参数对象
 * param: {
 *    text: '', // 整个文本
 *    ctx: {},  // 绘图上下文
 * }
 * 返回值：{
 *    measures: {
 *      'a': {
 *        width: 12,
 *        height: 12
 *      }
 *    },
 *    textArray: ['a', 'b']
 * }
 */
export function measureChars(param) {
  let s = Date.now()
  // 将文本转成数组，防止四字节字符问题
  let textArray = Array.from(param.text)
  // 加上额外需要测量的字符
  let tempArr = textArray.concat([bookSetting.hyphen, '阅'])
  console.log('  tempArr:', Date.now() - s)
  // 第一种，先去重，然后测量
  // // 去重
  // tempArr = [...new Set(tempArr)]
  // console.log('  Set:', Date.now() - s)
  // let measures = {}
  // let len = tempArr.length
  // // for 循环效率比 map 之类的遍历器高
  // for (let i = 0; i < len; i++) {
  //   measures[tempArr[i]] = {
  //     width: param.ctx.measureText(tempArr[i]).width
  //   }
  // }
  // 第二种，直接遍历测量--这种效率更高
  let len = tempArr.length
  let measures = {}
  for (let i = 0; i < len; i++) {
    if (!measures[tempArr[i]]) {
      measures[tempArr[i]] = {
        width: param.ctx.measureText(tempArr[i]).width
      }
    }
  }
  // console.log('  Set:', Date.now() - s)
  // tab符、换行符特殊处理
  if (measures['\t']) {
    measures['\t'].width = measures['阅'].width * 2
  }
  if (measures['\r']) {
    measures['\r'].width = 0
  }
  if (measures['\n']) {
    measures['\n'].width = 0
  }
  console.log('measureChars:', Date.now() - s)
  return {
    textArray,
    measures
  }
}

/**
 * 将文本分配到每一页
 * @param {Object} param 参数对象
 * param {
 *    text: [], // 文本
 *    width: null,  // 版心宽度
 *    height: null, // 版心高度
 *    fontSize: null, // 字体大小
 *    lineHeight: null, // 行高：字体大小的倍数，最小1
 *    measures: { // 字符尺寸表
 *      'a': {
 *        width: 12
 *      }
 *    }
 * }
 * 返回值：
 * pages: [
 *    {
 *      startIndex: 0,
 *      endIndex: 100,
 *      page: 1,
 *      rows: [{
 *        startIndex: 0,
 *        endIndex: 10,
 *        completed: true,
 *        chars: ['a', 'b']
 *      }]
 *    }
 *  ]
 */
export function textToPage(param) {
  return _textToPage(param)
}

/**
 * 绘制 cavnas 页面
 * @param {Object} param  参数对象
 * param: {
 *    rows: [{
 *      chars: [
 *        {
 *          char: 'a',
 *          position: [100, 100, 116, 116], // 字符绘制位置
 *        }
 *      ]
 *    }], // 文本
 *    width: 100, // 纸张宽度
 *    height: 100,  // 纸张高度
 *    paddingLeft: 20,
 *    paddingTop: 20,
 *    full: true, // 是否全屏状态
 *    ctx: {},  // canvas 绘图上下文
 *    fontSize: 16, // 字体大小，页眉和页脚文字大小为字体大小的 3/4，全屏模式下为 12
 *    footerText: '12/12', // 页脚文字
 * }
 * 返回值：true/false
 */
export function renderPage(param) {
  const s = Date.now()
  // 绘制内容
  param.rows.map((item, row) => {
    item.chars.map(chara => {
      param.ctx.fillText(chara.char, chara.position[0], chara.position[3])
    })
  })
  // 绘制页脚
  param.ctx.save()
  let _fontSize = param.full ? 12 : param.fontSize * 3 / 4
  if (_fontSize > param.paddingTop) {
    _fontSize = param.paddingTop * 3 / 4
  }
  param.ctx.font = `${_fontSize}px ${bookSetting.fontFamily}`
  param.ctx.textAlign = 'center'
  param.ctx.fillStyle = 'gray'
  let position = [
    param.width / 2,
    param.height - (param.paddingTop - _fontSize) / 2
  ]
  param.ctx.fillText(param.footerText, ...position)
  // 绘制页眉
  if (param.headerText) {
    param.ctx.textAlign = param.headerTextAlign === 'right' ? param.headerTextAlign : 'left'
    position = [
      param.headerTextAlign === 'right' ? param.width - param.paddingLeft : param.paddingLeft,
      param.paddingTop - (param.paddingTop - _fontSize) / 2
    ]
    param.ctx.fillText(param.headerText, ...position)
  }
  param.ctx.restore()

  console.log('renderPage:', Date.now() - s)
}

/**
 * 绘制 svg 页面
 * @param {Object} param  参数对象
 * param: {
 *    rows: [{
 *      chars: [
 *        {
 *          char: 'a',
 *          position: [100, 100, 116, 116], // 字符绘制位置
 *        }
 *      ]
 *    }], // 文本
 *    width: 100, // 纸张宽度
 *    height: 100,  // 纸张高度
 *    paddingLeft: 20,
 *    paddingTop: 20,
 *    full: true, // 是否全屏状态
 *    el: {},  // svg 容器
 *    fontSize: 16, // 字体大小，页眉和页脚文字大小为字体大小的 3/4，全屏模式下为 12
 *    fontFamily: 'Microsoft YaHei', // 字体
 *    color: 'red', // 字体颜色
 *    footerText: '12/12', // 页脚文字
 * }
 * 返回值：true/false
 */
export function renderSvgPage(param) {
  const s = Date.now()
  const fragment = document.createDocumentFragment()
  let text = null
  let textContent = ''
  // 绘制内容
  param.rows.map((item, row) => {
    textContent = ''
    text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    item.chars.map(chara => {
      textContent += chara.char
    })
    if (textContent) {
      text.textContent = textContent
      text.style.fontSize = `${param.fontSize}px`
      text.style.fontFamily = `${param.fontFamily}`
      text.style.fill = `${param.color}`
      text.setAttribute('x', item.charsSpace[0])
      text.setAttribute('y', item.charsSpace[3])
      fragment.appendChild(text)
    }
  })
  // 绘制页脚
  let _fontSize = param.full ? 12 : param.fontSize * 3 / 4
  if (_fontSize > param.paddingTop) {
    _fontSize = param.paddingTop * 3 / 4
  }
  let position = [
    param.width / 2,
    param.height - (param.paddingTop - _fontSize) / 2
  ]
  text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.textContent = param.footerText
  text.style.fontSize = `${_fontSize}px`
  text.style.fontFamily = `${bookSetting.fontFamily}`
  text.style.fill = `gray`
  text.setAttribute('x', position[0])
  text.setAttribute('y', position[1])
  text.setAttribute('text-anchor', 'middle')
  fragment.appendChild(text)
  // 绘制页眉
  if (param.headerText) {
    position = [
      param.headerTextAlign === 'right' ? param.width - param.paddingLeft : param.paddingLeft,
      param.paddingTop - (param.paddingTop - _fontSize) / 2
    ]
    text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.textContent = param.headerText
    text.style.fontSize = `${_fontSize}px`
    text.style.fontFamily = `${bookSetting.fontFamily}`
    text.style.fill = `gray`
    text.setAttribute('x', position[0])
    text.setAttribute('y', position[1])
    text.setAttribute('text-anchor', param.headerTextAlign === 'right' ? 'end' : 'start')
    fragment.appendChild(text)
  }

  while (param.el.lastChild) {
    param.el.removeChild(param.el.lastChild)
  }
  param.el.appendChild(fragment)

  console.log('renderSvgPage:', Date.now() - s)
}

/**
 * 绘制 dom 页面
 * @param {Object} param  参数对象
 * param: {
 *    rows: [{
 *      chars: [
 *        {
 *          char: 'a',
 *          position: [100, 100, 116, 116], // 字符绘制位置
 *        }
 *      ]
 *    }], // 文本
 *    width: 100, // 纸张宽度
 *    height: 100,  // 纸张高度
 *    paddingLeft: 20,
 *    paddingTop: 20,
 *    full: true, // 是否全屏状态
 *    el: {},  // svg 容器
 *    fontSize: 16, // 字体大小，页眉和页脚文字大小为字体大小的 3/4，全屏模式下为 12
 *    fontFamily: 'Microsoft YaHei', // 字体
 *    color: 'red', // 字体颜色
 *    footerText: '12/12', // 页脚文字
 * }
 * 返回值：true/false
 */
export function renderDomPage(param) {
  const s = Date.now()
  const fragment = document.createDocumentFragment()
  let text = null
  let textContent = ''
  // 绘制内容
  param.rows.map((item, row) => {
    textContent = ''
    text = document.createElement('span')
    item.chars.map(chara => {
      textContent += chara.char
    })
    if (textContent) {
      text.innerText = textContent
      text.style.fontSize = `${param.fontSize}px`
      text.style.fontFamily = `${param.fontFamily}`
      text.style.color = `${param.color}`
      text.style.position = 'absolute'
      text.style.left = `${item.charsSpace[0]}px`
      text.style.top = `${item.charsSpace[1]}px`
      text.style.letterSpacing = `${item.letterSpacing}px`
      fragment.appendChild(text)
    }
  })
  // 绘制页脚
  let _fontSize = param.full ? 12 : param.fontSize * 3 / 4
  if (_fontSize > param.paddingTop) {
    _fontSize = param.paddingTop * 3 / 4
  }
  let position = [
    param.width / 2,
    param.height - (param.paddingTop - _fontSize) / 2 - _fontSize
  ]
  text = document.createElement('span')
  text.textContent = param.footerText
  text.style.fontSize = `${_fontSize}px`
  text.style.fontFamily = `${bookSetting.fontFamily}`
  text.style.color = `gray`
  text.style.position = 'absolute'
  text.style.left = `${position[0]}px`
  text.style.top = `${position[1]}px`
  text.style.transform = 'translateX(-50%)'
  fragment.appendChild(text)
  // 绘制页眉
  if (param.headerText) {
    position = [
      param.headerTextAlign === 'right' ? param.width - param.paddingLeft : param.paddingLeft,
      (param.paddingTop - _fontSize) / 2
    ]
    text = document.createElement('span')
    text.textContent = param.headerText
    text.style.fontSize = `${_fontSize}px`
    text.style.fontFamily = `${bookSetting.fontFamily}`
    text.style.color = `gray`
    text.style.position = 'absolute'
    text.style.left = `${position[0]}px`
    text.style.top = `${position[1]}px`
    if (param.headerTextAlign === 'right') {
      text.style.transform = 'translateX(-100%)'
    }
    fragment.appendChild(text)
  }

  while (param.el.lastChild) {
    param.el.removeChild(param.el.lastChild)
  }
  param.el.appendChild(fragment)

  console.log('renderDomPage:', Date.now() - s)
}

/**
 * 计算页面排版
 * @param {Object} param 参数对象
 * param: {
 *    rows: [{  // 各行信息
 *      startIndex: 0,
 *      endIndex: 10,
 *      completed: true,
 *      chars: ['a', 'b']
 *    }]
 *    width: null,  // 页面宽度
 *    height: null, // 页面高度
 *    paddingLeft: null,  // 左右边距
 *    paddingTop: null, // 上下边距
 *    fontSize: null, // 字体大小
 *    lineHeight: null, // 行高：字体大小的倍数，最小1
 *    measures: { // 字符尺寸表
 *      'a': {
 *        width: 12
 *      }
 *    }
 * }
 * @returns {Array}
 * 返回值：[
 *  {
 *    startIndex: 0,
 *    endIndex: 10,
 *    completed: true,
 *    calculated: true,
 *    chars: [
 *      {
 *        char: 'a',
 *        position: [100, 100, 116, 116], // 字符绘制位置
 *      }
 *    ],
 *    charsSpace: [100, 100, 300, 116], // 此行字符占据的空间，除了换行，基本占据整行
 *    rowSpace: [100, 100, 300, 124], // 此行占据的空间，都是占据整行
 *  }
 * ]
 */
export function layout(param) {
  // 如果已经计算过了，直接返回
  if (param.rows[0] && param.rows[0].calculated) return param.rows

  const s = Date.now()

  const _params = {...param}
  _params.lineHeight = param.fontSize * param.lineHeight
  _params.lineWidth = param.width - param.paddingLeft * 2
  _params.rows = JSON.parse(JSON.stringify(_params.rows))
  _params.rows.map((item, row) => {
    let letterSpacing = 0
    let tempRowWidth = 0
    // 先计算rowSpace，后面计算字符位置需要用到
    item.rowSpace = [
      _params.paddingLeft,
      _params.paddingTop + row * _params.lineHeight,
      _params.paddingLeft + _params.lineWidth,
      _params.paddingTop + (row + 1) * _params.lineHeight
    ]
    // 如果是完整的一行，需要计算字间距，
    if (item.completed) {
      let charsWidth = 0
      item.chars.map(chara => {
        charsWidth += _params.measures[chara].width
      })
      letterSpacing = (_params.lineWidth - charsWidth) / (item.chars.length - 1)
    }
    // 计算字符位置
    item.chars.map((chara, index) => {
      let position = [
        _params.paddingLeft + tempRowWidth,
        item.rowSpace[1],
        _params.paddingLeft + tempRowWidth + _params.measures[chara].width,
        item.rowSpace[1] + _params.fontSize
      ]
      // 直接将原来的字符替换成对象
      item.chars[index] = {
        char: chara,
        position
      }
      // 更新 tempRowWidth
      tempRowWidth += _params.measures[chara].width + letterSpacing
    })
    // 计算 charsSpace
    item.charsSpace = [
      item.rowSpace[0],
      item.rowSpace[1],
      item.chars[item.chars.length - 1].position[2],
      item.chars[item.chars.length - 1].position[3]
    ]
    // letterSpacing 也加到对象中
    item.letterSpacing = letterSpacing
    // 标记此行已经计算过
    item.calculated = true
  })
  console.log('layout:', Date.now() - s)

  return _params.rows
}

/**
 * 计算显示书籍尺寸
 * @param {Object} param 参数对象
 * param: {
 *    defaultPageSize: [width, height],  // 单页尺寸
 *    defaultPagePadding: [number, number],  // 页边距
 *    limit: [number, number],  // 切换显示模式--全屏阈值
 *    width: number,  // 可视区宽度
 *    height: number, // 可视区高度
 *    menuWidth: number,  // 菜单溢出宽度
 * }
 */
export function calcBookSize(param) {
  const res = {
    full: false,
    single: false,
    pageSize: [],
    bookSize: [],
    pagePadding: []
  }
  let pageRatio = param.defaultPageSize[0] / param.defaultPageSize[1]

  // 是否全屏
  if (param.width <= param.limit[0] || param.width <= param.limit[1]) {
    res.full = true
    res.single = true
    res.bookSize = res.pageSize = [param.width, param.height]
  } else {
    let tempWidth = param.width - 20 * 2
    let tempHeight = param.height - 20 * 2
    // 单页
    if (param.width < param.height || param.width < 1000) {
      res.single = true
      // 宽度不足
      if ((tempWidth - param.menuWidth) / tempHeight < pageRatio) {
        let tempPageWidth = tempWidth - param.menuWidth
        res.pageSize = [tempPageWidth, tempPageWidth / pageRatio]
        res.bookSize = [tempWidth, res.pageSize[1]]
      } else {
        // 高度不足
        res.pageSize = [tempHeight * pageRatio, tempHeight]
        res.bookSize = [res.pageSize[0] + param.menuWidth, tempHeight]
      }
    } else {
      // 双页
      // 宽度不足
      if ((tempWidth - param.menuWidth) / tempHeight < pageRatio * 2) {
        let tempPageWidth = (tempWidth - param.menuWidth) / 2
        res.pageSize = [tempPageWidth, tempPageWidth / pageRatio]
        res.bookSize = [tempWidth, res.pageSize[1]]
      } else {
        // 高度不足
        res.pageSize = [tempHeight * pageRatio, tempHeight]
        res.bookSize = [res.pageSize[0] * 2 + param.menuWidth, tempHeight]
      }
    }
  }

  // padding
  if (res.full) {
    res.pagePadding = bookSetting.fullPagePadding
  } else {
    res.pagePadding = [
      res.pageSize[0] * param.defaultPagePadding[0] / param.defaultPageSize[0],
      res.pageSize[1] * param.defaultPagePadding[1] / param.defaultPageSize[1]
    ]
  }

  return res
}

/**
 * 字体支持
 * @param {Object} ctx 绘图上下文
 * @return {Boolean} true/false
 */
export function supportFamily(ctx) {
  if (ctx.measureText('一').width) {
    return true
  } else {
    return false
  }
}

/**
 * 文本搜索
 * @param {Object} param 参数对象
 * param: {
 *    textArray: ['a', 'b'], 文本数组
 *    pages: [], // 分页数据
 *    keyword: 'ddd', // 搜索关键字
 *    startIndex: 0 // 开始搜索位置
 * }
 * @return {Object|false}
 * 返回值：{
 *    startIndex: 0, // 开始位置
 *    keyword: 'a', // 搜索关键字
 *    isAll: false, // 是否全部结果
 *    results: [
 *      {
 *        startIndex: 2, // 结果开始位置
 *        keywordStartIndex: 3, // 关键字开始位置
 *        page: 1, // 结果页码
 *        strings: [ // 结果文本片段
 *          {
 *            text: 'add', // 文本
 *            isKeyword: false // 此文本是否为关键字
 *          }
 *        ]
 *      }
 *    ]
 * }
 */
export function search(param) {
  let searchResult = findSubArray(param.textArray, [...param.keyword], param.startIndex, bookSetting.maxSearchResult + 1)
  let resLen = searchResult.length
  if (resLen) {
    let res = {
      startIndex: param.startIndex,
      keyword: param.keyword,
      isAll: !(resLen >= bookSetting.maxSearchResult + 1),
      results: []
    }
    searchResult.map(item => {
      let temp = {
        startIndex: item < bookSetting.searchResultPadding ? 0 : item - bookSetting.searchResultPadding,
        keywordStartIndex: item,
        strings: []
      }
      // 页码
      param.pages.map((page, pageIndex) => {
        if (page.startIndex <= item && page.endIndex >= item) {
          temp.page = pageIndex + 1
        }
      })
      // 关键字之前
      temp.strings.push({
        text: arrayCopy(param.textArray, temp.startIndex, item - 1).join(''),
        isKeyword: false
      })
      // 关键字
      temp.strings.push({
        text: param.keyword,
        isKeyword: true
      })
      // 关键字之后
      temp.strings.push({
        text: arrayCopy(param.textArray, item + param.keyword.length, item + param.keyword.length + bookSetting.searchResultPadding).join(''),
        isKeyword: false
      })
      res.results.push(temp)
    })
    // 如果搜索结果比较多--超过指定数目，需要去掉最后一个，因为最后一个是用来确定是否已经全部搜索的
    if (!res.isAll) {
      res.results.pop()
    }
    return res
  } else {
    return false
  }
}

/**
 * 绘制背景
 * @param {Object} param  参数对象
 * param: {
 *    rows: [10, 10, 100, 20], // 绘制区域
 *    ctx: {},  // canvas 绘图上下文
 *    fillStyle: 'orange', // 背景色
 * }
 * 返回值：true/false
 */
export function renderBgc(param) {
  const { rows, ctx, fillStyle } = param
  ctx.fillStyle = fillStyle
  // 绘制背景
  rows.map((item, row) => {
    // 绘制的背景高度加 2 像素的补正--因为背景无法完全覆盖文字，不知为何
    ctx.fillRect(item[0], item[1], item[2] - item[0], item[3] - item[1] + 2)
  })
}
