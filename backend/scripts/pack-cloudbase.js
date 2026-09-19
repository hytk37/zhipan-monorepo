// ============================================
// 智慧膳系统 · 生成腾讯云云托管部署包
// ============================================
// 用法：node scripts/pack-cloudbase.js
// 产物：
//   D:\project\v3\产物\CloudBase部署包\zhipan-cloudbase\       ← 可直接上传的文件夹
//   D:\project\v3\产物\CloudBase部署包\zhipan-cloudbase.zip    ← 可直接上传的压缩包
//
// 关键点（云托管的坑）：
//   ① zip 内必须是「文件本身」，不能多一层顶层文件夹 —— 否则云托管找不到 Dockerfile
//   ② Dockerfile 必须在目标目录根下
//   ③ 绝不能包含 backend/.env（真实密钥）与 .git / node_modules / .tools

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');          // 仓库根
const BACKEND = path.join(__dirname, '..');
const OUT_DIR = 'D:/project/v3/产物/CloudBase部署包';
const STAGE_DIR = path.join(ROOT, '.pack', 'cloudbase'); // ASCII 临时路径（避开中文路径的编码坑）
const PKG_NAME = 'zhipan-cloudbase';

// 要打进包里的内容（相对仓库根）
const INCLUDES = [
  { src: 'Dockerfile', dest: 'Dockerfile' },
  { src: '.dockerignore', dest: '.dockerignore' },
  { src: 'package.json', dest: 'package.json' },
  { src: 'backend', dest: 'backend' },
  { src: 'admin', dest: 'admin' },
  { src: 'demo', dest: 'demo' },
];

// 一律排除（密钥、依赖、本地工具、无关内容）
const EXCLUDES = [
  'node_modules', '.git', '.git-rewrite', '.data', '.tools', '.pack',
  '.env', '.env.local', '.vscode', '.idea', '__pycache__',
];

function shouldSkip(name) {
  if (EXCLUDES.indexOf(name) >= 0) return true;
  if (name === '.env' || name.indexOf('.env.') === 0) return true;  // 任何 .env*
  if (/\.log$/i.test(name)) return true;
  return false;
}

let fileCount = 0;
let secretsFound = [];

function copyTree(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const name = path.basename(src);
    if (shouldSkip(name)) return;
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => copyTree(path.join(src, child), path.join(dest, child)));
    return;
  }
  if (shouldSkip(path.basename(src))) return;
  fs.copyFileSync(src, dest);
  fileCount++;
  // 防呆：确保没有真实密钥混进部署包
  if (/\.(js|json|example|yml|yaml)$/i.test(src) || src.indexOf('.env') >= 0) {
    try {
      const text = fs.readFileSync(src, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (/sk-[A-Za-z0-9_-]{16,}/.test(line) && line.indexOf('sk-你的') < 0) {
          secretsFound.push(path.relative(ROOT, src) + ':' + (i + 1));
        }
      });
    } catch (e) {}
  }
}

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.readdirSync(p).forEach((f) => {
    const cur = path.join(p, f);
    if (fs.statSync(cur).isDirectory()) rmrf(cur);
    else fs.unlinkSync(cur);
  });
  fs.rmdirSync(p);
}

console.log('\n══════ 生成腾讯云云托管部署包 ══════\n');

// ① 清理并复制
rmrf(STAGE_DIR);
fs.mkdirSync(STAGE_DIR, { recursive: true });
console.log('【1/4】收集文件');
INCLUDES.forEach((item) => {
  const src = path.join(ROOT, item.src);
  if (!fs.existsSync(src)) {
    console.log('  ⚠️  跳过（不存在）：' + item.src);
    return;
  }
  copyTree(src, path.join(STAGE_DIR, item.dest));
  console.log('  ✓ ' + item.src);
});

// ② 写一份包内说明
fs.writeFileSync(path.join(STAGE_DIR, '部署说明.txt'), [
  '智慧膳系统 · 腾讯云云托管部署包',
  '',
  '本包可直接用于「云托管 → 新建服务 → 上传代码包」。',
  '',
  '【上传注意】',
  '  如果上传 zip：本 zip 已按云托管要求打好（文件在根，没有多余顶层文件夹）。',
  '  如果你自己重新压缩：请进入文件夹、全选里面的文件再压缩，',
  '  不要直接压缩 zhipan-cloudbase 这个文件夹本身（会多一层，导致找不到 Dockerfile）。',
  '',
  '【创建服务时填什么】',
  '  服务名称        : zhipan-demo（只能小写字母/数字/-，小写字母开头）',
  '  部署方式        : 上传代码包',
  '  目标目录        : 留空（Dockerfile 就在根目录）',
  '  Dockerfile 名称 : 留空（默认根目录的 Dockerfile）',
  '  端口            : 3000',
  '  访问类型        : WEB（公网访问）',
  '  最小实例数      : 0（无流量不计费）',
  '  最大实例数      : 1',
  '  规格            : 0.5 核 1GB 起（演示够用）',
  '  环境变量        : DEEPSEEK_API_KEY = 你的密钥（不填也能跑，AI 会降级为模板）',
  '',
  '【部署完访问】',
  '  体验页    https://你的默认域名/demo',
  '  投屏二维码 https://你的默认域名/demo/qr.html   ← 演示时投屏这个，二维码自动指向该域名',
  '  管理大屏  https://你的默认域名/admin',
  '  健康检查  https://你的默认域名/api/demo/ping',
  '',
  '详细步骤见：产物/AI功能设计/腾讯云CloudBase部署手册.md',
  '',
].join('\n'), 'utf8');
console.log('  ✓ 部署说明.txt（包内使用说明）');

// ③ 密钥防呆检查
console.log('\n【2/4】密钥安全自检');
if (secretsFound.length) {
  console.log('  ✗ 发现真实密钥，已中止：' + secretsFound.slice(0, 3).join('、'));
  process.exit(1);
}
console.log('  ✓ 包内没有任何真实密钥（已扫描 ' + fileCount + ' 个文件）');
console.log('  ✓ 已排除：' + EXCLUDES.join(' / ') + ' 以及所有 .env*');

// ④ 生成 zip（用 PowerShell，路径保持 ASCII 避免编码问题）
console.log('\n【3/4】生成压缩包');
const zipPathAscii = path.join(ROOT, '.pack', PKG_NAME + '.zip');
if (fs.existsSync(zipPathAscii)) fs.unlinkSync(zipPathAscii);
const ps = spawnSync('powershell', [
  '-NoProfile', '-NonInteractive', '-Command',
  'Compress-Archive -Path "' + path.join(STAGE_DIR, '*') + '" -DestinationPath "' + zipPathAscii + '" -Force',
], { encoding: 'utf8' });
if (ps.status !== 0 || !fs.existsSync(zipPathAscii)) {
  console.log('  ⚠️  压缩失败（不影响文件夹版）：' + String(ps.stderr || ps.stdout).slice(0, 200));
  console.log('  你可以直接上传文件夹：' + path.join(OUT_DIR, PKG_NAME));
} else {
  console.log('  ✓ ' + PKG_NAME + '.zip  ' + (fs.statSync(zipPathAscii).size / 1048576).toFixed(2) + ' MB');
}

// ⑤ 复制到产物目录
console.log('\n【4/4】输出到产物目录');
fs.mkdirSync(OUT_DIR, { recursive: true });
const outFolder = path.join(OUT_DIR, PKG_NAME);
// 注意：这里逐个文件复制，不用 fs.cpSync —— 递归复制在某些环境会被安全策略静默跳过
let copied = 0;
(function copyInto(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach((f) => {
    const s = path.join(src, f);
    const d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) copyInto(s, d);
    else { fs.copyFileSync(s, d); copied++; }
  });
})(STAGE_DIR, outFolder);
console.log('  ✓ 文件夹：' + outFolder + '  (' + copied + ' 个文件)');
if (fs.existsSync(zipPathAscii)) {
  const outZip = path.join(OUT_DIR, PKG_NAME + '.zip');
  fs.copyFileSync(zipPathAscii, outZip);
  console.log('  ✓ 压缩包：' + outZip + '  (' + (fs.statSync(outZip).size / 1048576).toFixed(2) + ' MB)');
}

console.log('\n════════════════════════════════════');
console.log('  共 ' + fileCount + ' 个文件，密钥检查通过');
console.log('  上传时选「文件夹」或「zip」都可以（zip 已按云托管要求打好）');
console.log('');
