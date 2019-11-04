/**
 * 将文本分配到每一页
 * @param {Object} param 参数对象
 * param {
 *    text: '', // 文本
 *    ctx: {},  // canvas 绘图上下文
 *    width: null,  // 版心宽度
 *    height: null, // 版心高度
 *    fontSize: null, // 字体大小
 *    lineHeight: null, // 行高：字体大小的倍数，最小1
 *    measures: { // 字符尺寸表
 *      'a': {
 *        width: 12,
 *        height: 12
 *      }
 *    }
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
 *        width: 12,
 *        height: 12
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
