# AI Agent 智能助手 — 项目简报（所有协作 AI 必读）

> **维护者**：WorkBuddy（后端负责人）
> **最后更新**：2026-11-20
> **阅读对象**：所有参与本项目的 AI（前端 AI、美术 AI、Kimi 等）。读完再动工，不许凭猜测开工。

---

## 1. 项目是什么

**目标**：从零构建一个带网页界面的 AI Agent 智能助手，支持多轮对话、流式输出、工具调用（Function Calling）。

**特殊背景（重要）**：这是教学项目。用户（ZXZecho，计算机专业大二学生）的**首要目的是借项目学会 AI / API / Agent 的原理**，不是赶工期。因此：

- 每个模块的代码必须带"这段在做什么、为什么这么写"的注释或讲解文档
- 不许堆砌用户看不懂的高级抽象；简单直接优先于工程炫技
- 依赖越少越好，能不引入框架就不引入

## 2. 技术栈（锁定，不得擅自更换）

| 层 | 选型 | 理由 |
|---|---|---|
| 后端 | Node.js 26 原生（无框架，`http` + `fetch`） | 用户已装好，零依赖最利于学习 |
| 大模型 | DeepSeek `deepseek-chat`（API：`https://api.deepseek.com`） | 密钥已配好，便宜 |
| 前端 | 单文件 `frontend/index.html`（纯 HTML+CSS+JS，无 npm、无构建） | 零工具链，任何 AI 都能写 |
| 数据库 | 无（会话历史存内存） | 教学项目够用 |

## 3. 前后端接口契约（双方开发的唯一依据，不得擅改）

```
前端 → 后端
POST http://localhost:3000/api/chat
Content-Type: application/json
请求体：
{ "messages": [ { "role": "user", "content": "你好" }, ... ] }
（messages 含本会话全部历史，user/assistant 交替）

后端 → 前端
SSE 流式响应（Content-Type: text/event-stream）
每条消息：data: {"delta": "本次新增的文字"}
结束标记：data: [DONE]
```

前端不需要知道密钥、模型、Agent 逻辑——它只管发消息数组、收增量文字、逐字渲染。

## 4. 当前进度（2026-11-20）

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0 环境 | Node/Git/GitHub 账号/API 密钥 | ✅ 完成 |
| 1 最小闭环 | step1-hello.js：发一句话给模型、打印回复 | ✅ 完成并实测跑通 |
| 2 流式输出 | SSE 打字机效果 | ⏸ 参考实现在 backend/step2-answer.js，用户练习版未完成（协作模式下并入后端开发） |
| 3 多轮记忆 | 把历史消息塞回请求 | ⬜ 未开始 |
| 4 Function Calling | 让模型调用本地函数 | ⬜ 未开始 |
| 5 Agent 循环 | 模型自主多步调用工具完成任务 | ⬜ 未开始 |
| 6 网页界面 | HTTP 服务 + 前端聊天页面 | ⬜ 未开始（前后端并行） |

## 5. 分工提案（欢迎其他 AI 在 inbox/ 里回复异议）

| 角色 | 负责 | 产出位置 |
|---|---|---|
| **WorkBuddy（我）** | 后端全部（阶段 3-6 后端部分）、整体架构、代码审查、集成联调、给用户讲原理 | `backend/` |
| **前端 AI** | `frontend/index.html` 单文件聊天界面（按第 3 节契约） | `frontend/` |
| **美术 AI（可选）** | 只出 CSS 配色/布局/视觉方案建议，不改代码逻辑 | `ai-sandbox/design/` |
| **Kimi（可选）** | 长文本任务：讲解文档撰写、需求整理 | `ai-sandbox/docs/` |

## 6. 协作沟通约定（文件对话）

- 每条给其他 AI 的留言写进 `inbox/to-<AI名>-from-workbuddy-<日期>.md`
- 给我的留言写 `inbox/to-workbuddy-from-<AI名>-<日期>.md`
- 留言格式：**背景（1 行）→ 事项（编号列表）→ 需要对方做什么（1 行）**
- 争议解决不了 → 双方各自写明理由，由用户裁决，不得反复拉扯

## 7. 安全协议（红线，任何 AI 不得违反）

1. **密钥零暴露**：`.env` 绝不进入 git、绝不写进前端代码、绝不写进任何文档。密钥只在 `backend/.env`（本地，已被 .gitignore 排除）
2. **风险操作必须先请示用户**：删除文件、git push/force、安装依赖、修改配置文件、任何不可逆操作
3. **前端永远不接触密钥**：浏览器代码里出现 `sk-` 字样 = 直接打回
4. **不装来路不明的依赖/skill**；确需新增依赖，先在 inbox 说明库名、版本、理由，用户批准
5. 所有 AI 产出先落 `ai-sandbox/`，经 WorkBuddy 审查（对照 .ai-rules/04-审查清单.md）才能进正式目录

## 8. Git 与 GitHub

- 仓库根目录 = 本文件夹；`git init` 已完成，首次提交为项目简报 + 后端代码
- 提交规范：`<区域>: <做了什么>`，如 `backend: 实现阶段3多轮记忆`；谁写的模块谁署名
- **GitHub 远程仓库尚未创建**（待用户操作）：用户需在 github.com 新建仓库（建议名 `ai-agent-web`，public，不要勾选初始化 README），把仓库地址发给任一 AI 完成首次 push
- 密钥文件已列入 .gitignore，push 前每次都会再检查

## 9. 目录地图

```
├── README.md            ← 本文件（项目简报）
├── AGENTS.md            ← 硬约束规则（所有 AI 必须遵守）
├── .ai-rules/           ← 触发式细则（改码/审查/恢复上下文前必读）
├── TASKS.md             ← 任务板（谁在干什么、状态）
├── backend/             ← WorkBuddy 的地盘
│   ├── step1-hello.js   ← 阶段1成品（已跑通）
│   ├── step2-answer.js  ← 阶段2参考实现
│   └── package.json
├── frontend/            ← 前端 AI 的地盘（目标产出 index.html）
├── inbox/               ← AI 之间留言
├── ai-sandbox/          ← AI 草稿区（不入正式目录）
└── ai规范/              ← 规则模板原件（只读，勿动）
```

— WorkBuddy，2026-11-20
