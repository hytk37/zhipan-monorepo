// ============================================
// 智慧膳系统 · DeepSeek 客户端
// ============================================
// 职责：超时、重试、并发闸门、JSON 输出模式、token 计费日志、
//       失败可识别（调用方据此降级到规则模板）。
// 不负责业务：prompt 在 prompts.js，编排在 weekHealth.js / coach.js

const { config, isConfigured } = require('../../config/deepseek');

// ─── 计费与用量日志（内存，保留最近 500 条）───────
const usageLog = [];
const usageToday = { date: '', promptTokens: 0, cachedTokens: 0, completionTokens: 0, calls: 0, failed: 0 };

function todayKey() {
  const d = new Date(Date.now() + 8 * 3600 * 1000); // 北京时间
  return d.toISOString().slice(0, 10);
}

function recordUsage(entry) {
  const k = todayKey();
  if (usageToday.date !== k) {
    usageToday.date = k;
    usageToday.promptTokens = 0;
    usageToday.cachedTokens = 0;
    usageToday.completionTokens = 0;
    usageToday.calls = 0;
    usageToday.failed = 0;
  }
  usageToday.calls++;
  usageToday.promptTokens += entry.promptTokens || 0;
  usageToday.cachedTokens += entry.cachedTokens || 0;
  usageToday.completionTokens += entry.completionTokens || 0;
  if (!entry.ok) usageToday.failed++;

  usageLog.unshift({ time: new Date().toISOString(), ...entry });
  if (usageLog.length > 500) usageLog.length = 500;
}

function getUsage() {
  const k = todayKey();
  if (usageToday.date !== k) return { date: k, calls: 0, promptTokens: 0, cachedTokens: 0, completionTokens: 0, failed: 0 };
  return { ...usageToday };
}

function getRecentLog(limit) {
  return usageLog.slice(0, limit || 20);
}

/** 今日 token 是否已超预算 */
function overBudget() {
  const u = getUsage();
  return (u.promptTokens + u.completionTokens) >= config.dailyTokenBudget;
}

// ─── 并发闸门 ──────────────────────────────────
let running = 0;
const queue = [];

function acquire() {
  if (running < config.maxConcurrency) {
    running++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function release() {
  running--;
  const next = queue.shift();
  if (next) { running++; next(); }
}

// ─── 单次请求 ──────────────────────────────────
/**
 * 调用 DeepSeek Chat Completions
 * @param {object} opts
 * @param {string} opts.model        模型名（默认 flash）
 * @param {Array}  opts.messages     消息数组
 * @param {boolean} [opts.json]      是否要求 JSON 输出
 * @param {boolean} [opts.thinking]  是否开启思考模式
 * @param {'low'|'high'|'max'} [opts.effort] 思考强度
 * @param {number} [opts.maxTokens]
 * @param {string} [opts.tag]        业务标签（用于日志）
 * @returns {Promise<{ok:boolean, content?:string, reasoning?:string, error?:string, usage?:object, model?:string, ms?:number}>}
 */
async function chat(opts) {
  const tag = opts.tag || 'generic';
  if (!isConfigured()) {
    recordUsage({ tag, ok: false, error: 'not_configured' });
    return { ok: false, error: 'not_configured' };
  }
  if (overBudget()) {
    recordUsage({ tag, ok: false, error: 'over_budget' });
    return { ok: false, error: 'over_budget' };
  }

  const body = {
    model: opts.model || config.models.flash,
    messages: opts.messages,
    stream: false,
  };
  if (opts.json) body.response_format = { type: 'json_object' };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.thinking) {
    // 直接用 fetch 发 JSON 时，thinking / reasoning_effort 是顶层字段
    body.thinking = { type: 'enabled' };
    body.reasoning_effort = opts.effort || 'high';
  } else {
    body.thinking = { type: 'disabled' };
  }
  // 注意：思考模式下 temperature/penalty 不生效，这里只在非思考模式设置
  if (!opts.thinking && typeof opts.temperature === 'number') {
    body.temperature = opts.temperature;
  }

  await acquire();
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.timeoutMs);
    const res = await fetch(config.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + config.apiKey,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const ms = Date.now() - t0;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      recordUsage({ tag, model: body.model, ok: false, ms, error: 'HTTP ' + res.status });
      return { ok: false, error: 'HTTP ' + res.status + ' ' + text.slice(0, 200), ms };
    }

    const data = await res.json();
    const msg = (data.choices && data.choices[0] && data.choices[0].message) || {};
    const usage = data.usage || {};
    recordUsage({
      tag, model: body.model, ok: true, ms,
      promptTokens: usage.prompt_tokens || 0,
      cachedTokens: (usage.prompt_cache_hit_tokens || usage.cached_tokens || 0),
      completionTokens: usage.completion_tokens || 0,
    });
    return {
      ok: true,
      content: msg.content || '',
      reasoning: msg.reasoning_content || '',
      usage, model: body.model, ms,
    };
  } catch (e) {
    const ms = Date.now() - t0;
    const err = e.name === 'AbortError' ? 'timeout' : (e.message || 'unknown');
    recordUsage({ tag, model: body.model, ok: false, ms, error: err });
    return { ok: false, error: err, ms };
  } finally {
    release();
  }
}

/** 带重试的调用（默认重试 1 次，网络类错误才重试） */
async function chatWithRetry(opts) {
  let last = await chat(opts);
  let tries = 0;
  while (!last.ok && tries < config.maxRetries
    && /timeout|fetch|ECONN|socket|HTTP 5/.test(String(last.error))) {
    tries++;
    last = await chat(opts);
  }
  return last;
}

/** 解析 JSON（容错：剥离 ```json 包裹） */
function parseJson(text) {
  if (!text) return null;
  let s = String(text).trim();
  if (s.indexOf('```') >= 0) {
    s = s.replace(/```json/gi, '').replace(/```/g, '').trim();
  }
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i > 0 || (j >= 0 && j < s.length - 1)) s = s.slice(i >= 0 ? i : 0, j >= 0 ? j + 1 : s.length);
  try { return JSON.parse(s); } catch (e) { return null; }
}

module.exports = { chat, chatWithRetry, parseJson, getUsage, getRecentLog, overBudget };
