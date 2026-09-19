// ============================================
// 智慧膳系统 · 菜品安全规则（确定性硬过滤）
// ============================================
// 设计原则「安全不过模型」：过敏原与饮食禁忌是布尔判断，
// 由本文件用关键词/类别规则决定，AI 无权参与、无权绕过。
// 供 weekMeals（周用餐记录）、AI 推荐、AI 对话候选白名单共用。

// ─── 过敏原关键词 ──────────────────────────────
const ALLERGEN_KEYWORDS = {
  花生: ['花生'],
  虾蟹: ['虾', '蟹', '鱿鱼'],
  海鲜: ['虾', '蟹', '鱿鱼', '鱼', '海参', '贝', '蛤'],
  牛奶: ['牛奶', '芝士', '奶酥', '奶香', '椰奶', '炼乳', '奶酪'],
  鸡蛋: ['蛋', '蛋糕', '吐司', '三明治'],
  芒果: ['芒果'],
  麸质: ['面', '包', '馒头', '花卷', '油条', '饺', '馄饨', '吐司', '三明治',
    '蛋糕', '烧麦', '春卷', '窝窝头', '刀削', '杂酱', '拉面', '米线'],
};

// ─── 饮食禁忌关键词 ────────────────────────────
// 清真：猪及其制品 + 含义不明的肉末/绍子（从严处理，宁可多排除）
const PORK_KEYWORDS = ['猪', '排骨', '肘', '五花', '肥肠', '香肠', '腊肉', '猪脚', '猪扒', '叉烧'];
// 「肉 / 绍子 / 什锦」等含义模糊的，对清真从严排除
const AMBIGUOUS_MEAT = ['肉片', '肉丝', '肉末', '碎肉', '肉丸', '绍子', '卤肉', '回锅肉', '什锦'];
// 素食/蛋奶素：所有动物性食材
const MEAT_KEYWORDS = ['肉', '鸡', '鸭', '鱼', '虾', '蟹', '鱿鱼', '排骨', '肘', '肥肠',
  '猪', '牛', '兔', '翅', '蹄', '绍子', '丸', '香肠', '腊肉'];
// 蛋奶素允许：蛋、奶类
const EGG_DAIRY = ['蛋', '奶', '芝士', '奶酪'];

function hasAny(name, keywords) {
  return keywords.some((k) => name.indexOf(k) >= 0);
}

/**
 * 判断某道菜是否含有指定过敏原
 * @param {string} name 菜名
 * @param {'花生'|'虾蟹'|'海鲜'|'牛奶'|'鸡蛋'|'芒果'|'麸质'} allergen
 * @returns {boolean}
 */
function hasAllergen(name, allergen) {
  const kw = ALLERGEN_KEYWORDS[allergen];
  if (!kw) return false;
  return hasAny(name, kw);
}

/**
 * 禁忌硬过滤：判断某学生在饮食禁忌下能否吃这道菜
 * @param {{name:string, cat?:string}} dish 菜品（cat ∈ 荤菜/素菜/主食/汤品/面食/粥品/小吃/饮品/包点）
 * @param {string} diet 饮食类型：无限制/清真/素食/蛋奶素/无麸质/低敏
 * @returns {{ok:boolean, reason?:string}} ok=false 时给出排除原因
 */
function dietAllows(dish, diet) {
  const name = dish.name || '';
  const cat = dish.cat || '';

  if (diet === '清真') {
    if (hasAny(name, PORK_KEYWORDS)) return { ok: false, reason: '含猪肉类食材，不符合清真饮食' };
    if (hasAny(name, AMBIGUOUS_MEAT)) return { ok: false, reason: '肉源不明确，清真饮食从严排除' };
  }

  if (diet === '素食' || diet === '蛋奶素') {
    if (cat === '荤菜') return { ok: false, reason: '荤菜，不符合' + diet };
    if (hasAny(name, MEAT_KEYWORDS)) return { ok: false, reason: '含动物性食材，不符合' + diet };
    if (diet === '素食' && hasAny(name, EGG_DAIRY)) return { ok: false, reason: '含蛋奶，不符合纯素' };
  }

  if (diet === '无麸质') {
    if (hasAny(name, ALLERGEN_KEYWORDS.麸质)) return { ok: false, reason: '含麸质（小麦制品）' };
  }

  if (diet === '低敏') {
    const hits = ['花生', '虾蟹', '牛奶', '鸡蛋'].filter((a) => hasAllergen(name, a));
    if (hits.length) return { ok: false, reason: '含常见致敏原：' + hits.join('、') };
  }

  return { ok: true };
}

/**
 * 菜品完整安全判定（过敏原 + 饮食禁忌）
 * @param {{name:string, cat?:string}} dish
 * @param {{diet?:string, allergyList?:string[]}} student
 * @returns {{ok:boolean, reason?:string}}
 */
function isSafeForStudent(dish, student) {
  const s = student || {};
  const allergies = s.allergyList || [];
  for (const a of allergies) {
    if (hasAllergen(dish.name, a)) {
      return { ok: false, reason: '含过敏原：' + a };
    }
    // 海鲜过敏同时拦截「虾蟹」类关键词
    if (a === '海鲜' && hasAllergen(dish.name, '虾蟹')) {
      return { ok: false, reason: '含过敏原：海鲜' };
    }
  }
  return dietAllows(dish, s.diet || '无限制');
}

/** 列出某道菜的全部过敏原（用于解释与展示） */
function allergensOf(name) {
  return Object.keys(ALLERGEN_KEYWORDS).filter((a) => hasAllergen(name, a));
}

module.exports = {
  ALLERGEN_KEYWORDS,
  PORK_KEYWORDS,
  MEAT_KEYWORDS,
  hasAllergen,
  allergensOf,
  dietAllows,
  isSafeForStudent,
};
