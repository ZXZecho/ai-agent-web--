// ============================================================
// 阶段 2：流式输出 —— 让回答像打字机一样一个字一个字出现
// 运行：node --env-file=.env step2-stream.js
// 与阶段1的唯一区别：请求里加 stream: true，响应改为"边收边打印"
// ============================================================

// ---- 第 1 段：读取配置（和阶段1完全一样）----
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.MODEL || "deepseek-chat";

if (!API_KEY) {
  console.error("❌ 没找到 API_KEY，请在 .env 文件里填写后重试");
  process.exit(1);
}

// ---- 第 2 段：发起流式请求 ----
async function askStream(question) {
  const startTime = Date.now();      // 记下开始时间，用来算"多久看到第一个字"

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "你是一个中文助手，回答简洁，控制在100字内。" },
        { role: "user", content: question },
      ],
      stream: true,                  // ★ 关键开关：true = 不要一次性给我整段，要一段一段流式返回
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`请求失败 ${response.status}: ${errText}`);
  }

  // ---- 第 3 段：读流（这是阶段2 全新的部分）----
  const reader = response.body.getReader();      // 拿到一个"水管读头"，可以一段一段地读
  const decoder = new TextDecoder("utf-8");      // 网络传的是字节（0和1），要把它翻译成文字
  let buffer = "";                               // 缓冲区：存放"还没凑成完整一行"的残片
  let full = "";                                 // 完整答案，边收边拼
  let firstChunkTime = 0;                        // 第一个字到达的时间戳

  while (true) {
    const { done, value } = await reader.read(); // 读一小段，value 是字节，done 表示流是否结束
    if (done) break;                             // 读完了就退出循环

    if (!firstChunkTime) firstChunkTime = Date.now();

    buffer += decoder.decode(value, { stream: true });  // 字节转文字，拼到缓冲区

    const lines = buffer.split("\n");            // SSE 协议规定：每条消息以换行分隔
    buffer = lines.pop();                        // 最后一段可能不完整，留在缓冲区等下一轮

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;   // 空行、注释行直接跳过
      const payload = trimmed.slice(5).trim();      // 去掉前缀 "data:"，剩下的才是 JSON
      if (payload === "[DONE]") continue;           // 官方约定的结束标记

      try {
        const json = JSON.parse(payload);
        const piece = json.choices?.[0]?.delta?.content;   // delta = "增量"，这次只多出来的那几个字
        if (piece) {
          process.stdout.write(piece);             // write 不带换行，所以字会连成一片
          full += piece;
        }
      } catch {
        // 偶尔收到不完整片段，忽略即可，下一轮会补齐
      }
    }
  }

  const totalTime = Date.now() - startTime;
  console.log("\n");                             // 补一个换行，别让下一步提示挤在答案后面
  console.log(`—— 首字延迟 ${firstChunkTime - startTime} ms，总耗时 ${totalTime} ms，共 ${full.length} 字`);
  return full;
}

// ---- 第 4 段：调用 + 打印 ----
console.log("问：用三句话解释什么是流式输出\n答：");
await askStream("用三句话解释什么是流式输出");
