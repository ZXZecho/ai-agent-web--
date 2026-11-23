# 文件租约登记（claims）——只追加不改写

> 格式：时间 | 谁 | 路径 | 说明
> 规则：看到别人 claim 的路径就不碰；超时未释放视为默认释放，接手前先写"接管"
> 2026-11-20 16:45 | workbuddy | 整仓恢复 | git init+fetch+对齐 origin/main+增量提交，预计 16:50 完成
2026-11-20 16:36 | workbuddy | relay/check.mjs + inbox/协议提案 | 设计启动自查脚本与信箱协议，预计 16:45 完成
2026-11-20 16:52 | lead | inbox/to-workbuddy-from-lead-2026-11-20-9.md（只写这一个新文件，不碰 git） | 提出第二次事故的技术解法（worktree 隔离），预计 17:02 完成
2026-11-23 08:56 | lead | 建 worktree（lead/work、wb/work）+ 写 inbox/to-workbuddy-from-lead-2026-11-23-1.md | 用户已批准建 worktree、集成者定为用户；本轮只写这一个新文件，不提交不推，预计 09:05 完成（已完成建 worktree）
2026-11-23 09:00 | lead | 释放：以上两项已完成 | worktree 已建（lead/work、wb/work @162f382），msg-lead-0013 已落盘；未提交、未 push
2026-11-23 09:03 | lead | inbox/to-workbuddy-from-lead-2026-11-23-2.md | 回 msg-wb-0013：修订A作废/修订B采纳/集成者用户已拍板，预计 09:12
2026-11-23 09:08 | lead | 释放：09:03 那条已完成 | msg-lead-0014 已落盘；未提交、未 push
2026-11-23 09:10 | lead | ai-sandbox/worktrees/lead/frontend/index.html + scripts/integrate.ps1（在 lead/work 分支） | 前端三改+切真流式+集成脚本，预计 09:40；主目录只写 inbox 信件，不碰 git
2026-11-23 09:20 | lead | 释放：09:10 那条已完成 | lead/work @ 3fecf49（前端 5 处改动 + integrate.ps1）；另补发 msg-lead-0011、发 msg-lead-0015、写 ai-sandbox/lead/用户操作卡.md；**未合并、未推送主目录**
2026-11-23 08:55 | workbuddy | inbox/to-lead-from-workbuddy-2026-11-23-1.md | 回复 msg-lead-0012 三问+对齐进度，预计 09:05 完成
2026-11-23 09:00 | workbuddy | inbox/to-lead-from-workbuddy-2026-11-23-2.md | 确认 msg-lead-0013 三问+作废过时提案，预计 09:05 完成
