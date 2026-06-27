# AIOCR 交叉核验原型 — 文案对齐清单（梳理稿）

> **用途**：把原型现有文案与《AIOCR 需求文档》(OCR 部分) 的官方措辞逐条对照，得出统一后的最终文案。**本稿仅梳理，确认后再统一改原型。**
> **判定列**：`对齐` = 改为原文档官方文案 · `保留` = 原型新增、原文档无对应，保留并说明含义 · `修正` = 原型自身过时/不一致文案需改（多为两步合并后残留的"Step 3"）· `待定` = 需你拍板
> **对齐基线**：原文档 §3.1.4 告警处理、§3.1.4.8 操作按钮、表9 文件状态、§3.1.3 结果展示。

---

## 1. 操作按钮文案

| # | 功能 / 位置 | 原型现文案 | 原文档官方文案 | 判定 | 建议最终文案 |
|---|------------|-----------|---------------|------|-------------|
| 1.1 | 修正识别值（告警动作）| `Amend scanned result`（ACT_LABEL）；引导语里简写 `Amend` | `Amend scanned result` | 对齐 | `Amend scanned result`（引导语里的简写也统一为全称）|
| 1.2 | 备注通过（告警动作）| `Justify & proceed` / `Justify (note required)`（Hard Fail）| `Justification` | 对齐 | 按钮主名 `Justification`；Hard Fail 副提示保留 `(note required)` |
| 1.3 | 替换文件 | `Replace Document` | `Replace Document` | ✓已一致 | `Replace Document` |
| 1.4 | 一键核验（眼检）| 告警栏用 `✓ Mark All Verified`；ACT_LABEL 用 `Verify All` | `Verify All` | 对齐 | 统一为 `Verify All`（保留 ✓ 图标）|
| 1.5 | 跳过/备注（收入类眼检&缺失栏）| `Skip with Note` | （= Justification 的口语化）| 待定 | 二选一：①统一为 `Justification`；②保留 `Skip with Note` 但在文档注明本质=Justification（**建议②**，对 Sales 更易懂）|
| 1.6 | 采用参考值 | （未做，Phase2）| `Adopt Reference/System Value` | 对齐 | `Adopt Reference Value`（Phase2）|
| 1.7 | 列表页进入核验 | 行内 编辑图标 | `Review`（表9 Action：Review–文件确认）| 待定 | 建议对齐为 `Review`（hover 提示）|
| 1.8 | 列表页提交 | `Revalidation & Submit Results` | `Revalidation`（§3.1：修正后提交重新 validation）| 保留 | 保留 `Revalidation & Submit Results`（含义更全：重核+提交），文档注明对应原文档 Revalidation |
| 1.9 | 新增细项弹窗确认 | `Add Item` | （原文档分类台用"新增分类"；本处为收入细项补录，无直接对应）| 保留 | `Add Item`（原型新增功能：Step1 补录 OCR 漏识别的收入细项）|

---

## 2. 告警类型 / 规则名

| # | 告警 | 原型现文案 | 原文档官方文案 | 判定 | 说明 |
|---|------|-----------|---------------|------|------|
| 2.1 | 人工复核 | `Eyeball check` | `Eyeball Check`（§3.1.4.6）| 对齐 | 统一大小写 `Eyeball Check` |
| 2.2 | 存在性缺失 | `Missing field — N required field(s) not detected by OCR` | `Exist` 存在性校验（§3.1.4.5）| 待定/保留 | 原型"Missing field"是对"必填收入科目缺失"的友好具体化表达。**建议保留**面向 Sales 的措辞，文档注明底层=Exist 告警；操作按钮 `+ Add Item` 为收入类对 Exist 的补充处理（原文档 Exist 仅 Justify/Replace）|
| 2.3 | 大模型规则 | `General Document Rules` | `General document rules:`（§3.1.4.7）| ✓基本一致 | 统一为 `General document rules` |
| 2.4 | 一致性 / 公式 / 日期 / 固定值 | 规则名如 `Mykad - id_no Consistency`、`EPF Statement - statement_date Date Compare` | Consistency / Formula / Date Compare / Fix Value | ✓一致 | 命名风格与原文档一致，沿用 |
| 2.5 | 严重度标签 | `Hard Fail` / `Warning` / `Needs Check` | （原文档：High Priority / Alert 为预留；当前统一等级）| 保留 | 原型三档为视觉分级；文档注明当前业务规则等级统一、命中即需处理 |
| 2.6 | 阻断提交提示 | `⛔ Cannot submit — resolve or justify Hard Fails first` | （原文档：命中规则需处理后方可提交）| 保留 | 原型措辞，含义一致 |

---

## 3. 字段 / 行状态标签（原型新增为主，保留 + 说明）

| # | 状态 | 原型现文案 | 原文档对应 | 判定 | 功能含义 |
|---|------|-----------|-----------|------|---------|
| 3.1 | 暂存 | `Pending` 标签 + 暂存条 | （无，原型暂存模型）| 保留 | 金额已输入但未点保存；不影响汇总，点保存后生效 |
| 3.2 | 已改 | `Edited` 标签 | 规则 `fixed`（Amend 后转绿，§3.1.4.8）| 保留 | 字段级"应用值≠OCR原值"；与原文档规则级 fixed 含义相通，但维度不同（字段 vs 规则）|
| 3.3 | 新增 | `Added` 标签 | （无）| 保留 | 用户手动补录的细项 |
| 3.4 | 未识别 | `NOT DETECTED` | = Exist 缺失（§3.1.4.5）| 保留 | 必填字段 OCR 未识别到，整行占位 + Add/Skip |
| 3.5 | 眼检-未核验 | `Verify` 按钮 | Eyeball Check 待处理 | 保留 | 待人工核对 |
| 3.6 | 眼检-已核验 | `✓ Verified` | （Verify All 后态）| 保留 | 已人工核验 |
| 3.7 | 格式校验失败 | （原型暂无）| `Review_Required`（§2.1.2 Phase3）| 补充 | 建议原型补一个 Review_Required 态（字段正则/格式校验失败标红+原因），对齐原文档 |
| 3.8 | 归类待应用 | 下拉浅蓝边框 + 小点 | （无，原型暂存模型）| 保留 | 归类改了未应用 |

---

## 4. 提示 / 横幅 / Toast 文案（含原型内部过时文案修正）

> ⚠ 以下多条因"三步合并为两步"残留了 `Step 3` 字样，属原型自身需**修正**项。

| # | 位置 | 原型现文案 | 问题 | 判定 | 建议最终文案 |
|---|------|-----------|------|------|-------------|
| 4.1 | Step1 金额暂存条 | `N amount change(s) staged — Step 3 totals refresh after you save` | "Step 3" 已不存在 | 修正 | `N amount change(s) staged — totals refresh after you save` |
| 4.2 | Step1 保存 Toast（applyAmountChanges）| `Saved — Step 3 totals recalculated.` | "Step 3" 过时 | 修正 | `Saved — totals recalculated.` |
| 4.3 | 归类应用 Toast（confirmRuleChanges）| `Rules applied — Step 3 totals recalculated.` | "Step 3" 过时，且与 4.4 不统一 | 修正 | `Applied — totals recalculated.`（与 4.4 统一）|
| 4.4 | 归类应用 Toast（applyComputeChanges，现 Step2 用）| `Applied — totals recalculated.` | — | ✓保留 | `Applied — totals recalculated.` |
| 4.5 | Step2 卡副标题 | `Categorised totals — click any amount to adjust mapping or value` | 金额现只读，不能 adjust value | 修正 | `Categorised totals — change a category here; amounts are edited in Step 1` |
| 4.6 | Step2 拆解区副提示 | `classify here · click an amount to edit it in Step 1` | — | ✓保留 | 同左 |
| 4.7 | Step1 眼检告警栏 | `👁 Eyeball check — N field(s) need a manual check against the source document.` | 大小写 | 微调 | `👁 Eyeball Check — …`（与 2.1 统一）|
| 4.8 | Step1 缺失告警栏 | `⚠ Missing field — N required field(s) not detected by OCR. Add the line item or skip with a note.` | — | 保留 | 同左（见 2.2）|
| 4.9 | CED 洁净视图说明 | `Verified by Sales. You can adjust any value before approving.` | — | 保留 | 同左 |
| 4.10 | 文件详情顶部保存 Toast | `Saved.` | — | 保留 | 同左 |
| 4.11 | 全部核验完成 Toast | `All items verified — file is ready to route to CED.` | — | 保留 | 同左 |
| 4.12 | 补录成功 Toast | `<名> added to <期次>. Enter its amount per period.` | — | 保留 | 同左 |

---

## 5. 文件状态 / OCR 状态（对齐原文档表9）

| # | 维度 | 原型取值 | 原文档官方枚举 | 判定 |
|---|------|---------|---------------|------|
| 5.1 | File OCR Status | `Validating` / `Validation Succeeded` / `Validation Failed` / `Manual Override` / `OCR Succeeded` | Recognizing / Recognition Failed / Validating / Validation Failed / Validation Succeeded / Pending Replace / OCR Fail | 对齐 | 核对：`OCR Succeeded` → 原文档无此项，疑应为 `OCR Processed`(File Status) 或删除；`Manual Override` → 原文档无，建议确认是否纳入 |
| 5.2 | File Status | （列表页未显式区分）| File Exception / Upload Succeeded / OCR Processing / OCR Processed（+ 待人工确认/已验证通过/待替换/验证中）| 待定 | 建议列表页/详情对齐原文档 File Status 枚举 |
| 5.3 | 列表页状态筛选 | （筛选项简化）| All / Exception / Verified / Pending Re-validation / Pending Replace | 对齐 | 筛选下拉对齐原文档 5 项 |
| 5.4 | 替换后旧文件态 | （原型未完整做 Replace 流）| `待替换 Pending Replace` | 对齐 | Replace 后旧文件→Pending Replace，不可再编辑（原文档 §3.1.4.8-3）|

---

## 6. 待你拍板的决策点（汇总）

| # | 决策 | 选项 | 建议 |
|---|------|------|------|
| A | `Skip with Note` 是否改为 `Justification`（1.5）| ①统一术语 ②保留口语 | 建议②保留，文档注明=Justification |
| B | `Missing field` 是否改为 `Exist` 术语（2.2）| ①对齐术语 ②保留友好措辞 | 建议②保留，文档注明底层=Exist |
| C | 列表页进入按钮 `编辑` 是否对齐 `Review`（1.7）| ①Review ②保留 | 建议①Review |
| D | `OCR Succeeded` / `Manual Override` 两个非官方 OCR 状态如何处理（5.1）| 删除/改名/纳入官方 | 需后端确认 🔧 |
| E | 是否补 `Review_Required` 字段格式校验态（3.7）| 补/不补 | 建议补，对齐原文档 §2.1.2 |

---

## 附：确认后将统一修改的原型清单（预告，本轮不改）

- **修正类（原型自身过时）**：4.1 / 4.2 / 4.3 / 4.5 的 "Step 3" 与"adjust value"字样。
- **对齐类（向文档靠拢）**：1.1 / 1.2 / 1.4 / 2.1 / 2.3 的按钮与告警措辞。
- **待拍板后再定**：§6 的 A–E。
