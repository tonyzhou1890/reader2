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
        height: bookSize[1] + 'px'
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
        page-1
      </div>
      <!-- page-2 -->
      <div
        v-if="!single"
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
import { calcBookSize } from '@/utils/utils'
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
      default: '阅读器'
    }
  },
  data() {
    return {
      defaultPageSize: [210, 297],
      defaultPagePadding: [30, 25],
      limit: [400, 600], // 切换显示模式的阈值
      bookSize: [0, 0], // 书籍尺寸
      pageSize: [0, 0], // 纸张尺寸
      pagePadding: [0, 0], // 纸张边距
      menuWidth: 20, // 菜单溢出宽度
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
  watch: {
    windowSize: {
      handler() {
        this.calcBookSize()
      },
      immediate: true
    }
  },
  methods: {
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
