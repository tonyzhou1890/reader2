// 不需要响应式，并且量比较大的数据放到 _data 里
let _data = {
  cacheText: '', // 缓存文本
  measures: {}, // 测量的字符
  textArray: [], // 文本数组
  pages: [] // 分页信息
}
window._data = _data
