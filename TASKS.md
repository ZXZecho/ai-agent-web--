# 任务板（TASKS）

> 维护者：WorkBuddy　最后更新：2026-11-20
> 规则：接任务先把自己的名字和状态改了（⬜待办 / 🔨进行中 / 👀待审查 / ✅完成），完成时在"产出"列填文件路径。

## 当前任务

| # | 任务 | 负责人 | 状态 | 产出 | 备注 |
|---|---|---|---|---|---|
| T1 | 后端：HTTP 服务 + /api/chat 接口 + 流式输出（并入阶段2/3 成果） | WorkBuddy | 👀待 lead 复检 | backend/server.js | 8046b8a；已修 relay 草稿 B1-B5 + lead msg-0007 2 阻塞；npm start 可用 |
| T2 | 后端：多轮记忆（阶段3） | WorkBuddy | ✅完成（并入 T1） | backend/server.js | 契约口径：前端带全量 messages，后端无状态（教学注释已写明） |
| T3 | 前端：index.html 聊天界面（按契约） | lead | ✅完成 | frontend/index.html | lead 修 2 缺陷（d25c193）；WorkBuddy 复检通过（busy 闸两条复位路径全覆盖、尾包无重复喂字，2 条吹毛求疵见 msg-0009） |
| T4 | 美术方案（配色/布局建议，只出方案不改码） | 美术 AI（可选） | ⬜待认领 | ai-sandbox/design/ | 可跳过，不阻塞 |
| T5 | 讲解文档：Agent 循环原理（给用户的教学材料） | Kimi（可选） | ⬜待认领 | ai-sandbox/docs/ | 可跳过 |
| T6 | 用户：GitHub 建远程仓库并回传地址 | 用户 ZXZecho | ✅完成 | origin = github.com/ZXZecho/ai-agent-web-- | 首次 push 成功；此后 push 由 lead（DSH）或用户执行（受进程 TLS 权限限制，WorkBuddy 沙箱代推不可靠） |
| T7 | 集成联调 + 首次 push | WorkBuddy | ⬜待办 | — | 依赖 T1+T3+T6 |

## 已完成

| # | 任务 | 负责人 | 产出 |
|---|---|---|---|
| T0 | 阶段1 最小闭环（step1-hello.js 跑通） | WorkBuddy + 用户 | backend/step1-hello.js |
| T-1 | 项目简报/规则/任务板落盘、git 初始化 | WorkBuddy | README.md / AGENTS.md / TASKS.md |
| T-R | relay 草稿机（lead-proxy，经 DeepSeek API 代跑） | WorkBuddy | ✅完成整改 | relay/orchestrator.mjs | 用户裁决降级：署名 lead-proxy、白名单仅 ai-sandbox/lead-proxy/、不下结论、信尾固定声明；冒名事故已整改 |
