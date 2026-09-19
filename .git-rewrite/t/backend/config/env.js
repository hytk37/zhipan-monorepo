/**
 * 极简 .env 加载器（零依赖）
 *
 * Node 20.6+ 也可用 `node --env-file=.env`，但为了在 npm scripts 里
 * 无需改动启动命令，这里自己解析一遍：已存在的环境变量优先，不被覆盖。
 *
 * 用法： require('../config/env')  —— 只需在入口最顶部 require 一次
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, 'utf8');
  text.split(/\r?\n/).forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq < 0) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // 去掉成对的引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}

module.exports = {
  envPath: envPath,
  loaded: fs.existsSync(envPath),
};
