<template>
  <div
    id="book"
    class="book"
    v-loading="loading"
    :element-loading-text="this.loadingText"
    :style="{
      left: (width - _bookSize[0]) / 2 + 'px',
      top: (height - _bookSize[1]) / 2 + 'px',
      width: _bookSize[0] + 'px',
      height: _bookSize[1] + 'px'
    }"
  >
    <!-- 内容部分 -->
    <div
      class="content-wrapper"
      ref="bookContainer"
      :style="{
        left: full ? 0 : menuWidth + 'px',
        width: full ? _bookSize[0] + 'px' : _bookSize[0] - menuWidth + 'px',
        height: _bookSize[1] + 'px',
        background
      }"
      tabindex="-1"
      @wheel="handleMousewheel"
      @keydown.right="(e) => changePage(1)"
      @keydown.left="(e) => changePage(-1)"
      @touchstart="touch"
      @touchend="touch"
      @mousedown="handleMousedown"
      @mouseup="handleMouseup"
      @mousemove="handleMousemove"
    >
      <!-- 封面 -->
      <img
        v-show="showWhat === 'frontCover'"
        class="cover-img"
        :src="frontCoverPath"
      />
      <!-- 封底 -->
      <img
        v-show="showWhat === 'backCover'"
        class="cover-img"
        :src="backCoverPath"
      />
      <!-- page-1 -->
      <div
        v-show="showWhat === 'content'"
        class="page-1"
        :style="{
          width: pageSize[0] + 'px',
          height: pageSize[1] + 'px'
        }"
      >
        <div class="por">
          <!-- 背景层 -->
          <canvas
            ref="pageOneBgc"
            class="poa"
            :style="{
              width: _pageSize.canvas[0] + 'px',
              height: _pageSize.canvas[1] + 'px'
            }"
          />
          <!-- 内容层 -->
          <canvas
            ref="pageOneText"
            class="poa"
            :style="{
              width: _pageSize.canvas[0] + 'px',
              height: _pageSize.canvas[1] + 'px'
            }"
          />
          <!-- svg 渲染 -->
          <svg
            ref="svgPageOneText"
            class="poa"
            :style="{
              width: _pageSize.svg[0] + 'px',
              height: _pageSize.svg[1] + 'px'
            }"
          ></svg>
          <!-- dom 渲染 -->
          <div
            ref="domPageOneText"
            class="poa dom-page-content"
            :style="{
              width: _pageSize.dom[0] + 'px',
              height: _pageSize.dom[1] + 'px',
              lineHeight: lineHeight
            }"
          ></div>
        </div>
      </div>
      <!-- page-2 -->
      <div
        v-show="!single && showWhat === 'content'"
        class="page-2"
        :style="{
          width: pageSize[0] + 'px',
          height: pageSize[1] + 'px'
        }"
      >
        <div class="por">
          <!-- 背景层 -->
          <canvas
            ref="pageTwoBgc"
            class="poa"
            :style="{
              width: _pageSize.canvas[0] + 'px',
              height: _pageSize.canvas[1] + 'px'
            }"
          />
          <!-- 内容层 -->
          <canvas
            ref="pageTwoText"
            class="poa"
            :style="{
              width: _pageSize.canvas[0] + 'px',
              height: _pageSize.canvas[1] + 'px'
            }"
          />
          <!-- svg 渲染 -->
          <svg
            ref="svgPageTwoText"
            class="poa"
            :style="{
              width: _pageSize.svg[0] + 'px',
              height: _pageSize.svg[1] + 'px'
            }"
          ></svg>
          <!-- dom 渲染 -->
          <div
            ref="domPageTwoText"
            class="poa dom-page-content"
            :style="{
              width: _pageSize.dom[0] + 'px',
              height: _pageSize.dom[1] + 'px',
              lineHeight: lineHeight
            }"
          ></div>
        </div>
      </div>
    </div>
    <!-- 菜单插槽 -->
    <slot
      :full="full"
    ></slot>
  </div>
</template>

<script>
// import debounce from 'lodash/debounce'
import Worker from '@/utils/utils.worker'
import {
  measureChars,
  layout,
  renderPage,
  renderSvgPage,
  renderDomPage,
  calcBookSize,
  supportFamily,
  renderBgc
} from '@/utils/utils'
import {
  arrayCopy,
  findCharsBetweenPoints,
  calcHighlightArea,
  calcPosition
} from '@/utils/pureUtils'
import { bookSetting, appSetting } from '@/utils/setting'
let {
  defaultPageSize,
  defaultPagePadding,
  limit,
  bookSize,
  pageSize,
  pagePadding,
  menuWidth
} = bookSetting
let initSelection = { // 默认文字选择
  startEvent: {
    page: null,
    e: null
  },
  endEvent: {
    page: null,
    e: null
  },
  isMoving: false,
  startChar: null,
  endChar: null,
  highlight: []
}
// let _calcBookSize = debounce(calcBookSize, 100)
export default {
  name: 'Book',
  components: {},
  props: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    text: {
      // 正文
      type: String,
      default: appSetting.title
    },
    title: {
      // 标题/书名
      type: String,
      default: ''
    },
    color: {
      type: String,
      required: true
    },
    background: {
      type: String,
      required: true
    },
    highlightBgc: {
      type: String,
      required: true
    },
    fontSize: {
      type: Number,
      required: true
    },
    lineHeight: {
      type: Number,
      required: true
    },
    fontFamily: {
      type: String,
      required: true
    },
    // point: {
    //   // 阅读进度字符下标
    //   type: Number,
    //   default: 0
    // },
    percent: {
      // 阅读进度百分比
      type: Number,
      default: 0
    },
    frontCoverPath: {
      type: String,
      default: ''
    },
    backCoverPath: {
      type: String,
      default: ''
    },
    renderChapter: { // 是否分章排版
      type: Boolean,
      default: true
    },
    render: { // 渲染方式 svg / canvas
      type: String,
      default: 'svg'
    }
  },
  data() {
    return {
      defaultPageSize,
      defaultPagePadding,
      limit, // 切换显示模式的阈值
      bookSize, // 书籍尺寸
      pageSize, // 纸张尺寸
      pagePadding, // 纸张边距
      menuWidth, // 菜单溢出宽度
      full: false,
      single: false,
      loading: false,
      loadingText: '',
      page: 0, // 当前页下标，小于 0 时为封面，大于等于 this._bookData.pages.length 时为封底
      touchData: { // 触摸事件数据
        start: null,
        end: null,
        duration: null,
        direction: null
      },
      mouseEventData: { // mousedown 和 mouseup 事件数据
        down: null,
        up: null,
        move: null,
        duration: null
      },
      DPR: appSetting.DPR, // 设备像素比，canvas 的计算需要考虑这个
      worker: new Worker(),
      selection: JSON.parse(JSON.stringify(initSelection)) // 文字选择
    }
  },
  computed: {
    // 可视区宽高
    windowSize() {
      let { width, height } = this
      return { width, height }
    },
    // 文本需要重新计算的相关属性
    propertiesToCalc() {
      let { lineHeight } = this
      return { lineHeight }
    },
    // 重新测量字符,重新分页
    propertiesToMeasure() {
      let { text, fontSize, fontFamily } = this
      return { text, fontSize, fontFamily }
    },
    // 页面需要重新绘制的相关属性
    propertiesToRender() {
      let { color, title, render } = this
      return { color, title, render }
    },
    // 显示内容
    showWhat() {
      if (this.frontCoverPath && this.page < 0) {
        return 'frontCover'
      } else if (this.backCoverPath && this.page >= this._bookData.pages.length) {
        return 'backCover'
      } else {
        return 'content'
      }
    },
    // 显示的 bookSize，这里重新定义一个 _bookSize 是为了解决封面封底显示问题
    // 显示封面封底的时候，应该只显示封面和封底，并且居中
    _bookSize() {
      if (this.showWhat === 'content' || this.full || this.single) {
        return this.bookSize
      } else {
        return [
          this.bookSize[0] - this.pageSize[0],
          this.bookSize[1]
        ]
      }
    },
    // 文字选择
    _selection() {
      return {
        startChar: this.selection.startChar,
        endChar: this.selection.endChar,
        single: this.single,
        full: this.full
      }
    },
    _pageSize() {
      return {
        canvas: this.render === 'canvas' ? [...this.pageSize] : [0, 0],
        svg: this.render === 'svg' ? [...this.pageSize] : [0, 0],
        dom: this.render === 'dom' ? [...this.pageSize] : [0, 0]
      }
    }
  },
  created() {},
  mounted() {
    if (this.$refs.pageOneText) {
      window.ctxOneText = this.ctxOneText = this.$refs.pageOneText.getContext(
        '2d'
      )
      window.ctxTwoText = this.ctxTwoText = this.$refs.pageTwoText.getContext(
        '2d'
      )
      window.ctxOneBgc = this.ctxOneBgc = this.$refs.pageOneBgc.getContext('2d')
      window.ctxTwoBgc = this.ctxTwoBgc = this.$refs.pageTwoBgc.getContext('2d')
      this.textToPage()
    }
  },
  watch: {
    // 监听可视区宽高
    windowSize: {
      handler() {
        this.calcBookSize()
      },
      immediate: true
    },
    // 监听需要重新计算的属性
    propertiesToCalc: {
      handler() {
        this.textToPage()
      }
    },
    // 监听需要重新测绘的属性
    propertiesToMeasure: {
      handler() {
        this.textToPage(true)
      }
    },
    // 监听需要重新绘制的属性
    propertiesToRender: {
      handler() {
        // 重绘文字前，清除文字选择
        this.clearSelection()
        this.renderPage()
        // 如果是双页，渲染第二页
        if (!this.single) {
          this.renderPage('two')
        }
      }
    },
    // 监听percent
    percent: {
      handler() {
        this.calcPage()
      },
      immediate: true
    },
    // 监听 page
    page: {
      handler(newPage, oldPage) {
        // 重绘文字前，清除文字选择
        this.clearSelection()
        this.renderPage()
        // 如果是双页，渲染第二页
        if (!this.single) {
          this.renderPage('two')
        }
        // 清空之前页面文字的布局信息，减少内存占用
        this.clearLayout(oldPage)
        if (!this.single) {
          this.clearLayout(oldPage + 1)
        }
      }
    },
    // 监听 _selection
    _selection: {
      handler() {
        this.renderBgc()
        // 如果是双页，渲染第二页
        if (!this.single) {
          this.renderBgc('two')
        }
      }
    },
    // 监听高亮背景色
    highlightBgc: {
      handler() {
        this.setSelectionStyle()
      },
      immediate: true
    }
  },
  methods: {
    // 计算书籍尺寸
    calcBookSize() {
      let _this = this
      if (!this.width) return
      let res = calcBookSize({
        defaultPageSize: this.defaultPageSize,
        defaultPagePadding: this.defaultPagePadding,
        limit: this.limit,
        width: this.width,
        height: this.height,
        menuWidth: this.menuWidth
      })
      if (
        res.single === this.single &&
        res.full === this.full &&
        res.bookSize[0] === this.bookSize[0] &&
        res.bookSize[1] === this.bookSize[1]
      ) return

      ['full', 'single', 'pageSize', 'bookSize', 'pagePadding'].map(key => {
        _this[key] = res[key]
      })
      this._bookData.single = res.single
      this.textToPage()
    },
    // 分页
    textToPage(measure) {
      if (!this.ctxOneText) return
      // 如果文本已经改变，清空视图--在设置 ctx 样式前清空，因为清空画布会影响 ctx
      if (this.text !== this._bookData.cacheText) {
        this.clearView()
      }
      this.setTextCtx(this.ctxOneText)
      this.loading = true
      this.loadingText = '分页中'
      let param = {}
      // 测量字符
      if (measure) {
        param = {
          text: this.text,
          ctx: this.ctxOneText
        }
        let res = measureChars(param)
        this._bookData.measures = res.measures
        this._bookData.textArray = res.textArray
        this._bookData.cacheText = this.text
      }

      // 计算章节
      if (!this._bookData.chapters || measure) {
        // 分章之前重置章节为 null
        this._bookData.chapters = null
        param = {
          textArray: this._bookData.textArray,
          titleLineLength: bookSetting.titleLineLength
        }
        // 在 worker 中计算章节
        this._worker({
          action: 'splitChapter',
          param: [param]
        })
          .then(res => {
            this.getChapters(res.e)
            _textToPage(this)
          })
      }

      // 计算分页
      _textToPage(this)

      // 分页
      function _textToPage(self) {
        // 如果需要分章排版，但章节还没有计算出来，直接返回
        if (self.renderChapter && !self._bookData.chapters) return

        param = {
          text: self._bookData.textArray,
          textOffsetIndex: 0,
          width: self.pageSize[0] - self.pagePadding[0] * 2,
          height: self.pageSize[1] - self.pagePadding[1] * 2,
          fontSize: self.fontSize,
          lineHeight: self.lineHeight,
          measures: self._bookData.measures,
          bookSetting
        }

        // 如果需要分章排版，并且计算后存在章节信息，则分章排版
        if (self.renderChapter && self._bookData.chapters.length) {
          // 每个章节就是一个任务
          // 需要检查第一个章节之前是否还有内容
          let tasks = [...self._bookData.chapters]
          if (tasks[0].startIndex !== 0) {
            tasks.unshift({
              startIndex: 0,
              endIndex: tasks[0].startIndex - 1
            })
          }
          // 设置任务
          tasks = tasks.map(chapter => {
            return self._worker({
              action: 'textToPage',
              param: [{
                ...param,
                textOffsetIndex: chapter.startIndex,
                text: arrayCopy(self._bookData.textArray, chapter.startIndex, chapter.endIndex)
              }]
            })
          })

          const s = Date.now()
          Promise.all(tasks)
            .then(res => {
              console.log('textToPage:', Date.now() - s)
              let tempRes = res.map(item => item.result)
              // 删除空页
              // tempRes = tempRes.flat().filter(page => page.rows.some(row => row.chars.join('').trim().length))
              tempRes = tempRes.flat().filter(page => page.rows.some(row => !row.empty))
              // 重新设置页码
              tempRes.map((item, index) => {
                item.page = index
              })
              self.getPages(tempRes)
            })
        } else {
          // 在 worker 中分页
          self._worker({
            action: 'textToPage',
            param: [param]
          })
            .then(res => {
              self.getPages(res.result)
            })
        }
      }
    },
    // worker 分章结果
    getChapters(e) {
      if (e.data.action !== 'splitChapter') return
      this._bookData.chapters = e.data.result
    },
    // worker 分页结果
    getPages(res) {
      this._bookData.pages = res
      // 分页后需要计算页码
      this.calcPage()
      // 以及渲染页面
      this.renderPage()
      // 如果是双页，渲染第二页
      if (!this.single) {
        this.renderPage('two')
      }
      this.loading = false
      this.loadingText = ''
    },
    // 设置内容ctx样式
    setTextCtx(ctx) {
      ctx.font = `${this.fontSize}px '${this.fontFamily}'`
      ctx.fillStyle = this.color
      // 字体支持检测
      if (!supportFamily(this.ctxOneText)) {
        this.$message.error(`不支持当前字体${this.fontFamily}`)
        ctx.font = `${this.fontSize}px '${bookSetting.fontFamily}'`
      }
    },
    // 绘制页面，不仅仅处理内容 canvas / svg 的绘制，还处理封面和封底
    renderPage(two) {
      let page = this.page
      if (two) {
        page += 1
      }
      const tempPageInfo = this._bookData.pages[page]
      // 计算文字位置
      if (
        tempPageInfo &&
        tempPageInfo.rows.length
      ) {
        const param = {
          rows: tempPageInfo.rows,
          width: this.pageSize[0],
          height: this.pageSize[1],
          paddingLeft: this.pagePadding[0],
          paddingTop: this.pagePadding[1],
          fontSize: this.fontSize,
          lineHeight: this.lineHeight,
          measures: this._bookData.measures,
          textArray: this._bookData.textArray
        }
        this._bookData.pages[page].rows = layout(param)
      }
      // 清屏
      switch (this.render) {
        case 'canvas':
        {
          let textCtx = two ? this.ctxTwoText : this.ctxOneText
          // 首先清屏
          // 采用这种方式清屏，是为了一并解决纸张大小变化的情况
          textCtx.canvas.width = this.pageSize[0] * this.DPR
          textCtx.canvas.height = this.pageSize[1] * this.DPR
          // 画布缩放
          textCtx.scale(this.DPR, this.DPR)
          // 重设画布大小后，绘图上下文会重置
          this.setTextCtx(textCtx)
          break
        }
        case 'svg':
        {
          let el = two ? this.$refs.svgPageTwoText : this.$refs.svgPageOneText
          el.innerHTML = ''
          break
        }
        case 'dom':
          let el = two ? this.$refs.domPageTwoText : this.$refs.domPageOneText
          el.innerHTML = ''
          break
      }
      // 渲染
      if (tempPageInfo) {
        let renderParam = {
          rows: tempPageInfo.rows,
          width: this.pageSize[0],
          height: this.pageSize[1],
          paddingLeft: this.pagePadding[0],
          paddingTop: this.pagePadding[1],
          full: this.full,
          fontSize: this.fontSize,
          headerText: this.title,
          headerTextAlign: two ? 'right' : 'left',
          footerText: `${page + 1}/${this._bookData.pages.length}`
        }
        // canvas
        switch (this.render) {
          case 'canvas':
            renderParam.ctx = two ? this.ctxTwoText : this.ctxOneText
            renderPage(renderParam)
            break
          case 'svg':
            renderParam.el = two ? this.$refs.svgPageTwoText : this.$refs.svgPageOneText
            renderParam.fontFamily = this.fontFamily
            renderParam.color = this.color
            // 绘制页面
            renderSvgPage(renderParam)
            break
          case 'dom':
            renderParam.el = two ? this.$refs.domPageTwoText : this.$refs.domPageOneText
            renderParam.fontFamily = this.fontFamily
            renderParam.color = this.color
            renderParam.lineHeight = this.lineHeight
            // 绘制页面
            renderDomPage(renderParam)
            break
        }
      }
    },
    // 根据 percent 和 this._bookData.pages 计算 page
    calcPage() {
      let tempPage = this.frontCoverPath ? -1 : 0
      if (this._bookData && Array.isArray(this._bookData.pages) && this._bookData.pages.length) {
        let len = this._bookData.pages.length
        // let odd = len % 2
        // 百分比下限
        if (this.percent <= 0) {
          // 有封面
          if (this.frontCoverPath) {
            tempPage = -1
          } else {
            // 没有封面
            tempPage = 0
          }
        } else if (this.percent > 1) {
          // 百分比上限
          // 有封底
          if (this.backCoverPath) {
            tempPage = len
          } else {
            // 没有封底
            tempPage = len - 1
          }
        } else {
          // 正常情况
          tempPage = Math.round(this.percent * len) - 1
          // 双页时，需要检查 tempPage 是否在左边
          if (!this.single && tempPage > 0 && tempPage % 2 === 1) {
            tempPage--
          }
          if (tempPage < 0) {
            tempPage = 0
          }
        }
      } else {
        if (this.percent > 1 && this.backCoverPath) {
          tempPage = 0
        }
      }
      if (this.page !== tempPage) {
        this.page = tempPage
      }
      this.$emit('changePage', {
        page: this.page + 1,
        totalPages: this._bookData.pages.length
      })
    },
    // 鼠标滚动
    handleMousewheel(e) {
      e.wheelDelta > 0 || e.deltaY < 0 ? this.changePage(-1) : this.changePage(1)
    },
    // 触摸
    tap(e) {
      const rect = this.$refs.bookContainer.getBoundingClientRect()
      const left = e.changedTouches[0].clientX - rect.left
      const top = e.changedTouches[0].clientY - rect.top
      if (left < rect.width / 3) {
        this.changePage(-1)
      } else if (left > (rect.width / 3) * 2) {
        this.changePage(1)
      } else if (top > rect.height / 3 && top < rect.height / 3 * 2) {
        this.$emit('showMenu')
      }
    },
    // touch 事件
    touch(e) {
      if (e.type === 'touchstart') {
        this.touchData.start = e
      } else if (e.type === 'touchend') {
        this.touchData.end = e
        // 相关计算
        const X =
          this.touchData.end.changedTouches[0].clientX -
          this.touchData.start.changedTouches[0].clientX
        const Y =
          this.touchData.end.changedTouches[0].clientY -
          this.touchData.start.changedTouches[0].clientY
        if (Math.abs(X) > 10 || Math.abs(Y) > 10) {
          // 有效滑动
          if (Math.abs(Y) > Math.abs(X)) {
            // 竖直方向不处理
            this.initTouchData()
            return
          }
          // 水平方向处理
          if (X < 0) {
            this.changePage(1)
            this.initTouchData()
          } else {
            this.changePage(-1)
            this.initTouchData()
          }
        } else if (
          this.touchData.end.timeStamp - this.touchData.start.timeStamp <
          300
        ) {
          // tap
          this.tap(e)
          this.initTouchData()
        }
      }
    },
    // 初始化touchData
    initTouchData() {
      Object.keys(this.touchData).map(item => {
        this.touchData[item] = null
      })
    },
    // mousedown
    handleMousedown(e) {
      // 只记录左键
      if (e.button !== 0) return
      this.mouseEventData.down = e
    },
    // mouseup
    handleMouseup(e) {
      let isClearSelection = false // 本次操作是否为清除文字选择
      // 如果鼠标弹起的时候文字选择有值，并且 isMoving 为假，需要清除文字选择
      if (this.selection.highlight.length && !this.selection.isMoving) {
        this.clearSelection()
        isClearSelection = true
      }
      // 只记录左键
      if (e.button !== 0) return

      this.mouseEventData.up = e
      const rect = this.$refs.bookContainer.getBoundingClientRect()
      const left = e.clientX - rect.left
      const top = e.clientY - rect.top
      // 全屏状态下，点击九宫格中间小于300ms，并且非文字选择状态，则显示菜单
      if (
        e.timeStamp - this.mouseEventData.down.timeStamp < 300 &&
        e.clientX === this.mouseEventData.down.clientX &&
        e.clientY === this.mouseEventData.down.clientY &&
        top > rect.height / 3 &&
        top < rect.height / 3 * 2 &&
        left > rect.width / 3 &&
        left < rect.width / 3 * 2 &&
        this.full &&
        !isClearSelection
      ) {
        this.$emit('showMenu')
      }
      // 是否需要显示操作按钮
      if (this.selection.highlight.length && this.selection.isMoving) {
        let tempPage = this.selection.highlight[this.selection.highlight.length - 1]
        let tempRow = tempPage.rows[tempPage.rows.length - 1]
        if (tempRow) {
          tempRow = [tempRow[2], tempRow[3]]
          // 如果右边页面，需要加上左边页面宽度
          if (!this.single && tempPage.page !== this.page) {
            tempRow[0] += this.pageSize[0]
          }
          // 如果非全屏，需要加上空白区域
          if (!this.full) {
            let rect = this.$refs.bookContainer.getBoundingClientRect()
            tempRow[0] += rect.left
            tempRow[1] += rect.top
          }
          const position = calcPosition({
            window: [this.width, this.height],
            el: [40, 28],
            target: [tempRow[0], tempRow[1]],
            position: 'bottom'
          })
          this.$emit('showActionBar', { show: true, position })
        }
      }
      // 清除事件记录
      this.mouseEventData.down = null
      this.mouseEventData.up = null
      this.selection.isMoving = false
    },
    // mousemove
    handleMousemove(e) {
      if (this.mouseEventData.down &&
        this.mouseEventData.up === null &&
        (e.clientX !== this.mouseEventData.down.clientX || e.clientY !== this.mouseEventData.down.clientY)
      ) {
        this.mouseEventData.move = this.selection.endEvent = e
        if (!this.selection.isMoving) {
          this.selection.startEvent = this.mouseEventData.down
          this.selection.isMoving = true
        }
        // 非 canvas 不需要计算选中区域
        if (this.render !== 'canvas') {
          return
        }
        // 计算points
        const rect = this.$refs.bookContainer.getBoundingClientRect()
        const startPoint = [this.selection.startEvent.clientX - rect.left, this.selection.startEvent.clientY - rect.top]
        const endPoint = [this.selection.endEvent.clientX - rect.left, this.selection.endEvent.clientY - rect.top]
        const points = [
          {
            point: startPoint,
            page: this._bookData.pages[this.page]
          },
          {
            point: endPoint,
            page: this._bookData.pages[this.page]
          }
        ]
        // 如果是双页，需要判断所在页
        if (!this.single) {
          if (startPoint[0] > this.pageSize[0]) {
            // 还要判断所在页是否存在
            if (this._bookData.pages[this.page + 1]) {
              startPoint[0] -= this.pageSize[0]
              points[0].page = this._bookData.pages[this.page + 1]
              // 如果不存在，默认上一页右下角
            } else {
              points[0].point = [this.pageSize[0], this.pageSize[1]]
            }
          }
          if (endPoint[0] > this.pageSize[0]) {
            if (this._bookData.pages[this.page + 1]) {
              endPoint[0] -= this.pageSize[0]
              points[1].page = this._bookData.pages[this.page + 1]
            } else {
              points[1].point = [this.pageSize[0], this.pageSize[1]]
            }
          }
        }
        // 计算选中字符
        const tempChars = findCharsBetweenPoints({
          points
        })
        if (tempChars) {
          const tempHighlight = calcHighlightArea({
            pages: this._bookData.pages,
            startChar: tempChars.startChar,
            endChar: tempChars.endChar
          })
          this.selection = {
            ...this.selection,
            startChar: tempChars.startChar,
            endChar: tempChars.endChar,
            highlight: tempHighlight
          }
        }
      }
    },
    // 页码改变
    changePage(direction) {
      let len = this._bookData.pages.length
      let percent = 0
      // 如果没有内容
      if (len === 0) {
        // 上一页
        if (direction < 0) {
          percent = 0
        } else {
          percent = this.backCoverPath ? 1.1 : 1
        }
        this.$emit('changePage', {
          percent
        })
        return
      }
      // 有内容
      // 上一页
      if (direction < 0) {
        // 单页
        if (this.single) {
          // 如果有封底，并且目前处于封底，则回到最后一页
          if (this.page >= len && this.backCoverPath) {
            percent = 1
          } else {
            // 否则回到前一页
            percent = this.page / len
          }
          // 检查是否超出范围
          // 有封面最小为0，没有封面最小为 1 / len
          if (this.frontCoverPath) {
            percent = percent < 0 ? 0 : percent
          } else {
            percent = percent < 1 / len ? 1 / len : percent
          }
        } else {
          // 双页
          // 如果有封底，并且目前处于封底，则回到最后一页
          // 双页的情况下，百分比是按照右边的一页算的
          if (this.page >= len && this.backCoverPath) {
            percent = 1
          } else {
            // 否则回到前两页
            percent = this.page / len
          }
          // 检查是否超出范围
          // 有封面最小为0，没有封面，如果内容只有一页，最小为1，否则为 2 / len
          if (this.frontCoverPath) {
            percent = percent < 0 ? 0 : percent
          } else {
            let minPercent = len === 1 ? 1 : 2 / len
            percent = percent < minPercent ? minPercent : percent
          }
        }
      } else {
        // 下一页
        // 单页
        if (this.single) {
          // 如果有封面，并且目前处于封面，则到第一页
          if (this.page < 0 && this.frontCoverPath) {
            percent = 1 / len
          } else {
            // 否则到下一页
            percent = (this.page + 2) / len
          }
          // 检查是否超出范围
          // 没有封底，最大为1
          if (!this.frontCoverPath) {
            percent = percent > 1 ? 1 : percent
          }
        } else {
          // 双页
          // 如果有封面，并且目前处于封面，如果内容只有一页，到第一页，否则到第二页
          // 双页的情况下，百分比是按照右边的一页算的
          if (this.page < 0 && this.frontCoverPath) {
            percent = len === 1 ? 1 : 2 / len
          } else {
            // 否则到后两页
            percent = (this.page + 3) / len
          }
          // 检查是否超出范围
          // 没有封底，最大为1
          if (!this.frontCoverPath) {
            percent = percent > 1 ? 1 : percent
          }
        }
      }
      this.$emit('changePercent', percent)
    },
    // 绘制背景--目前只包括选择文字
    renderBgc(two) {
      let page = this.page
      let bgcCtx = this.ctxOneBgc
      if (two) {
        page += 1
        bgcCtx = this.ctxTwoBgc
      }
      // 首先清屏
      // 采用这种方式清屏，是为了一并解决纸张大小变化的情况
      bgcCtx.canvas.width = this.pageSize[0] * this.DPR
      bgcCtx.canvas.height = this.pageSize[1] * this.DPR
      // 画布缩放
      bgcCtx.scale(this.DPR, this.DPR)
      // 是否需要绘制
      if (this.selection.startChar !== null && this.selection.endChar !== null) {
        const tempPageInfo = this.selection.highlight.find(item => item.page === page)
        if (tempPageInfo) {
          renderBgc({
            rows: tempPageInfo.rows,
            ctx: bgcCtx,
            fillStyle: this.highlightBgc
          })
        }
      }
    },
    // 清除文字选择和操作按钮
    clearSelection() {
      this.selection = JSON.parse(JSON.stringify(initSelection))
      this.$emit('showActionBar', { show: false, position: [0, 0] })
    },
    // 清除指定页面的文字布局信息
    clearLayout(oldPage) {
      // 当前页面不处理
      if (oldPage === this.page || (!this.single && oldPage === this.page + 1)) return
      const tempPageInfo = this._bookData.pages[oldPage]
      if (tempPageInfo && tempPageInfo.rows && tempPageInfo.rows.length) {
        tempPageInfo.rows.map(row => {
          row.chars = null
        })
      }
    },
    // 按钮触发的操作
    trigger(key) {
      switch (key) {
        case 'copy':
          this.handleCopy()
          break
      }
    },
    // 复制
    handleCopy() {
      let text = arrayCopy(this._bookData.textArray, this.selection.startChar, this.selection.endChar).join('')
      const el = document.getElementById('action-copy-el')
      el.dataset.clipboardAction = 'copy'
      el.dataset.clipboardText = text
      const clipboard = new this.Clipboard('#action-copy-el')
      clipboard.on('success', () => {
        this.$message.success('复制成功')
      })
      clipboard.on('error', (e) => {
        this.$message.success('复制失败')
        console.log(e)
      })
      this.clearSelection()
    },
    // 设置选择文字的背景色
    setSelectionStyle() {
      let el = document.querySelector('#page-text-selection')
      if (!el) {
        el = document.createElement('style')
        el.setAttribute('id', 'page-text-selection')
        document.head.appendChild(el)
      }
      el.innerHTML = `
        .content-wrapper svg text::selection,
        .content-wrapper .dom-page-content *::selection
        {
          background-color: ${this.highlightBgc};
        }
      `
    },
    // 清除视图
    clearView() {
      if (this.$refs.pageOneBgc) {
        this.$refs.pageOneBgc.width = this._pageSize[0]
        this.$refs.pageOneText.width = this._pageSize[0]
        this.$refs.pageTwoBgc.width = this._pageSize[0]
        this.$refs.pageOneText.width = this._pageSize[0]

        while (this.$refs.svgPageOneText.lastChild) {
          this.$refs.svgPageOneText.removeChild(this.$refs.svgPageOneText.lastChild)
        }
        while (this.$refs.svgPageTwoText.lastChild) {
          this.$refs.svgPageTwoText.removeChild(this.$refs.svgPageTwoText.lastChild)
        }
        this.$refs.domPageOneText.innerHTML = ''
        this.$refs.domPageTwoText.innerHTML = ''
      }
    }
  }
}
</script>

<style lang='less' scoped>
.book {
  position: absolute;
  // background: #444;
  .content-wrapper {
    position: absolute;
    background-color: #777;
    overflow: hidden;
    box-shadow: 5px 5px 12px gray;
    display: flex;
    .page-1,
    .page-2 {
      flex: 1;
    }
    .cover-img {
      vertical-align: middle;
      margin: 0 auto;
      width: 100%;
      height: 100%;
    }
    .dom-page-content {
      overflow: hidden;
    }
  }
}
</style>
