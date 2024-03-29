# reader2

使用 canvas 实现的阅读器

## 功能

1. 支持`txt`文本
2. 可以直接本地打开`utf-8`编码的`txt`文本
3. 可以通过`url`参数`address`打开远程`utf-8`文本
   比如：reader.tony93.top/?address=https://store.tony93.top/舞舞舞.txt

## 其他说明

1. 排版只考虑了中文和英文，算法并没有考虑复杂情况
2. 移动端因为字体库较少，所以字体切换没有效果
3. 阅读进度存储在本地，至于是在`indexDB`还是`localstorage`取决于浏览器支持--用的库是`localforage`

## 更新日志

### v0.7.1--2022.10.28

1. 修复 svg 和 dom 渲染双页情况下最后一页没有内容时不清屏的问题

### v0.7.0--2021.09.11

1. 优化性能和内存占用

### v0.6.0--2020.11.14

1. 修复 dom 渲染选择文字闪烁问题
2. 增加“书籍”信息和关闭书籍功能
3. 调整页面渲染顺序

### v0.5.0--2020.11.08

1. 增加 dom 渲染

### v0.4.0--2020.10.31

1. 多线程优化
2. 增加 svg 渲染

### v0.3.0--2020.04.06

1. 添加搜索功能
2. 添加自动分章（暂不支持取消）
3. pc 端添加复制文字功能
4. 修复部分`bug`

### v0.2.0--2019.12.09

1. 支持设置--字体、字体大小、行高、字体颜色、背景色
2. 支持跳页
3. 分页计算优化--放到`web worker`中

### v0.1.0

1. 支持`url`指定文本和本地文本
2. 中英文排版
3. `postMessage`支持
