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
  // 遍历字符分行分页
  for (let i = 0; i < len; i++) {
    // 当前字符
    let curChar = _params.text[i]
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
      // 如果这个字符是\r，下一个是\n，i+1
      if (curChar === '\r' && _params.text[i + 1] === '\n') {
        i++
      }
      endRow(i)
    } else {
      let tempRowWidth = rowWidth + _params.measures[curChar].width
      /**
       * 普通字符（包括其余各种符号）处理
       * 1 有剩余空间
       *    1.1 行首后置符号
       *      1.1.1 上一行最后一个字符（前一个字符）为换行符，不回溯换行
       *      1.1.2 最大回溯字符数以内，回溯换行
       *      1.1.3 超过最大回溯字符数，不回溯换行
       *    1.2 行尾前置符号
       *      1.2.1 下一个字符为换行字符，不提前换行
       *      1.2.2 剩余空间小于下一个非换行字符，提前换行
       *    1.3 其余情况，常规处理
       * 2 没有剩余空间，换行
       */
      // 如果确定不是最后一个字符（剩余空间大于等于最大字符宽度），则改变当前行宽，此行添加当前字符
      if (width - tempRowWidth >= _params.maxCharWidth) {
        rowWidth = tempRowWidth
        rowChars[rowChars.length] = curChar
      } else if (width - tempRowWidth < _params.minCharWidth) {
        // 如果确定是最后一个字符（剩余空间小于最小字符宽度），检查是否是前置符号，如果是，提前换行（i--），否则常规处理
        if (prePunctuation.includes(curChar)) {
          i--
          endRow(i)
        } else {
          rowWidth = tempRowWidth
        }
      } else {
        // 如果不确定是否是最后一个字符，需要预检下一个字符
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
    if (row > _params.rowNum) {
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
