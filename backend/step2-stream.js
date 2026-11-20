// ============================================================
// 阶段 1：最小闭环 —— 把一句话发给大模型，把它的回复打印出来
// 运行：node --env-file=.env step1-hello.js
// 说明：整个程序只做三件事 —— 组装请求 / 发出去 / 解析回来
// ============================================================

// ---- 第 1 段：读取配置 ----
const API_KEY = process.env.API_KEY;                                  // 密钥，从 .env 文件读进来，绝不写死在代码里
const BASE_URL = process.env.BASE_URL || "https://api.deepseek.com"; // 接口地址（可换 DeepSeek）
const MODEL = process.env.MODEL || "deepseek-flash";                      // 用哪个模型

if (!API_KEY) {                                                        // 防御：没填密钥就直接退出，避免发出一个注定失败的请求
  console.error("❌ 没找到 API_KEY，请在 .env 文件里填写后重试");
  process.exit(1);
}

// ---- 第 2 段：发请求 ----
async function ask(question) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {       // fetch 是 Node 自带的网络请求函数，相当于浏览器发请求
    method: "POST",
    headers: {
      "Content-Type": "application/json",                              // 告诉服务器：我发的是 JSON
      Authorization: `Bearer ${API_KEY}`,                              // 身份认证：Bearer 后面跟密钥
    },
    body: JSON.stringify({                                             // 请求体（真正要发给模型的内容）
      model: MODEL,
      messages: [
        { role: "user", content: question },                           // role 决定"谁在说话"：user=你，assistant=模型，system=规则
      ],
      stream: true,
    }),
  });
 

  // ---- 第 3 段：检查是否成功 ----
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`请求失败 ${response.status}: ${errText}`);         // 401=密钥错，402/403=没钱或没权限，429=太快了
  }

 
 // ---- 第 4 段：读流 ----
 const reader =response.body.getReader();
 const decoder =new TextDecoder("utf-8");
 let buffer = "";
 let full = "";

while (true) {
  const { done,value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value,{stream:true});
  const lines =buffer.split("\n");
  buffer =lines.pop();
  for (const line of lines){
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:"))continue;
    const payload = trimmed.slice(5).trim();
    if (payload === "[DONE]")continue;
  }
}
// ---- 第 5 段：调用 + 打印 ----
console.log("问：用三句话介绍你自己\n答：");
await askStream("用三句话介绍你自己");