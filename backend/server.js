// ============================================================
// backend/server.js —— T1：HTTP 服务 + /api/chat + SSE 流式
// 零依赖：只用 Node 原生模块（http / fs / path）。
// 契约（README 第 3 节，不可单方面改）：
//   前端 → 后端：POST /api/chat，body: { "messages": [ { role, content }, ... ] }
//   后端 → 前端：SSE，每条 data: {"delta": "增量文字"} + 空行，结束 data: [DONE]
// 运行：node --env-file=.env server.js  （默认端口 3000）
// 教学版说明：多轮记忆由前端维护完整 messages 数组随每次请求带来，
// 后端保持无状态（重启不丢对话，因为对话本来就不存在后端）。
// ============================================================

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- 配置（.env 提供，与 step1/step2 同一套变量名）----
const API_KEY = process.env.API_KEY;
const BASE_URL = (process.env.BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const MODEL = process.env.MODEL || "deepseek-chat";
const PORT = process.env.PORT || 3000;
if (!API_KEY) {
  console.error("❌ 没找到 API_KEY，请确认用 --env-file=.env 启动");
  process.exit(1);
}

// ---- 小工具 ----
// CORS 头（教学项目用 *；生产环境应收窄到具体 origin——lead 审查 B1/S2）
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
};
function sseWrite(res, obj) {
  // SSE 协议要求：每条消息以 "data: " 开头、以两个换行结尾（前端按 \n\n 切块）
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}
function sseError(res, message) {
  // 错误也走 SSE 通道（lead 审查建议第 4 条），别让前端干等到超时
  sseWrite(res, { delta: `\n[出错] ${message}` });
  res.write("data: [DONE]\n\n");
  res.end();
}

// ---- 核心：把 messages 数组转发给 DeepSeek，流式转发给前端 ----
async function handleChat(req, res) {
  // 1. 读请求体（POST body 是分段到达的，要攒起来；B4：设 200KB 上限防内存打爆）
  const MAX_BODY = 200 * 1024;
  let body = "";
  let size = 0;
  req.on("data", chunk => {
    if (res.headersSent) return;          // 413 已发出后，忽略后续数据
    size += chunk.length;
    if (size > MAX_BODY) {
      res.writeHead(413, { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: "请求体过大（上限 200KB）" }));
      req.destroy();
      return;
    }
    body += chunk;
  });
  req.on("end", async () => {
    if (res.headersSent) return;          // B4：413 之后不再往下走
    // 顶层兜底（lead msg-0007 §4-③）：writeHead(200) 之后任何意外都不能变成
    // unhandled rejection（Node 26 会直接退出进程），全部转到 sseError 通道
    try {
    // 2. 校验输入（lead 审查建议第 2 条：脏数据直接 400，不转给 DeepSeek）
    let messages;
    try {
      messages = JSON.parse(body).messages;
    } catch {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: "请求体不是合法 JSON" }));
      return;
    }
    const valid = Array.isArray(messages) && messages.length > 0 &&
      messages.every(m => m && typeof m.role === "string" && typeof m.content === "string");
    if (!valid) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: "messages 必须是非空数组，每项含 role 和 content 字符串" }));
      return;
    }

    // 3. 置 SSE 响应头（lead 审查建议第 1 条，三条都不能少）
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      ...CORS_HEADERS,
    });
    res.flushHeaders();                     // B2：立刻把头发出去，否则打字机效果退化成一次性返回

    // B5：SSE 心跳。SSE 标准允许注释行（":" 开头），前端解析器会自动忽略；
    // 每 15 秒发一次防止中间代理/浏览器扩展在无数据期断连
    res.write(": connected\n\n");
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(": ping\n\n");
    }, 15000);

    // 4. 向 DeepSeek 发起流式请求（结构同 step1/step2，多加了 stream:true）
    // S1：30 秒超时只约束"拿到响应头"，拿到后立即清除——长回答的流式传输不受影响
    const upstreamController = new AbortController();
    const upstreamTimer = setTimeout(() => upstreamController.abort(), 30000);
    let upstream;
    try {
      upstream = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ model: MODEL, messages, stream: true }),
        signal: upstreamController.signal,
      });
    } catch (err) {
      clearTimeout(upstreamTimer);
      sseError(res, err.name === "AbortError"
        ? "大模型服务 30 秒无响应，已超时中断"
        : `无法连接大模型服务：${err.message}`);
      return;
    }
    clearTimeout(upstreamTimer);
    if (!upstream.ok) {
      const status = upstream.status;
      const hint = status === 401 ? "密钥无效" : status === 402 ? "余额不足，去 platform.deepseek.com 充值" : status === 429 ? "请求太快被限流" : `HTTP ${status}`;
      sseError(res, `大模型服务返回错误：${hint}`);
      return;
    }

    // 5. 读上游字节流 → 解析 → 转发给前端（复用 step2 学的"水管读头"模式）
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let clientClosed = false;
    // B3+S3：客户端断开时取消上游读取（白烧 token 防线）；
    // writableEnded 判断避免正常结束后做无意义的 cancel（lead S3）
    res.on("close", () => {
      if (!res.writableEnded) {
        clientClosed = true;
        clearInterval(heartbeat);          // B5：断开就停心跳
      }
    });

    try {
      while (true) {
        if (clientClosed) {
          clearInterval(heartbeat);
          reader.cancel().catch(() => {});   // B3：cancel 返回 Promise，挂 catch 防 unhandled rejection
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // DeepSeek 的 SSE 和我们发给前端的是同一种格式：按空行切块
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              clearInterval(heartbeat);      // B5：收尾停心跳
              try { await reader.cancel(); } catch {}   // B3：释放上游连接，防 fd 泄漏
              res.write("data: [DONE]\n\n");   // 向前端发出结束标记
              res.end();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const piece = json.choices?.[0]?.delta?.content;
              if (piece) sseWrite(res, { delta: piece });  // 增量转发
            } catch { /* 半截 JSON 已由缓冲区机制兜住，这里兜其余异常 */ }
          }
        }
      }
      // 上游流正常读完但没发 [DONE]（罕见），也要给前端收尾
      clearInterval(heartbeat);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      clearInterval(heartbeat);
      sseError(res, `流式传输中断：${err.message}`);
    }

    // ---- 以上是流式处理的内层 try/catch；下面是整个请求的外层兜底 ----
    } catch (err) {
      // 顶层兜底：还没发头就用 500 JSON，发了头就走 SSE 错误通道
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS });
        res.end(JSON.stringify({ error: `服务器内部错误：${err.message}` }));
      } else {
        try { sseError(res, `服务器内部错误：${err.message}`); } catch { /* res 已死，放弃 */ }
      }
    }
  });
}

// ---- 静态文件：把 frontend/ 挂在根路径，让浏览器直接打开页面 ----
function serveStatic(req, res) {
  // 只允许白名单文件，防路径穿越（用户在 URL 里写 ../ 也拿不到目录外文件）
  const whitelist = { "/": "index.html", "/index.html": "index.html" };
  const file = whitelist[req.url.split("?")[0]];
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }
  const filePath = path.join(__dirname, "..", "frontend", file);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("前端文件缺失：frontend/index.html");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(data);
  });
}

// ---- 路由分发 ----
const server = http.createServer((req, res) => {
  // B1：CORS 预检。浏览器在跨源 POST JSON 前会先发 OPTIONS 探路，不接就会 405 被拦
  if (req.method === "OPTIONS" && req.url === "/api/chat") {
    res.writeHead(204, {
      ...CORS_HEADERS,
      "Access-Control-Max-Age": "86400",   // 让浏览器缓存预检结果，24h 内不再探
    });
    res.end();
    return;
  }
  if (req.method === "POST" && req.url === "/api/chat") {
    handleChat(req, res);
  } else if (req.method === "GET" && req.url.split("?")[0] === "/favicon.ico") {
    res.writeHead(204);                    // N1：浏览器会自动要图标，静默给空响应
    res.end();
  } else if (req.method === "GET") {
    serveStatic(req, res);
  } else {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
  }
});

server.listen(PORT, () => {
  console.log(`✅ 服务已启动：http://localhost:${PORT}`);
  console.log(`   模型：${MODEL} @ ${BASE_URL}`);
  console.log(`   按 Ctrl+C 停止`);
});
