/**
 * 书籍默认设置
 */
export const bookSetting = {
  defaultPageSize: [210, 297],
  defaultPagePadding: [25, 20],
  fullPagePadding: [20, 20],
  limit: [400, 600], // 切换显示模式的阈值
  bookSize: [0, 0], // 书籍尺寸
  pageSize: [0, 0], // 纸张尺寸
  pagePadding: [0, 0], // 纸张边距
  menuWidth: 20, // 菜单溢出宽度
  prePunctuation: '([{·‘“〈《「『【〔〖（．［｛￡￥', // 前置标点
  postPunctuation: '!),.:;?]}¨·ˇˉ―‖’”…∶、。〃々〉》」』】〕〗！＂＇），．：；？］｀｜｝～￠', // 后置标点
  breakMaxChars: 3, // 提前断行回溯最大字符数
  // englishCharTest: /[A-Za-z']/, // 英文字符检测正则
  englishChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'",
  englishMaxWrapChars: 5, // 英文提前换行最大字符数，否则添加连字符-
  hyphen: '-', // 连字符
  fontFamily: 'Microsoft YaHei', // 默认字体
  fontSize: 16, // 默认字体大小
  lineHeight: 1.5, // 默认行高
  color: '#333', // 默认字体颜色
  background: '#fff5ee', // 默认背景色
  fontFamilies: [ // 可选字体
    {
      value: 'Microsoft YaHei',
      label: '微软雅黑'
    },
    {
      value: 'KaiTi',
      label: '楷体'
    },
    {
      value: 'SimSun',
      label: '宋体'
    },
    {
      value: 'LiSu',
      label: '隶书'
    },
    {
      value: 'HeiTi',
      label: '黑体'
    }
  ],
  fontSizes: [12, 24], // 可选字体大小(最小-最大)
  lineHeights: [1, 2], // 可选行高(最小-最大)
  title: '享阅·阅读器',
  maxSearchResult: 50, // 最多搜索结果
  searchResultPadding: 10 // 搜索结果字符串两边填充额外字符串长度
}

/**
 * 应用设置
 */
export const appSetting = {
  title: '享阅·阅读器',
  DPR: window.devicePixelRatio || 1 // 设备像素比，canvas 的计算需要考虑这个
}
