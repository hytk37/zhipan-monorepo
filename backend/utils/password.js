/**
 * 密码哈希与校验（零依赖，使用 Node 内置 crypto.scrypt）
 *
 * 为什么不用 bcrypt：bcrypt 是原生扩展，Windows 上需要编译工具链，
 * 会显著抬高部署门槛；scrypt 是 Node 内置的、同样抗暴力破解的 KDF
 * （内存硬 + 可调参数），对本项目的安全等级完全够用。
 *
 * 存储格式：scrypt$N$r$p$<saltHex>$<hashHex>
 *   N  CPU/内存代价（2^14 = 16384）
 *   r  块大小（8）   p  并行度（1）
 * 参数写进哈希串里，将来调参不会让旧密码失效。
 *
 * 替换现有问题：当前 auth.js 里是明文 'admin123' / '123456' 与固定 token。
 */
const crypto = require('crypto');

const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;

// scrypt 的 maxmem 默认 32MB，N=16384, r=8 需要约 128*N*r = 16MB，留出余量
const MAX_MEM = 64 * 1024 * 1024;

/** 生成密码哈希 */
function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('密码不能为空');
  }
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(plain, salt, KEY_LEN, { N: N, r: R, p: P, maxmem: MAX_MEM });
  return ['scrypt', N, R, P, salt.toString('hex'), hash.toString('hex')].join('$');
}

/** 校验密码（时序安全比较） */
function verifyPassword(plain, stored) {
  if (!plain || !stored) return false;
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const n = parseInt(parts[1], 10);
  const r = parseInt(parts[2], 10);
  const p = parseInt(parts[3], 10);
  const salt = Buffer.from(parts[4], 'hex');
  const expected = Buffer.from(parts[5], 'hex');

  let actual;
  try {
    actual = crypto.scryptSync(plain, salt, expected.length, {
      N: n,
      r: r,
      p: p,
      maxmem: MAX_MEM,
    });
  } catch (e) {
    return false;
  }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
