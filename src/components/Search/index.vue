<template>
  <div class="setting-container" @scroll="wheel">
    <el-form
      label-width="80px"
    >
      <el-form-item label="关键字">
        <el-input
          v-model="bindKeyword"
          :min="min"
          :max="max"
          size="mini"
          @keypress.native.enter="handleSearch"
          placeholder="输入搜索关键字"></el-input>
      </el-form-item>
      <el-form-item label="起始页">
        <el-input-number
          v-model="bindPage"
          :min="min"
          :max="max"
          size="mini"
          @keypress.native.enter="handleSearch"
          placeholder="输入页码"></el-input-number>
      </el-form-item>
      <el-row class="buttons">
        <el-button
          size='mini'
          @click="handleClose"
        >关闭</el-button>
        <el-button
          size='mini'
          @click="handleReset"
        >复原</el-button>
        <el-button
          size='mini'
          @click="handleSearch"
        >搜索</el-button>
      </el-row>
    </el-form>
    <div class="results-wrapper">
      <!-- 结果列表 -->
      <div v-if="searchResult.results" class="result-list">
        <div
          v-for="(result, index) in searchResult.results"
          :key="index"
          :class="active === index ? 'active' : ''"
          @click="() => jumpPage(index, result.page)"
          class="result">
          <p class="result-text">
            <span
              v-for="(piece, subIndex) in result.strings"
              :key="subIndex"
              :class="piece.isKeyword ? 'keyword' : ''">{{ piece.text }}</span>
          </p>
          <p class="result-page">第{{ result.page }}页</p>
        </div>
        <p class="result-tip">{{searchResult.isAll ? '到底了！' : '结果太多了'}}</p>
      </div>
      <!-- 没有结果 -->
      <p v-else class="no-result">~暂无结果~</p>
    </div>
  </div>
</template>

<script>
import { search } from '@/utils/utils'
let _data = window._data
export default {
  name: 'Search',
  props: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
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
    bindKeyword: {
      get() {
        return this.keyword
      },
      set(value) {
        this.keyword = value.trim()
      }
    }
  },
  methods: {
    // 关闭
    handleClose() {
      this.$emit('close')
    },
    // 复原
    handleReset() {
      this.keyword = ''
      this.bindPage = this.min
      this.searchResult = {}
    },
    // 确定
    handleSearch() {
      if (!this.keyword.trim()) {
        this.$message.error('请输入关键字')
      } else if (!_data || !_data.textArray || !_data.pages || !Array.isArray(_data.pages)) {
        this.$message.error('没有可以搜索的文本')
      } else if (this.bindPage < this.min || this.bindPage > this.max) {
        this.$message.error(`页码错误，请输入${this.min}-${this.max}之间的值`)
      } else {
        let param = {
          textArray: _data.textArray,
          keyword: this.keyword,
          startIndex: _data.pages[this.bindPage].startIndex,
          pages: _data.pages
        }
        this.searchResult = search(param) || {}
        console.log(this.searchResult)
      }
    },
    // 滚动
    wheel(e) {
      console.log(e)
    },
    // 跳页
    jumpPage(index, page) {
      this.active = index
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
  .buttons {
    text-align: center;
  }
  .results-wrapper {
    font-size: 14px;
    .result-list {
      padding-top: 10px;
      .result {
        cursor: pointer;
        border: 1px solid transparent;
        &.active {
          border-color: @primary;
        }
        .result-text {
          white-space: pre-wrap;
          word-break: break-all;
          .keyword {
            font-weight: bold;
            text-decoration: underline;
          }
        }
        .result-page {
          font-size: 12px;
          text-align: right;
        }
      }
      .result-tip {
        color: @primary;
        text-align: center;
      }
    }
    .no-result {
      color: @primary;
      text-align: center;
    }
  }
}
</style>
