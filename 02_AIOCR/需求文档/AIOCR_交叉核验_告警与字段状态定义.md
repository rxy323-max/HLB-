# AIOCR 交叉核验（收入核验）原型 — 告警 / 字段状态 / 操作文案定义

> **用途**：供前后端开发对齐。本文档聚焦交叉核验原型中的**告警逻辑、字段/文件状态、操作按钮与文案**，是对 [aiocr-外网复刻.html](aiocr-外网复刻.html) 原型的规则化沉淀。
> **对齐基线**：本文档术语与定义对齐《AIOCR 需求文档》（OCR 部分），尤其 `§3.1 文件交叉验证`（§3.1.3 结果展示、§3.1.4 结果处理、§3.1.4.8 操作按钮定义）。下文凡引用即标注原文档章节号。
> **范围**：文件详情核验页（Step 1 核对识别 / Step 2 收入核算）+ 交叉核验结果列表页（Cross-Validation Results）。
> **状态标记**：`P0` 必做 · `🟡` 待业务确认 · `🔧` 后端提供

---

## 0. 与原文档的关系（先读）

原文档已定义一套**通用交叉验证框架**（7 类告警 + 5 个操作按钮 + 文件状态机）。本原型在该框架内，针对**收入类文件（Payslip 等）的逐细项核验与收入核算**做了具体化设计，并按 2026-06-17 评审做了两处调整：

1. **收入核算（旧 Step 3）不再产生"计算值 vs 印刷值"的公式（Formula）告警** —— 金额准确性在 Step 1 对原件核验，Step 2 只读展示与归类。详见 §1.4。
2. **三步合并为两步**：Step 1 核对识别（金额唯一编辑入口）+ Step 2 收入核算（归类 + 结果，金额只读）。

非收入类文件（身份证、VSO、EPF 等）仍走原文档 §3.1.4 的通用告警框架，本文档 §1.1 给出对照表。

---

## 1. 告警逻辑与定义

### 1.1 告警分类总表（对齐原文档 §3.1.4）

| # | 告警类型 | 含义 | 命中后操作按钮 | 本原型适用场景 |
|---|---------|------|---------------|---------------|
| 1 | **Consistency** 一致性 | 跨文件 / 与系统值不一致（File-to-System、File-to-File）| `Adopt Reference Value`(Phase2) · `Amend scanned result` · `Justification` · `Replace Document` | 身份类、VSO 等非收入文件 |
| 2 | **Formula** 公式计算 | 文件内数字关系（求和/比例/累乘），如各项收入之和=Gross | `Amend` · `Justification` · `Replace` | **收入类：本原型不在 Step 2 告警**（见 §1.4）；其他文件按原文档 |
| 3 | **Date Compare** 日期 | 与当前日期 / 跨文件日期校验，如工资单在近 3 个月内 | `Amend` · `Justification` · `Replace` | EPF / 收入文件时效 |
| 4 | **Fix Value** 固定值 | 字段须为某固定值（如 status=existing）| `Amend` · `Justification` · `Replace` | 通用 |
| 5 | **Exist** 存在性 | 某字段 / 签名必须存在有值 | `Justification` · `Replace`（**收入类补充 `+ Add Item`**）| 收入类必填科目缺失（见 §1.3-B）|
| 6 | **Eyeball Check** 人工复核 | 关键字段无交叉校验源，必须人工核对（如驾照 class、VSO 车辆信息）| `Verify All` · `Replace`（**收入类补充 `Skip with Note`**）| 收入类细项眼检（见 §1.3-A）|
| 7 | **General document rules** 大模型规则 | 缺页、正反面、签名齐全等大模型判断的逻辑 | `Justification` · `Replace` | 通用 |

> 操作按钮的统一行为定义见 §3，对齐原文档 §3.1.4.8。

### 1.2 告警的三维属性（🔧 后端返回）

每条告警须返回三个维度（驱动前端展示与操作）：

| 维度 | 字段 | 取值 | 用途 |
|------|------|------|------|
| 类型 | `kind` | consistency / formula / datecmp / fixvalue / exist / eyeball / genrules | 决定操作按钮组与文案 |
| 维度归类 | `dim` | File Consistency / Internal Logic / Business Validity / Existence / Eyeball / Image Quality | 仅展示分组 |
| 严重度 | `sev` | hard（Hard Fail，阻断提交）/ warn（Warning）/ check（Needs Check）| 决定是否阻断 + 颜色 |

> 备注（对齐原文档 §3.1.1 规则容错等级）：当前所有规则等级一致，**命中即需处理后方可提交**；High Priority / Alert 的分级为预留功能，本期不实现。

### 1.3 收入类文件（Payslip）专属告警 —— 两条独立告警栏 `P0`

收入核验 Step 1 顶部最多两条**相互独立**的橙色告警栏，对应两个不同操作，各自独立清除：

#### A. 👁 Eyeball Check（人工复核，对应原文档 §3.1.4.6）

| 项 | 定义 |
|----|------|
| 触发 | 存在未核验的眼检字段：Document Information 各项 + 标记 `eyeCheck` 的细项（**仅最近一期 `mIdx=0`**，更早期次为参考不强制）|
| 文案 | `👁 Eyeball check — N field(s) need a manual check against the source document.` |
| 操作按钮 | `✓ Mark All Verified`（一键核验全部）· `Skip with Note`（填理由跳过，= Justification）|
| 清除 | 全部核验或 Skip 后该栏消失；状态由卡片徽章 + 行内 `✓ Verified` 承载 |

#### B. ⚠ Missing Field（存在性缺失，对应原文档 §3.1.4.5 Exist）

| 项 | 定义 |
|----|------|
| 触发 | 必填收入科目无对应细项（OCR 未识别到），如 Basic Salary / Overtime 缺失 |
| 文案 | `⚠ Missing field — N required field(s) not detected by OCR. Add the line item or skip with a note.` |
| 操作按钮 | `+ Add Missing Item`（补录细项，自动归类到该字段）· `Skip with Note`（= Justification）|
| 清除 | 补录成功或 Skip 后该字段不再计入缺失 |

#### C. 图像质量告警（自动注入，对应原文档防伪/质检思路）

- 当文件存在边缘模糊页时，自动注入一条 `check / Image Quality` 告警：`Marginal page quality — Verify required`，操作 = `Verify All`，提示"AI 已提取但准确性无保证，提交前每字段须人工核验"。

### 1.4 收入核算（Step 2 / 结果）不再产生告警 —— 评审决策 `P0`

> 历史版本曾在 Step 3 对"计算合计 vs 印刷合计"做 Formula mismatch 告警 + 三按钮（调数字/调规则/跳过）。**0617 评审后移除。**

- **原因**：Step 2 的计算值是套用归类规则后的加工数据，与 OCR 印刷原值的差异不具备纠错意义；金额准确性应在 Step 1（识别值 vs 原件）核验完成。
- **现状**：Step 2 计算器表格平铺展示"计算值"与"印刷值（参照）"，**无 ✓/⚠ 判定、无 mismatch 横幅、无三按钮**。
- **公式可见性**：每个类目的"细项相加汇总值"以小字展示在该类目归类分组的组头（如 Other Income = TC Meal + TC Productivity + Performance Bonus），可见但**不告警**。
- **联调注意 🔧**：后端不需、也不应在 Step 2/结果层返回 mismatch 告警。

### 1.5 告警解决态（对齐原文档 §3.1.4.8 规则状态）

| 解决态 | 触发 | 表现 | 数据 |
|--------|------|------|------|
| 未解决 Unsolved | 默认 | 告警常驻，计入 Alert Count | — |
| 已修正 Fixed | `Amend` / `Verify All` / `Adopt` | 该规则状态→`fixed`，颜色转绿，移出待办 | `alertResolved[fileId][alertId]` |
| 已备注通过 Justified | `Justification`（填理由）| 转"Justified"+ 显示理由 + `↺ Undo`；**清空理由则恢复未解决** | `justifiedAlerts[fileId][alertId]=note` |
| 已请求替换 Pending Replace | `Replace Document` | 旧文件→`待替换`（不可再编辑），新文件→`验证中` | 见 §3.7 |

- **Hard Fail 未解决/未豁免时禁止提交**：提交按钮置灰，文案 `⛔ Cannot submit — resolve or justify Hard Fails first`。

### 1.6 告警在列表页的展示（对齐原文档 §3.1.3）

| 条件 | Alert Count | Alert Rules |
|------|-------------|-------------|
| File OCR Status = `Validation Succeeded` 且 count=0 | 绿色 ✓ | 空 |
| File OCR Status ∈ (`Recognizing`,`Recognition Failed`,`Validating`) 且 count=0 | 空 | 空 |
| File OCR Status = `Validation Failed` | 命中具体数量 | 展示 rule description |

---

## 2. 字段 / 行状态列表

### 2.1 细项金额（行值）状态 `P0`

> 仅 **Step 1** 可编辑金额；Step 2 只读（见 §3.8）。

| 状态 | 触发条件 | 视觉标记 | 对齐原文档 |
|------|---------|---------|-----------|
| 默认（已识别 Recognized）| OCR 识别值，未修改 | 无标签（可带置信分）| OCR 提取结果 |
| **Pending** 暂存 | 已输入新值但未点保存 | 橙色虚线输入框 + `Pending` 标签 | 本原型暂存模型 |
| **Edited** 已改 | 已保存，应用值 ≠ OCR 原值 | 橙色实线输入框 + `Edited` 标签 | = `Amend` 后规则 `fixed` |
| **Added** 新增 | 用户经"+ Add"手动新增的细项 | `Added` 标签（可与 Pending/Edited 共存）| 本原型补录 |
| **NOT DETECTED** 未识别 | 必填字段 OCR 未识别到 | 占位行 + `Add Item`/`Skip` 按钮，无金额框 | = §1.3-B Exist 告警 |
| **Review_Required** 待复核 🟡 | 字段格式/正则校验失败（原文档 Phase3）| 标红 + 错误原因 | 对齐原文档 §2.1.2 |

### 2.2 眼检（Verify）维度 —— 独立第二维状态 `P0`

仅用于 Document Information 行与标 `eyeCheck` 的细项：

| 状态 | 视觉标记 |
|------|---------|
| 未核验 | 橙色 `Verify` 按钮 + 整行待查高亮 |
| 已核验 | 绿色 `✓ Verified` |

> CED 角色收到的文件已被 Sales 核验，**默认全部显示已核验（clean view）**，无告警、无橙行（见 §4.3）。

### 2.3 归类映射（Step 2）状态 `P0`

| 状态 | 触发 | 视觉标记 |
|------|------|---------|
| 默认映射（AI）| AI 预分类的 bucket | 下拉显示当前归类 |
| **待应用** Draft | 改了下拉但未点应用 | 下拉浅蓝边框 + 行内小点 |
| **已应用** Applied | 点"应用并刷新"后 | 计算器实时重算，写入 Change Log |

---

## 3. 修改 / 编辑状态前后的提示与按钮文案

> 操作按钮统一行为对齐原文档 §3.1.4.8；以下补充本原型的"暂存→应用"模型与文案。

### 3.1 金额编辑（Step 1，唯一金额入口）

| 阶段 | 行/区域表现 | 文案 / 按钮 |
|------|-----------|-----------|
| 编辑前 | 输入框显示 OCR 识别值 | — |
| 输入中（暂存）| 行标 `Pending`、橙虚线框；顶部出现 sticky 暂存条 | 暂存条：`✎ N amount change(s) staged — totals refresh after you save` ／ 按钮 `✓ Save & refresh totals` |
| 应用后 | 行标 `Edited`、橙实线框；绿行闪烁 | Toast：`Saved — totals recalculated.` |

### 3.2 归类编辑（Step 2）

| 阶段 | 表现 | 文案 / 按钮 |
|------|------|-----------|
| 改下拉（暂存）| 下拉浅蓝边框 + 小点；顶部 sticky 条 | `✎ N classification change(s) pending — totals refresh after you apply` ／ 按钮 `↻ Apply & refresh` |
| 应用后 | 计算器与组头汇总实时重算；写入审计 | `Applied — totals recalculated.` + Change Log 一行（时间 · 细项 · from→to）|

### 3.3 新增细项 Add Item（Step 1）

- 入口：告警栏 `+ Add Missing Item`（预置缺失字段）／每期 `+ Add item to this period`／缺失占位行 `Add Item`。
- 弹窗 `Add Missing Item` / `Add <类目>`：字段 = 细项名(原文)`*` · 英文标注(选填) · 类型(earning/deduction)；按钮 `Cancel` / `Add Item`。
- 保存后：新行标 `Added`，自动归类到对应 bucket；缺失提示即时关闭。

### 3.4 删除新增细项

- 仅"Added"细项可删：行尾 `×`（hover 标红），点击即删（`removeCustomLine`）。
- OCR 原始细项不可删，"减少"通过归类下拉选 `Exclude`（不计入收入）。

### 3.5 眼检 Verify / Mark All Verified（对应 §1.3-A）

| 操作 | 前 | 后 |
|------|----|----|
| 单行 `Verify` | 橙色待查 | 绿色 `✓ Verified` |
| `✓ Mark All Verified` | 多项待查 | 全部转 `✓ Verified`，告警栏消失，Toast 提示 |

### 3.6 Justification / Skip with Note（对齐原文档 §3.1.4.8-2）

- 弹窗输入自定义理由，**≤200 字符**，不限格式。
- 保存后该规则状态→`fixed`、颜色转绿；**清空理由则恢复未解决态**。
- 理由透传下游并计入审计。

### 3.7 Replace Document（对齐原文档 §3.1.4.8-3）

| 阶段 | 表现 |
|------|------|
| 点击 `Replace` | 弹出上传框（格式/大小/防伪校验同 OCR 上传，batch1 限传 1 个）|
| 上传成功 | 旧文件状态→`待替换`（Pending Replace，**不可再编辑/不可重复替换**），新文件→`验证中`(Validating)；replace 前的其他修改保存在旧文件 |
| 重新校验 | 新文件重跑校验，不通过仍可再次 Replace |

### 3.8 Step 2 金额只读 + 点击回 Step 1 改 `P0`

- Step 2 拆解区金额为**只读小字（无币种 RM）**，仅作结论展示。
- **点击任一金额** → 跳转 Step 1、闪烁该细项各期行、并**聚焦对应期次的输入框**直接改（`editAmtInStep1`）。
- 设计原理：金额=数据准确性=核验任务（需对原件 + 审计）属 Step 1；归类=判断任务属 Step 2。两步职责不重叠。

### 3.9 Amend scanned result（非收入类文件，对齐原文档 §3.1.4.8-1）

- 点击 `Amend` → 定位到规则对应字段，手工修改识别值（**≤100 字符**）；
- 修改后该规则状态→`fixed`、颜色转绿；Region/公式如有联动则重算。

---

## 4. 其他需提前定义的状态（开发对齐）

### 4.1 文件状态 / 文件 OCR 处理状态（对齐原文档 §1.1.1.10-B、表9）`🔧`

**File Status**（文件业务生命周期）：`File Exception` · `Upload Succeeded` · `OCR Processing` · `OCR Processed`（+ 交叉核验维度：`待人工确认` · `已验证通过` · `待替换`）。

**File OCR Status**（本模块涉及的取值）：`Recognizing` · `Recognition Failed` · `Validating` · `Validation Failed` · `Validation Succeeded` · `Manual Override` · `Pending Replace` · `OCR Failed`（整批失败）。

> 识别失败兜底（对齐原文档 §3.1.3）：识别 3 次仍失败 → `Recognition Failed`，不参与规则校验，列表照常展示，人工走 Manual Override / Replace。

### 4.2 Step 卡状态徽章 `P0`

| 卡 | 待处理 | 完成 |
|----|--------|------|
| Step 1 · 核对识别 | `N Pending`（橙）| `Verified`（绿）|
| Step 2 · 收入核算 | `N Pending`（橙，仅数归类待应用）| `Computed`（绿）|

### 4.3 角色差异 `P0`

| 角色 | 告警 | 眼检默认 | 金额/归类编辑 |
|------|------|---------|--------------|
| Sales | 全部告警可见 | 需逐项核验 | Step1 改金额、Step2 改归类 |
| CED | clean view：无告警、无橙行 | 默认全部已核验 | 仍可编辑（文案：Verified by Sales. You can adjust any value before approving.）|

### 4.4 两套体验方案（原型演示用，非上线功能）🟡

- 切换钮 `Option 1 (1→2)` / `Option 2 (2→1)`：仅控制 Step 1、Step 2 的**展示顺序**，与角色、告警可见性、编辑权限完全解耦。
- 上线时按业务确认结果保留一套（待定）。

### 4.5 列表页状态筛选（对齐原文档 §3.1.3）`🔧`

- 按状态：`All` / `Exception` / `Verified` / `Pending Re-validation` / `Pending Replace`。
- 按文件类别 / 文件类型筛选；底部唯一主操作 `Revalidation & Submit Results`。

---

## 附：本模块操作按钮速查

| 按钮 | 出现位置 | 行为 | 来源 |
|------|---------|------|------|
| `Verify` / `✓ Mark All Verified` | Step1 眼检 | 标记已核验 | §3.5 |
| `+ Add Missing Item` / `+ Add item to this period` / `+ Add Pay Period` | Step1 | 补录细项 / 期次 | §3.3 |
| `×`（Remove）| Step1 / Step2 拆解 | 删除 Added 细项 | §3.4 |
| `✓ Save & refresh totals` | Step1 暂存条 | 应用金额暂存 | §3.1 |
| `↻ Apply & refresh` | Step2 暂存条 | 应用归类暂存 | §3.2 |
| 归类下拉 / `Exclude` | Step2 拆解 | 改映射 / 移出收入 | §2.3 / §3.4 |
| `Skip with Note` / `Justification` | 告警 | 填理由通过 | §3.6 |
| `Amend scanned result` | 非收入类告警 | 修正识别值 | §3.9 |
| `Replace Document` | 告警 | 替换文件 | §3.7 |
| `Adopt Reference Value`(Phase2) | Consistency 告警 | 采用参考值 | §1.1 |
| `Revalidation & Submit Results` | 列表页 | 重核并提交 | §4.5 |
