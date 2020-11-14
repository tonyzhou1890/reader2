<template>
  <div id="app" class="por" v-loading="loading">
    <!-- 操作按钮 -->
    <ActionBar
      :show="showActionBar"
      :position="actionBarPosition"
      @action="handleAction"
    />
    <Book
      ref="book"
      :style="`z-index: 1`"
      :text="text"
      :title="title"
      :width="width"
      :height="height"
      :color="setting.color"
      :background="setting.background"
      :highlightBgc="setting.highlightBgc"
      :fontFamily="setting.fontFamily"
      :fontSize="setting.fontSize"
      :lineHeight="setting.lineHeight"
      :renderChapter="setting.renderChapter"
      :render="setting.render"
      :percent="percent"
      :frontCoverPath="frontCoverPath"
      :backCoverPath="backCoverPath"
      @changePage="handleChangePage"
      @changePercent="handleChangePercent"
      @showMenu="() => toggleMenu(true)"
      @showActionBar="toggleActionBar"
    >
      <!-- 菜单 -->
      <Menu
        slot-scope="menuProps"
        @showMenu="() => toggleMenu(true)"
        @closeMenu="() => toggleMenu(false)"
        @closeBook="() => closeBook()"
        :show="showMenu"
        :full="menuProps.full"
        :type="type"
      >
        <!-- 设置 -->
        <template
          slot='setting'
          slot-scope="props"
        >
          <Setting
            :show="showMenu"
            :defaultSetting="defaultSetting"
            :setting="setting"
            :activeMenu="props.activeMenu"
            @close="() => toggleMenu(false)"
            @settingChange="handleSettingChange"></Setting>
        </template>
        <!-- 跳页 -->
        <template
          slot="jumpPage"
          slot-scope="props">
          <JumpPage
            :show="showMenu"
            :page="Number(page)"
            :min="minPage"
            :max="maxPage"
            :activeMenu="props.activeMenu"
            @close="() => toggleMenu(false)"
            @jumpPage="handleJumpPage"
          ></JumpPage>
        </template>
        <!-- 搜索 -->
        <template
          slot="search"
          slot-scope="props">
          <Search
            :min="minPage"
            :max="maxPage"
            :activeMenu="props.activeMenu"
            @close="() => toggleMenu(false)"
            @jumpPage="handleJumpPage"
          ></Search>
        </template>
        <!-- 目录 -->
        <template
          slot="chapterList"
          slot-scope="props">
          <ChapterList
            :page="Number(page)"
            :activeMenu="props.activeMenu"
            @jumpPage="handleJumpPage"
          ></ChapterList>
        </template>
        <!-- 书籍信息 -->
        <template
          slot="info"
          slot-scope="props">
          <Info
            :title="title"
            :number="text.length"
            :activeMenu="props.activeMenu"
            @close="() => toggleMenu(false)"
          ></Info>
        </template>
      </Menu>
    </Book>
    <local
      v-if="showLocal"
      :style="`z-index: 4;`"
      @get-data="getLocalData"
    />
  </div>
</template>

<script>
import axios from 'axios'
import Setting from '@/components/Setting'
import JumpPage from '@/components/JumpPage'
import Search from '@/components/Search'
import ChapterList from '@/components/ChapterList'
import Info from './components/Info'
import Local from './components/Local'
import Book from './components/Book'
import Menu from './components/Menu'
import ActionBar from './components/ActionBar'
import localforage from 'localforage'
import { bookSetting, appSetting } from '@/utils/setting'
import { getBookInfo, setBookInfo } from '@/utils/storage'
import { appErrorInfo } from '@/utils/error'
let { fontFamily, fontSize, lineHeight, color, background, highlightBgc, renderChapter, render } = bookSetting
let { title } = appSetting
const defaultSetting = {
  fontFamily,
  fontSize,
  lineHeight,
  color,
  background,
  highlightBgc,
  renderChapter,
  render
}
export default {
  name: 'App',
  components: {
    Setting,
    JumpPage,
    Search,
    ChapterList,
    Info,
    Local,
    Book,
    Menu,
    ActionBar
  },
  data() {
    return {
      width: null,
      height: null,
      text: title,
      title: bookSetting.title,
      total: null,
      page: null,
      percent: null,
      frontCoverPath: '',
      backCoverPath: '',
      showMenu: false,
      defaultSetting,
      setting: Object.assign({}, defaultSetting),
      type: 'local', // 打开方式：address、local、message
      address: null,
      loading: false,
      local: null,
      showLocal: false,
      saveBookInfoTimeOut: null, // 缓存书籍信息延时引用
      message: null, // postMessage 发送过来的信息
      showActionBar: false, // 是否显示操作按钮
      actionBarPosition: [0, 0] // 操作按钮位置
    }
  },
  computed: {
    // 最小页码
    minPage() {
      let min = this.frontCoverPath ? 0 : 1
      return min
    },
    // 最大页码
    maxPage() {
      let max = this.total !== null ? this.total : 1
      max = this.backCoverPath ? max + 1 : max
      return max
    }
  },
  created() {
    this.settingSize()
    this.watchClientSize()
    this.resolveUrl()
    this.getSetting()
  },
  methods: {
    // 监听 onresize
    watchClientSize() {
      window.addEventListener('resize', this._.debounce(this.settingSize, 500))
    },
    // 获取body大小
    settingSize() {
      // 如果是输入框聚焦导致的窗口大小变化，不处理
      const tagName = document.activeElement ? document.activeElement.tagName : null
      if (['INPUT', 'TEXTAREA'].includes(tagName)) return
      const s = window.getComputedStyle(document.body)
      this.width = Number(s.width.split('px')[0])
      this.height = Number(s.height.split('px')[0])
    },
    // 跳页
    handleJumpPage(data) {
      console.log(data)
      if (data) {
        this.page = data
        this.percent = data / this.total
        this.saveBookInfo()
      }
      this.toggleMenu()
    },
    // 解析url
    resolveUrl() {
      const temp = window.location.search.slice(1).split('&')
      temp.map((item, index) => {
        temp[index] = item.split('=')
      })
      // 是否通过address指定文本地址
      const address = temp.filter(item => { return item[0] === 'address' })
      if (address.length) {
        this.type = 'address'
        this.getAddressTxt(address[0][1])
        return
      }
      // 是否通过message通信
      const message = temp.filter(item => item[0] === 'message')
      if (message.length && window.opener) {
        this.type = 'message'
        window.addEventListener('message', this.dealPostMessage)
        window.opener.postMessage({
          from: 'reader',
          data: 'ready'
        }, '*')
        return
      }
      // 其余默认local
      this.type = 'local'
      this.showLocal = true
    },
    // 处理通过指定 address 打开的方式
    getAddressTxt(url) {
      this.loading = true
      let address = decodeURI(url)
      axios.get(url)
        .then(res => {
          getBookInfo(address)
            .then(bookInfo => {
              if (bookInfo) {
                this.percent = bookInfo.percent
              }
              this.text = res.data
              this.address = address
              let bookTitle = address.split('/')
              bookTitle = bookTitle[bookTitle.length - 1].replace(/[\.txt|\.TXT]/g, '')
              this.title = bookTitle
              this.loading = false
            })
            .catch(e => {
              this.$message.error(appErrorInfo('101'))
            })
        })
        .catch(e => {
          this.$message({
            message: '地址错误',
            type: 'error'
          })
          this.loading = false
        })
    },
    // 处理 postMessage 形式的用法
    dealPostMessage(e) {
      if (e.data && e.data.dest === 'reader') {
        this.message = e.data
        this.loading = true
        // 如果有 uuid 则继续获取文本
        if (this.message.data.uuid) {
          axios.get(this.message.data.textPath)
          // axios.get('http://store.tony93.top/舞舞舞.txt')
            .then(res => {
              // 获取文本后先从本地获取进度，与线上进度时间对比
              getBookInfo(this.message.data.uuid)
                .then(bookInfo => {
                  // 设置percent
                  // 用本地的情况
                  // 1. 线上没有，2. 本地进度较新
                  if (bookInfo && (!this.message.data.updateTime || (bookInfo.updateTime > new Date(this.message.data.updateTime).getTime()))) {
                    this.percent = bookInfo.percent
                  } else {
                    this.percent = this.message.data.percent ? this.message.data.percent * 100 : null
                  }

                  this.text = res.data
                  this.title = this.message.data.title
                  this.frontCoverPath = this.message.data.frontCoverPath
                  this.backCoverPath = this.message.data.backCoverPath
                  this.loading = false
                })
                .catch(e => {
                  this.$message.error(appErrorInfo('r101'))
                })
            })
            .catch(e => {
              this.$message.error('获取文本失败。错误码：r201')
              console.log(e)
              this.loading = false
            })
        } else {
          this.$message.error('书籍信息错误，缺少uuid')
        }
      }
    },
    toggleMenu(show) {
      let _show = !this.showMenu
      if (show) {
        _show = show
      } else if (!show && show !== undefined) {
        _show = false
      }
      this.showMenu = _show
    },
    handleSettingChange(data) {
      if (data) {
        this.setting = Object.assign(this.setting, data)
        this.storeSetting()
      }
      this.toggleMenu()
    },
    // 页码改变
    handleChangePage(val) {
      this.page = val.page
      this.total = val.totalPages
    },
    // 百分比改变
    handleChangePercent(val) {
      this.percent = val
      this.saveBookInfo()
    },
    // 保存设置
    storeSetting() {
      localforage.setItem('setting', this.setting)
        .then(res => {})
        .catch(e => {
          const m = JSON.parse(e.message)
          this.$message({
            type: 'error',
            message: m.message
          })
        })
    },
    // 获取设置
    getSetting() {
      if (!window.localStorage) {
        this.$message({
          type: 'tip',
          message: '此浏览器不支持本地存储，请更换浏览器。'
        })
        return
      }
      localforage.getItem('setting')
        .then(res => {
          if (res) {
            this.setting = Object.assign(this.setting, res)
          }
        })
        .catch(e => {
          const m = JSON.parse(e.message)
          this.$message({
            type: 'error',
            message: m.message
          })
        })
    },
    getLocalData(e) {
      getBookInfo(e.key)
        .then(res => {
          if (res) {
            this.percent = res.percent || this.percent
          }
          this.text = e.value
          this.local = e.key
          this.title = e.title
          this.showLocal = false
        })
        .catch(e => {
          this.$message.error(appErrorInfo('r101'))
        })
    },
    // 缓存书籍信息
    saveBookInfo() {
      let key = ''
      switch (this.type) {
        case 'address':
          key = this.address
          break
        case 'local':
          key = this.local
          break
        case 'message':
          key = this.message.data.uuid
          break
        default:
          return
      }
      clearTimeout(this.saveBookInfoTimeOut)
      this.saveBookInfoTimeOut = setTimeout(() => {
        setBookInfo(key, {
          percent: this.percent,
          updateTime: Date.now(),
          type: this.type
        })

        // 发送请求
        if (this.type === 'message' && this.message.request && this.message.request.url) {
          this.savePercentOnline()
        }
      }, 3000)
    },
    // 阅读进度存储服务器
    savePercentOnline() {
      let reqConfig = {...this.message.request}
      if (this.message.request.data) {
        reqConfig.data = {
          ...this.message.request.data,
          percent: this.percent * 100
        }
      }
      axios(reqConfig)
        .then(res => {
          if (res.data.code !== 0) {
            this.$message.error('同步进度失败。错误码：r203')
          }
        })
        .catch(e => {
          this.$message.error('同步进度失败。错误码：r202')
        })
    },
    // 处理按钮操作
    handleAction(key) {
      this.$refs.book.trigger(key)
    },
    // 切换操作按钮显隐
    toggleActionBar(e) {
      this.showActionBar = e.show
      this.actionBarPosition = e.position || this.actionBarPosition
    },
    // 关闭当前书籍
    closeBook() {
      if (this.type !== 'local') {
        this.$message.info('只有本地模式才能关闭书籍')
        return
      }
      this.showLocal = true
      this.text = bookSetting.title
      this.title = bookSetting.title
      // this.total = 0
      // this.page = 1
      // this.percent = null
      // this.frontCoverPath = ''
      // this.backCoverPath = ''
    }
  }
}
</script>

<style lang='less' scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: seashell;
  .middle-cover {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
}
</style>
