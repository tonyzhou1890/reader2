<template>
  <div :class="`${show ? 'show' : ''} ${full ? 'full-screen' : ''} menu-wrapper`">
    <!-- 遮罩层 -->
    <div
      class="menu-cover"
      :class="full ? '' : 'not-full-screen'"
    ></div>
    <!-- 侧边栏按钮 -->
    <div v-show="!full" class="sidebar">
      <div
        v-for="(item, index) in menuItems"
        :key="index"
        class="menu-item"
        :class="[active === item.key && show ? 'active' : '', show ? 'show' : '']"
        @click="() => showMenu(item.key)"
      >
        <span class="menu-icon" :title="item.text">
          <svg-icon :icon-class="item.icon"></svg-icon>
        </span>
        <span v-show="!show" >{{item.text}}</span>
      </div>
    </div>
    <!-- 菜单内容 -->
    <div
      class="menu-content"
      :class="full ? 'full-screen' : ''"
      @click="closeMenu"
    >
      <!-- 非全屏 -->
      <div class="menu-content-inner" v-show="!full">
        <div
          class="menu-content-inner-item"
          v-for="(item, index) in menuItems"
          v-show="active === item.key"
          :key="index"
        >
          <slot :name="item.key"></slot>
        </div>
      </div>
      <!-- 全屏 -->
      <div class="menu-content-inner" v-show="full">
        <el-tabs v-model="active">
          <el-tab-pane
            v-for="(item, index) in menuItems"
            :key="index"
            :name="item.key"
            :label="item.text"
          >
            <slot :name="item.key"></slot>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Menu',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    full: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      menuItems: [
        {
          key: 'setting',
          icon: 'setting',
          text: '设置'
        },
        {
          key: 'jumpPage',
          icon: 'jump',
          text: '跳页'
        },
        {
          key: 'search',
          icon: 'search',
          text: '搜索'
        }
      ],
      active: 'setting'
    }
  },
  methods: {
    showMenu(which) {
      this.$emit('showMenu')
      this.active = which
    },
    // 关闭菜单
    closeMenu(e) {
      if (e) {
        if (e.target === e.currentTarget) {
          close(this)
        }
      } else {
        close(this)
      }

      function close(self) {
        self.$emit('closeMenu')
        setTimeout(() => {
          self.active = 'setting'
        }, 300)
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import url('~@/styles/variables.less');
.full() {
  width: 100%;
  height: 100%;
}
.menu-wrapper {
  position: absolute;
  .full;
  width: 20px;
  &.full-screen {
    width: 0;
  }
  &.show {
    width: 100%;
  }
  transition: all .3s;
  .menu-cover {
    .full;
    position: absolute;
    background-color: rgba(0, 0, 0, .3);
    &.not-full-screen {
      width: calc(~'100% - 20px');
      left: 20px;
    }
  }
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    .menu-item {
      width: 40px;
      height: 40px;
      cursor: pointer;
      font-size: 20px;
      line-height: 40px;
      white-space: nowrap;
      overflow: hidden;
      background-color: orange;
      color: #333;
      margin-bottom: 3px;
      transition: all .3s;
      > span {
        display: inline-block;
      }
      .menu-icon {
        width: 40px;
        padding: 0 10px;
      }
      &:hover {
        width: 120px;
      }
      &.active {
        color: white;
      }
      &.show:hover {
        width: 40px;
      }
    }
  }
  .menu-content {
    width: calc(~'100% - 20px');
    height: 100%;
    position: absolute;
    top: 0;
    left: 20px;
    z-index: 1;
    overflow: hidden;
    &.full-screen {
      width: 100%;
      left: 0;
    }
    .menu-content-inner {
      .full;
      width: 300px;
      background-color: orange;
      .menu-content-inner-item {
        .full;
      }
    }
  }
}
</style>
