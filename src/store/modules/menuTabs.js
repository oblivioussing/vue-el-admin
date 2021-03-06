import router from '@/router'
import store from '@/store'

const state = {
  menus: [], // 菜单列表
  tabs: [{ path: '/', title: '首页' }], // 顶部tab
  actived: '', // 需要激活的path
  pathMap: {}, // 路由映射
  exclude: '' // 销毁的路由组件
}

const getters = {
  // 当前路由的父级path
  stair (state) {
    const pathMap = state.pathMap[state.actived]
    return pathMap && pathMap.parentPath
  }
}

const mutations = {
  // 菜单初始化
  menuInit (state) {
    // 菜单列表
    state.menus = router.options.routes
    // 初始化路由映射
    this.commit('menuTabs/pathMapInit')
  },
  // 路由变化
  routerChange (state, to) {
    const path = to.path
    state.actived = path
    // 如果没有数据就先初始化
    if (!state.menus.length) {
      // 菜单列表
      state.menus = router.options.routes
      // 初始化路由映射
      this.commit('menuTabs/pathMapInit')
    }
    // 判断该路由是否已经存在
    const exist = state.tabs.some(item => item.path === path)
    // 不存在就添加一个tab
    if (!exist) {
      const path = to.path
      // 如果为根目录则清空tabs
      if (path === '/') {
        state.tabs = []
      }
      const pathMap = state.pathMap[path]
      const title = pathMap && pathMap.title
      title && state.tabs.push({ path, title })
    }
  },
  // 初始化路由映射
  pathMapInit (state) {
    const menus = state.menus
    menus.forEach(item => {
      const children = item.children
      if (!children) {
        return
      }
      const path = item.path
      const title = item.meta && item.meta.title
      state.pathMap[path] = { path, title }
      children.forEach(cItem => {
        let map = {}
        const cPath = cItem.path
        const cMeta = cItem.meta
        const cTtile = cMeta && cMeta.title
        // path和title的映射
        map.title = cTtile || ''
        // path和skip的映射
        if (cPath.indexOf('List') < 0 && cPath !== '/') {
          const skip = cPath.replace(/Add|Edit|View/, 'List')
          map.skip = skip
        }
        // path的父级路由的映射
        map.parentPath = path
        // 路由映射
        state.pathMap[cPath] = map
      })
    })
    // 路由权限初始化
    this.commit('menuTabs/pathAuthorityInit')
  },
  // 路由权限初始化
  pathAuthorityInit (state) {
    const userInfo = store.state.user.userInfo
    const authorityMenus = userInfo.authorityMenus || []
    for (let item in state.pathMap) {
      for (let authorityItem of authorityMenus) {
        if (item === authorityItem.path) {
          // 向pathMap赋值权限属性
          state.pathMap[item].authority = authorityItem.authority
        }
      }
    }
  },
  // 关闭一个tab
  removeTab (state, path, jump = true) {
    path = path.includes('/') ? path : `/${path}`
    const index = state.tabs.findIndex(item => item.path === path)
    state.tabs.splice(index, 1)
    let actived
    if (index > 0) {
      actived = state.tabs[index - 1].path
    } else {
      actived = state.tabs.length > 0 ? state.tabs[0].path : '/'
    }
    const pathMap = state.pathMap[path]
    // 关闭后要跳转的页面
    let skip = pathMap && pathMap.skip
    const isSkipInTabs = state.tabs.some(item => item.path === skip)
    skip = isSkipInTabs ? skip : false
    state.actived = skip || actived
    state.exclude = path.substr(1)
    // 路由跳转
    jump && router.push(state.actived)
  },
  // 关闭其他tab
  removeTabOther (state, path) {
    state.tabs.forEach(item => {
      if (item.path !== path && item.path !== '/') {
        state.exclude = item.path.substr(1)
      }
    })
    state.tabs = [{ path: '/', title: '首页' }]
    const pathMap = state.pathMap[path]
    const title = pathMap && pathMap.title
    title && state.tabs.push({ path, title })
    router.push(path)
  },
  // 关闭所有tab
  removeTabAll (state) {
    state.tabs.forEach(item => {
      state.exclude = item.path.substr(1)
    })
    state.tabs = []
    router.push('/')
  },
  // 清空被销毁的路由组件
  clearExclude (state) {
    state.exclude = ''
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
