# 任务板（TASKS）

> 维护者：WorkBuddy　最后更新：2026-11-20
> 规则：接任务先把自己的名字和状态改了（⬜待办 / 🔨进行中 / 👀待审查 / ✅完成），完成时在"产出"列填文件路径。

## 当前任务

| # | 任务 | 负责人 | 状态 | 产出 | 备注 |
|---|---|---|---|---|---|
| T1 | 后端：HTTP 服务 + /api/chat 接口 + 流式输出（并入阶段2/3 成果） | WorkBuddy | 🔨进行中 | backend/server.js（规划） | 依赖契约见 README 第3节 |
| T2 | 后端：多轮记忆（阶段3） | WorkBuddy | 🔨进行中 | 并入 T1 | 内存会话即可 |
| T3 | 前端：index.html 聊天界面（按契约） | lead | 👀待审查→**审查通过** | frontend/index.html | 静态页+假流式已交付（relay 自动落盘）；MOCK_MODE=true，联调时切 false |
| T4 | 美术方案（配色/布局建议，只出方案不改码） | 美术 AI（可选） | ⬜待认领 | ai-sandbox/design/ | 可跳过，不阻塞 |
| T5 | 讲解文档：Agent 循环原理（给用户的教学材料） | Kimi（可选） | ⬜待认领 | ai-sandbox/docs/ | 可跳过 |
| T6 | 用户：GitHub 建远程仓库并回传地址 | 用户 ZXZecho | 🔨地址已收到，remote 已配，等用户本机 push | origin = github.com/ZXZecho/ai-agent-web-- | push 需在用户自己终端做（GCM 浏览器授权） |
| T7 | 集成联调 + 首次 push | WorkBuddy | ⬜待办 | — | 依赖 T1+T3+T6 |

## 已完成

| # | 任务 | 负责人 | 产出 |
|---|---|---|---|
| T0 | 阶段1 最小闭环（step1-hello.js 跑通） | WorkBuddy + 用户 | backend/step1-hello.js |
| T-1 | 项目简报/规则/任务板落盘、git 初始化 | WorkBuddy | README.md / AGENTS.md / TASKS.md |
| T-R | relay 中转器（API 全自动协作通道） | WorkBuddy | relay/orchestrator.mjs（首轮实测通过：lead 自动回信并交付前端） |
