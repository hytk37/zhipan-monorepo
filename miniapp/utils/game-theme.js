/**
 * 智盘冒险 - 主题配置
 * 包含 9 套主题（5 深色 + 4 浅色）
 */

const THEMES = {
  cyber: {
    name: '霓虹',
    light: false,
    accent: '#00e5ff',
    accent2: '#7c4dff',
    gold: '#ffd740',
    fire: '#ff6d00',
    hp: '#ff5252',
    mp: '#448aff',
    exp: '#69f0ae',
    particleRGB: [0, 229, 255],
    // CSS 变量值（用于动态更新 page 样式）
    vars: {
      '--bg1': '#0a0e1a', '--bg2': '#131833', '--bg3': '#1c2245',
      '--accent': '#00e5ff', '--accent2': '#7c4dff', '--gold': '#ffd740', '--fire': '#ff6d00',
      '--hp': '#ff5252', '--mp': '#448aff', '--exp': '#69f0ae', '--star': '#ffd740',
      '--card': 'rgba(25,32,72,0.85)', '--border': 'rgba(0,229,255,0.2)',
      '--text': '#e8eaf6', '--text2': '#9fa8da', '--text3': '#5c6bc0',
      '--bar-bg': 'rgba(10,14,26,0.95)', '--bar-bg2': 'rgba(10,14,26,0.7)',
      '--glow': 'rgba(0,229,255,0.3)', '--glow2': 'rgba(0,229,255,0.15)',
      '--glow3': 'rgba(0,229,255,0.12)', '--glow4': 'rgba(0,229,255,0.25)'
    }
  },
  fire: {
    name: '烈焰',
    light: false,
    accent: '#ff6d00',
    accent2: '#ff3d00',
    gold: '#ffd740',
    fire: '#ff9100',
    hp: '#ff5252',
    mp: '#448aff',
    exp: '#69f0ae',
    particleRGB: [255, 109, 0],
    vars: {
      '--bg1': '#1a0a0a', '--bg2': '#2a1212', '--bg3': '#3d1a1a',
      '--accent': '#ff6d00', '--accent2': '#ff3d00', '--fire': '#ff9100',
      '--hp': '#ff5252', '--mp': '#448aff', '--exp': '#69f0ae', '--gold': '#ffd740', '--star': '#ffd740',
      '--card': 'rgba(45,18,18,0.85)', '--border': 'rgba(255,109,0,0.25)',
      '--text': '#fff3e0', '--text2': '#ffcc80', '--text3': '#d4864a',
      '--bar-bg': 'rgba(26,10,10,0.95)', '--bar-bg2': 'rgba(26,10,10,0.7)',
      '--glow': 'rgba(255,109,0,0.3)', '--glow2': 'rgba(255,109,0,0.15)',
      '--glow3': 'rgba(255,109,0,0.12)', '--glow4': 'rgba(255,109,0,0.25)'
    }
  },
  emerald: {
    name: '翡翠',
    light: false,
    accent: '#69f0ae',
    accent2: '#00c853',
    gold: '#ffd740',
    fire: '#ff6d00',
    hp: '#ff5252',
    mp: '#448aff',
    exp: '#69f0ae',
    particleRGB: [105, 240, 174],
    vars: {
      '--bg1': '#06120b', '--bg2': '#0d2218', '--bg3': '#163425',
      '--accent': '#69f0ae', '--accent2': '#00c853', '--fire': '#ffd740',
      '--hp': '#ff5252', '--mp': '#448aff', '--exp': '#69f0ae', '--gold': '#ffd740', '--star': '#ffd740',
      '--card': 'rgba(14,38,26,0.85)', '--border': 'rgba(105,240,174,0.2)',
      '--text': '#e0f5e8', '--text2': '#8cc9a0', '--text3': '#4a8c64',
      '--bar-bg': 'rgba(6,18,11,0.95)', '--bar-bg2': 'rgba(6,18,11,0.7)',
      '--glow': 'rgba(105,240,174,0.3)', '--glow2': 'rgba(105,240,174,0.15)',
      '--glow3': 'rgba(105,240,174,0.12)', '--glow4': 'rgba(105,240,174,0.25)'
    }
  },
  purple: {
    name: '星空',
    light: false,
    accent: '#ce93d8',
    accent2: '#9c27b0',
    gold: '#ffd740',
    fire: '#ff6d00',
    hp: '#ff5252',
    mp: '#448aff',
    exp: '#69f0ae',
    particleRGB: [206, 147, 216],
    vars: {
      '--bg1': '#120818', '--bg2': '#1e1030', '--bg3': '#2e1848',
      '--accent': '#ce93d8', '--accent2': '#9c27b0', '--fire': '#ff6d00',
      '--hp': '#ff5252', '--mp': '#448aff', '--exp': '#69f0ae', '--gold': '#ffd740', '--star': '#ffd740',
      '--card': 'rgba(30,16,48,0.85)', '--border': 'rgba(206,147,216,0.2)',
      '--text': '#f0e4f4', '--text2': '#c99ad4', '--text3': '#8c5c9c',
      '--bar-bg': 'rgba(18,8,24,0.95)', '--bar-bg2': 'rgba(18,8,24,0.7)',
      '--glow': 'rgba(206,147,216,0.3)', '--glow2': 'rgba(206,147,216,0.15)',
      '--glow3': 'rgba(206,147,216,0.12)', '--glow4': 'rgba(206,147,216,0.25)'
    }
  },
  gold: {
    name: '暗金',
    light: false,
    accent: '#ffd740',
    accent2: '#ff8f00',
    gold: '#ffd740',
    fire: '#ff6d00',
    hp: '#ff5252',
    mp: '#448aff',
    exp: '#69f0ae',
    particleRGB: [255, 215, 64],
    vars: {
      '--bg1': '#14100a', '--bg2': '#26200f', '--bg3': '#3a3018',
      '--accent': '#ffd740', '--accent2': '#ff8f00', '--fire': '#ff6d00',
      '--hp': '#ff5252', '--mp': '#448aff', '--exp': '#69f0ae', '--gold': '#ffd740', '--star': '#ffd740',
      '--card': 'rgba(42,34,16,0.85)', '--border': 'rgba(255,215,64,0.2)',
      '--text': '#fff8e1', '--text2': '#e6c968', '--text3': '#a08830',
      '--bar-bg': 'rgba(20,16,10,0.95)', '--bar-bg2': 'rgba(20,16,10,0.7)',
      '--glow': 'rgba(255,215,64,0.3)', '--glow2': 'rgba(255,215,64,0.15)',
      '--glow3': 'rgba(255,215,64,0.12)', '--glow4': 'rgba(255,215,64,0.25)'
    }
  },
  dawn: {
    name: '晨光',
    light: true,
    accent: '#e65100',
    accent2: '#ff8a65',
    gold: '#f9a825',
    fire: '#d84315',
    hp: '#c62828',
    mp: '#1565c0',
    exp: '#2e7d32',
    particleRGB: [230, 81, 0],
    vars: {
      '--bg1': '#faf6f0', '--bg2': '#fff8f0', '--bg3': '#f0e8dc',
      '--accent': '#e65100', '--accent2': '#ff8a65', '--fire': '#d84315', '--gold': '#f9a825',
      '--hp': '#c62828', '--mp': '#1565c0', '--exp': '#2e7d32', '--star': '#f9a825',
      '--card': 'rgba(255,255,255,0.92)', '--border': 'rgba(230,81,0,0.15)',
      '--text': '#3e2723', '--text2': '#795548', '--text3': '#a1887f',
      '--bar-bg': 'rgba(255,248,240,0.97)', '--bar-bg2': 'rgba(255,248,240,0.85)',
      '--glow': 'rgba(230,81,0,0.18)', '--glow2': 'rgba(230,81,0,0.08)',
      '--glow3': 'rgba(230,81,0,0.06)', '--glow4': 'rgba(230,81,0,0.12)'
    }
  },
  mint: {
    name: '薄荷',
    light: true,
    accent: '#00897b',
    accent2: '#26a69a',
    gold: '#f9a825',
    fire: '#ef6c00',
    hp: '#c62828',
    mp: '#1565c0',
    exp: '#2e7d32',
    particleRGB: [0, 137, 123],
    vars: {
      '--bg1': '#f0faf5', '--bg2': '#f5fcf8', '--bg3': '#e0f2ec',
      '--accent': '#00897b', '--accent2': '#26a69a', '--fire': '#ef6c00', '--gold': '#f9a825',
      '--hp': '#c62828', '--mp': '#1565c0', '--exp': '#2e7d32', '--star': '#f9a825',
      '--card': 'rgba(255,255,255,0.92)', '--border': 'rgba(0,137,123,0.15)',
      '--text': '#1b3a33', '--text2': '#4a7c6f', '--text3': '#80a89d',
      '--bar-bg': 'rgba(245,252,248,0.97)', '--bar-bg2': 'rgba(245,252,248,0.85)',
      '--glow': 'rgba(0,137,123,0.18)', '--glow2': 'rgba(0,137,123,0.08)',
      '--glow3': 'rgba(0,137,123,0.06)', '--glow4': 'rgba(0,137,123,0.12)'
    }
  },
  lavender: {
    name: '薰衣草',
    light: true,
    accent: '#7b1fa2',
    accent2: '#ab47bc',
    gold: '#f9a825',
    fire: '#e65100',
    hp: '#c62828',
    mp: '#1565c0',
    exp: '#2e7d32',
    particleRGB: [123, 31, 162],
    vars: {
      '--bg1': '#f5f0fa', '--bg2': '#faf8fc', '--bg3': '#ede0f5',
      '--accent': '#7b1fa2', '--accent2': '#ab47bc', '--fire': '#e65100', '--gold': '#f9a825',
      '--hp': '#c62828', '--mp': '#1565c0', '--exp': '#2e7d32', '--star': '#f9a825',
      '--card': 'rgba(255,255,255,0.92)', '--border': 'rgba(123,31,162,0.15)',
      '--text': '#2d1b3e', '--text2': '#6a4c8a', '--text3': '#9c80b8',
      '--bar-bg': 'rgba(250,248,252,0.97)', '--bar-bg2': 'rgba(250,248,252,0.85)',
      '--glow': 'rgba(123,31,162,0.18)', '--glow2': 'rgba(123,31,162,0.08)',
      '--glow3': 'rgba(123,31,162,0.06)', '--glow4': 'rgba(123,31,162,0.12)'
    }
  },
  snow: {
    name: '暖白',
    light: true,
    accent: '#1565c0',
    accent2: '#42a5f5',
    gold: '#f9a825',
    fire: '#d84315',
    hp: '#c62828',
    mp: '#1565c0',
    exp: '#2e7d32',
    particleRGB: [21, 101, 192],
    vars: {
      '--bg1': '#f8f9fc', '--bg2': '#ffffff', '--bg3': '#eceef3',
      '--accent': '#1565c0', '--accent2': '#42a5f5', '--fire': '#d84315', '--gold': '#f9a825',
      '--hp': '#c62828', '--mp': '#1565c0', '--exp': '#2e7d32', '--star': '#f9a825',
      '--card': 'rgba(255,255,255,0.95)', '--border': 'rgba(21,101,192,0.12)',
      '--text': '#1a1a2e', '--text2': '#546e7a', '--text3': '#90a4ae',
      '--bar-bg': 'rgba(255,255,255,0.97)', '--bar-bg2': 'rgba(255,255,255,0.9)',
      '--glow': 'rgba(21,101,192,0.18)', '--glow2': 'rgba(21,101,192,0.08)',
      '--glow3': 'rgba(21,101,192,0.06)', '--glow4': 'rgba(21,101,192,0.12)'
    }
  }
};

// 主题点样式数据
const THEME_DOTS = [
  { key: 'cyber', label: '霓虹', section: 'dark', gradient: 'linear-gradient(135deg,#0a0e1a,#1c2245)', inset: '#00e5ff', glow: 'rgba(0,229,255,0.3)' },
  { key: 'fire', label: '烈焰', section: 'dark', gradient: 'linear-gradient(135deg,#1a0a0a,#3d1a1a)', inset: '#ff6d00', glow: 'rgba(255,109,0,0.3)' },
  { key: 'emerald', label: '翡翠', section: 'dark', gradient: 'linear-gradient(135deg,#06120b,#163425)', inset: '#69f0ae', glow: 'rgba(105,240,174,0.3)' },
  { key: 'purple', label: '星空', section: 'dark', gradient: 'linear-gradient(135deg,#120818,#2e1848)', inset: '#ce93d8', glow: 'rgba(206,147,216,0.3)' },
  { key: 'gold', label: '暗金', section: 'dark', gradient: 'linear-gradient(135deg,#14100a,#3a3018)', inset: '#ffd740', glow: 'rgba(255,215,64,0.3)' },
  { key: 'dawn', label: '晨光', section: 'light', gradient: 'linear-gradient(135deg,#faf6f0,#f0e8dc)', inset: '#e65100', glow: 'rgba(230,81,0,0.2)' },
  { key: 'mint', label: '薄荷', section: 'light', gradient: 'linear-gradient(135deg,#f0faf5,#e0f2ec)', inset: '#00897b', glow: 'rgba(0,137,123,0.2)' },
  { key: 'lavender', label: '薰衣草', section: 'light', gradient: 'linear-gradient(135deg,#f5f0fa,#ede0f5)', inset: '#7b1fa2', glow: 'rgba(123,31,162,0.2)' },
  { key: 'snow', label: '暖白', section: 'light', gradient: 'linear-gradient(135deg,#f8f9fc,#eceef3)', inset: '#1565c0', glow: 'rgba(21,101,192,0.2)' }
];

module.exports = { THEMES, THEME_DOTS };
