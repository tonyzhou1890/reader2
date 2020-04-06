/**
 * 将文本分配到每一页
 * @param {Object} param 参数对象
 * param {
 *    text: [], // 文本
 *    textOffsetIndex: 0, // 文本开始下标偏移量，比如分章节的时候
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
  // 后面使用的变量
  const { bookSetting } = param
  const { prePunctuation, postPunctuation } = bookSetting
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
          !bookSetting.englishChars.includes(_params.text[i - 1]) &&
          _params.width - tempRowWidth < _params.measures[_params.text[i - 1]].width &&
          (backCharInfo = validPreBack(i))
        ) {
          rowChars.splice(backCharInfo.endIndex - rows[row].startIndex + 1)
          endRow(backCharInfo.endIndex)
          i = backCharInfo.endIndex
        } else if ( // 行尾连续英文
          bookSetting.englishChars.includes(curChar) &&
          _params.text[i - 1] &&
          _params.text[i + 1] &&
          bookSetting.englishChars.includes(_params.text[i + 1]) &&
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

  // 对页和行进行章节偏移量处理
  for (let i = 0; i < page; i++) {
    pages[i].startIndex += _params.textOffsetIndex
    pages[i].endIndex += _params.textOffsetIndex
    const rowsLen = pages[i].rows.length
    for (let r = 0; r < rowsLen; r++) {
      pages[i].rows[r].startIndex += _params.textOffsetIndex
      pages[i].rows[r].endIndex += _params.textOffsetIndex
    }
  }
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
      if (!bookSetting.englishChars.includes(_params.text[index])) {
        temp.endIndex = index
        break
      }
    }
    // 如果换行后本行最后一个字符是英文，需要添加连字符，并且重置最后一个字符位置
    if (bookSetting.englishChars.includes(_params.text[temp.endIndex])) {
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
 * 查找子数组
 * @param {Array} parentArray 父数组
 * @param {Array} subArray 子数组
 * @param {Number} startIndex 开始查找下标，可选
 * @param {Number} number 需要的结果数量
 */
export function findSubArray(parentArray = [], subArray = [], startIndex = 0, number = Infinity) {
  let res = []
  let parentLen = parentArray.length
  let subLen = subArray.length
  // 如果有一个为空数组，或者 startIndex 大于等于父数组长度，或者 number 为0，直接返回空数组
  if (parentLen === 0 || subLen === 0 || startIndex >= parentLen || number === 0) {
    return []
  }

  // 第二层循环不使用 every 或者 some 是出于性能的考虑
  for (let i = startIndex; i < parentLen; i++) {
    let flag = true
    for (let j = 0; j < subLen; j++) {
      if (subArray[j] !== parentArray[i + j]) {
        flag = false
        break
      }
    }
    if (flag) {
      res.push(i)
    }
    if (res.length >= number) {
      break
    }
  }

  return res
}

/**
 * 数组浅拷贝
 * @param {Array} arr 原数组
 * @param {Number} startIndex 开始索引
 * @param {Number} endIndex 结束索引
 */
export function arrayCopy(arr = [], startIndex = 0, endIndex = 0) {
  let _len = arr.length
  let _start = startIndex < 0 ? 0 : startIndex
  let _end = endIndex >= _len ? _len - 1 : endIndex
  if (_len === 0) {
    return []
  } else {
    let temp = []
    for (; _start <= _end; _start++) {
      temp[temp.length] = arr[_start]
    }
    return temp
  }
}

/**
 * 分章
 * @param {Object} param 参数对象
 * param {
 *    textArray: [], // 文本数组
 *    titleLineLength: 30 // 标题文本长度
 * }
 * @return {Array} 对象数组
 * 对象参考 checkChapter
 */
export function splitChapter(param) {
  let s = Date.now()
  const { textArray, titleLineLength } = param
  const len = textArray.length
  if (len === 0) {
    return []
  }
  const res = []
  // 第一行开始没有换行符，直接检测
  let checkTemp = null
  checkTemp = checkChapter({
    textArray,
    index: 0,
    titleLineLength
  })
  if (checkTemp) {
    res.push({
      ...checkTemp
    })
  }

  // 其余的从换行符后开始检测
  for (let i = 1; i < len; i++) {
    if (textArray[i] === '\n' && textArray[i + 1]) {
      checkTemp = checkChapter({
        textArray,
        index: i + 1,
        titleLineLength
      })
      if (checkTemp) {
        res.push({
          ...checkTemp
        })
      }
    }
  }
  console.log('splitChapter:', Date.now() - s)
  // 添加每个章节的 startIndex 和 endIndex
  res.map((item, index) => {
    item.startIndex = item.index
    item.endIndex = res[index + 1] ? res[index + 1].index - 1 : textArray.length - 1
  })
  return res
}

/**
 * 检测是否是章节标题--包括‘序言’之类的
 * @param {Object} param 对象参数
 * param {
 *    textArray: [], // 文本数组
 *    index: 1, // 行开始索引
 *    titleLineLength: 30 // 标题文本长度
 * }
 * @return {Boolean|Object}
 * 返回值：{
 *    index: 1, 行开始字符索引
 *    str: 'ddd', 标题字符串
 *    strArray: ['a'] 标题行
 * }
 */
export function checkChapter(param) {
  const { textArray, index, titleLineLength } = param
  const specialTitle = ['序言', '总序', '前言', '后记']
  let tempIndex = textArray.indexOf('\n', index)
  if (tempIndex > -1 && tempIndex < index + titleLineLength) {
    const strArray = arrayCopy(textArray, index, tempIndex)
    // 排除两边空字符的影响
    const str = strArray.join('').trim()
    if (str.length && (
      specialTitle.includes(str) ||
      // eslint-disable-next-line no-irregular-whitespace
      /^第?[0-9 一二三四五六七八九十百千万]+[章回篇节]([ \t　]\S+)*$/.test(str)
    )) {
      return {
        index,
        str,
        strArray
      }
    } else {
      return false
    }
  } else {
    return false
  }
}

/**
 * 根据页面像素位置查找字符--偏差值：0.5个字宽
 * @param {*} param 对象参数
 * param {
 *    point: [0, 0], // 像素位置
 *    page: { // 当前页信息
 *      startIndex: 0,
 *      endIndex: 100,
 *      page: 1,
 *      rows: [{
 *        startIndex: 0,
 *        endIndex: 10,
 *        completed: true,
 *        chars: [
 *          {
 *            char: 'a',
 *            position: [100, 100, 116, 116], // 字符绘制位置
 *          }
 *        ],
 *        charsSpace: [100, 100, 300, 116], // 此行字符占据的空间，除了换行，基本占据整行
 *        rowSpace: [100, 100, 300, 124], // 此行占据的空间，都是占据整行
 *      }]
 *    },
 *    direction: true or false // 查找方向-true: 向后，false: 向前
 * }
 * @return {Null|Object}
 * 返回值：{
 *    char: '', // 字符
 *    index: 0, // 索引
 * }
 */
export function findCharInPageByPoint(param) {
  const { point, page, direction } = param
  const { rows } = page
  let row = null // 哪一行
  let rowIndex = null // 哪一行索引
  let rowLen = rows.length // 行数
  let res = null // 结果
  // 找出位于哪一行
  if (point[1] < rows[0].rowSpace[1]) { // 如果在第一行之前
    // 如果向后查找，则算第一行；否则不处理
    if (direction) {
      row = rows[0]
      rowIndex = 0
    }
  } else if (point[1] >= rows[rowLen - 1].rowSpace[3]) { // 如果在最后一行之后
    // 如果向前查找，则算最后一行
    if (!direction) {
      row = rows[rowLen - 1]
      rowIndex = rowLen - 1
    }
  } else { // 其余情况遍历查找行
    let temp = findRowByPoint({ point, rows })
    if (temp) {
      row = temp.row
      rowIndex = temp.index
    }
  }

  // 如果没有找到行，直接返回 null
  if (row === null) return res

  // 查找所在字符
  // 如果向后查找
  if (direction) {
    // 如果像素点 x 轴在某个字符中间的左边，则为此字符，否则下一行第一个字符
    row.chars.map((char, index) => {
      if (res === null && (point[0] <= ((char.position[0] + char.position[2]) / 2))) {
        res = {
          char: char.char,
          index: row.startIndex + index
        }
      }
    })
    // 没有找到，则为下一行第一个字符
    if (res === null && rows[rowIndex + 1]) {
      row = rows[rowIndex + 1]
      res = {
        char: row.chars[0].char,
        index: row.startIndex
      }
    }
    // 向前查找
  } else {
    // 如果像素点 x 轴在某个字符中间的右边，则为此字符，否则为上一行最后一个字符
    for (let i = row.chars.length - 1; i >= 0; i--) {
      if (res === null && (point[0] > ((row.chars[i].position[0] + row.chars[i].position[2]) / 2))) {
        res = {
          char: row.chars[i].char,
          index: row.startIndex + i
        }
        break
      }
    }
    // 没有找到，则为上一行最后一个字符
    if (res === null && rows[rowIndex - 1]) {
      row = rows[rowIndex - 1]
      res = {
        char: row.chars[row.chars.length - 1].char,
        index: row.endIndex
      }
    }
  }
  return res
}

/**
 * 找出两个像素点之间的首尾字符
 * @param {*} param
 * param {
 *    points: [{
 *      point: point,
 *      page: page
 *    }], // 两个像素点
 *    pageSize: [0, 0],
 *    pagePadding: [0, 0],
 * }
 */
export function findCharsBetweenPoints(param) {
  const { points } = param
  let start = null // 开始点
  let end = null // 结束点
  let startChar = null // 开始字符
  let endChar = null // 结束字符
  let res = null // 结果
  // 如果不同页码，按页码顺序
  if (points[0].page.page !== points[1].page.page) {
    if (points[0].page.page > points[1].page.page) {
      points.reverse()
    }
    // 相同页码需要根据是否同一行判断
  } else {
    let rows = [
      findRowByPoint({
        point: points[0].point,
        rows: points[0].page.rows
      }),
      findRowByPoint({
        point: points[1].point,
        rows: points[1].page.rows
      })
    ]
    // 如果在同一行，根据 x 轴确定先后
    if (rows[0] && rows[1] && rows[0].index === rows[1].index) {
      if (points[0].point[0] > points[1].point[0]) {
        points.reverse()
      }
      // 不在同一行，根据 y 轴确定先后
    } else if (points[0].point[1] > points[1].point[1]) {
      points.reverse()
    }
  }
  start = points[0]
  end = points[1]
  startChar = findCharInPageByPoint({
    point: start.point,
    page: start.page,
    direction: true
  })
  endChar = findCharInPageByPoint({
    point: end.point,
    page: end.page,
    direction: false
  })
  // 判断结果是否有效
  if (startChar && endChar) {
    res = { startChar: startChar.index, endChar: endChar.index }
  } else {
    // 不同页面，需要重新设置有效值；同一个页面，结果直接无效
    if (points[0].page.page !== points[1].page.page) {
      // 开始页无效，则设置下一页第一个字符
      if (!startChar) {
        startChar = start.page.endIndex + 1
        // 结束页无效，则设置上一页最后一个字符
      } else {
        endChar = end.page.startIndex - 1
      }
      res = { startChar, endChar }
    }
  }
  return res
}

/**
 * 找出像素点所在行
 * @param {*} param
 * param {
 *    point: [0, 0],
 *    rows: [{
 *      rowSpace: [100, 100, 300, 124]
 *    }]
 * }
 */
export function findRowByPoint(param) {
  const { point, rows } = param
  let res = null
  rows.map((item, index) => {
    if (point[1] >= item.rowSpace[1] && point[1] < item.rowSpace[3]) {
      res = {
        row: JSON.parse(JSON.stringify(item)),
        index
      }
    }
  })
  return res
}

/**
 * 计算高亮背景区域
 * @param {*} param
 * param {
 *    pages: [page],
 *    startChar: 0, // 开始字符索引
 *    endChar: 1, // 结束字符索引
 * }
 */
export function calcHighlightArea(param) {
  const { pages, startChar, endChar } = param
  let startPageIndex = null
  let endPageIndex = null
  let startRowIndex = null
  let endRowIndex = null
  let res = null
  // 找到开始页/行和结束页/行
  pages.map((page, index) => {
    if (page.startIndex <= startChar && page.endIndex >= startChar) {
      startPageIndex = index
      page.rows.map((row, rowIndex) => {
        if (row.startIndex <= startChar && row.endIndex >= startChar) {
          startRowIndex = rowIndex
        }
      })
    }
    if (page.startIndex <= endChar && page.endIndex >= endChar) {
      endPageIndex = index
      page.rows.map((row, rowIndex) => {
        if (row.startIndex <= endChar && row.endIndex >= endChar) {
          endRowIndex = rowIndex
        }
      })
    }
  })

  res = []
  for (let i = startPageIndex; i <= endPageIndex; i++) {
    res.push({
      page: i,
      rows: calcHighlightInPage({
        startChar: i === startPageIndex ? startChar : pages[i].startIndex,
        endChar: i === endPageIndex ? endChar : pages[i].endIndex,
        startRowIndex: i === startPageIndex ? startRowIndex : 0,
        endRowIndex: i === endPageIndex ? endRowIndex : pages[i].rows.length - 1,
        page: pages[i]
      })
    })
  }
  return res
}

/**
 * 计算某一页中高亮区域
 * @param {*} param
 * param {
 *    startChar: 0, // 开始索引
 *    endChar: 1, // 结束索引
 *    startRowIndex: 0, // 本页开始行
 *    endRowIndex: 1, // 本页结束行
 *    page: page
 * }
 */
export function calcHighlightInPage(param) {
  const { startChar, endChar, startRowIndex, endRowIndex, page } = param
  let row = null
  let startPosition = null
  let endPosition = null
  const res = []

  for (let i = startRowIndex; i <= endRowIndex; i++) {
    row = page.rows[i]
    // 开始字符和结束字符在同一行
    if (i === startRowIndex && i === endRowIndex) {
      startPosition = row.chars[startChar - row.startIndex].position
      endPosition = row.chars[endChar - row.startIndex].position
      // 开始行
    } else if (i === startRowIndex) {
      startPosition = row.chars[startChar - row.startIndex].position
      endPosition = row.chars[row.chars.length - 1].position
      // 结束行
    } else if (i === endRowIndex) {
      startPosition = row.chars[0].position
      endPosition = row.chars[endChar - row.startIndex].position
      // 普通行
    } else {
      startPosition = row.chars[0].position
      endPosition = row.chars[row.chars.length - 1].position
    }
    res.push([
      startPosition[0],
      startPosition[1],
      endPosition[2],
      endPosition[3]
    ])
  }
  return res
}

/**
 * 计算元素位置
 * @param {*} param
 * param {
 *    window: [100, 100], // 窗口尺寸
 *    el: [10, 10], // 元素尺寸
 *    target: [10, 10], // 目标位置
 *    position: 'left'/'right'/'top'/'bottom' // 元素位置
 * }
 * @return {Array}
 * 返回值：[0, 0]
 */
export function calcPosition(param) {
  const { window, el, target, position } = param
  // 首先，根据 target 和 el 中心定位左上角
  const res = [target[0] - el[0] / 2, target[1] - el[1] / 2]
  // 然后根据方位调整
  switch (position) {
    case 'left':
      res[0] = target[0] - el[0]
      break
    case 'right':
      res[0] = target[0]
      break
    case 'top':
      res[1] = target[1] - el[1]
      break
    case 'bottom':
      res[1] = target[1]
      break
  }
  // 如果超出屏幕范围，需要调整--暂不考虑 el 比 window 大的情况
  // 左侧
  res[0] = res[0] < 0 ? 0 : res[0]
  // 右侧
  res[0] = res[0] + el[0] > window[0] ? window[0] - el[0] : res[0]
  // 上面
  res[1] = res[1] < 0 ? 0 : res[1]
  // 下面
  res[1] = res[1] + el[1] > window[1] ? window[1] - el[1] : res[1]
  return res
}
