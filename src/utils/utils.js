import { bookSetting } from '@/utils/setting'
let { prePunctuation, postPunctuation } = bookSetting
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
  let tempArr = textArray.concat([...prePunctuation, ...postPunctuation, bookSetting.hyphen, '阅'])
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
  if (!param.text.length) {
    return []
  }
  let s = Date.now()
  // 参数预处理
  let _params = {...param}
  _params.lineHeight = param.fontSize * param.lineHeight
  _params.rowNum = Math.floor(param.height / _params.lineHeight)
  _params.referenceChar = _params.measures['阅']

  let pages = [] // 存储每页信息
  let len = _params.text.length
  let page = 0
  let rows = []
  let row = 0
  let rowChars = []
  let rowWidth = 0
  let curChar = ''
  let tempRowWidth = 0
  let breakMaxChars = bookSetting.breakMaxChars < 0 ? 0 : bookSetting.breakMaxChars
  let englishMaxWrapChars = bookSetting.englishMaxWrapChars < 0 ? 0 : bookSetting.englishMaxWrapChars
  let backCharInfo = false // 回溯信息
  // 遍历字符分行分页
  for (let i = 0; i < len; i++) {
    // 当前字符
    curChar = _params.text[i]
    // 如果是新页，初始化本页数据
    if (row === 0 && rowWidth === 0) {
      pages[page] = {
        page,
        startIndex: i
      }
    }

    // 如果是新行，初始化新行数据
    if (rowWidth === 0) {
      rows[row] = {
        startIndex: i,
        completed: true
      }
    }
    // 如果是换行符，结束此行
    if (curChar === '\r' || curChar === '\n') {
      rowChars[rowChars.length] = curChar
      // 如果这个字符是\r，下一个是\n，i+1
      if (curChar === '\r' && _params.text[i + 1] === '\n') {
        rowChars[rowChars.length] = _params.text[i + 1]
        i++
      }
      rows[row].completed = false
      endRow(i)
    } else {
      tempRowWidth = rowWidth + _params.measures[curChar].width
      /**
       * 普通字符（包括其余各种符号）处理
       * 1 有剩余空间(包括0)
       *    1.1 行首后置符号
       *      1.1.1 上一行最后一个字符（前一个字符）为换行符，不回溯换行
       *      1.1.2 最大回溯字符数以内，回溯换行
       *      1.1.3 超过最大回溯字符数，不回溯换行
       *      1.1.4 上一个字符为英文，不回溯换行
       *      1.1.5 判断：一行第一个字符，并且是后置字符，并且前一个字符有值且非换行符、非英文，并且回溯字符数以内有非后置字符
       *    1.2 行尾前置符号
       *      1.2.1 下一个字符为换行字符，不提前换行
       *      1.2.2 剩余空间小于下一个非换行字符，提前换行
       *      1.2.3 回溯字符数以内遇到非前置字符，非前置字符后提前换行
       *      1.2.4 判断：下一个字符非换行字符，且剩余空间小于下一个字符，然后函数回溯
       *    1.3 行尾英文字符
       *      1.3.1 下一个字符也是英文，回溯换行
       *      1.3.2 最大英文回溯字符以内，回溯换行
       *      1.3.3 超过最大英文回溯字符数，添加连字符换行
       *    1.3 其余情况，常规处理--改变当前行宽度，当前字符加入当前行
       * 2 没有剩余空间，换行
       */
      if (_params.width - tempRowWidth >= 0) {
        // 行首后置符号
        if (
          !rowWidth &&
          postPunctuation.includes(curChar) &&
          _params.text[i - 1] &&
          _params.text[i - 1] !== '\r' &&
          _params.text[i - 1] !== '\n' &&
          (backCharInfo = validPostBack(i))
        ) {
          backCharInfo.prevRow.endIndex = backCharInfo.endIndex
          backCharInfo.prevRow.chars.splice(backCharInfo.endIndex - backCharInfo.prevRow.startIndex + 1)
          i = backCharInfo.endIndex
        } else if ( // 行尾前置符号
          prePunctuation.includes(curChar) &&
          _params.text[i - 1] &&
          _params.text[i - 1] !== '\r' &&
          _params.text[i - 1] !== '\n' &&
          !bookSetting.englishCharReg.test(_params.text[i - 1]) &&
          _params.width - tempRowWidth < _params.measures[_params.text[i - 1]].width &&
          (backCharInfo = validPreBack(i))
        ) {
          rowChars.splice(backCharInfo.endIndex - rows[row].startIndex + 1)
          endRow(backCharInfo.endIndex)
          i = backCharInfo.endIndex
        } else if ( // 行尾连续英文
          bookSetting.englishCharReg.test(curChar) &&
          _params.text[i - 1] &&
          _params.text[i + 1] &&
          bookSetting.englishCharReg.test(_params.text[i + 1]) &&
          _params.width - tempRowWidth < _params.measures[_params.text[i + 1]].width &&
          (backCharInfo = validEnglishPreBack(i))
        ) {
          rowChars.splice(backCharInfo.endIndex - rows[row].startIndex + 1)
          if (backCharInfo.append) {
            rows[row].append = backCharInfo.append
            rowChars[rowChars.length] = backCharInfo.append
          }
          endRow(backCharInfo.endIndex)
          i = backCharInfo.endIndex
        } else { // 其余情况
          rowWidth = tempRowWidth
          rowChars[rowChars.length] = curChar
        }
      } else {
        i--
        endRow(i)
      }
    }
  }
  // 遍历结束后
  // 检查最后一个字符是否为非换行符，如果是非换行符，需要结束行和页
  if (_params.text[len - 1] !== '\r' && _params.text[len - 1] !== '\n') {
    endRow(len - 1)
  }
  // 最后一页的最后一行不需要填充空隙
  let tempRowLen = pages[page - 1].rows.length
  pages[page - 1].rows[tempRowLen - 1].completed = false
  console.log('textToPage:', Date.now() - s)
  // 返回结果
  return pages

  /**
   * 结束此行
   */
  function endRow(index) {
    rows[row].endIndex = index
    rows[row].chars = rowChars
    row++
    rowChars = []
    rowWidth = 0
    // 如果达到最大行/最后一个字符，结束此页
    if (row >= _params.rowNum || index === len - 1) {
      endPage(index)
    }
  }

  /**
   * 结束此页
   */
  function endPage(index) {
    pages[page].endIndex = index
    pages[page].rows = rows
    page++
    rows = []
    row = 0
  }

  /**
   * 行首后置字符回溯是否有效
   */
  function validPostBack(i) {
    let prevRow = null
    // 上一行在前页
    if (!row) {
      prevRow = pages[page - 1].rows[_params.rowNum - 1]
    } else {
      // 上一行不在前页
      prevRow = rows[row - 1]
    }
    // 如果只回溯一个，直接返回i-2
    if (breakMaxChars === 0) {
      return {
        prevRow,
        endIndex: i - 2
      }
    }
    // 否则深度回溯
    let start = i - 1 - breakMaxChars - 1
    let index = null
    start = prevRow.startIndex > start ? prevRow.startIndex : start
    for (index = i - 1; index > start; index--) {
      if (!postPunctuation.includes(_params.text[index])) {
        return {
          prevRow,
          endIndex: index - 1
        }
      }
    }
    return false
  }

  /**
   * 行尾前置字符回溯是否有效
   */
  function validPreBack(i) {
    // 如果不回溯，直接返回i-1
    if (breakMaxChars === 0) {
      return {
        endIndex: i - 1
      }
    }
    // 否则深度回溯
    let start = i - 1 - breakMaxChars
    let index = null
    start = rows[row].startIndex > start ? rows[row].startIndex : start
    for (index = i - 1; index > start; index--) {
      if (!prePunctuation.includes(_params.text[index])) {
        return {
          endIndex: index
        }
      }
    }
    return false
  }

  /**
   * 行尾连续英文回溯是否有效
   */
  function validEnglishPreBack(i) {
    const temp = {
      endIndex: i - 1
    }
    // 否则深度回溯
    let start = i - 1 - englishMaxWrapChars
    let index = null
    start = rows[row].startIndex > start ? rows[row].startIndex : start
    for (index = i - 1; index > start; index--) {
      if (!bookSetting.englishCharReg.test(_params.text[index])) {
        temp.endIndex = index
        break
      }
    }
    // 如果换行后本行最后一个字符是英文，需要添加连字符，并且重置最后一个字符位置
    if (bookSetting.englishCharReg.test(_params.text[temp.endIndex])) {
      temp.endIndex = i - 1
      temp.append = bookSetting.hyphen
    }
    // if (page < 2) {
    //   console.log(temp, start, index)
    // }
    return temp
  }
}

/**
 * 绘制页面
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
      _params.paddingTop + row * (_params.lineHeight + 1)
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
