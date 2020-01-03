<template>
  <div class="setting-container">
    <el-form
      label-width="80px"
    >
      <el-form-item label="字体">
        <el-select
          v-model="bindSetting.fontFamily"
          placeholder="选择字体"
          size="mini"
        >
          <el-option
            v-for="(item, index) in fontFamilies"
            :key="index"
            :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="字体大小">
        <el-slider
          v-model="bindSetting.fontSize"
          :min="fontSizes[0]"
          :max="fontSizes[1]"
          :step="1"/>
      </el-form-item>
      <el-form-item label="行高">
        <el-slider
          v-model="bindSetting.lineHeight"
          :min="lineHeights[0]"
          :max="lineHeights[1]"
          :step="0.1"/>
      </el-form-item>
      <el-form-item label="字体颜色">
        <el-color-picker
          v-model="bindSetting.color"
          size='small'></el-color-picker>
      </el-form-item>
      <el-form-item label="背景颜色">
        <el-color-picker
          v-model="bindSetting.background"
          size="small"></el-color-picker>
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
        <el-button
          size='mini'
          @click="handleDefault"
        >默认</el-button>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import { bookSetting } from '@/utils/setting'
const { fontFamilies, fontSizes, lineHeights } = bookSetting
export default {
  name: 'Setting',
  props: {
    defaultSetting: { // 默认设置
      type: Object,
      required: true
    },
    setting: { // 当前生效设置
      type: Object,
      default() {
        return {}
      }
    },
    show: { // 目前菜单的状态
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fontFamilies,
      fontSizes,
      lineHeights,
      bindSetting: Object.assign({}, this.setting) // 待改变的设置
    }
  },
  watch: {
    show: {
      handler() {
        this.bindSetting = { ...this.setting }
      },
      immediate: true
    }
  },
  methods: {
    // 关闭
    handleClose() {
      this.$emit('close')
    },
    // 确定
    handleSure() {
      this.$emit('settingChange', Object.assign({}, this.bindSetting))
    },
    // 默认
    handleDefault() {
      this.$emit('settingChange', Object.assign({}, this.defaultSetting))
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
