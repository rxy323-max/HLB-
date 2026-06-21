# AIOCR 交叉核验模块 — 功能需求文档（FRD）

> **用途**：供前端、后端开发与联调使用。覆盖功能规格、字段与状态枚举、告警/异常模型、评审遗留问题、数据契约建议。
> **对应原型**：[aiocr-外网复刻.html](aiocr-外网复刻.html)（branch `session-v9`，可交互演示）
> **配套文档**：[AIOCR_交叉核验评审纪要与优化方案_20260617.md](AIOCR_交叉核验评审纪要与优化方案_20260617.md)（设计取舍与会议结论）
> **版本**：v1.0 / 2026-06-21
> **状态约定**：✅ 已在原型实现 · 🟡 待确认（见 §11） · 🔧 后端依赖

---

## 0. 文档导读

| 章节 | 读者 |
|------|------|
| §1–4 范围 / 角色 / 两套方案 / 页面结构 | 全体 |
| §5 交叉核验列表页 | 前端 + 后端 |
| §6 文件详情页框架 | 前端 |
| §7 收入核验三步法（Step 1/2/3） | 前端 + 后端（核心） |
| §8 细项状态枚举 | 前端 |
| §9 告警 / 异常状态模型 | 前端 + 后端（核心） |
| §10 OCR / 文件状态枚举 | 后端 |
| §11 评审遗留问题 | 全体（联调前必读） |
| §12 数据契约建议 | 后端 |
| §13 边界与异常处理清单 | 联调 |
| §14 附录：字段字典 | 后端 |

---

## 1. 范围与定位

### 1.1 模块定位

AIOCR 交叉核验模块位于贷款申请流程的「文件上传 → OCR 识别 → **交叉核验** → 审批/放款」环节，负责：

1. 把 OCR 从文件中识别出的字段，与系统（CDM）已有数据、文件之间、业务规则做交叉校验；
2. 对**收入类文件**（Payslip 等）提供逐细项的人工核验、规则分类、收入汇总计算；
3. 把核验结果透传给下游 CED（信审）/ CRA（放款）使用。

### 1.2 本文档覆盖的页面

| 页面 | 说明 | 本文档章节 |
|------|------|-----------|
| Cross-Validation Results（交叉核验列表页） | 一个申请下所有文件的核验结果汇总表 | §5 |
| 文件详情/核验页（File Detail） | 单个文件的字段核验工作台 | §6 |
| 收入核验三步法 | 文件详情页中，收入类文件特有的 Step 1/2/3 | §7 |

### 1.3 不在本文档范围

- 文件上传与分类（Classification）页面的内部交互；
- OCR 引擎本身（识别准确率、VSOCR 失败等属引擎层问题）；
- 放款（Disbursement）阶段的 CRA 专属规则。

---

## 2. 角色与术语

| 角色 | 全称 | 在本模块的职责 |
|------|------|---------------|
| **Sales** | 销售 | 上传材料、Step 1 核验识别值与图片原文一致、补录缺失字段 |
| **CED** | Credit Evaluation Department（信审） | 申请阶段审核：Step 2 规则分类、确认收入计算结果、做批准/拒绝决策 |
| **CRA** | Credit Administration（放款行政） | 签约后放款阶段审查（不在本模块核心范围） |

| 术语 | 含义 |
|------|------|
| 细项 / Line Item | Payslip 上的一行收入或扣减项（如 Basic Salary、EPF）|
| Bucket / 科目 | 细项被归类到的标准收入/扣减科目（见 §14.1）|
| Eyeball Check / 眼检 | AI 无法自动校验、需人工对照原件确认的字段 |
| Pay Period | 一期工资单（一个月），收入类文件可有多期 |
| printed 值 | 文件上印刷的合计数（Gross/Deductions/Net），用于与计算值并列展示 |

---

## 3. 两套体验方案（方案1 / 方案2）✅

> ⚠️ **重要**：这是当前阶段为「面对面确认哪种步骤顺序更好」而并存的**两套展示方案**，与角色无关。开发时应支持切换，**不要把它写死成某角色专属**。最终上线只保留一套（待确认，见 §11-1）。

| 方案 | 步骤顺序 | 默认展开 | 设计意图 |
|------|---------|---------|---------|
| **方案1** | Step 1 → 2 → 3 | Step 1 展开 | 数据优先：从原始细项开始，逐步加工到结果 |
| **方案2** | Step 3 → 2 → 1 | Step 3 + Step 2 展开 | 结果优先：先看汇总结果，需要时下钻到规则/细项 |

实现要点：
- 方案选择由一个独立开关控制（原型中 `curScheme()` / `setScheme()`），**与角色字段（`role`）解耦**；
- 切换方案只改变步骤卡片的**顺序**和**默认展开状态**，不改变任何告警可见性、编辑权限；
- 方案1 额外多展示 4 个 Document Information 字段（见 §7.2.1），方案2 不展示。

---

## 4. 整体页面结构与导航

```
文件上传与分类页
   └─ Tab: [File List] [Cross-Validation Results]   ← §5 列表页
            └─ 行内「编辑」按钮 → 文件详情/核验页      ← §6
                                   └─ 收入类文件: Step 1/2/3   ← §7
```

- 列表页底部唯一主操作：**Revalidation & Submit Results**（重新核验并提交结果）；
- 文件详情页顶部导航：`‹ 返回` · `‹ Previous` · `Next ›` · `Save`（见 §6.1）。

---

## 5. 交叉核验列表页（Cross-Validation Results）✅

### 5.1 页面构成

1. **顶部工具条**：Search values（关键字）、Subject（下拉）、Category（下拉）、OCRStatus（下拉）、`Search`、`Reset Filters`、`Download`、`Refresh`；
2. **结果表格**（见 5.2 列定义）；
3. **底部栏**：`Total N items` · `N Files with issues` · `Revalidation & Submit Results`（主按钮，右对齐）。

### 5.2 表格列定义

| 列 | 字段 | 说明 | 来源 |
|----|------|------|------|
| ☐ | — | 行选择 checkbox | 前端 |
| Original File Name | `originalFileName` | 上传时原始文件名 | 后端 🔧 |
| File Name | `fileName` | 分类后规范文件名 | 后端 🔧 |
| Subject | `subject` | 主体（Applicant / Guarantor / CASE_LEVEL…）| 后端 🔧 |
| Category | `category` | 文件大类（见 §14.3）| 后端 🔧 |
| File Type | `fileType` | 文件细类（Mykad / Payslip / VSO…）| 后端 🔧 |
| File OCR Status | `ocrStatus` | OCR/核验状态（见 §10.1）| 后端 🔧 |
| Alert Count | `alertCount` | 告警数；0 时显示绿色 ✓ | 后端 🔧 |
| Alert Rules | `alertRules[]` | 命中的规则名列表（如 `General Document Rules:5`）| 后端 🔧 |
| Justification | `justification` | 已填理由（含 `?` 提示图标）| 后端 🔧 |
| Action | — | 行内：`下载` + `编辑`（进入文件详情页）| 前端 |

### 5.3 交互规则

- **编辑按钮**：进入对应文件的详情/核验页（§6）。`File Type` 决定进入哪种详情视图（见 §7.1 判定）；
- **Revalidation & Submit Results**：触发重新核验 + 提交。🔧 后端需提供「按申请批量重新核验」接口；
- **Download**：导出当前筛选结果（CSV/Excel）；
- 列表为只读汇总，所有修改都在文件详情页内完成，返回后列表刷新对应行状态。

---

## 6. 文件详情页框架 ✅

### 6.1 按钮框架（已对齐真实系统，精简且统一）

> 设计原则：**全局按钮保持一致、精简，不重复**。Save / Submit / Save-as-Draft 属于全局应用级按钮栏（页面最外层），核验页内不重复堆叠。

| 区域 | 元素 | 行为 |
|------|------|------|
| 顶部左 | `‹` 返回 | 关闭详情，回列表页 |
| 顶部右 | `‹ Previous` / `Next ›` | 在同一申请的文件间翻页 |
| 顶部右 | `Save`（主按钮）| 保存当前文件的核验改动 |
| 顶部右（收入类，仅原型演示）| `方案1 / 方案2` 切换 | 见 §3；上线时按最终决定保留一套或移除 |
| 底部（仅收入类）| 收入汇总只读信息 | `Avg verifiable income (3 mo): RM x/mo` + `(N confirmed rules)`，无按钮 |
| 文件分类工具条 | `category` / `fileType` 下拉 + `Confirm` | 修正文件分类（与真实系统一致）|

**非收入类文件**：无底部栏，仅顶部 Previous/Next/Save。

### 6.2 布局

- **左栏**：核验工作区（收入类=Step 1/2/3 卡片；非收入类=字段列表 + 告警）；
- **右栏**：原文 PDF 预览（页码、缩放、旋转），与左栏字段联动定位（hover/点击高亮）。

### 6.3 非收入类文件的核验区（字段 + 告警）

- **VALIDATION ALERTS**：该文件命中的告警卡片列表（见 §9）；
- **FIELDS**：OCR 提取字段（Field / OCR Value / Conf. 三列）；可逐字段 Amend；
- 字段为空且无告警时显示 `no fields`（如示例 Payslip 6/6 页）。

---

## 7. 收入核验三步法（Step 1 / 2 / 3）✅

### 7.1 适用判定 🔧🟡

- 仅**收入类文件**走三步法。原型中由 `FILE_DETAIL[fileId].lineItemMode = true` 标识（当前仅 Payslip）；
- **判定来源（待后端确定）**：会议结论是后端直接返回一个布尔/枚举字段，**不要让前端用 `category` + `fileType` 组合推断**（见 §11-2）；
- 非 Payslip 的简单收入文件（无复杂分类规则）应**只显示 Step 1**，自动收起 Step 2/3（🟡 折叠态样例待补，见 §11-4）。

### 7.2 Step 1 · 细项核验（Sales 主责）

Step 1 = 把 OCR 识别出的所有内容**完整搬过来**，由人工核验「识别值 == 图片原文」。分为两个区块：

#### 7.2.1 Document Information（文档信息区，与 Pay Period 同级）

逐字段展示 + 眼检（Verify）。字段集**随方案不同**：

| 字段 | key | 方案1 | 方案2 | 示例值 |
|------|-----|:----:|:----:|--------|
| Employer Name | `ei_employer` | ✓ | ✓ | Malaysia Airlines Berhad |
| Employee IC / ID | `ei_name` | ✓ | ✓ | MOHD ZULKURNAIN · IC … |
| Currency | `ei_currency` | ✓ | ✓ | MYR |
| Pure Commission | `ei_comm` | ✓ | ✓ | No |
| EPF Scheme | `ei_govt` | ✓ | ✓ | Private sector |
| EPF % | `ei_epfpct` | ✓ | ✗ | 11% |
| Conversion Rate | `ei_convrate` | ✓ | ✗ | 1 |
| Is Customer MNC/PLC/GLC | `ei_mncplcglc` | ✓ | ✗ | No |
| Government Employee without EPF Contribution | `ei_govtnoepf` | ✓ | ✗ | No |

> 字段集对齐真实 Income Calculator 页面表头。方案1 多出的 4 个字段是 Calculator 表格上方的配置项。

#### 7.2.2 Pay Period 细项区（按期重复）

每个 Pay Period 一组，内含 EARNINGS / DEDUCTIONS 两类细项行。每行结构：

`[定位图标] [细项名（Malay 主 + English 副）] [标签] [RM 金额输入框] [Verify 列]`

细项数据见 §14.2（RULE_ITEMS）。每期合计有 printed 值（`ocrGross`/`ocrDed`/`ocrNet`）用于 Step 3 并列展示。

#### 7.2.3 两条独立告警栏（核心交互）

Step 1 顶部最多两条**互相独立**的橙色告警栏，分别对应两个不同操作：

| 告警 | 触发 | 操作按钮 |
|------|------|---------|
| 👁 **Eyeball Check** | 存在未核验的眼检字段（Document Info 项 + 标了 `eyeCheck` 的细项，仅最近一期）| `Mark All Verified` / `Skip with Note` |
| ⚠ **Missing Field** | 必填收入科目无对应细项（OCR 未识别到）| `+ Add Missing Item` / `Skip with Note` |

- 两条各自独立清除，互不影响；
- 全部清除后两栏消失，状态由卡片 badge + 行内标记承载。

#### 7.2.4 眼检范围（降噪规则）✅

- 眼检**只针对最近一期**（`mIdx===0`）；更早期次作为参考，不重复要求核验；
- `RULE_ITEMS` 中仅 `Basic Salary`(r1) 与 `Performance Bonus`(r4) 标了 `eyeCheck:true`，其余细项不强制眼检。

#### 7.2.5 金额暂存-保存模型（下游可溯）✅

> 防止「边改边联动」造成 Step 3 数字乱跳，采用暂存机制。

- 输入金额 → 进入**暂存态**（`lineAmtDraft`），Step 3 合计**不变**；行显示 `Pending` 标签 + 橙色虚线输入框；
- 顶部出现 sticky apply 条，显示「N amount changes staged」+ `Save & refresh totals` 按钮；
- 点击保存 → 提交到 `lineAmt`，Step 3 重算，绿行闪烁 + Step 3 区段闪烁 + Toast「Saved — Step 3 totals recalculated」；已提交行显示 `Edited` 标签 + 橙色实线框。

#### 7.2.6 Add Item（补录细项）✅

- 入口：`+ Add Missing Item`（告警栏，预填缺失字段）/ `+ Add item to this period`（每期底部）/ 缺失占位行的 `Add Item`；
- **范围限定当前周期**：新增细项只出现在触发它的那一期（`mIdx`）；多期需要则分别添加；
- 弹窗字段：细项名（必填）、英文注释、类型（earning/deduction）；
- 保存后：自动映射到一个默认收入科目（`ai` bucket），自动写入 Step 2 规则映射（CED 仍可改），若是补缺失必填字段则同时关闭该缺失提示；
- 行标记 `Added`，可删除。

### 7.3 Step 2 · 规则映射（CED 主责）

Step 2 = **纯类型→科目映射**，**不涉及金额**。

- 默认规则已预置（每个细项类型有 AI 默认 bucket，见 §14.2 的 `ai` 字段）；
- 仅 **Sales 新补录的类型**需要 CED 确认映射（`newTypeGaps`）；
- 交互：每行一个科目下拉（earning→EARNING_BUCKETS / deduction→DEDUCTION_BUCKETS，见 §14.1），暂存为 `ruleDraft`；
- 有未应用变更时顶部出现「N rule changes pending」+ `Confirm & Refresh` 按钮 → 提交到 `ruleMap`，Step 3 重算，写入 Change Log（审计）；
- **规则按类型配置一次，应用到所有期次**（不是按月配）；
- Step 2 **保留告警**（规则映射缺口等），这点与 Step 3 不同（见 §9.6）。

### 7.4 Step 3 · 结果展示（表格化，纯展示无告警）✅

> 会议结论：Step 3 是已加工数据的**纯结果展示**，**不再承担告警/mismatch 判定**（见 §9.6）。

#### 7.4.1 表格结构（对齐真实 Income Calculator）

- **行** = 每个 Pay Period；**列** = 收入/扣减科目；
- Gross / Total Deductions / Net Pay 各自「计算值」与「printed 值」**并列两列**，printed 列灰底、无对错图标；
- 底部 `Total` + `Average` 两行汇总（按列汇总/平均）；
- 末行：`Average verifiable income across N periods (excl. policy items): RM x`。

列顺序：Basic Salary · Total Allowances · Overtime · Bonus/Commission · Other Income · EPF(Employee) · SOCSO/EIS · PCB/Tax · Other Deduction · Gross(calc.) · Gross(printed) · Deductions(calc.) · Deductions(printed) · Net Pay(calc.) · Net Pay(printed) · Verifiable Income。

#### 7.4.2 公式明细（脚注）✅

- 由多个细项加总的格子，数值后加角标（如 `RM 13,149.00¹`）；
- 表格下方有可展开区域「N formula breakdowns — click to view」，默认收起，点开按脚注顺序列出完整算式（如 `03/2025 · Other Income = TC Meal Allowance: RM 3,185.00 + TC Productivity Allowance: RM 9,464.00 + Performance Bonus: RM 500.00`）；
- hover 单元格也显示该算式（快速查看）；
- Total/Average 行不带脚注。

#### 7.4.3 Step 3 状态

| 状态 | 条件 | 展示 |
|------|------|------|
| Pending（灰）| Step 1 或 Step 2 未完成 | 灰色等待提示，表格隐藏/置灰 |
| Reconciled（绿）| Step 1、2 均完成 | 表格正常展示 |

### 7.5 收入计算口径 🔧

- **Verifiable income（可核收入）** = 各**收入科目**之和，**排除** `exclude` 科目（政策性/不计收入项）；
- 多期取平均（原型 `payslipAvgIncome` = 各期 `incomeGross` 之和 / 期数）；
- `grossAll`/`dedAll` = 所有捕获细项之和（用于与 printed 值并列，**不做对错判定**）；
- 🔧 真实计算口径（哪些科目计入、变量收入 ÷12 平均、≤12 个月历史等规则）需后端按 CED 收入政策实现，见 §14.4 的 `FIELD_RULE_OPTS`。

---

## 8. 细项行状态枚举 ✅

Step 1 / 2 细项行的状态（前端渲染依据）：

| 状态 | 触发条件 | 视觉标记 |
|------|---------|---------|
| 默认（已识别）| OCR 识别值，未修改 | 无标签 |
| **Pending** | 已输入新值，未点保存（暂存）| 橙色虚线输入框 + `Pending` 标签 |
| **Edited** | 已保存，应用值 ≠ OCR 原值 | 橙色实线输入框 + `Edited` 标签 |
| **Added** | 用户手动新增的细项 | `Added` 标签（可与 Pending/Edited 共存）|
| **NOT DETECTED** | 必填字段 OCR 未识别到 | 占位提示行，`Add Item` / `Skip` 按钮，无金额输入框 |

**Verify（眼检）维度**（独立的第二维状态，仅 Document Info 行与标了 `eyeCheck` 的细项）：

| 状态 | 标记 |
|------|------|
| 未核验 | 橙色 `Verify` 按钮 + 整行 needs-check 高亮 |
| 已核验 | 绿色 `✓ Verified` |

> CED 视角下文件已被 Sales 核验过，默认全部显示已核验（clean view）。

---

## 9. 告警 / 异常状态模型 ✅🔧

### 9.1 告警三维属性

每条告警由三个维度描述（🔧 后端需在核验结果中返回）：

**① 严重度 `sev`**

| 值 | 标签 | 含义 |
|----|------|------|
| `hard` | Hard Fail | 阻断提交，必须解决或 Justify |
| `warn` | Warning | 警告，建议处理 |
| `check` | Needs Check | 需人工核对（眼检/存在性）|

**② 维度 `dim`**（命中的校验类别，仅展示用）：File Consistency / Internal Logic / Business Validity / Existence / Eyeball / Existence / Image Quality。

**③ 类型 `kind`**（决定操作建议与文案）：

| `kind` | 含义 | 推荐操作 |
|--------|------|---------|
| `consistency` | 跨文件/与 CDM 不一致 | Amend / Replace |
| `eyeball` | 需人工对照原件 | Verify All / Justify |
| `exist` | OCR 未检测到字段 | Amend（补录）/ Justify |
| `recency` | 文件时效不符（如 EPF 月份过旧）| Replace |
| `datefmt` | 日期格式/范围异常 | Amend / Replace |

### 9.2 告警操作 `acts`

| key | 标签 | 行为 |
|-----|------|------|
| `amend` | Amend scanned result | 修正 OCR 识别值并保存 |
| `replace` | Replace Document | 请求替换文件（重新上传/重跑）|
| `verifyall` | Verify All | 一键核验该告警下所有眼检字段 |
| `justify` | Justification | 填理由后放行（见 9.3）|
| `adopt` | （特定场景）采纳参考值 | — |

每条告警有一个 `rec`（推荐操作），UI 高亮。

### 9.3 告警解决态

| 态 | 触发 | 表现 | 数据 |
|----|------|------|------|
| 未解决 | 默认 | 告警卡片常驻，计入 Alert Count | — |
| 已解决 | 点 amend/replace/adopt | 卡片转「已解决」并从待办移除 | `alertResolved[fileId][alertId]={how}` |
| 已豁免 | Justify & proceed（填理由）| 卡片转「Justified」+ 显示理由 + `Undo` | `justifiedAlerts[fileId][alertId]=note` |

- Hard Fail 未解决/未豁免时，**禁止提交**（提交按钮 disabled，文案「Cannot submit — resolve or justify Hard Fails first」）；
- Justify 需填写理由（textarea），理由透传下游并计入审计。

### 9.4 告警在三步法中的归属

| 告警类别 | 归属步骤 | 说明 |
|---------|---------|------|
| Eyeball Check（眼检）| **Step 1** | 识别值 vs 图片原文 |
| Existence（字段存在性/缺失）| **Step 1** | 必填字段是否被识别到 |
| 规则映射缺口（新补录类型未映射）| **Step 2** | 类型→科目 |
| 合计一致性（Gross/Net 等）| **不再产生告警** | Step 3 纯展示，见 §9.6 |

### 9.5 图像质量告警（自动注入）

- 当文件存在「边缘模糊/marginal sharpness」页时，自动注入一条 `check` 级告警（`dim: Image Quality`），提示「AI 提取了值但准确性无保证，提交前每个字段必须人工核验」，操作 = Verify All。

### 9.6 ⚠ Step 3 不再有告警（与旧版本的差异）✅

历史版本曾在 Step 3 对「计算合计 vs printed 合计」做 mismatch 判定并给三按钮（调数字/调规则/跳过接受）。**0617 评审后已移除**：

- 原因：Step 3 是套用 Step 2 规则后的加工数据，与 OCR 原始 printed 值的差异不具备纠错意义；真正的准确性校验应在 Step 1（识别值 vs 图片）完成；
- 现状：Step 3 只平铺展示计算值与 printed 值，**无 ✓/⚠ 图标、无 mismatch 横幅、无三按钮**；
- **联调注意**：后端不需要、也不应在 Step 3 层返回 mismatch 告警；合计差异（若存在）由前端如实并列展示即可。

---

## 10. OCR / 文件状态枚举 🔧

### 10.1 File OCR Status（列表页 `ocrStatus`）

| 值 | 含义 |
|----|------|
| `Validating` | 核验进行中 |
| `Validation Succeeded` | 核验通过（Alert Count 显示绿 ✓）|
| `Validation Failed` | 核验命中告警 |
| `Manual Override` | 人工覆盖（已人工处理）|
| `OCR Succeeded` | OCR 完成（尚未/无需交叉核验）|

### 10.2 File Status（文件生命周期，上传/分类页）

`Upload Succeeded` → `OCR Processing` → `OCR Processed`。

### 10.3 OCR 识别失败兜底 🔧

- 当某文件 OCR 识别失败（如 VSOCR 不识别），应有兜底态：跳过该文件的自动核验 → 走人工 Manual Override / Replace 重跑；
- 「Other Documents (Non AI Scanning)」类文件天然走人工核验，不进 OCR。

---

## 11. 评审遗留问题 / 待确认项 🟡

> **联调与排期前必读。** 以下为 0617 评审尚未拍板或依赖他方的事项。

| # | 事项 | 当前状态 | 待确认方 |
|---|------|---------|---------|
| 1 | 方案1 / 方案2 最终保留哪一套（步骤顺序）| 原型两套并存，待面对面确认 | 业务（危俊等）|
| 2 | 文件是否走 Step1-3 的判定字段 | 需后端直接返回布尔/枚举，**前端不自行用 category+fileType 推断** | 后端 🔧 |
| 3 | Pay Period 日期字段交互形式 | 纯文本 or 日期选择器，未定 | 业务（危俊）|
| 4 | 非 payslip 简单收入文件「仅 Step 1」折叠态样例 | 原型未做 | 前端补样例后确认 |
| 5 | 收入计算精确口径（÷12 平均、变量收入、≤12 月历史等）| 见 §14.4 选项，具体政策待定 | CED + 后端 🔧 |
| 6 | 整体开发方式（改造现有接口 vs 新增）| 赵倩评估「基本相当于重做」，需拉后端定方案 | 后端 🔧 |

---

## 12. 数据契约建议（给后端）🔧

> 以下为**建议结构**，字段名以后端最终接口为准。目的是让前端拿到的核验结果能直接驱动本文档定义的 UI。

### 12.1 列表页：一个申请的核验结果

```jsonc
{
  "applicationId": "APP-xxxx",
  "files": [
    {
      "fileId": "string",
      "originalFileName": "AINA WAHIDA MYVI H.pdf",
      "fileName": "Payslip.pdf",
      "subject": "Applicant",
      "category": "Applicant Income",
      "fileType": "Payslip",
      "ocrStatus": "Validation Failed",     // §10.1 枚举
      "isIncomeFlow": true,                  // §11-2：是否走 Step1-3，后端直接给
      "alertCount": 2,
      "alertRules": ["Payslip - id_no Consistency", "Eyeball Check"],
      "justification": "string|null"
    }
  ]
}
```

### 12.2 文件详情：告警

```jsonc
{
  "fileId": "string",
  "alerts": [
    {
      "id": "idcons",
      "title": "Mykad - id_no Consistency",
      "sev": "hard",                  // hard|warn|check
      "dim": "File Consistency",
      "kind": "consistency",          // consistency|eyeball|exist|recency|datefmt
      "fields": ["id_no"],
      "compare": { "ocr": "870420-49-5767", "expected": "870420-49-5767-05", "source": "CDM" },
      "acts": ["amend", "replace"],
      "rec": "amend",
      "locate": { "field": "id_no", "page": 2 }   // 用于 PDF 联动定位
    }
  ]
}
```

### 12.3 收入类文件：Step 1/2/3 数据

```jsonc
{
  "fileId": "payslip",
  "documentInfo": [
    { "key": "ei_employer", "label": "Employer Name", "value": "..." }
    // 方案1 额外返回 ei_epfpct / ei_convrate / ei_mncplcglc / ei_govtnoepf
  ],
  "payPeriods": [
    {
      "periodLabel": "03/2025",
      "earnings":   [ { "type": "Basic Salary", "amount": 9673.00, "eyeCheck": true } ],
      "deductions": [ { "type": "EPF Employee Contr.", "amount": 2167.00 } ],
      "printed": { "gross": 22822.00, "deductions": 3251.10, "net": 19570.90 }
    }
  ],
  "ruleMapping": [
    { "type": "Basic Salary", "bucket": "earning_basic_salary", "isDefault": true, "addedBySales": false }
  ]
}
```

### 12.4 提交核验结果（写回）

需支持：
- 单字段 Amend（修正识别值 + 是否人工核验）；
- 细项金额修改（按 `fileId + period + type`）；
- 规则映射变更（`type → bucket`，含审计 from/to/timestamp）；
- 补录细项（含所属 period）；
- 告警处理（resolved how / justified note）；
- 申请级「Revalidation & Submit」批量重核。

---

## 13. 边界与异常处理清单（联调用）🔧

| 场景 | 期望行为 |
|------|---------|
| OCR 完全未识别到任何细项 | Step 1 展示空 + 全部必填字段为 NOT DETECTED；引导补录或 Justify |
| 必填收入科目缺失 | 触发 Missing Field 告警栏；补录后自动消除 |
| 同一类型在某期有、某期无 | 各期独立；缺的期次不强制补（补录限定单期）|
| 金额改后未保存就离开 | 暂存值不影响 Step 3；🟡 是否提示「有未保存改动」待定 |
| Hard Fail 未解决就点提交 | 阻断，提示先解决/豁免 Hard Fails |
| 多期工资单期数 > 列展示空间 | Step 3 表格横向滚动（已实现 overflow-x）|
| CED 收到的文件 | 默认 clean view（无告警、无待核验标记，全部显示已核验），但仍可编辑任意值 |
| 文件 OCR 识别失败 | 走兜底：Manual Override / Replace 重跑（§10.3）|
| 非收入类文件 | 仅字段 + 告警视图，无 Step 1/2/3，无底部收入栏 |
| 图像模糊页 | 自动注入 Image Quality 眼检告警，要求逐字段核验 |
| Step 3 计算值 ≠ printed 值 | **不报错**，如实并列展示（§9.6）|

---

## 14. 附录：字段字典

### 14.1 收入/扣减科目（Bucket）

**收入（earning）**：

| key | label |
|-----|-------|
| `earning_basic_salary` | Basic Salary |
| `earning_total_allowances` | Total Allowances |
| `earning_overtime_pay` | Overtime |
| `earning_bonus_commission` | Bonus / Commission |
| `earning_others` | Other Income |
| `exclude` | Exclude (not income) |

**扣减（deduction）**：

| key | label |
|-----|-------|
| `deduction_epf_employee` | EPF (Employee) |
| `deduction_socso_eis` | SOCSO / EIS |
| `deduction_pcb_tax` | PCB / Tax |
| `deduction_angkasa_and_loan` | Angkasa / Loan |
| `deduction_other_deductions` | Other Deduction |
| `exclude` | Exclude (ignore) |

### 14.2 Payslip 细项类型（RULE_ITEMS，含默认映射）

| id | type（内部键）| Malay | English | kind | 默认 bucket `ai` | eyeCheck |
|----|------|-------|---------|------|------------------|:-------:|
| r1 | Basic Salary | Gaji Pokok | Basic Salary | earning | earning_basic_salary | ✓ |
| r2 | TC Meal Allowance | Elaun Makan | Meal Allowance | earning | earning_others | |
| r3 | TC Productivity Allowance | Elaun Produktiviti | Productivity Allowance | earning | earning_others | |
| r4 | Performance Bonus | Bonus Prestasi | Performance Bonus | earning | earning_others | ✓ |
| r5 | EPF Employee Contr. | Caruman KWSP Pekerja | EPF (Employee) | deduction | deduction_epf_employee | |
| r6 | SOCSO Employee Contr. | Caruman PERKESO | SOCSO (Employee) | deduction | deduction_socso_eis | |
| r7 | PCB/Tax | Potongan Cukai (PCB) | Tax (PCB) | deduction | deduction_pcb_tax | |
| r8 | EIS EE Contr. | Caruman SIP Pekerja | EIS (Employee) | deduction | deduction_socso_eis | |
| r9 | MAPA Fee | Yuran MAPA | MAPA Fee | deduction | deduction_other_deductions | |

> 注：细项类型「不同文件会有不同」（会议确认），上表为 Payslip 样例。后端应支持按文件类型返回可变的细项与默认映射。

### 14.3 文件大类（Category）

Personal Identity · Company Identity · Applicant Income · Other Application & Vehicle · Seller Documents · Other Documents（Non AI Scanning）· Collateral/Others。

### 14.4 字段规则选项（收入计算口径，节选）🔧

> 用于 CED 调整字段如何参与收入计算。完整策略待 §11-5 确认。

| 字段 | 可选规则 |
|------|---------|
| `earning_gross_salary` | Count as Annual Income (÷12/mo) / Reference Only / Exclude |
| `earning_total_allowances` | Fixed Allowance (count in full) / Variable Allowance (÷12 avg) / Exclude |
| `earning_overtime_pay` | Variable OT — include (÷12 avg ≤12mo) / Exclude (insufficient history) |
| `earning_bonus` | Non-recurring Bonus (÷12) / Exclude |
| `earning_commission` | Commission Variable (÷12 avg) / Exclude |
| `employee_contribution` | Employee EPF — verify vs Payslip / Reference Only / Exclude |
| `deduction_epf_employee` | EPF Deduction / Exclude (Ineligible Foreign Worker) |

---

## 附：变更对照（相对历史版本）

| 项 | 历史 | 现状（本 FRD）|
|----|------|------|
| Step 3 mismatch 告警 | 三按钮（调数字/调规则/跳过）| ❌ 已移除，纯展示 |
| Step 3 布局 | 纵向月份卡片 | ✅ 表格（行=期次，列=科目）|
| 公式明细 | 卡片副标题常驻 | ✅ 脚注 + 可展开区 + hover |
| Add Item 范围 | 灌满所有期次（bug）| ✅ 限定当前期次 |
| 体验路径命名 | Sales View / CED View | ✅ 方案1 / 方案2（与角色解耦）|
| Document Info 字段 | 5 项 | ✅ 方案1 增至 9 项（+Currency/EPF%/ConvRate/MNC/GovtNoEPF）|
| 核验页按钮 | 顶部+底部多排（含 Save Draft/Submit/Confirm/Sync）| ✅ 精简为顶部 Previous/Next/Save |
