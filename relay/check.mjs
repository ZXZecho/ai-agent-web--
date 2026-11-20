// relay/check.mjs —— 开工自查工具（msg-wb-0012 协议的落地脚本）
//
// 用法：
//   node relay/check.mjs workbuddy          # 列出我未读的信 + 当前租约（开工前跑）
//   node relay/check.mjs workbuddy ack <文件名>   # 读完某封信后签收
//
// 原理：信件按 to-<收件人>-from-<发件人>-*.md 命名；
//       READLOG.md 记录"谁在何时读了哪封信"，让对方能确认信没白写。
//       这是把"读信"从自觉变成协议的关键：不 ack = 视为没读。

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const INBOX = path.join(ROOT, "inbox");
const READLOG = path.join(INBOX, "READLOG.md");

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
  readLog.filter(l => l.includes(`| ${who} | 已读`)).map(l => l.split("| 已读 ")[1]?.trim())
);

const letters = fs.readdirSync(INBOX).filter(f => f.startsWith(`to-${who}-from-`) && f.endsWith(".md"));
const unread = letters.filter(f => !readByMe.has(f));

console.log(`\n📬 ${who} 的开工自查（${new Date().toISOString().slice(0, 16)}）\n`);

console.log(`── 未读信件（${unread.length} 封，读完请 ack 签收）──`);
if (unread.length === 0) console.log("  （无，信箱已清空）");
unread.forEach(f => console.log(`  📩 ${f}`));

console.log(`\n── 当前租约（近 1 小时内登记的 claims，最后一条为准）──`);
const claims = fs.existsSync(path.join(INBOX, "claims.md"))
  ? fs.readFileSync(path.join(INBOX, "claims.md"), "utf8").split("\n").filter(l => /^\d{4}-/.test(l.trim()))
  : [];
const now = Date.now();
const active = claims.filter(l => {
  const t = new Date(l.split("|")[0].trim().replace(" ", "T")).getTime();
  return now - t < 60 * 60 * 1000;
});
if (active.length === 0) console.log("  （无活跃租约，但 git 操作仍需先登记）");
active.forEach(l => console.log(`  🔒 ${l.trim()}`));

console.log(`\n── 开工四步（缺一不可）──`);
console.log(`  1. 本脚本确认未读信 + 租约     2. 读 TASKS.md 认领/更新状态`);
console.log(`  3. 动文件前先在 claims.md 登记 4. 收工前留信 + ack 本轮读过的信`);
console.log();
