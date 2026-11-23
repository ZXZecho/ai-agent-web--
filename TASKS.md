# 任务板（TASKS）

> 维护者：WorkBuddy　最后更新：2026-11-23 09:20（worktree 架构落地，回归测试全绿，待协议定稿+集成）
> 规则：接任务先把自己的名字和状态改了（⬜待办 / 🔨进行中 / 👀待审查 / ✅完成），完成时在"产出"列填文件路径。

## 当前任务

| # | 任务 | 负责人 | 状态 | 产出 | 备注 |
|---|---|---|---|---|---|
| T1 | 后端：HTTP 服务 + /api/chat 接口 + 流式输出（并入阶段2/3 成果） | WorkBuddy | ✅完成 | backend/server.js | wb/work 回归五项全绿（3101端口，2026-11-23），含心跳泄漏回归 |
| T2 | 后端：多轮记忆（阶段3） | WorkBuddy | ✅完成（并入 T1） | backend/server.js | 契约口径：前端带全量 messages，后端无状态（教学注释已写明） |
| T3 | 前端：index.html 聊天界面（按契约） | lead | ✅完成 | frontend/index.html | lead/work @3fecf49：切真流式 + 上下文截 20 条 + 滚动锚定 + 错误气泡；WorkBuddy 审查无阻塞项 |
| T4 | 美术方案（配色/布局建议，只出方案不改码） | 美术 AI（可选） | ⬜待认领 | ai-sandbox/design/ | 可跳过，不阻塞 |
| T5 | 讲解文档：Agent 循环原理（给用户的教学材料） | Kimi（可选） | ⬜待认领 | ai-sandbox/docs/ | 可跳过 |
| T6 | 用户：GitHub 建远程仓库并回传地址 | 用户 ZXZecho | ✅完成 | origin = github.com/ZXZecho/ai-agent-web-- | push 由 integrate.ps1 问询后执行（y/N），主目录 push = 用户专属 |
| T7 | 集成联调 + push | 用户（决策）+ integrate.ps1（执行） | ⬜待协议定稿 | scripts/integrate.ps1 | lead 已交付脚本 @3fecf49，WorkBuddy 审查通过；两分支文件零重叠，合并可期干净 |
| T8 | AGENTS 协议 v3 定稿（双草案对齐 → 采纳 → 合入主目录） | WorkBuddy + lead 协商，用户委托采纳权 | 🔨进行中 | ai-sandbox/worktrees/wb/AGENTS.draft-v3.md | 用户 09:16 裁决：双方讨论无问题即采纳；等 lead 确认后合入 |
| T9 | check.mjs v3 采纳（主目录信箱定位 + claims/ 一文件制） | WorkBuddy | 👀随 T8 一并采纳 | relay/check.mjs @7299dde | 已在 wb/work，随集成进 main |

## 已完成

| # | 任务 | 负责人 | 产出 |
|---|---|---|---|
| T0 | 阶段1 最小闭环（step1-hello.js 跑通） | WorkBuddy + 用户 | backend/step1-hello.js |
| T-1 | 项目简报/规则/任务板落盘、git 初始化 | WorkBuddy | README.md / AGENTS.md / TASKS.md |
| T-R | relay 草稿机（lead-proxy，经 DeepSeek API 代跑） | WorkBuddy | ✅完成整改 | relay/orchestrator.mjs | 用户裁决降级：署名 lead-proxy、白名单仅 ai-sandbox/lead-proxy/、不下结论、信尾固定声明；冒名事故已整改 |
