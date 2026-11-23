# AGENTS.md 协作协议 v3（草案）——待双方确认 + 用户终审后合入 AGENTS.md

> 起草：WorkBuddy（msg-wb-0014 §1③）
> 依据：msg-wb-0012（四步两步）+ msg-lead-0012 §3（补 4 条）+ msg-lead-0013（worktree 架构）+ msg-lead-proxy-0014（判罚降级、needs: 行）
> 状态：**草案，未生效**。生效条件：lead 确认 + 用户终审 → 由用户合入主目录 AGENTS.md

## 一、架构铁律（worktree 分工，msg-lead-0013 §1-2）

| 谁 | 工作目录 | 分支 | 可提交路径 |
|---|---|---|---|
| lead | `ai-sandbox/worktrees/lead` | `lead/work` | `frontend/`、`ai-sandbox/`（lead 子目录）、`inbox/to-workbuddy-*` |
| WorkBuddy | `ai-sandbox/worktrees/wb` | `wb/work` | `backend/`、`relay/`、`TASKS.md`、`inbox/to-lead-*` |
| 用户（集成者） | 主目录 | `main` | **唯一**可 merge、可 push、可 commit 主目录的人 |

- 信箱资源（`inbox/`、`READLOG.md`、`claims/`）**永远在主目录**，双方直接写文件、**不 commit**，由用户集成时统一提交
- 主目录内的正式目录（`backend/`、`frontend/`、`relay/` 等）对两个 AI 冻结为只读
- 结构性操作（init/checkout/switch/reset/clean/rebase/worktree add）**只允许在各自 worktree 内**；主目录 git 操作 = 用户专属

## 二、开工四步（每次会话开始，先于一切代码操作）

0. **第 0 步**：`git rev-parse --abbrev-ref HEAD` + `pwd`，确认分支与目录——"我以为我在哪"是两次事故的共同开场白
1. 跑 `node relay/check.mjs <自己>`：未读信 + 活跃租约一屏看清（工具是提示，不是锁）
2. 逐封读信，读完 `check.mjs <自己> ack <文件名>` 签收（READLOG 台账留痕）
3. 读 TASKS.md，认领/更新任务状态
4. 动文件前登记租约：在 `inbox/claims/` 新建 `<谁>-<时间戳>.md`（一 claim 一文件，创建原子），写明路径 + 预计完成时间

## 三、收工两步

1. 留交接信，**必须含 `needs:` 行**（写明下一步要谁做什么），防交接信变流水账
2. ack 本轮读过的信；若租约未完成，在 claim 文件里标注"挂起/移交"

## 四、合并前协商三件套（写进收工信或独立信）

```
① 分支 + commit：lead/work @ abc1234
② 改了哪些文件：frontend/index.html（第 120-180 行）
③ 依赖声明：依赖 wb/work 的 XXX，若未合并我等
```

集成者（用户）按依赖顺序合并：先被依赖、后依赖方。**物理冲突靠 worktree 隔离消灭，语义冲突靠三件套协商**——两者不可互相替代。

## 五、身份与结论签发（沿用 2026-11-20 增补条款，并入本版）

1. channel 来源标记：每封信标注 `channel: dsh / relay`，缺字段拒收
2. 审查/验收结论只可由 DSH 会话（真实 lead）与 WorkBuddy 各自签发；relay 产物（lead-proxy）一律是草稿
3. AI 身份 = 系统提示词 + 写盘白名单，不由署名自证

## 六、事故响应协议

1. 任何一方发现异常（git 报错异常、文件消失、历史断裂）→ **立即冻结**：停止一切 git 与写盘
2. 报告用户，由用户指定**唯一恢复人**，另一方完全停手
3. 恢复前先备份 `.git`（`Copy-Item -Recurse .git .git.bak.<时间戳>`）
4. 恢复完成后**双向核验**（HEAD / 分支 / 文件清单 / 信件数）一致才复工

## 七、判罚

- 违反本协议（漏跑四步、漏签收、漏登记租约）：标记"未按协议启动"，**可补签**，劳动成果不因程序性违规作废
- 触碰红线（密钥入仓/前端、越权 push、主目录结构性操作）：该轮产出作废 + 回滚 + 教训写成新条款
