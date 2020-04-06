<template>
  <div
    :class="`${show ? 'show' : ''} action-wrapper`"
    :style="{
      left: position[0] + 'px',
      top: position[1] + 'px'
    }"
  >
    <div
      class="action-item"
      v-for="(item, index) in actions"
      :id="item.id"
      :key="index"
      @click="() => trigger(item.key)"
    >{{ item.text }}</div>
  </div>
</template>

<script>
export default {
  name: 'ActionBar',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    position: {
      type: Array,
      default() {
        return [0, 0]
      }
    }
  },
  data() {
    return {
      actions: [
        {
          key: 'copy',
          id: 'action-copy-el',
          text: '复制'
        }
      ]
    }
  },
  methods: {
    trigger(key) {
      this.$emit('action', key)
    }
  }
}
</script>

<style lang="less" scoped>
@import url('~@/styles/variables.less');
.action-wrapper {
  position: absolute;
  border: 1px solid #333;
  display: none;
  z-index: 2;
  &.show {
    display: initial;
  }
  .action-item {
    padding: 5px;
    display: inline-block;
    cursor: pointer;
    background: white;
    font-size: 14px;
    &:hover {
      background-color: lightgray;
    }
  }
}
</style>
