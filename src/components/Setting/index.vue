<template>
  <div class="setting-container poa" :style="computedPosition">
    <div class="tabs">
      <div class="tab fl"
        :class="[curTab === 'setting' ? 'active' : '']"
        @click="curTab = 'setting'"
      >
        <p class="tab-title">设置</p>
      </div>
      <div class="tab fl"
        :class="[curTab === 'jump' ? 'active' : '']"
        @click="curTab = 'jump'"
      >
        <p class="tab-title">跳页</p>
      </div>
    </div>
    <!-- 内容区 -->
    <ul
      v-show="curTab === 'setting'"
      class="setting setting-content">
      <li class="setting-item">
        <p class="item-label">字体</p>
        <el-row class="item-content">
          <el-select
            v-model="bindSetting.fontFamily"
            size="mini"
          >
            <el-option
              v-for="(item, index) in fontFamily"
              :key="index"
              :value="item.value"
              :label="item.label"
            ></el-option>
          </el-select>
        </el-row>
      </li>
      <li class="setting-item">
        <p class="item-label">字号</p>
        <el-row class="item-content">
          <el-slider
            v-model="bindSetting.fontSize"
            :min="12"
            :max="24"
            :step="2"
            class="slider"
          ></el-slider>
        </el-row>
      </li>
      <li class="setting-item">
        <p class="item-label">行高</p>
        <el-row class="item-content">
          <el-slider
            v-model="bindSetting.lineHeight"
            :min="18"
            :max="48"
            :step="2"
            class="slider"
          ></el-slider>
        </el-row>
      </li>
      <li class="setting-item">
        <p class="item-label">边距</p>
        <el-row class="item-content">
          <el-slider
            v-model="bindSetting.padding"
            :min="0"
            :max="100"
            :step="2"
            class="slider"
          ></el-slider>
        </el-row>
      </li>
      <li class="setting-item">
        <p class="item-label">颜色</p>
        <el-row class="item-content">
          <el-col
            v-for="(item, index) in color"
            :key="index"
            :span="6"
            class="item-content-sub-item">
            <span
              @click="bindSetting.color = item.value"
              :style="`background-color: ${item.value};`"
              :class="[bindSetting.color === item.value ? 'active' : '']"
              class="color-sample">&emsp;</span>
          </el-col>
          <el-col
            :span="6"
            class="item-content-sub-item">
            <el-color-picker
              v-model="bindSetting.color"
              size="mini"
              :class="[color.every(item => item.value != bindSetting.color) ? 'active' : '', 'color-picker']"
            ></el-color-picker>
          </el-col>
        </el-row>
      </li>
      <li class="setting-item">
        <p class="item-label">背景</p>
        <el-row class="item-content">
          <el-col
            v-for="(item, index) in color"
            :key="index"
            :span="6"
            class="item-content-sub-item">
            <span
              @click="bindSetting.background = item.value"
              :style="`background-color: ${item.value};`"
              :class="[bindSetting.background === item.value ? 'active' : '']"
              class="background-sample">&emsp;</span>
          </el-col>
          <el-col
            :span="6"
            class="item-content-sub-item">
            <el-color-picker
              v-model="bindSetting.background"
              size="mini"
            ></el-color-picker>
          </el-col>
        </el-row>
      </li>
      <li class="setting-item setting-action">
        <el-button
          size="mini"
          @click="setDefault"
        >默认</el-button>
        <el-button
          size="mini"
          @click="changeSetting"
        >确定</el-button>
      </li>
    </ul>
    <div
      v-show="curTab === 'jump'"
      class="jump setting-content">
      <div class="page">
        <el-slider
          v-model="bindPage"
          :min="0"
          :max="total"
          show-input
        ></el-slider>
        <el-row class="jump-button-row">
          <el-button
            type="primary"
            @click="changePage"
          >跳页</el-button>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Setting',
  props: {
    position: {
      type: String,
      default: 'top'
    },
    setting: {
      type: Object,
      default() {
        return {}
      }
    },
    page: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      curTab: 'setting',
      bindSetting: Object.assign({}, this.setting),
      fontFamily: [
        {
          value: 'Microsoft YaHei',
          label: '微软雅黑'
        },
        {
          value: 'KaiTi',
          label: '楷体'
        },
        {
          value: 'SimSun',
          label: '宋体'
        },
        {
          value: 'LiSu',
          label: '隶书'
        }
      ],
      color: [
        {
          value: '#333'
        },
        {
          value: '#aaa'
        },
        {
          value: '#fff5ee'
        }
      ],
      bindPage: this.page
    }
  },
  computed: {
    computedPosition() {
      return this.position === 'bottom' ? `bottom: 0;` : 'top: 0;'
    }
  },
  watch: {
    page: {
      handler() {
        this.bindPage = this.page
      },
      immediate: true
    }
  },
  methods: {
    setDefault() {
      this.bindSetting = Object.assign({}, this.setting)
    },
    changeSetting() {
      this.$emit('dataChange', Object.assign({}, this.bindSetting))
    },
    changePage() {
      this.$emit('pageChange', this.bindPage)
    }
  }
}
</script>

<style lang="less" scoped>
@outline: 5px solid #444;
.setting-container {
  width: 100%;
  max-width: 500px;
  background-color: #333;
  color: seashell;
  left: 0;
  right: 0;
  margin: 0 auto;
  p, ul {
    margin: 0;
  }
  .tabs {
    width: 100%;
    height: 40px;
    .tab {
      width: 50%;
      height: 100%;
      cursor: pointer;
      .tab-title {
        text-align: center;
        line-height: 40px;
      }
      &.active {
        background-color: #222;
      }
    }
  }
  .setting-content {
    background-color: #222;
    padding: 15px;
    list-style: none;
    .setting-item {
      width: 100%;
      padding: 10px 0;
      white-space: nowrap;
      .item-label {
        display: inline-block;
        width: 50px;
      }
      .item-content {
        display: inline-block;
        width: calc(100% - 50px);
        .item-content-sub-item {
          height: 20px;
          .color-sample,
          .background-sample {
            width: 28px;
            height: 28px;
            display: inline-block;
            cursor: pointer;
            &.active {
              outline: @outline;
            }
          }
          .color-picker {
            &.active {
              outline: @outline;
            }
          }
        }
      }
      &.setting-action {
        text-align: center;
      }
    }
    .page {
      .jump-button-row {
        text-align: center;
      }
    }
  }
}
</style>

<style lang="less">
.setting-container {
  .setting-content {
    .setting-item {
      .item-content {
        .slider {
          margin-top: -10px;
          .el-slider__runway {
            margin: 0;
          }
        }
        .item-content-sub-item {
          .el-color-picker {
            position: absolute;
            top: 0;
          }
        }
      }
    }
  }
}
</style>
