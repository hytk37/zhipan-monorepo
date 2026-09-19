// ============================================
// 智慧膳系统 · AI Key 配置工具
// ============================================
// 用法：
//   node scripts/set-key.js              查看当前配置状态（脱敏，并实测是否可用）
//   node scripts/set-key.js sk-xxxxx     写入新 Key 并立即实测
//   node scripts/set-key.js --test       只实测当前 Key
//
// 设计目的：Key 只能写在 backend/.env（已被 .gitignore 忽略）。
// 手改文件很容易填错到 .env.example（会被提交 → GitHub 拒推），本工具避免这种事故。

const fs = require('fs');
const path = require('path');

const BACKEND = path.join(__dirname, '..');
const ENV = path.join(BACKEND, '.env');
const ENV_EXAMPLE = path.join(BACKEND, '.env.example');
const GITIGNORE = path.join(BACKEND, '..', '.gitignore');

function mask(k) {
  if (!k) return '(未填)';
  if (k.length < 14) return k.slice(0, 4) + '****';
  return k.slice(0, 7) + '****' + k.slice(-4);
}

function readEnvKey() {
  if (!fs.existsSync(ENV)) return null;
  const lines = fs.readFileSync(ENV, 'utf8').split(/\r?\n/);
  const hit = lines.find((l) => /^\s*DEEPSEEK_API_KEY\s*=/.test(l));
  return hit ? hit.split('=').slice(1).join('=').trim() : null;
}

function writeEnvKey(key) {
  // 不存在则从示例文件复制一份
  if (!fs.existsSync(ENV)) {
    if (fs.existsSync(ENV_EXAMPLE)) {
      fs.copyFileSync(ENV_EXAMPLE, ENV);
      console.log('· 已从 .env.example 创建 backend/.env');
    } else {
      fs.writeFileSync(ENV, '# 本文件含密钥，已被 .gitignore 忽略\n', 'utf8');
      console.log('· 已新建 backend/.env');
    }
  }
  const raw = fs.readFileSync(ENV, 'utf8');
  const lines = raw.split(/\r?\n/);
  let done = false;
  const out = lines.map((l) => {
    if (/^\s*DEEPSEEK_API_KEY\s*=/.test(l)) { done = true; return 'DEEPSEEK_API_KEY=' + key; }
    return l;
  });
  if (!done) out.push('DEEPSEEK_API_KEY=' + key);
  fs.writeFileSync(ENV, out.join('\n'), 'utf8');
}

function isIgnored() {
  const candidates = [
    path.join(BACKEND, '..', '.gitignore'),
    path.join(BACKEND, '.gitignore'),
  ];
  for (const gi of candidates) {
    if (!fs.existsSync(gi)) continue;
    const text = fs.readFileSync(gi, 'utf8');
    if (/^\s*(backend\/)?\.env\s*$/m.test(text)) return true;
  }
  return false;
}

/** 实测 Key 是否可用（一次极小的调用） */
async function testKey(key) {
  const base = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: process.env.AI_MODEL_FLASH || 'deepseek-flash',
        messages: [{ role: 'user', content: '回复"ok"两个字' }],
        max_tokens: 10,
        thinking: { type: 'disabled' },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      return { ok: true, reply: (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '' };
    }
    const body = await res.text().catch(() => '');
    return { ok: false, status: res.status, body: body.slice(0, 200) };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e.name === 'AbortError' ? '请求超时' : e.message };
  }
}

(async () => {
  const arg = process.argv[2];
  console.log('\n══════ AI Key 配置 ══════\n');

  // ① 写入模式
  if (arg && arg !== '--test') {
    const key = arg.trim();
    if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(key)) {
      console.log('✗ Key 格式不对：应以 sk- 开头，后面至少 16 位字符');
      console.log('  你填的是：' + mask(key));
      process.exit(1);
    }
    if (/\.env\.example/i.test(process.argv[1] || '')) {
      console.log('✗ 异常：请勿把密钥写入 .env.example');
      process.exit(1);
    }
    writeEnvKey(key);
    console.log('✓ 已写入：backend/.env  →  DEEPSEEK_API_KEY=' + mask(key));
    console.log('  （该文件已被 .gitignore 忽略，不会被提交：' + (isIgnored() ? '是' : '⚠️ 否，请检查 .gitignore') + '）');
    console.log('\n正在实测这个 Key 能不能用…');
    const r = await testKey(key);
    if (r.ok) {
      console.log('✓ 实测通过！AI 返回：' + JSON.stringify(r.reply));
      console.log('\n下一步：');
      console.log('  1) 重启服务让配置生效：cd backend && npm start（或 npm run share）');
      console.log('  2) 若已部署到云端，别忘了在平台控制台也加同名环境变量 DEEPSEEK_API_KEY');
      console.log('     （腾讯云云托管：服务 → 环境变量 → 新增 → 然后重新发布版本）');
    } else {
      console.log('✗ 实测失败：' + (r.status ? 'HTTP ' + r.status : r.error));
      if (r.body) console.log('  服务端返回：' + r.body);
      if (r.status === 401) console.log('  → 这个 Key 无效或已被删除，请到 https://platform.deepseek.com/api_keys 重新生成');
      process.exit(1);
    }
    console.log('');
    return;
  }

  // ② 查看 / 实测模式
  const cur = readEnvKey();
  console.log('配置位置：' + ENV);
  console.log('当前 Key ：' + mask(cur));
  console.log('文件存在 ：' + (fs.existsSync(ENV) ? '是' : '否（可从 .env.example 复制）'));
  console.log('已被忽略 ：' + (isIgnored() ? '是（安全，不会被提交）' : '⚠️ 否'));
  if (!cur) {
    console.log('\n还未配置。写入方式：\n  cd backend\n  npm run set-key -- sk-你的新密钥\n');
    return;
  }
  console.log('\n正在实测当前 Key…');
  const r = await testKey(cur);
  if (r.ok) {
    console.log('✓ 可用，AI 返回：' + JSON.stringify(r.reply));
    console.log('  服务运行中时，打开 /api/ai/status 应看到 "configured": true');
  } else {
    console.log('✗ 不可用：' + (r.status ? 'HTTP ' + r.status : r.error));
    if (r.body) console.log('  服务端返回：' + r.body);
    console.log('  → 请到 https://platform.deepseek.com/api_keys 重新生成后执行：');
    console.log('     npm run set-key -- sk-新密钥');
  }
  console.log('');
})();
