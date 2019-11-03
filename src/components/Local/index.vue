<template>
  <div class="local-container poa">
    <el-upload
      ref="upload"
      class="chose-file"
      action="/"
      accept="text/plain"
      :on-change="handleChange"
      :auto-upload="false"
      drag
    >
      <i class="el-icon-plus"></i>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <div class="el-upload__tip" slot="tip">只能上传txt文件，建议大小200k以下</div>
    </el-upload>
  </div>
</template>

<script>
function getFile(path) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    reader.onerror = (e) => {
      reject(e)
    }
    reader.readAsText(path, 'gb2312')
  })
}
export default {
  name: 'Local',
  data() {
    return {
      data: null
    }
  },
  methods: {
    handleChange(e) {
      if (e.raw.type !== 'text/plain') {
        this.$message({
          type: 'error',
          message: '文件类型错误'
        })
        this.$refs.upload.clearFiles()
        return
      }
      getFile(e.raw)
        .then(res => {
          this.data = res
          this.$emit('get-data', {
            key: e.raw.name + e.raw.size,
            value: this.data
          })
        })
        .catch(e => {
          console.log(e)
        })
    },
    handleError(e) {
      console.log(e)
    }
  }
}
</script>

<style lang="scss" scoped>
.local-container {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background-color: seashell;
  .chose-file {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    .el-icon-plus {
      font-size: 30px;
      margin-top: 50px;
    }
  }
}
</style>
