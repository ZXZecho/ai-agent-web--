// ============================================================
// relay/orchestrator.mjs —— AI 协作中转器（"全自动传话人"）
// 原理：lead 跑在 DeepSeek 上，所以我们用 DeepSeek API 直接和它的大脑对话。
// 流程：扫 inbox/ 里发给 lead 的新信 → 连同项目上下文发给 API →
//       把回复存成信件；如果回复里有 ```file:路径 代码块 → 自动落盘到允许的目录
// 运行：node --env-file=E:/AI/ai-agent/.env relay/orchestrator.mjs
//       （密钥始终留在原项目 .env 里，绝不复制进本仓库）
// 也可以问我一句话：node --env-file=E:/AI/ai-agent/.env relay/orchestrator.mjs --ask "问题"
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WS = path.resolve(__dirname, "..");          // 工作区根目录
const INBOX = path.join(WS, "inbox");
const STATE_FILE = path.join(__dirname, "state.json");

// ---- 配置（来自 .env，DeepSeek）----
const API_KEY = process.env.API_KEY;
const BASE_URL = (process.env.BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const MODEL = process.env.MODEL || "deepseek-chat";
if (!API_KEY) { console.error("❌ 没找到 API_KEY，请用 --env-file 指向含密钥的 .env"); process.exit(1); }

// ---- 安全护栏：API 产出的文件只能落在这个目录（msg-0006 用户裁决：收窄，frontend/ 已移除）----
const ALLOWED_DIRS = ["ai-sandbox/lead-proxy/"];

// ---- 工具函数 ----
const state = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
  : { processedLetters: [], rounds: 0 };

function saveState() { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

function listLetters() {
  return fs.readdirSync(INBOX)
    .filter(f => f.endsWith(".md"))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(INBOX, f)).mtimeMs }))
    .sort((a, b) => a.mtime - b.mtime);            // 按时间排序 = 对话顺序
}

// ---- 组装系统提示词：把"lead 的人设 + 项目契约 + 纪律"一次性交给它 ----
function systemPrompt() {
  return `你是 lead-proxy——真实 lead（DSH 会话）的**草稿机**，由 relay 脚本经 DeepSeek API 代跑。
你与真实 lead 共享同一个模型大脑，但**身份和权限完全不同**，这是用户定下的裁决，必须严格遵守：

## 身份铁律（违反即冒名，已发生过一次事故）
1. 你的署名永远是 **lead-proxy（relay 代跑）**，绝不能写"lead"、"真实 DSH 会话"等字样
2. 你的产出只是**草稿/建议**，不构成审查结论——不能写"审查通过/验收通过/阻塞必须修"等裁决性用语，
   只能写"草稿意见：建议……"
3. 正式审查由真实 lead（DSH 会话）负责，你的草稿仅供它参考

## 项目契约（不得更改）
- 前端 → 后端：POST http://localhost:3000/api/chat，请求体 { "messages": [ { "role": "user", "content": "..." } ] }
- 后端 → 前端：SSE 流式返回，每条 data: {"delta": "增量文字"}，结束标记 data: [DONE]
- 技术栈：后端 Node.js 原生 http（无框架）；前端单文件 index.html（纯 HTML+CSS+JS，无框架无构建）
- 大模型：DeepSeek deepseek-chat，密钥只在后端 .env，前端绝不出现任何密钥

## 分工现状
- WorkBuddy：后端 server.js + 架构 + 最终验收
- 真实 lead（DSH 会话）：前端 index.html + 交叉审查
- 你 lead-proxy：只出草稿，落盘白名单只有 ai-sandbox/lead-proxy/

## 你的输出纪律（非常重要）
1. 每次回复 = 一份草稿，Markdown 格式，开头带元数据块：
   # 草稿标题
   - **from**：lead-proxy（relay 代跑）
   - **to**：WorkBuddy / 真实lead
   - **type**：草稿建议
2. 建议交付的代码文件用这种格式（会自动落盘到 ai-sandbox/lead-proxy/）：
   \`\`\`file:ai-sandbox/lead-proxy/文件名
   <完整文件内容>
   \`\`\`
3. 简洁：回答问题不超过 300 字；代码除外。不寒暄，直接干货。
4. 遵守安全协议：不把密钥写进前端或文档；不提议删除文件、force push。`;
}

// ---- 调 DeepSeek API（复用项目里学的请求格式）----
async function callLLM(system, userContent) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      max_tokens: 8000,
    }),
  });
  if (!response.ok) {
    throw new Error(`API 请求失败 ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// ---- 从回复里提取 file: 代码块并落盘（带护栏）----
function extractAndWriteFiles(reply) {
  const written = [];
  const re = /```file:([^\n]+)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(reply)) !== null) {
    const rawPath = m[1].trim();
    const content = m[2];
    const normalized = path.normalize(rawPath).replace(/\\/g, "/");
    // 护栏 1：只允许白名单目录
    if (!ALLOWED_DIRS.some(d => normalized.startsWith(d))) {
      console.warn(`⚠️ 拒绝写盘（不在白名单）：${rawPath}`);
      continue;
    }
    // 护栏 2：防目录穿越（../ 逃逸）
    const abs = path.resolve(WS, normalized);
    if (!abs.startsWith(path.resolve(WS))) {
      console.warn(`⚠️ 拒绝写盘（路径逃逸）：${rawPath}`);
      continue;
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
    written.push(normalized);
    console.log(`📄 已落盘：${normalized}（${content.length} 字符）`);
  }
  return written;
}

// ---- 主流程 ----
async function main() {
  const askArg = process.argv.indexOf("--ask");
  // --ask 模式：先替用户写一封信，再跑一轮
  if (askArg > -1) {
    const question = process.argv[askArg + 1] || "（空消息）";
    const fname = `to-lead-from-workbuddy-adhoc-${Date.now()}.md`;
    fs.writeFileSync(path.join(INBOX, fname), `# 临时询问\n\n${question}\n`, "utf8");
    console.log(`✉️ 已写入询问信：${fname}`);
  }

  const letters = listLetters();
  // 找出还没处理过的、发给 lead 的信
  const pending = letters.filter(l =>
    l.name.startsWith("to-lead-from-workbuddy") && !state.processedLetters.includes(l.name)
  );
  if (pending.length === 0) {
    console.log("收件箱里没有等 lead 处理的新信，本轮无事可做。");
    return;
  }
  console.log(`📬 发现 ${pending.length} 封新信：${pending.map(p => p.name).join(", ")}`);

  // 把最近的信件历史都给它（它没见过这个对话，全靠信件了解上下文）
  const recent = letters.slice(-12); // 最多带最近 12 封，控制 token
  const history = recent
    .map(l => `===== 信件文件：${l.name} =====\n${fs.readFileSync(path.join(INBOX, l.name), "utf8")}`)
    .join("\n\n");

  const repoTree = ["README.md 摘要见信件历史", "backend/: step1-hello.js, step2-answer.js, step2-stream.js(用户手写、进行中), package.json", "frontend/: 空（等你交付）"].join("\n");

  const reply = await callLLM(
    systemPrompt(),
    `以下是收件箱里的最近信件（按时间顺序），最后几封是发给你（lead）的，请阅读并回复最新待办。\n\n## 仓库现状\n${repoTree}\n\n${history}`
  );

  // 回信落盘（msg-0006 整改：署名 lead-proxy；文件名用时间戳防两个进程撞名）
  const stamp = new Date().toISOString().slice(0, 10);
  state.rounds += 1;
  const replyName = `to-workbuddy-from-lead-proxy-${stamp}-${Date.now()}.md`;
  const written = extractAndWriteFiles(reply);
  const postscript = [
    written.length ? `\n\n---\n*relay 已自动落盘 ${written.length} 个文件：${written.join(", ")}*` : "",
    `\n> ⚠️ 本信由 lead-proxy 自动生成，不构成 lead 的审查意见。`,
  ].join("");
  fs.writeFileSync(path.join(INBOX, replyName), reply + postscript, "utf8");
  console.log(`✅ lead-proxy 的草稿已写入：${replyName}`);

  // 标记已处理
  for (const p of pending) state.processedLetters.push(p.name);
  saveState();
}

main().catch(err => { console.error("❌ relay 出错：", err.message); process.exit(1); });
