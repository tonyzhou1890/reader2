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
      @mousewheel="handleMousewheel"
      @keydown.right="(e) => changePage(1)"
      @keydown.left="(e) => changePage(-1)"
      @touchstart="touch"
      @touchend="touch"
      @mousedown="handleMousedown"
      @mouseup="handleMouseup"
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
          <!-- 内容层 -->
          <canvas
            ref="pageOneText"
            class="poa"
            :style="{
              width: pageSize[0] + 'px',
              height: pageSize[1] + 'px'
            }"
          />
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
          <!-- 内容层 -->
          <canvas
            ref="pageTwoText"
            class="poa"
            :style="{
              width: pageSize[0] + 'px',
              height: pageSize[1] + 'px'
            }"
          />
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
  calcBookSize,
  supportFamily
} from '@/utils/utils'
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
// 不需要响应式，并且量比较大的数据放到 _data 里
let _data = {
  cacheText: '', // 缓存文本
  measures: {}, // 测量的字符
  textArray: [], // 文本数组
  pages: [] // 分页信息
}
window._data = _data
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
      page: 0, // 当前页下标，小于 0 时为封面，大于等于 _data.pages.length 时为封底
      touchData: { // 触摸事件数据
        start: null,
        end: null,
        duration: null,
        direction: null
      },
      mouseEventData: { // mousedown 和 mouseup 事件数据
        down: null,
        up: null,
        duration: null
      },
      DPR: appSetting.DPR, // 设备像素比，canvas 的计算需要考虑这个
      worker: new Worker()
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
      let { color, title } = this
      return { color, title }
    },
    // 显示内容
    showWhat() {
      if (this.frontCoverPath && this.page < 0) {
        return 'frontCover'
      } else if (this.backCoverPath && this.page >= _data.pages.length) {
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
      handler() {
        this.renderPage()
        // 如果是双页，渲染第二页
        if (!this.single) {
          this.renderPage('two')
        }
      }
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
      this.textToPage()
    },
    // 分页
    textToPage(measure) {
      if (!this.ctxOneText) return
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
        _data.measures = res.measures
        _data.textArray = res.textArray
        _data.cacheText = this.text
      }
      // 计算分页
      param = {
        text: _data.textArray,
        width: this.pageSize[0] - this.pagePadding[0] * 2,
        height: this.pageSize[1] - this.pagePadding[1] * 2,
        fontSize: this.fontSize,
        lineHeight: this.lineHeight,
        measures: _data.measures,
        bookSetting
      }

      // 在 worker 中分页
      this.worker.addEventListener('message', this.getPages)
      this.worker.postMessage({
        action: 'textToPage',
        param: [param],
        timeStamp: Date.now()
      })
    },
    // worker 分页结果
    getPages(e) {
      _data.pages = e.data.result
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
      this.worker.removeEventListener('message', this.getPages)
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
    // 绘制页面，不仅仅处理内容 canvas 的绘制，还处理封面和封底
    renderPage(two) {
      let page = this.page
      let textCtx = this.ctxOneText
      if (two) {
        page += 1
        textCtx = this.ctxTwoText
      }
      const tempPageInfo = _data.pages[page]
      // 如果计算过每个文字的位置，则先计算
      if (
        tempPageInfo &&
        tempPageInfo.rows.length &&
        !tempPageInfo.rows[0].calculated
      ) {
        const param = {
          rows: tempPageInfo.rows,
          width: this.pageSize[0],
          height: this.pageSize[1],
          paddingLeft: this.pagePadding[0],
          paddingTop: this.pagePadding[1],
          fontSize: this.fontSize,
          lineHeight: this.lineHeight,
          measures: _data.measures
        }
        _data.pages[page].rows = layout(param)
      }
      // 首先清屏
      // 采用这种方式清屏，是为了一并解决纸张大小变化的情况
      textCtx.canvas.width = this.pageSize[0] * this.DPR
      textCtx.canvas.height = this.pageSize[1] * this.DPR
      // 画布缩放
      textCtx.scale(this.DPR, this.DPR)
      // 重设画布大小后，绘图上下文会重置
      this.setTextCtx(textCtx)
      if (tempPageInfo) {
        const renderParam = {
          rows: tempPageInfo.rows,
          width: this.pageSize[0],
          height: this.pageSize[1],
          ctx: textCtx,
          paddingLeft: this.pagePadding[0],
          paddingTop: this.pagePadding[1],
          full: this.full,
          fontSize: this.fontSize,
          headerText: this.title,
          headerTextAlign: two ? 'right' : 'left',
          footerText: `${page + 1}/${_data.pages.length}`
        }
        // 绘制页面
        renderPage(renderParam)
      }
    },
    // 根据 percent 和 _data.pages 计算 page
    calcPage() {
      let tempPage = this.frontCoverPath ? -1 : 0
      if (_data && Array.isArray(_data.pages) && _data.pages.length) {
        let len = _data.pages.length
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
        totalPages: _data.pages.length
      })
    },
    // 鼠标滚动
    handleMousewheel(e) {
      e.wheelDelta > 0 ? this.changePage(-1) : this.changePage(1)
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
      this.mouseEventData.down = e
    },
    // mouseup
    handleMouseup(e) {
      this.mouseEventData.up = e
      const rect = this.$refs.bookContainer.getBoundingClientRect()
      const left = e.clientX - rect.left
      const top = e.clientY - rect.top
      // 点击九宫格中间
      if (
        e.timeStamp - this.mouseEventData.down.timeStamp < 300 &&
        e.clientX === this.mouseEventData.down.clientX &&
        e.clientY === this.mouseEventData.down.clientY &&
        top > rect.height / 3 &&
        top < rect.height / 3 * 2 &&
        left > rect.width / 3 &&
        left < rect.width / 3 * 2 &&
        this.full
      ) {
        this.$emit('showMenu')
      }
    },
    // 页码改变
    changePage(direction) {
      let len = _data.pages.length
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
  }
}
</style>
