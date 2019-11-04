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