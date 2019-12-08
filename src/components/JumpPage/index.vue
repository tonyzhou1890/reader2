<template>
  <div class="setting-container">
    <el-form
      label-width="80px"
    >
      <el-form-item label="跳页">
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
          @click="handleSure"
        >确定</el-button>
      </el-row>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'JumpPage',
  props: {
    page: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    show: { // 目前菜单的状态
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      bindPage: this.page
    }
  },
  watch: {
    show: {
      handler() {
        this.bindPage = this.page
      },
      immediate: true
    }
  },
  methods: {
    // 关闭
    handleClose() {
      this.$emit('jumpPage')
    },
    // 确定
    handleSure() {
      this.$emit('jumpPage', this.bindPage)
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
