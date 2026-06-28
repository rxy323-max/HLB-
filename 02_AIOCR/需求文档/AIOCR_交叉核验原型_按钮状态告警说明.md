# AIOCR 交叉核验原型 · 按钮 / 状态 / 告警说明

> 本文档面向开发与评审，逐项说明原型中的**操作按钮、字段/文件状态、告警**及其文案与含义。文案即原型当前最终态。
> 对应原型：[aiocr-外网复刻.html](aiocr-外网复刻.html)（branch `session-v9`）。

---

## 一、操作按钮

### 1.1 文件详情核验页 · 顶部栏

| 按钮 | 作用 |
|------|------|
| `‹`（返回）| 关闭详情，回到交叉核验结果列表 |
| `‹ Previous` / `Next ›` | 在同一申请的文件间翻页 |
| `Save` | 保存当前文件的核验改动 |
| `◫ Hide document` / `◫ Show document` | 收起 / 展开右侧原文档，给核算表腾出整宽（收入类文件默认收起）|
| `Option 1 (1→2)` / `Option 2 (2→1)` | 切换 Step 1、Step 2 的展示顺序（演示用，与角色无关）|

### 1.2 Step 1 · 核对识别

| 按钮 | 作用 |
|------|------|
| `Verify` | 单行眼检：核对该字段与原件一致 → 转 `✓ Verified` |
| `✓ Verify All` | 一键核验所有待眼检字段 |
| `Justification` | 填理由通过该告警（眼检栏 / 缺失栏 / 缺失行）|
| `+ Add Missing Item` | 补录 OCR 未识别到的必填收入科目，自动归到该字段 |
| `Add Item` | 缺失行内 / 新增弹窗的确认：新增一条收入细项 |
| `+ Add line item` | 在某期次下新增一条收入细项 |
| `+ Add Pay Period` | 新增一个工资单期次（月份）|
| `↻ Apply & refresh` | 应用暂存的金额修改，重算结果 |
| `×`（Remove）| 删除手动新增（Added）的细项 |

### 1.3 Step 2 · 收入核算

| 元素 / 按钮 | 作用 |
|------|------|
| 类目列表头（带 ▾）| 点击 → 下方拆解只显示该类目（筛选）|
| 金额（只读小字）| 点击 → 跳回 Step 1 对应期次的输入框直接改（金额唯一编辑入口在 Step 1）|
| 归类下拉 | 改某条细项归到哪个收入/扣减科目 |
| `↻ Apply & refresh` | 应用暂存的归类修改，重算结果 |
| `← Show all categories` | 取消筛选，展示全部类目 |
| `×`（Remove）| 删除手动新增（Added）的细项 |

> **Step 2 不提供新增**：增加期次 / 增加细项统一在 Step 1；Step 2 只做归类。

### 1.4 告警卡操作按钮（非收入类文件，如身份证 / VSO / EPF）

| 按钮 | 作用 |
|------|------|
| `Amend scanned result` | 修正 OCR 识别错误的字段值（≤100 字符）|
| `Justification` / `Justification (note required)` | 填理由通过（Hard Fail 必填理由）|
| `Replace Document` | 上传正确文件替换 |
| `Verify All` | 一键确认眼检字段 |
| `Adopt Reference Value`（Phase 2）| 一键采用参考/系统值覆盖 |
| `↺ Undo` | 撤销已填的 Justification |

### 1.5 弹窗

| 弹窗 | 按钮 |
|------|------|
| 新增细项（Add line item / Add Missing Item）| `Cancel` · `Add Item` |
| 备注通过（Justification）| `Cancel` · `Justification` |

### 1.6 交叉核验结果列表页

| 按钮 | 作用 |
|------|------|
| `Search` / `Reset Filters` / `Refresh` / `Download` | 关键字/条件筛选、重置、刷新、导出 |
| 行内 `Review` | 进入该文件的核验详情 |
| 行内 下载图标 | 下载该文件 |
| `Revalidation & Submit Results` | 重新核验并提交结果（底部主操作）|

---

## 二、字段 / 状态

### 2.1 细项金额（行值）状态

| 状态 | 含义 | 视觉 |
|------|------|------|
| 默认（已识别）| OCR 识别值，未修改 | 无标签 |
| `Pending` | 已输入新值但未点应用（暂存）| 橙色虚线框 + Pending 标签 |
| `Edited` | 已应用，值 ≠ OCR 原值 | 橙色实线框 + Edited 标签 |
| `Added` | 用户手动新增的细项 | Added 标签 |
| `NOT DETECTED` | 必填字段 OCR 未识别到 | 占位行 + Add Item / Justification |

> 金额仅 Step 1 可编辑；Step 2 金额只读（点击回 Step 1 改）。

### 2.2 眼检（Verify）状态

| 状态 | 视觉 |
|------|------|
| 未核验 | 橙色 `Verify` 按钮 + 整行待查高亮 |
| 已核验 | 绿色 `✓ Verified` |

### 2.3 归类映射（Step 2）状态

| 状态 | 含义 | 视觉 |
|------|------|------|
| 默认映射 | AI 预分类的科目 | 下拉显示当前归类 |
| 待应用 | 改了下拉未点应用 | 下拉浅蓝边框 + 行内小点 |
| 已应用 | 点"应用并刷新"后 | 计算器实时重算，写入变更记录 |

### 2.4 Step 卡状态徽章

| 卡 | 待处理 | 完成 |
|----|--------|------|
| Step 1 · 核对识别 | `N Pending`（橙）| `Verified`（绿）|
| Step 2 · 收入核算 | `N Pending`（橙，归类待应用）| `Computed`（绿）|

### 2.5 告警解决态

| 状态 | 触发 | 表现 |
|------|------|------|
| 未解决 | 默认 | 告警常驻，计入 Alert Count |
| 已修正（Fixed）| `Amend scanned result` / `Verify All` / `Adopt` | 规则转绿，移出待办 |
| 已备注（Justified）| `Justification`（填理由）| 转 Justified + 显示理由 + `↺ Undo`；清空理由则恢复未解决 |
| 待替换（Pending Replace）| `Replace Document` | 旧文件→待替换（不可再编辑），新文件→验证中 |

> Hard Fail 未解决/未豁免时禁止提交：`⛔ Cannot submit — resolve or justify Hard Fails first`。

### 2.6 文件 OCR 状态（列表页）

`Validating`（核验中）· `Validation Succeeded`（核验通过，Alert Count 绿 ✓）· `Validation Failed`（命中告警）· `Manual Override`（人工覆盖）·（识别阶段）`Recognizing` / `Recognition Failed` · `Pending Replace`（待替换）。

### 2.7 角色视图差异

| 角色 | 告警 | 眼检默认 | 编辑 |
|------|------|---------|------|
| Sales | 全部告警可见 | 需逐项核验 | Step1 改金额、Step2 改归类 |
| CED | 洁净视图：无告警、无橙行 | 默认全部已核验 | 仍可编辑（提示：Verified by Sales. You can adjust any value before approving.）|

---

## 三、告警

### 3.1 收入类文件 · 两条独立告警栏（Step 1）

#### 👁 Eyeball Check（人工复核）
- **触发**：存在未核验的眼检字段（Document Information 各项 + 标记眼检的细项，仅最近一期）。
- **文案**：`👁 Eyeball Check — N field(s) need a manual check against the source document.`
- **操作**：`✓ Verify All` · `Justification`。

#### ⚠ Missing Field（存在性缺失 / Exist）
- **触发**：必填收入科目无对应细项（OCR 未识别到）。
- **文案**：`⚠ Missing field — N required field(s) not detected by OCR. Add the line item or skip with a note.`
- **操作**：`+ Add Missing Item` · `Justification`。

#### 图像质量告警（自动注入）
- **触发**：文件存在边缘模糊页。
- **文案**：`Marginal page quality — Verify required`（提示 AI 已提取但准确性无保证）。
- **操作**：`Verify All`。

### 3.2 通用告警类型（非收入类文件）

| 告警类型 | 含义 | 操作按钮 |
|---------|------|---------|
| Consistency 一致性 | 跨文件 / 与系统值不一致 | Adopt Reference Value · Amend scanned result · Justification · Replace Document |
| Formula 公式计算 | 文件内数字关系（求和/比例）| Amend scanned result · Justification · Replace Document |
| Date Compare 日期 | 与当前 / 跨文件日期校验 | Amend scanned result · Justification · Replace Document |
| Fix Value 固定值 | 字段须为某固定值 | Amend scanned result · Justification · Replace Document |
| Exist 存在性 | 字段 / 签名须存在 | Justification · Replace Document |
| Eyeball Check 人工复核 | 关键字段须人工核对 | Verify All · Replace Document |
| General document rules 大模型规则 | 缺页 / 正反面 / 签名齐全等 | Justification · Replace Document |

### 3.3 严重度

| 标签 | 含义 |
|------|------|
| `Hard Fail` | 阻断提交，必须解决或备注 |
| `Warning` | 警告 |
| `Needs Check` | 需人工核对 |

### 3.4 收入核算（Step 2 / 结果）不产生告警

Step 2 是 Step 1 核验后数据的归类与汇总展示。计算器表格平铺展示"计算值"与"印刷值（参照）"，**不做对错判定、不产生 mismatch 告警**；每个类目的细项相加汇总值以小字展示在该类目分组组头（可见但不告警）。
