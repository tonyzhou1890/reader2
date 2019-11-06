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
  let tempArr = textArray.concat([...prePunctuation, ...postPunctuation, '-', '阅'])
  // 去重
  tempArr = [...new Set(tempArr)]
  let measures = {}
  let len = tempArr.length
  // 最小字符宽度，后面用来确定当前字符是否是一行末尾的字符
  let minCharWidth = 1000
  let maxCharWidth = 0
  // for 循环效率比 map 之类的遍历器高
  for (let i = 0; i < len; i++) {
    measures[tempArr[i]] = param.ctx.measureText(tempArr[i])
    minCharWidth = measures[tempArr[i]].width < minCharWidth ? measures[tempArr[i]].width : minCharWidth
    maxCharWidth = measures[tempArr[i]].width > maxCharWidth ? measures[tempArr[i]].width : maxCharWidth
  }
  // tab符特殊处理
  if (measures['\t']) {
    measures['\t'].width = measures['阅'].width * 2
    maxCharWidth = measures['\t'].width > maxCharWidth ? measures['\t'].width : maxCharWidth
  }
  console.log('measureChars:', Date.now() - s)
  return {
    textArray,
    measures,
    minCharWidth,
    maxCharWidth
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
 *    },
 *    minCharWidth: 1000
 * }
 * 返回值：
 * {
 *    pages: [
 *      {
 *        startIndex: 0,
 *        endIndex: 100,
 *        page: 1
 *      }
 *    ],
 *    total: 12
 * }
 */
export function textToPage(param) {
  // 参数预处理
  let _params = {...param}
  _params.lineHeight = param.fontSize * param.lineHeight
  _params.rowNum = Math.floor(height / _params.lineHeight)
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
  let backCharIndex = false  // 回溯索引
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
       *      1.1.4 判断：一行第一个字符，并且是后置字符，并且前一个字符有值且非换行符，并且回溯字符数以内有非后置字符
       *    1.2 行尾前置符号
       *      1.2.1 下一个字符为换行字符，不提前换行
       *      1.2.2 剩余空间小于下一个非换行字符，提前换行
       *      1.2.3 回溯字符数以内遇到非前置字符，非前置字符后提前换行
       *      1.2.4 判断：下一个字符非换行字符，且剩余空间小于下一个字符，然后函数回溯
       *    1.3 其余情况，常规处理
       * 2 没有剩余空间，换行
       */
      if (_params.width - tempRowWidth >= 0) {
        if (!rowWidth && postPunctuation.includes(curChar) && _params.text[i - 1] && _params.text[i - 1] !== '\r' && _params.text[i - 1] !== '\n' && (backCharIndex = validPostBack(i))) {

        }
      } else {
        i--
        endRow(i)
      }
    }
  }

  /**
   * 结束此行
   */
  function endRow(index) {
    rows[row].endIndex = index
    rows[row].completed = false
    rows[row].chars = rowChars
    row++
    rowChars = []
    rowWidth = 0
    // 如果达到最大行，结束此页
    if (row >= _params.rowNum) {
      endPage(index)
    }
  }

  /**
   * 结束此页
   */
  function endPage(index) {
    pages[page].endIndex = index
    pages.rows = rows
    page++
    rows = []
  }

  /**
   * 行首前置字符回溯是否有效
   */
  function validPostBack(i) {
    // 如果只回溯一个，直接返回i-2
    if (bookSetting.breakMaxChars) {
      return i - 2
    }
    // 否则深度回溯
    let start = i - 1 - bookSetting.breakMaxChars - 1
    let prevRow = null
    if (!row) {
      prevRow = pages[page - 1].rows[_params.rowNum - 1]
      start = prevRow.startIndex < start ? prevRow.startIndex : start
      
    }
  }
}

/**
 * 绘制页面
 * @param {Object} param  参数对象
 * param: {
 *    chars: [
 *      {
 *        char: 'a',  // 字符
 *        left: null, // 左边距离
 *        top: null,  // 上部距离
 *      }
 *    ], // 文本
 *    ctx: {},  // canvas 绘图上下文
 * }
 * 返回值：true/false
 */
export function renderPage(param) {

}

/**
 * 计算页面排版
 * @param {Object} param 参数对象
 * param: {
 *    text: '', // 全部文本
 *    startIndex: 0,  // 开始下标
 *    endIndex: 100,  // 结束下标
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
 */
export function layout(param) {

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
    if (param.width < param.height) {
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
  res.pagePadding = [
    res.pageSize[0] * param.defaultPagePadding[0] / param.defaultPageSize[0],
    res.pageSize[1] * param.defaultPagePadding[1] / param.defaultPageSize[1]
  ]

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
