// relay/check.mjs —— 开工自查工具（协作协议 v3 落地脚本）
//
// 用法：
//   node relay/check.mjs workbuddy          # 列出我未读的信 + 当前租约（开工前跑）
//   node relay/check.mjs workbuddy ack <文件名>   # 读完某封信后签收
//
// v3 变更（msg-lead-0013 / msg-wb-0014）：
//   1. 信箱永远定位到【主目录】——无论本脚本从哪个 worktree 里跑，
//      都向上逐级找 ".git 是文件夹" 的那一层（worktree 里 .git 是文件）。
//   2. 租约从单一 claims.md 改为一 claim 一文件：inbox/claims/<谁>-<时间戳>.md
//      （创建是原子操作，两人同时登记不再互相覆盖）；旧 claims.md 继续兼容读取。

import fs from "node:fs";
import path from "node:path";

// ---- 定位主目录：向上爬，直到某层的 .git 是一个目录 ----
function findMainRoot(start) {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    const git = path.join(dir, ".git");
    if (fs.existsSync(git) && fs.statSync(git).isDirectory()) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return start; // 找不到就退回原逻辑
}

const MAIN_ROOT = findMainRoot(path.resolve(import.meta.dirname, ".."));
const INBOX = path.join(MAIN_ROOT, "inbox");
const READLOG = path.join(INBOX, "READLOG.md");
const CLAIMS_DIR = path.join(INBOX, "claims");

const who = process.argv[2];
const action = process.argv[3]; // "ack" 可选
const ackFile = process.argv[4];

if (!who || !["workbuddy", "lead", "lead-proxy", "user"].includes(who)) {
  console.log("用法: node relay/check.mjs <workbuddy|lead|lead-proxy|user> [ack <信件文件名>]");
  process.exit(1);
}

// ---- 签收模式：追加一行到 READLOG ----
if (action === "ack") {
  if (!ackFile || !fs.existsSync(path.join(INBOX, ackFile))) {
    console.log(`找不到信件: ${ackFile}`);
    process.exit(1);
  }
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  fs.appendFileSync(READLOG, `${stamp} | ${who} | 已读 ${ackFile}\n`);
  console.log(`✅ 已签收: ${ackFile}`);
  process.exit(0);
}

// ---- 自查模式：列出未读信 + 活跃租约 ----
const readLog = fs.existsSync(READLOG)
  ? fs.readFileSync(READLOG, "utf8").split("\n").filter(Boolean)
  : [];
const readByMe = new Set(
  readLog.filter(l => l.includes(`| ${who} | 已读`)).map(l => l.split("| 已读 ")[1]?.trim().split(/[\s（]/)[0])
);

const letters = fs.readdirSync(INBOX).filter(f => f.startsWith(`to-${who}-from-`) && f.endsWith(".md"));
const unread = letters.filter(f => !readByMe.has(f));

console.log(`\n📬 ${who} 的开工自查（${new Date().toISOString().slice(0, 16)}）`);
console.log(`🏠 主目录（信箱所在地）: ${MAIN_ROOT}\n`);

console.log(`── 未读信件（${unread.length} 封，读完请 ack 签收）──`);
if (unread.length === 0) console.log("  （无，信箱已清空）");
unread.forEach(f => console.log(`  📩 ${f}`));

// ---- 租约：兼容旧 claims.md + 新 claims/ 目录 ----
console.log(`\n── 当前租约（近 1 小时内登记，最后一条为准）──`);
const claimLines = [];

const legacy = path.join(INBOX, "claims.md");
if (fs.existsSync(legacy)) {
  fs.readFileSync(legacy, "utf8").split("\n")
    .filter(l => /^\d{4}-/.test(l.trim()))
    .forEach(l => claimLines.push(l));
}
if (fs.existsSync(CLAIMS_DIR)) {
  for (const f of fs.readdirSync(CLAIMS_DIR).filter(f => f.endsWith(".md"))) {
    fs.readFileSync(path.join(CLAIMS_DIR, f), "utf8").split("\n")
      .filter(l => /^\d{4}-/.test(l.trim()))
      .forEach(l => claimLines.push(l));
  }
}

const now = Date.now();
const active = claimLines.filter(l => {
  const t = new Date(l.split("|")[0].trim().replace(" ", "T")).getTime();
  return now - t < 60 * 60 * 1000;
});
if (active.length === 0) console.log("  （无活跃租约，但动文件前仍需登记）");
active.forEach(l => console.log(`  🔒 ${l.trim()}`));

console.log(`\n── 开工四步（协议 v3，缺一不可）──`);
console.log(`  0. git rev-parse --abbrev-ref HEAD + pwd，确认自己在哪个分支哪个目录`);
console.log(`  1. 本脚本确认未读信 + 租约     2. 读 TASKS.md 认领/更新状态`);
console.log(`  3. 动文件前在 inbox/claims/ 新建一文件登记  4. 收工留信（含 needs: 行）+ ack`);
console.log();
