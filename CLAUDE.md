# HLB LOAD$ — 签约模块原型 项目记忆

> **使用说明**：每次新会话先读这个文件，然后看"当前待办"部分。  
> 完成任务后立即更新此文件。用户说「更新待办」时也同步更新。

---

## 项目概述

**产品**：HLB LOAD$ 内部系统 — 签约模块（E-Acceptance 原型）  
**目标**：可交互 HTML 单文件原型，供销售人员演示和客户体验  
**语言**：全英文（对外版本）  
**仓库**：`https://github.com/rxy323-max/HLB-`  
**当前分支**：`session-v9`  
**预览链接（session-v9）**：  
`https://htmlpreview.github.io/?https://github.com/rxy323-max/HLB-/blob/session-v9/05_%E7%AD%BE%E7%BA%A6/%E9%9C%80%E6%B1%82%E6%96%87%E6%A1%A3/e-acceptance-prototype.html`

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `05_签约/需求文档/e-acceptance-prototype.html` | **E-Acceptance 主原型文件（session-v9，持续迭代）** |
| `05_签约/需求文档/_v4_reference.html` | v4 快照，保留为参考，不修改 |
| `02_AIOCR/需求文档/aiocr-prototype.html` | **AIOCR 主原型文件（session-v9，持续迭代）** |
| `CLAUDE.md` | 本文件，项目记忆 + 任务看板 |

---

## ═══ 当前待办（AIOCR + E-Acceptance 任务看板）═══

> 状态：`[ ]` 未开始 · `[~]` 进行中 · `[x]` 已完成

### 高优先级（下次会话先做）

— 暂无 —

### 中优先级（可选继续迭代）

- [ ] 为 CED 的 Income Computation Tab 增加 "Sales amended" 状态同步（目前 Income Tab 里 CED 看不到 Sales 改了哪里）
- [ ] 加 CRA list 的 OCR Summary Strip 点击"Review 1 Alert"直接跳转到对应文件的动作
- [ ] Classification 页面增加置信度分级视觉（红/橙/绿 badge 而不是只有 %）

---

## AIOCR 已完成变更（session-v9）

### 本轮（Jira 综合分析 → 原型改造，commit 02c0907）

- [x] **重复按钮全部清理**：
  - 删 s-app-detail 底部 Back/Done 行（footer 已有）
  - 删 cra-defect-build 底部 Cancel/Send 行（footer 已有）
  - 删 CED detail 底部两个按钮（footer 已有）
  - 删 CRA list 顶部 "Issue Defect Note (2 items)" 批量按钮（与行内按钮重复）
  - 删 Step 4 文件表格行的 "Review OCR" 和 "Replace File"（Readiness panel 已有）
- [x] **OCR Summary Strip**：4 格摘要栏（文件数/OCR状态/验证结果/下一步），在 Sales Step 4、CED 文件列表、CRA 文件列表均显示
- [x] **结构化 Alert 卡片**：Submission Readiness 的 Alert 项从纯文字升级为 Rule + 对比值网格 + 操作按钮组；Amended 状态自动变绿
- [x] **re-validation feedback**：Amendment 保存后状态 banner 显示 "Net Pay vs BS — Alert → Pass ✓"
- [x] **3-Tab OCR Detail**：Sales s-app-detail 和 CED detail 均新增 3 个 Tab
  - OCR Fields（原有布局）
  - Income Computation（月份来源、收入科目分类、计算结果、EPF 验证）
  - Compliance Check（水印扫描、文件真实性、年限要求）
- [x] **CED Detail 改进**：Amendment 通知横幅（如 Sales 已修改，CED 看到"请核实"提示）；footer 与 ced-list 分离，各有独立 CTA
- [x] **Jira 325 条缺陷综合分析报告**：三份 AI 分析（Jira/Workbuddy/GPT）综合形成修改方案文档



- [x] 4步 Pipeline 进度条（salesStepBar）
- [x] Upload 页：去除预成 AI Classification 列，状态文字重命名
- [x] Classification 工作站：去除 "Step 2—" 前缀，添加文件切换标签，Prev/Next 翻页
- [x] OCR 页：去除置信度 %，"Pass"→"Rules Pass"，自动填充 toast
- [x] Review 页：Submission Readiness 分层面板（Hard Fail / Alert / Pass）
- [x] 放款 Upload 标签与底部文字修正
- [x] 交叉验证面板（CED + CRA 文件列表页底部）
- [x] **Sales OCR 字段修正（Amend）**：
  - s-app-detail 场景：Payslip 详情页，xval 字段有 "✏ Amend" 按钮
  - Amendment 保存后：原值划线 + 修正值 + "Amended ✓" 徽章
  - Region 3 公式动态重算（net_pay_amount 修正后 Bank cross-check 变绿）
  - modalAmend 弹窗 + saveAmendment() + clearAmendments()
- [x] **CRA OCR 字段修正（Modify）**：
  - renderCraVehicleRegions()：booking_fee fval 字段有 "✏ Modify" 按钮
  - 修正后：原值划线 + 新值 + "Modified ✓"；Region 3 Booking Fee 规则变绿
  - 侧边 Cross-file Links 横幅动态切换（红→绿）
  - 底部 Hard Rule Fail 横幅变成 alert-ok 成功提示
  - Footer "Approve Disbursement" 按钮解锁
  - modalCraEdit 弹窗 + saveCraEdit() + clearCraMods()
- [x] renderSAppDone alert 行新增 "✏ View & Amend Fields" 按钮
- [x] render() 路由 + updateFooter() 新增 s-app-detail
- [x] Dev Tool 新增 "Amend OCR — Payslip detail" 场景按钮



### 已完成（本 session-v9 所有变更）

- [x] bio-layout 两栏 CSS 恢复
- [x] devViz() SVG 设备图（disconnected/scanning/connected 三态）
- [x] 按钮 onclick 改为命名函数（修复 CSP/htmlpreview 问题）
- [x] Mode Gate（一次性模式选择入口，替代持久 Toggle）
- [x] 生物识别分步：MyKad 读卡 → 指纹扫描（scanning-fp 子状态）
- [x] 所有生物识别流程（EA S1/S3/Manual）统一 5 状态链
- [x] Document Library 拆分：Contract Docs（always shown）+ Signing Docs（mode-dependent）
- [x] Document Library History 按钮（仅 DL 有，签约流程只显示最新版）
- [x] EA Step 2 RIB 详细流程（3份文件 → Submit → 指纹确认提示）
- [x] s2RibStatus 替换 s2RibDone（'waiting' | 'submitted'）
- [x] 去除 emoji，改用 SVG 线框图标（ICO_OK/ICO_FAIL/ICO_WARN 及 SM 变体）
- [x] Manual Acceptance — Option A：DC 状态横幅，无 Confirm 按钮，DC 上传模拟
- [x] **EA Step 1: Remarks 文本框**：失败（1/3、2/3）时显示必填 textarea；Retry 按钮禁用直到填写；左侧面板同步显示；retryS1() 清空 remarks
- [x] **leftPanel 补齐**：Triggering Point、Trigger Counter、Remarks 行均正确渲染；失败时 Remarks 行显示 officer 输入内容
- [x] **Amendment 流程**：renderAmendment() + triggerSMS() 完整；Dev Tool `ea-amendment` 场景可验证
- [x] **Document History 弹窗**：openHistory() 支持 multiVer（amendment 后显示 v1+v2 两行）
- [x] **attempt-badge 样式**：ab-warn（1-2/3 橙色）+ ab-danger（3/3 红色）逻辑正确
- [x] **Cancel 按钮**：添加 onclick 占位 alert
- [x] **模式切换重设计**：
  - EA→Manual：清 EA flow state，保留 EA Log，更新弹窗文案
  - Manual→EA：有条件允许（无担保人 + DC 未上传），新增 `modalSwitchToEA`
  - `forceManualSwitch()` 也同步重置 EA state
  - Manual panel 顶部显示 "Switch to E-Acceptance" 条件链接
- [x] **指纹按钮简化**：Step 1/Step 3/Manual bio 的 ready 状态只显示单个 Scan Fingerprint 按钮，失败场景走 Dev Tool
- [x] **Manual 人员卡重组**：
  - 移除 Section 1 + Section 2 双区块结构
  - 改为每人一张 `.mp-card` 卡片，包含：bio 验证区 + 该人需签的文件列表
  - `MANUAL_PERSONS` 数据：Primary 签 3 份，Guarantor 签 2 份
  - 顶部：Skip All Biometric 链接 + Switch to EA 链接
  - 底部：DC 状态横幅（Pending / Complete）
  - `renderManualPanel()` + `renderPersonCard()` 替代原来的两个函数
- [x] **Manual bio "Proceed Offline" 重命名 + 强制警告**：
  - "Skip Bio" → "Proceed Offline"（卡片头部按钮）
  - "Skip All Biometric" → "Proceed All Offline"（顶部操作栏）
  - unmatched 状态 "Skip" 链接 → "Proceed Offline"
  - disconnected 状态新增 "Proceed Offline" 链接
  - skipped 完成态改为橙色警告框：说明需补件上传 Document Centre
  - 添加 "↺ Restart in-system verification" 链接（可逆性）
  - 新增 `mBioRestart(key)` 函数：重置 bio 状态到 disconnected
  - section 标签 "Optional" → "Physical report required if offline"

---

## 架构决策（已确定，不可变更）

### 两套文件系统（重要！）
- **Document Library tab**（本原型内）：合同生成区，展示所有初始版本，只读（View/Download/History）。**不支持上传**。
- **Document Centre**（申请页面另一个独立页面，本原型不模拟）：上传和归档已签署文件的地方。销售在这里上传签好的文件，触发人工签约完成状态。

### Manual Acceptance 完成触发（Option A）
- Acceptance tab 的 Manual 流程终止于"签约包已分发给客户"
- 实际完成状态由 Document Centre 的上传动作触发（原型用 Dev Tool `m-dc-uploaded` 模拟）
- **不设 Confirm 按钮**（Manual 模式下完全隐藏）

### 其他已确定决策
1. **bio-layout 两栏布局**：左栏 230px（#fafafa，客户/销售/交易信息）+ 右栏居中（设备 SVG + 状态）
2. **devViz() 设备图**：MyKad Reader + 连接指示点 + Computer
3. **RIB 是外部系统**：不模拟 RIB 门户内部界面，只展示 LOAD$ 侧的等待/完成状态
4. **全英文**：所有按钮、状态文字均英文
5. **不放引导说明文字**：页面只有功能和状态，无蓝色解释框
6. **E-Acceptance 不支持担保人**：有担保人时 EA 按钮禁用
7. **Mode Gate 一次性**：选择后不能自由切换；EA→Manual 可通过 "Switch to Manual" 确认弹窗切换，不可逆
8. **生物识别分步**：所有生物识别均为 MyKad 读卡（scanning 2s）→ 指纹扫描（scanning-fp 1.5s）→ 结果
9. **Document Library 只读**：没有上传功能

---

## E-Acceptance 三步流程

### Step 1 — Identity Verification
设备状态链：`disconnected` → `scanning`(2s) → `ready` → `scanning-fp`(1.5s) → `matched` / `unmatched`

- **匹配**：Verified OK，Proceed to Step 2
- **不匹配（1/3, 2/3）**：Remarks 必填，可重试
- **不匹配（3/3）**：红色 auto-switch banner，强制切到 Manual

### Step 2 — Review & Accept at RIB
- s2RibStatus: `'waiting'` → `'submitted'`
- 等待状态：spinning icon，"Customer reviewing at RIB Portal"
- 客户在 RIB 阅读 3 份文件后 Submit
- 完成状态：绿色确认，行员需扫描指纹确认，Proceed to Step 3

### Step 3 — E-Acceptance Confirmation
设备状态链同 Step 1

- **匹配**：Complete E-Acceptance
- **不匹配（3/3）**：OTP 兜底（SMS → 6位 OTP → 验证）

### 完成后
- 显示完成状态（via Biometric 或 via OTP）
- 若有 Amendment：变更文档高亮 + SMS 通知

---

## Manual Acceptance 流程

### Section 1: Identity Verification（Optional）
- Primary ± Guarantor 各自独立的 bio-layout 卡片
- 设备状态链同 EA（5步）
- 每人可 Skip（跳过生物识别）
- 结果记录但不阻断流程

### Section 2: Signing Package
- 文档列表（SIGNING_DOCS_MANUAL）：View / Download
- DC 状态横幅：Pending（默认）/ Complete（manualDCUploaded=true）
- 无 Confirm 按钮，无上传入口
- 完成由 Document Centre 触发（Dev Tool `m-dc-uploaded` 模拟）

---

## Dev Tool 场景清单

### E-Acceptance
| key | 说明 |
|-----|------|
| `gate` | 无担保人，未选模式 |
| `m-gate` | 有担保人，未选模式 |
| `ea-s1-disc` | Step 1: 设备未连接 |
| `ea-s1-ready` | Step 1: 设备就绪，等待扫描 |
| `ea-s1-matched` | Step 1: 匹配成功 |
| `ea-s1-fail1` | Step 1: 失败 1/3 |
| `ea-s1-fail2` | Step 1: 失败 2/3 |
| `ea-s1-fail3` | Step 1: 失败 3/3 → 强制切 Manual |
| `ea-s2-wait` | Step 2: RIB 等待中 |
| `ea-s2-done` | Step 2: RIB 已完成 |
| `ea-s3-ready` | Step 3: 设备就绪 |
| `ea-s3-fail1` | Step 3: 失败 1/3 |
| `ea-s3-fail2` | Step 3: 失败 2/3 |
| `ea-s3-otp` | Step 3: 失败 3/3 → OTP 兜底 |
| `ea-complete` | 全流程完成（Biometric）|
| `ea-amendment` | 完成 + Amendment 触发 |

### Manual Acceptance
| key | 说明 |
|-----|------|
| `m-ng-disc` | 无担保人，设备未连接 |
| `m-ng-ready` | 无担保人，就绪 |
| `m-ng-matched` | 无担保人，匹配成功 |
| `m-ng-fail` | 无担保人，失败（可继续）|
| `m-ng-skip` | 无担保人，跳过 |
| `m-g-disc` | 有担保人，双人均未连接 |
| `m-g-p-matched` | Primary 完成，Guarantor 进行中 |
| `m-g-both-matched` | 双人均匹配成功 |
| `m-g-skip` | 双人均跳过 |
| `m-dc-uploaded` | **模拟 Document Centre 上传完成 → 签约完成态** |

---

## 状态对象结构（S）

```javascript
S = {
  mode: 'ea' | 'manual',
  modeConfirmed: false,           // false = 显示 Mode Gate
  hasGuarantor: true | false,
  // EA flow
  eaStep: 1 | 2 | 3,
  s1Dev: 'disconnected' | 'scanning' | 'ready' | 'scanning-fp' | 'matched' | 'unmatched',
  s1Attempts: 0~3,
  s2RibStatus: 'waiting' | 'submitted',
  s3Dev: 'disconnected' | 'scanning' | 'ready' | 'scanning-fp' | 'matched' | 'unmatched',
  s3Attempts: 0~3,
  eaComplete: false,
  eaViaOTP: false,
  amendmentRequired: false,
  smsSent: false,
  // Manual flow
  manualDCUploaded: false,        // true = Document Centre 上传完成（Dev Tool 模拟）
  mBioPrimary:   { dev, done, attempts },
  mBioGuarantor: { dev, done, attempts },
}
```

---

## 技术注意事项

1. **htmlpreview CSP 限制**：innerHTML 里的 onclick 不能有箭头函数或 `{...}` 块。所有按钮动作提取为顶层命名函数。
2. **单 HTML 文件**：所有 CSS + HTML + JS 在一个文件内（~1500+ 行）
3. **推送方式**：`git add + commit + push origin session-v9`，预览链接不变
4. **template literals**：JS 里正常可用，只有 onclick 属性内不行

---

## 会话工作流程

**开始新会话时**：读 CLAUDE.md → 看"当前待办"→ 从高优先级开始
**完成一项任务后**：立即更新 CLAUDE.md 的待办状态
**用户说「更新待办」时**：同步最新状态到 CLAUDE.md 并 commit
**用户说「接着做」时**：读 CLAUDE.md，从上次中断处继续
