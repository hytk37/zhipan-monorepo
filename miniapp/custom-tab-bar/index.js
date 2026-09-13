// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/meals/meals', text: '记录', icon: '📋' },
      { pagePath: '/pages/recommend/recommend', text: '推荐', icon: '🤖' },
      { pagePath: '/pages/game/game', text: '冒险', icon: '🎮', isGame: true },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '👤' }
    ]
  },
  methods: {
    switchTab(e) {
      const idx = Number(e.currentTarget.dataset.index);
      const item = this.data.list[idx];
      // 冒险页不作为 tab 页，用 navigateTo 打开子页面，避免 tabBar 重叠
      if (item.isGame) {
        wx.navigateTo({ url: item.pagePath });
        return;
      }
      wx.switchTab({ url: item.pagePath });
    }
  }
});
