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
  fontFamily: 'Microsoft YaHei',
  fontSize: 16,
  lineHeight: 1.5,
  color: '#333',
  background: '#fff5ee'
}

/**
 * 应用设置
 */
export const appSetting = {
  title: '享阅·阅读器'
}
