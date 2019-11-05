<template>
  <div
    id="book"
    class="book"
    v-loading="loading"
    :style="{
      left: (width - bookSize[0]) / 2 + 'px',
      top: (height - bookSize[1]) / 2 + 'px',
      width: bookSize[0] + 'px',
      height: bookSize[1] + 'px'
    }"
  >
    <!-- 内容部分 -->
    <div
      class="content-wrapper"
      :style="{
        left: full ? 0 : menuWidth + 'px',
        width: full ? bookSize[0] + 'px' : bookSize[0] - menuWidth + 'px',
        height: bookSize[1] + 'px',
        background
      }"
    >
      <!-- page-1 -->
      <div
        class="page-1"
        :style="{
          width: pageSize[0],
          height: pageSize[1]
        }"
      >
        <div class="por">
          <!-- 内容层 -->
          <canvas
            ref="pageOneText"
            class="poa"
            :width="pageSize[0]"
            :height="pageSize[1]"
            :style="{
              width: pageSize[0],
              height: pageSize[1]
            }"
          />
        </div>
      </div>
      <!-- page-2 -->
      <div
        v-show="!single"
        class="page-2"
        :style="{
          width: pageSize[0],
          height: pageSize[1]
        }"
      >
        page-2
      </div>
    </div>
  </div>
</template>

<script>
// import debounce from 'lodash/debounce'
import { measureChars, calcBookSize, supportFamily } from '@/utils/utils'
import { bookSetting, appSetting } from '@/utils/setting'
let { defaultPageSize, defaultPagePadding, limit, bookSize, pageSize, pagePadding, menuWidth } = bookSetting
// 不需要响应式，并且量比较大的数据放到 _data 里
let _data = {
  cacheText: '', // 缓存文本
  measures: {}, // 测量的字符
  textArray: [], // 文本数组
  minCharWidth: 1000 // 最小字符宽度
}
window._data = _data
// let _calcBookSize = debounce(calcBookSize, 100)
export default {
  name: 'Book',
  components: {
  },
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
      type: String,
      default: appSetting.title
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
      loading: false
    }
  },
  computed: {
    windowSize() {
      let { width, height } = this
      return { width, height }
    }
  },
  created() {
  },
  mounted() {
    if (this.$refs.pageOneText) {
      this.ctxOneText = this.$refs.pageOneText.getContext('2d')
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
      if (res.single === this.single && res.full === this.full && res.bookSize[0] === this.bookSize[0]) return
      ['full', 'single', 'pageSize', 'bookSize', 'pagePadding'].map(key => {
        _this[key] = res[key]
      })
      this.textToPage()
    },
    // 分页
    textToPage() {
      if (!this.ctxOneText) return

      this.setTextCtx(this.ctxOneText)
      this.loading = true
      // 测量字符
      if (_data.cacheText !== this.text) {
        let param = {
          text: this.text,
          ctx: this.ctxOneText
        }
        let res = measureChars(param)
        _data.measures = res.measures
        _data.textArray = res.textArray
        _data.minCharWidth = res.minCharWidth
      }
    },
    // 设置内容ctx样式
    setTextCtx(ctx) {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`
      ctx.fillStyle = this.color
      // 字体支持检测
      if (!supportFamily(this.ctxOneText)) {
        this.$message.error(`不支持当前字体${this.fontFamily}`)
        ctx.font = `${this.fontSize}px ${bookSetting.fontFamily}`
      }
    }
  }
}
</script>

<style lang='scss' scoped>
.book {
  position: absolute;
  background: #444;
  .content-wrapper {
    position: absolute;
    background-color: #777;
    overflow: hidden;
    box-shadow: 5px 5px 12px gray;
    display: flex;
    .page-1, .page-2 {
      flex: 1;
    }
  }
}
</style>
