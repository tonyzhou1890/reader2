# reader2
使用 canvas 实现的阅读器

## 功能
1. 支持`txt`文本
2. 可以直接本地打开`utf-8`编码的`txt`文本
3. 可以通过`url`参数`address`打开远程`utf-8`文本
    比如：reader.tony93.top/?address=https:store.tony93.top/舞舞舞.txt

## todo
1. 文本搜索
2. 文本选择复制

## 其他说明
1. 排版只考虑了中文和英文，算法并没有考虑复杂情况
2. 移动端因为字体库较少，所以字体切换没有效果
3. 阅读进度存储在本地，至于是在`indexDB`还是`localstorage`取决于浏览器支持--用的库是`localforage`

## 更新日志
### v0.2.0--2019.12.09
1. 支持设置--字体、字体大小、行高、字体颜色、背景色
2. 支持跳页
3. 分页计算优化--放到`web worker`中

### v0.1.0
1. 支持`url`指定文本和本地文本
2. 中英文排版
3. `postMessage`支持