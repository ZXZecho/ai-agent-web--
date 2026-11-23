# ============================================================
# scripts/integrate.ps1 —— 集成脚本（给用户：唯一集成者用）
#
# 它做什么：把两个 AI 的分支（lead/work、wb/work）合进 main，然后可选地推送。
# 铁律：**遇到冲突立即停下并回滚，绝不自动解冲突**。
#       冲突怎么解，是"人做决定"的事；脚本只负责不让仓库留在半死不活的状态。
#
# 用法（在项目根目录的 PowerShell 窗口里）：
#     .\scripts\integrate.ps1
#
# 你会看到：要合并什么 → 按回车确认 → 合并结果 → 问你要不要推送。
# ============================================================

$ErrorActionPreference = 'Stop'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'   # 全程共用一个时间戳，备份/提交信息都用它

function Say($msg, $color = 'Gray') { Write-Host $msg -ForegroundColor $color }
function Stop-Here($msg) {
  Say ""
  Say "❌ $msg" Red
  Say "已停止，没有做任何破坏性操作。" DarkGray
  exit 1
}

# ---------- 0. 确认在项目根目录、且在 main 分支 ----------
if (-not (Test-Path '.git')) {
  Stop-Here "当前目录不是项目根目录（找不到 .git）。请先 cd 到项目根目录再运行。"
}
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
  Stop-Here "当前不在 main 分支（现在是 $branch）。集成只能在 main 上做。"
}

# ---------- 1. 工作区必须干净 ----------
# 主目录常驻未提交的信件/台账（协议规定两人都不 commit，由集成者统一提交），
# 所以这里不是直接报错，而是：只有 inbox/ 和 relay/state.json 时，替你提交掉。
$dirty = git status --porcelain
if ($dirty) {
  $paths   = $dirty | ForEach-Object { $_.Substring(3).Trim('"') }
  $allowed = $paths | Where-Object { $_ -like 'inbox/*' -or $_ -eq 'relay/state.json' }
  $others  = $paths | Where-Object { -not ($_ -like 'inbox/*' -or $_ -eq 'relay/state.json') }

  Say "工作区有未提交的改动：" Yellow
  $dirty | ForEach-Object { Say "  $_" }

  if ($others) {
    Say ""
    Say "其中这些不在信箱范围内，需要我们先处理：" Red
    $others | ForEach-Object { Say "  $_" Red }
    Stop-Here "为避免把不明改动一并提交，集成先停下。请把上面的清单发给 lead 或 WorkBuddy。"
  }

  Say ""
  $c = Read-Host "以上都是信箱/台账文件，回车把它们提交掉，输入 q 取消"
  if ($c -eq 'q') { Say "已取消。" Yellow; exit 0 }
  git add -- $allowed
  git commit -m "mail: 集成前提交信箱与台账（$stamp）"
  if ($LASTEXITCODE -ne 0) { Stop-Here "提交信箱文件失败。" }
  Say "✅ 信箱文件已提交" Green
}

# ---------- 2. 备份 .git（放在用户目录，免得污染 git status）----------
# 备份放用户目录，别放仓库里（否则 git status 会一直看到它，也怕被误提交）
$bakRoot = Join-Path $env:USERPROFILE 'ai-agent-git-backups'
New-Item -ItemType Directory -Path $bakRoot -Force | Out-Null
$bak = Join-Path $bakRoot "git-$stamp"
Say "备份 .git → $bak" DarkGray
Copy-Item -Recurse .git $bak
Say "✅ 备份完成（万一出事，把它拷回去就能回到现在）" Green

# ---------- 3. 预览：让用户知道自己批了什么 ----------
Say ""
Say "════════ 要合并的内容 ════════" Cyan

$branches = @('lead/work', 'wb/work')
foreach ($b in $branches) {
  Say ""
  Say "── $b ──" Yellow
  $exist = git rev-parse --verify --quiet $b
  if (-not $exist) {
    Say "  （分支不存在，跳过）" DarkGray
    continue
  }
  $commits = git log --oneline "main..$b"
  if (-not $commits) {
    Say "  （没有新提交，已是最新）" DarkGray
    continue
  }
  Say "  未合并的提交：" DarkGray
  $commits | ForEach-Object { Say "    $_" }
  Say "  改动统计：" DarkGray
  (git diff --stat "main...$b") | ForEach-Object { Say "    $_" }
}

Say ""
$go = Read-Host "回车开始合并，输入 q 取消"
if ($go -eq 'q') { Say "已取消。" Yellow; exit 0 }

# ---------- 4. 逐个合并：失败即停 + 回滚 ----------
function Merge-Branch($name) {
  Say ""
  Say "── 合并 $name ──" Cyan
  git merge --no-ff --no-edit $name
  if ($LASTEXITCODE -ne 0) {
    Say ""
    Say "❌ 合并 $name 出现冲突，已停止。" Red
    Say "冲突文件：" Yellow
    git diff --name-only --diff-filter=U | ForEach-Object { Say "  $_" }
    Say ""
    Say "正在回滚到合并前的状态（不丢失任何提交，只是撤销这次合并）..." DarkGray
    git merge --abort
    Say "✅ 已回滚，仓库是干净的。" Green
    Say ""
    Say "下一步：把上面的冲突文件清单发给 lead 或 WorkBuddy，他们会给你两个方案选。" Yellow
    exit 1
  }
  Say "✅ $name 合并完成" Green
}

foreach ($b in $branches) {
  $exist = git rev-parse --verify --quiet $b
  if ($exist) { Merge-Branch $b }
}

# ---------- 5. 结果 ----------
Say ""
Say "════════ 合并后的 main ════════" Cyan
git log --oneline -6

Say ""
Say "自检建议（可选，但推荐）：" Yellow
Say "  1) cd backend; npm start        ← 起服务"
Say "  2) 浏览器打开 http://localhost:3000 发一句话，看是否流式返回"

# ---------- 6. 推送（问过才推）----------
Say ""
$ans = Read-Host "现在推送到 GitHub 吗？(y/N)"
if ($ans -eq 'y') {
  Say "推送中…" DarkGray
  git push -u origin main
  if ($LASTEXITCODE -ne 0) {
    Say ""
    Say "❌ 推送失败。常见原因：网络/需要 GitHub 授权/远程有新提交。" Red
    Say "把这段输出发给 lead 或 WorkBuddy，别自己重试。" Yellow
    exit 1
  }
  Say "✅ 推送成功，远程和本地一致。" Green
} else {
  Say "未推送。以后想推，在主目录执行：git push -u origin main" Yellow
}

Say ""
Say "全部完成 🎉" Green
