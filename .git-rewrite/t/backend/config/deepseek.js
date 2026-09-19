// ============================================
// 智慧膳系统 · DeepSeek 接入配置
// ============================================
// 依赖：Node 内置 fetch（Node 18+），不新增任何 npm 依赖
// Key 放在 backend/.env（已在 .gitignore 中），未配置时全链路自动降级

require('./env');   // 加载 backend/.env（零依赖手写解析）

const MODELS = {
  // 通用：识别、翻译、文案生成（非思考，可关思考省 token）
  flash: process.env.AI_MODEL_FLASH || 'deepseek-flash',
  // 复杂推理：菜单编排、多约束分析（思考模式）
  pro: process.env.AI_MODEL_PRO || 'deepseek-v4-pro',
};

const config = {
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  models: MODELS,
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS, 10) || 25000,
  maxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 1,
  maxConcurrency: parseInt(process.env.AI_MAX_CONCURRENCY, 10) || 4,
  dailyTokenBudget: parseInt(process.env.AI_DAILY_TOKEN_BUDGET, 10) || 800000,
  // 总开关：AI_ENABLED=false 或无 Key 时，所有 AI 能力走规则模板降级
  enabled: process.env.AI_ENABLED !== 'false',
  mock: process.env.AI_MOCK === 'true',
};

/** 是否具备真实调用条件（总开关开、有 Key、非 mock 模式） */
function isConfigured() {
  return config.enabled && !!config.apiKey && !config.mock;
}

/** 供 /api/ai/status 返回的脱敏信息 */
function describe() {
  return {
    enabled: config.enabled,
    configured: isConfigured(),
    mock: config.mock,
    keyPresent: !!config.apiKey,
    keyMasked: config.apiKey ? config.apiKey.slice(0, 6) + '****' + config.apiKey.slice(-4) : '',
    baseUrl: config.baseUrl,
    models: config.models,
    timeoutMs: config.timeoutMs,
    maxConcurrency: config.maxConcurrency,
    dailyTokenBudget: config.dailyTokenBudget,
  };
}

module.exports = { config, isConfigured, describe, MODELS };
