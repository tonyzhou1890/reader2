<template>
  <div class="setting-container">
    <el-form
      label-width="80px"
    >
      <el-form-item label="关键字">
        <el-input
          v-model="keyword"
          :min="min"
          :max="max"
          size="mini"
          placeholder="输入搜索关键字"></el-input>
      </el-form-item>
      <el-form-item label="起始页">
        <el-input-number
          v-model="bindPage"
          :min="min"
          :max="max"
          size="mini"
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
  </div>
</template>

<script>
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
      searchResult: []
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
      this.searchResult = []
    },
    // 确定
    handleSearch() {
      if (!this.keyword) {
        this.$message.error('请输入关键字')
      } else if (!_data || !_data.textArray || !_data.pages || !Array.isArray(_data.pages)) {
        this.$message.error('没有可以搜索的文本')
      } else {
        console.log(this.keyword)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.setting-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  .buttons {
    text-align: center;
  }
}
</style>
