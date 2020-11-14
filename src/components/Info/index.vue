<template>
  <div class="info-container">
    <el-form
      label-width="80px"
      :show-message="false"
    >
      <el-form-item label="书名">
        <p class="text">{{ title }}</p>
      </el-form-item>
      <el-form-item label="字数">
        <p class="text">{{ number }}</p>
      </el-form-item>
      <el-row class="buttons">
        <el-button
          size='mini'
          @click="handleClose"
        >关闭</el-button>
      </el-row>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'Info',
  props: {
    title: {
      type: String,
      default: ''
    },
    number: {
      type: Number,
      default: null
    }
  },
  methods: {
    // 关闭
    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="less" scoped>
.info-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding-top: 20px;
  & /deep/ .el-form-item {
    margin-bottom: 0;
  }
  .text {
    margin: 0;
  }
  .buttons {
    text-align: center;
  }
}
</style>
