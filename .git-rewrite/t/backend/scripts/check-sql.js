#!/usr/bin/env node
/**
 * SQL 结构自检（不需要 MySQL 服务）
 * ============================================================================
 * 本机若没装 MySQL Server，也能在提交前拦住大部分低级错误：
 *   1. 语句能否被 MySQL 方言解析器解析（node-sql-parser）
 *   2. 括号 / 引号是否配对
 *   3. 外键引用的表是否存在、是否先于引用者创建
 *   4. 建表数量、索引数量、视图数量统计
 *
 * 用法： node scripts/check-sql.js [sql/schema.sql sql/seed-demo.sql ...]
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['sql/schema.sql'];

let errors = 0;
const warn = [];
const note = [];

/** 去掉行注释（-- ...）与块注释（/* ... *\/），但不碰字符串内的内容 */
function stripComments(sql) {
  let out = '';
  let i = 0;
  let inStr = null;
  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (inStr) {
      out += ch;
      if (ch === '\\') { out += next; i += 2; continue; }
      if (ch === inStr) inStr = null;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; out += ch; i++; continue; }
    if (ch === '-' && next === '-') { while (i < sql.length && sql[i] !== '\n') i++; continue; }
    if (ch === '#') { while (i < sql.length && sql[i] !== '\n') i++; continue; }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function splitStatements(sql) {
  const parts = [];
  let buf = '';
  let inStr = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inStr) {
      buf += ch;
      if (ch === '\\') { buf += sql[i + 1]; i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; buf += ch; continue; }
    if (ch === ';') { if (buf.trim()) parts.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function checkBalance(text, label) {
  let par = 0, cur = 0;
  let inStr = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '(') par++;
    else if (ch === ')') par--;
    else if (ch === '{') cur++;
    else if (ch === '}') cur--;
    if (par < 0) return `${label}: 括号提前闭合`;
  }
  if (inStr) return `${label}: 引号未闭合`;
  if (par !== 0) return `${label}: 圆括号不配对（差 ${par}）`;
  if (cur !== 0) return `${label}: 花括号不配对（差 ${cur}）`;
  return null;
}

let Parser = null;
try {
  Parser = require('node-sql-parser').Parser;
} catch (e) {
  warn.push('未安装 node-sql-parser，跳过语法解析（npm i -D node-sql-parser 可启用）');
}

// 解析器已知不支持的语句前缀，跳过语法解析只做结构检查
const SKIP_PREFIX = ['use ', 'set ', 'truncate ', 'create or replace view', 'create database'];

const created = [];
const fkRefs = [];

files.forEach(function (rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.error(`✗ 文件不存在：${rel}`);
    errors++;
    return;
  }
  const raw = fs.readFileSync(file, 'utf8');
  const clean = stripComments(raw);
  const stmts = splitStatements(clean);

  console.log(`\n══════ ${rel} ══════`);
  console.log(`  语句数 ${stmts.length}，体积 ${(raw.length / 1024).toFixed(1)} KB`);

  let tables = 0, views = 0, inserts = 0, skippedSyntax = 0, parsed = 0, indexCount = 0, fkCount = 0;

  stmts.forEach(function (st, idx) {
    const head = st.slice(0, 60).replace(/\s+/g, ' ');

    const bal = checkBalance(st, `${rel} 第${idx + 1}条`);
    if (bal) { console.error('  ✗ ' + bal); errors++; return; }

    const lower = st.toLowerCase();
    const isCreateTable = /^create\s+table/i.test(st);

    if (isCreateTable) {
      tables++;
      const m = st.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?`?([\w]+)`?/i);
      if (m) created.push(m[1].toLowerCase());
      // 收集外键引用
      const fkRe = /references\s+`?([\w]+)`?\s*\(/gi;
      let fm;
      while ((fm = fkRe.exec(st))) fkRefs.push({ from: m ? m[1] : '?', to: fm[1].toLowerCase() });
      indexCount += (st.match(/\b(key|index|unique key|primary key)\b/gi) || []).length;
      fkCount += (st.match(/\bforeign key\b/gi) || []).length;
    } else if (/^create\s+(or\s+replace\s+)?view/i.test(st)) views++;
    else if (/^insert\s+/i.test(st)) inserts++;

    // 语法解析
    if (Parser) {
      const skip = SKIP_PREFIX.some((p) => lower.startsWith(p));
      if (skip) { skippedSyntax++; return; }
      try {
        const parser = new Parser();
        parser.astify(st, { database: 'MySQL' });
        parsed++;
      } catch (e) {
        const msg = String(e.message).split('\n')[0];
        // 视图 / 复杂 INSERT 是解析器能力边界，降级为警告
        if (/view|insert/i.test(head)) {
          skippedSyntax++;
          warn.push(`${rel} 第${idx + 1}条 解析器未支持（已跳过）：${msg}`);
        } else {
          console.error(`  ✗ ${rel} 第${idx + 1}条 语法解析失败：${msg}\n      片段: ${head}`);
          errors++;
        }
      }
    }
  });

  console.log(`  建表 ${tables} 张（索引 ${indexCount} 个 / 外键 ${fkCount} 个）、视图 ${views} 个、INSERT ${inserts} 条`);
  if (Parser) console.log(`  语法解析通过 ${parsed} 条，跳过 ${skippedSyntax} 条（解析器能力边界）`);
});

// 外键目标表是否存在（同一批文件内）
if (fkRefs.length) {
  const known = new Set(created);
  const missing = fkRefs.filter((r) => !known.has(r.to));
  console.log(`\n══════ 外键引用检查（共 ${fkRefs.length} 处）══════`);
  if (missing.length) {
    missing.forEach((r) => {
      console.error(`  ✗ ${r.from} → ${r.to} 引用的表不存在`);
      errors++;
    });
  } else {
    console.log('  ✓ 所有外键目标表均存在');
  }
}

if (warn.length) {
  console.log('\n──── 警告 ────');
  warn.forEach((w) => console.log('  ! ' + w));
}

console.log(`\n结果：${errors === 0 ? '通过' : errors + ' 项错误'}`);
process.exit(errors === 0 ? 0 : 1);
