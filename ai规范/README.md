> **性质**：规则包总索引。AI 不需要每次读它；这是给人看的导航。
> **最后更新**：2026-11-20

# ai规范 · AI 协作规则包

把「AI&人工安全协作」的规范落成 AI 能被强制执行的条款。分两层：

- **第 1 层 常驻规则**：`AGENTS.md` 系列 —— 每次自动加载，只放硬约束。
- **第 2 层 细则库**：`.ai-rules/` —— 按需读取，放模板和细节。

## 目录结构

```
ai规范/
├── README.md                     ← 本文件（导航 + 安装说明）
├── AGENTS.md                     ← ⭐ 项目级常驻规则（放项目根）
├── AGENTS.global.md              ← ⭐ 全局常驻规则（放用户目录，例如 ~/.dsh/AGENTS.md）
├── AGENTS.microservices.md       ← 多服务 / 多模块场景的叠加规则
└── .ai-rules/
    ├── 00-使用说明.md            ← 规则包怎么长期维护
    ├── 01-需求模板.md            ← 怎么把需求说清楚
    ├── 02-局部改码.md            ← 怎么精确指哪儿改哪儿
    ├── 03-上下文与恢复.md        ← 长对话怎么不失忆
    ├── 04-审查清单.md            ← 交付前怎么自查
    └── 05-协作红线.md            ← 边界怎么划
```

## 安装：三层落点

### 1）全局层（所有项目生效）

把 `AGENTS.global.md` 的内容复制成：

| 工具 | 路径 |
|---|---|
| DeepSeek Harness | `C:\Users\<你>\.dsh\AGENTS.md` |
| Claude Code | `C:\Users\<你>\.claude\CLAUDE.md` |

### 2）项目层（每个项目一份）

把 `AGENTS.md` 复制到项目根目录（含 `.git` 的目录），然后**填写第 0 节的 `<待填>`**：

- 不改完项目名、技术栈、可写/禁写目录，**不要让 AI 开工**。
- 如果是多服务仓库，把 `AGENTS.microservices.md` 合并进去或放在旁边并在 `AGENTS.md` 里注明。

### 3）细则层

把 `.ai-rules/` 整个目录复制到项目根目录下。`AGENTS.md` 第 6 节已写好触发指令，AI 会在对应场景自行读取。

> 注意：`.ai-rules/` 是**给 AI 读的**，不要写进 `.gitignore`；只有 `ai-sandbox/` 该被忽略。

## 其他工具的对应文件名

同一套内容换个名字到处能用：

| 工具 | 常驻规则文件 |
|---|---|
| DeepSeek Harness | `~/.dsh/AGENTS.md` + 项目 `AGENTS.md` |
| Claude Code | `~/.claude/CLAUDE.md` + 项目 `CLAUDE.md` |
| Cursor | `.cursor/rules/*.mdc` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Trae CN / Qoder CN | 项目设置里的「自定义规则 / 智能体指令」 |
| 万能兜底 | 项目根 `AGENTS.md` |

## 三条使用纪律

1. **翻车即入库**：AI 犯了新错，立刻在 `AGENTS.md` 禁忌里加一行。
2. **固化即删除**：某条规则已被 hook / CI / 沙箱机械拦住，就从 `AGENTS.md` 删掉——机器管的事不用再喂给模型。
3. **保持短**：`AGENTS.global.md` ≤ 80 行，项目 `AGENTS.md` ≤ 150 行。超了先拆到 `.ai-rules/`。

## 这套包解决什么 / 不解决什么

| ✅ 解决 | ❌ 不解决（属第 3 层，需另配） |
|---|---|
| AI 不知道规则（没读到） | AI 绕过规则写盘 |
| 规则太长被截断丢弃 | 违规进入主分支 |
| 不知道该怎么提需求 | 沙箱 / 权限隔离 |
| 改码时不知道边界在哪 | pre-commit hook、CI 路径守卫 |
| 交付质量靠自觉 | 强制 diff 落地流程 |
