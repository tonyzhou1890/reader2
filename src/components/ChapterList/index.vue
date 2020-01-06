<template>
  <div class="setting-container">
    <p class="catelog">目录</p>
    <ul class="chapter-list">
      <li
        v-for="(chapter, index) in chapters"
        :key="index"
        :class="chapter.active ? 'active' : ''"
        :title="`${chapter.str} 第${chapter.page}页`"
        class="chapter-item"
        @click="() => jumpPage(chapter.page)"
      >
        <span class="chapter-text no-wrap">{{ chapter.str }}</span>
        <span class="chapter-page no-wrap">第{{ chapter.page }}页</span>
      </li>
    </ul>
    <p v-if="chapters.length === 0" class="no-result">~暂无目录~</p>
  </div>
</template>

<script>
export default {
  name: 'ChapterList',
  props: {
    page: {
      type: Number,
      required: true
    },
    activeMenu: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      keyword: '',
      bindPage: this.min,
      searchResult: {},
      active: null
    }
  },
  computed: {
    chapters() {
      // 当前菜单没有激活的状态下，不计算
      if (this.activeMenu !== 'chapterList') return []

      let arr = this._bookData.chapters || []
      const arrLen = arr.length
      // 如果已经分章和分页，计算章节开始页码
      if (arrLen && this._bookData.pages) {
        const pageLen = this._bookData.pages.length
        arr.map(chapter => {
          // 找出页码
          for (let i = 0; i < pageLen; i++) {
            if (this._bookData.pages[i].startIndex <= chapter.index && this._bookData.pages[i].endIndex >= chapter.index) {
              chapter.page = i + 1
              break
            }
          }
        })
        // 找出当前激活章节
        for (let i = 0; i < arrLen; i++) {
          // 首先置'否'
          arr[i].active = false
          if (arr[i].page <= this.page && i === arrLen - 1) {
            arr[i].active = true
          }
          if (arr[i].page <= this.page && arr[i + 1] && arr[i + 1].page > this.page) {
            arr[i].active = true
          }
        }
      }

      return arr
    }
  },
  methods: {
    // 跳页
    jumpPage(page) {
      this.$emit('jumpPage', page)
    }
  }
}
</script>

<style lang="less" scoped>
@import url('~@/styles/variables.less');
.setting-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  .chapter-list {
    padding-left: 10px;
    .chapter-item {
      font-size: 14px;
      padding: 10px;
      display: flex;
      align-items: baseline;
      cursor: pointer;
      .chapter-text {
        flex: 7;
      }
      .chapter-page {
        flex: 3;
        font-size: 12px;
      }
      .no-wrap {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      &.active {
        color: seashell;
      }
      &:hover {
        background-color: rgba(255, 255, 255, .3);
      }
    }
  }
  .no-result {
    color: @primary;
    text-align: center;
  }
}
</style>
