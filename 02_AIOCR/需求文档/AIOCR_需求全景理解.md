# AIOCR 需求全景理解

> **说明**：本文基于以下来源综合整理：
> - `AIOCR需求文档.pdf`（主文档，87页）
> - `PRD_File_Upload_CN.pdf`
> - `PRD_File_Management_CN.pdf`
> - `Document Lists and Category02-03.xlsx`（文件分类体系）
> - `Documents Listing_30_12_2025-CRA comments as at 14012026.xlsx`（放款阶段字段规则）
> - `OCR_fields Sales Comments.xlsx (Vickie+HP CED).xlsx`（申请阶段字段提取规范）
> - `Documents Listing_09-01-2026-CED_V2.0.xlsx`（IDP 文件类型字典 + 字段规则）
>
> **最近更新**：修正 CED/CRA 角色定义，补充完整业务流程、Defect 回传流设计、Sales 减负交互设计要点。

---

## 一、三方角色与业务主流程

### 1.1 角色定义

| 角色 | 全称 | 职责 | 使用系统 |
|------|------|------|---------|
| **Sales** | — | 前端业务，录入申请、收集上传材料、引导客户签约 | CDM |
| **CED** | Credit Evaluation Department（信贷审核团队）| 申请阶段：核实收入、评估风险、做出批准/拒绝决策 | CVS（审核侧）|
| **CRA** | Credit Administration（信贷行政团队）| 签约后：审查放款文件包、核实合同与车辆信息、执行资金拨付 | CVS（放款侧）|

> ⚠️ **易混淆点**：CED 负责**审批**（申请阶段），CRA 负责**放款**（签约后）。两者出现时机完全不同，文件类型不重叠。

### 1.2 完整业务流程

```
① Sales 录入申请 + 上传申请材料（身份/收入/抵押）
           ↓
② CED 信用审核 → 批准 / 拒绝
           ↓（批准后）
③ Sales 引导客户完成合同签署（E-Acceptance 或 Manual）
           ↓
④ Sales 补件 + 上传放款材料（HP 合同/车辆文件）
           ↓
⑤ CRA 审查放款文件 → 通过打款 / 发现缺陷退回

           ⑤ 若有缺陷（Defect）：
           CRA 发出 Defect Note
                ↓
           Sales 收到精准问题说明并重新补件
                ↓
           系统自动重跑规则 → 通知 CRA 复审
```

### 1.3 AIOCR 在流程中的两段介入

AIOCR 不是单点功能，而是在①④两个 Sales 上传节点分别介入，分别服务 CED 审批和 CRA 放款两个下游角色：

| 介入点 | 触发时机 | 主要服务对象 | 文件类型 |
|--------|---------|------------|---------|
| **第一段** | Sales 上传申请材料（步骤①）| CED（看结果）| 身份/收入/抵押文件 |
| **第二段** | Sales 上传放款材料（步骤④）| CRA（看结果）| HP 合同/车辆/保险文件 |

---

## 二、四段 AI Pipeline

```
① 文件采集与检测（格式/大小/加密/损坏/防伪）
      ↓
② AI 分类确认（Classification Workstation — Sales 确认）
      ↓
③ LLM 字段提取（IDP，Gemini 模型）
      ↓
④ 交叉校验（Rules Engine — CED 或 CRA 看结论）
```

每段之间有**人工确认门**：第②段 AI 分类必须经 Sales 确认后，系统才允许触发 OCR；OCR 处理中的文件所在页面不允许提交。

---

## 三、文件分类体系（三级）

### 3.1 层级结构

```
Phase（阶段）
 └─ Subject（主体）
     └─ Category（类别）
         └─ Document Type（AI 分类名称）
```

### 3.2 申请阶段（Application Submission）完整分类

由 Sales 上传，CED 审核结果。

| Subject | Category | 主要 Document Type（AI 名称）|
|---------|---------|--------------------------|
| Applicant | Personal Identity | Mykad, MyPR, Passport, Malaysia Residence Pass, Singapore Identity card, SG Work Permit, SG Work Permit MOM, Work Permit, Driving License, Experian IBP |
| Applicant | Company Identity | Experian CP, SSM ROC, SSM ROB, Business Registration Sarawak, Trading License Sabah, Experian BP, SSM LLP, Experian LLP |
| Applicant | Applicant Income | Form B, Form BE, EA Form, CP 58, EC Form, Singapore NOA, Payslip, Individual Bank Statement, EPF Statement, PTPTN Letter, SPGA Report |
| Applicant | Collateral/Others | CRA Form, VSO, VOC, Form 8, JK 69, Bill of Lading, SCRC |
| Seller | Seller Documents | Mykad, Experian CP, SSM ROC... Seller Invoice, Information On Seller, CRA Form |
| Guarantor | Guarantor Personal Identity | Mykad, MyPR, Passport, Malaysia Residence Pass, SG Work Permit, Driving License, Experian IBP, CRA Form |
| Guarantor | Guarantor Company Identity | Experian CP, SSM ROC, SSM ROB... Experian LLP, CRA Form |
| Guarantor | guarantor Income | Form B, Form BE, EA Form, CP 58, EC Form, Singapore NOA, Payslip, Individual Bank Statement, EPF, PTPTN, SPGA |
| —— | Other Documents | Other Documents（兜底）|

### 3.3 放款阶段（Disbursement）完整分类

由 Sales 二次上传，CRA 审核结果。

| Category | Document Type |
|---------|--------------|
| CRA Identity/Company | Biometric, Mykad, MyPR... |
| CRA HP Agreement | HP Agreement T&C, Second Schedule Part 1, HP Guarantee Agreement (HPGA), Guarantor Waiver Rights & Liabilities (Appendix I-V) |
| CRA HP Form & Other Funding Docs | Vehicle Invoice, FD Receipt, Letter of Setoff (LOSO), HP276, HP566(2) Dealer Indemnity Letter, SI Form |
| CRA Vehicle Docs | VOC, Roadtax/JPJ Receipt, Insurance Cover Note, Delivery Receipt, FIS/JPJ Result, E-hakmilik copy, IBG Letter (dealer) |
| Other Documents | Other Documents |

> ⚠️ **Tab 隔离**：Application Submission 和 Disbursement 的文件列表完全独立，不互通。

---

## 四、OCR 文件分类字段命名规范

### 4.1 AI 分类名称 vs 原始文件名

部分文件的 AI 分类名称与 Sales 上传时的原始分类不同，对接开发时须用 AI 名称：

| 原始上传名 | AI 分类名（系统用）|
|-----------|----------------|
| NRIC (Blue IC) | Mykad |
| Salary Slip | Payslip |
| EPF | EPF Statement |
| Individual Business Profile (IBP) | Experian IBP |
| Company Profile (CP) | Experian CP |
| Business Profile (BP) | Experian BP |
| Registration of Company (ROC) | SSM ROC |
| Registration of Business (ROB) | SSM ROB |
| LIMITED LIABILITY PARTNERSHIP (LLP) | SSM LLP |
| LLP Profile (LP) | Experian LLP |
| SG Work Permit (MOM checking) | SG Work Permit MOM |
| Other Country Work Permit | Work Permit |
| SPGA-i report | SPGA Report |
| Consent for Disclosure（CRA Form）| CRA Form |
| Vehicle sales order | VSO |
| Information On Seller/Non-Panel Dealer | Information On Seller / Non-Panel Dealer |
| Seller's invoice | Seller Invoice |

### 4.2 字段数据类型约定

| 类型 | 含义 |
|------|------|
| `string` | 普通文本 |
| `date` | 日期（YYYY-MM-DD）|
| `currency` | 金额（数字，无 RM 和千位逗号）|
| `boolean` | Y/N |
| `object` | 嵌套对象 |
| `object_array` | 对象数组（如多条月份薪资）|
| `array.string` | 字符串数组（如多个共同申请人）|

---

## 五、字段提取规格（关键文件详解）

### 5.1 字段关键属性

每个文件的每个字段有三个关键属性：

| 属性 | 含义 | 注意 |
|------|------|------|
| `Is_Mandatory` | OCR 是否必须提取到值，空则报警 | Y = 必取，N = 可选 |
| `Is_Critical` | 如果 OCR 取到了值，必须确保准确 | Y = 精度要求高，会做规则校验或人工 review |
| `Rule Type` | 校验方式 | Consistency / Formula / Date Compare / Fix Value / Exist / Eyeball Check |
| `Rule Level` | 规则严格度 | Hard Rule（阻断）/ Alert（提示，不阻断）|
| `Checking Sys` | 谁执行规则 | OCR（IDP 自动）/ CRA（放款侧系统）/ `/`（仅人工 eyeball）|

### 5.2 申请阶段核心文件字段速查

#### Mykad（Blue IC）
| 字段 | 标准名 | Mandatory | Critical | 备注 |
|------|-------|-----------|---------|------|
| 12位身份证号 | `id_no` | Y | Y | 与系统对比 |
| 姓名 | `customer_name` | Y | Y | **不做跨文件比对**，IC 名简写太多 |
| 地址 | `address_line1` | Y | N | IC 地址往往不是当前住址，只 eyeball |
| 性别 | `gender` | Y | N | JPN 数据可能有误 |
| 正反面齐全 | `has_front_back_copy` | Y | — | 规则校验 |

#### Payslip（工资单）
- 关键结构：`monthly_records`（数组，每月一条）
- 关键字段：`payslip_month`, `gross_salary`, `net_pay_amount`, `deduction_epf_employee`
- 公式校验：`gross_salary = basic + allowances + overtime + bonus + others`；`net_pay = gross - total_deductions`
- 需标记：`is_commission`（是否为佣金型）、`is_government_without_epf`（政府无 EPF）

#### Form B / Form BE（税表）
- 关键区分：Form B 有 "WHO CARRIES ON BUSINESS" → 有 P&L 和资产负债表；Form BE 为受雇个人
- 核心字段：`year_of_assessment`, `total_income`, `tax_payable`, `serial_number`, `bill_number`
- 校验：`V7 acknowledgement_match_check` — 回执与明细一致性
- 分类规则：如发现 "DOES NOT CARRY ON BUSINESS" 则强制重分类为 Form BE

#### Individual Bank Statement
- 结构：`statement_list`（数组，多份）→ `transaction_info`（数组）
- 关键：`credit_amount` 与 Payslip 的 `net_pay_amount` 交叉核对工资到账
- 只验证工资入账相关行，不全量验证

#### CRA Form
- 两类：Individual（签名）/ Non-Individual（公司名 + 注册号 + 公司印）
- `version_code`：版本号（当前最新 V007 Dec 2023）
- `other_customer_list`：多个共同申请人时为数组

### 5.3 放款阶段核心文件字段速查

#### HP Agreement T&C（分期付款合同）
- 页数规则：E-acceptance Conventional 8-9页 / Islamic 10页 / Manual Conventional 7-8页 / Manual Islamic 9页
- 关键提取：`aa_reference_number`, `hirer_name`, `nric_passport_no`, `mailing_address`, `loan_financing_terms`
- 公式校验：融资金额、利率、期限、月供四项互相验证
- 特殊规则：Manual 案例需 hirer 每页签名或初签

#### Vehicle Invoice（车辆发票）
- 关键字段：`dealer_name`, `hirer_name`, `chassis_number`, `vehicle_model`, `otr_price`, `loan_amount`, `deposit_amount`
- Booking fee ≤ OTR × 1%；OTR 公式自动验证

#### VOC（车辆所有权证）
- 关键字段：`registration_number`, `chassis_number`, `engine_number`, `vehicle_make_model`, `year_made`, `bdm`
- 交叉验证：Insurance、FIS/JPJ、Roadtax 均需与 VOC 信息一致

#### FIS/JPJ Result
- 状态必须为 "Processed"（常规）或 "Verified"（FBR 案）
- `serial_number` 即 AA 参考号

---

## 六、校验规则体系（Cross-Validation）

### 6.1 六种规则类型

| 规则类型 | 说明 | 示例 |
|---------|------|------|
| Consistency | 与系统或其他文件字段完全匹配 | Hirer Name 与系统记录一致 |
| Formula | 数学公式验证 | gross = basic + allowances；OTR 计算 |
| Date Compare | 日期先后/区间判断 | 驾照有效期 > 申请日；护照 > 申请日 + 6个月 |
| Fix Value | 固定值存在性校验 | FIS 状态必须为 "Processed"/"Verified" |
| Exist | 字段/元素是否存在 | 签名是否存在 |
| Eyeball Check | 仅人工目视，不自动验证 | 发票内含 "Invoice" 字样 |

### 6.2 规则级别

| 级别 | 行为 |
|------|------|
| Hard Rule | 校验失败则**阻断**，不可跳过 |
| Alert | 校验失败则**提示警告**，CED/CRA 可知悉后放行 |

### 6.3 典型跨文件校验链

```
【申请阶段 — CED 查看】
Payslip → Bank Statement       工资月份 & 到账金额交叉核对
Payslip → EPF Statement        雇主缴款比例验证（12%）
Form B/BE → Bank Statement     年收入与流水印证

【放款阶段 — CRA 查看】
VOC → Insurance Cover Note     车架号 & 登记号一致
VOC → FIS/JPJ Result           底盘号 & 发动机号一致
VOC → Roadtax                  登记号一致；有效期校验
Vehicle Invoice → VOC          车型 & 底盘号 & 发动机号一致
HP Agreement → AA Ref No       所有放款文件 AA 号统一
HP Agreement → 2nd Schedule    融资条款四项互验
Biometric → Hirer Name & NRIC  全匹配
FD Receipt → 批核条件          抵押金额 ≥ 条件批准要求
```

### 6.4 执行系统分工

```
IDP（OCR 系统）负责：
  - 字段提取
  - Consistency 规则（与系统对比）
  - Formula 规则
  - Exist 规则

CRA 系统（放款侧）负责：
  - Hirer's date 日期合规性
  - EHP witness Date（比对 hirer 日期）
  - MOA date
  - Delivery date
  - Deposit Date
  - FIS/JPJ Status（Fixed Value）
```

---

## 七、文件检测规则（5 层）

| 层级 | 检测项 | 处理方式 |
|------|--------|---------|
| L1 | 文件格式（非 PDF/JPG/PNG 等）| Hard Block |
| L2 | 文件大小超限 | Hard Block |
| L3 | 加密/密码保护 PDF | Hard Block |
| L4 | 文件损坏/无法读取 | Hard Block |
| L5 | 疑似伪造（防伪检测）| Soft Warning（提示，可继续）|

---

## 八、AI 分类特殊场景与难点

### 8.1 易混淆文件对

| 易混淆文件对 | 区分方法 |
|------------|---------|
| Mykad vs Biometric MyKad（放款阶段）| Biometric 有物理芯片 + 指纹图标 + "STATUS PENGESAHAN CAP JARI" |
| Form B vs Form BE | Form B 有 "WHO CARRIES ON BUSINESS" + P&L 页 + serial 号以 "B" 开头 |
| SPGA-i（黄金报告）vs Experian IBP | SPGA-i 有 "SPGA INTELLIGENCE REPORT-(SPGA-I)" 标题 + "Grams (g)" 单位；IBP 有 "Shareholding %" |
| SSM ROC vs Experian CP | ROC 是政府官方摘录（带注册机关印章）；CP 是 Experian 商业报告 |
| SG Work Permit vs SG Work Permit MOM | WP = 卡片本体；MOM = MOM 网站/App 数字验证截图 |
| VOC vs Vehicle Ownership Card | VOC 依据 Road Transport Act 1987 Second Schedule；两者字段有差异 |

### 8.2 已知 AI 误判案例（来自实测）

| 文件 | 误判为 | 原因 & 解决 |
|------|--------|-----------|
| SPGA-i | Experian IBP | 表格结构相似；需强调 "Grams (g)" 关键字 |
| SG Driving License | Unknown | **不支持识别**，明确排除在支持范围之外 |
| PTPTN（手机邮件截图）| Unknown | 属正常行为；业务上 CRA 会退回给 Sales |

### 8.3 Batch 1 不包含的文件类型

- **Biometric MyKad**（放款阶段专用）— 非 Batch 1
- **Rental（租赁协议）** — Batch 1 无
- **Fixed Deposit Slip** — Batch 1 不测
- **SG Driving License** — 不支持识别

---

## 九、LLM 字段提取配置（IDP 系统）

### 9.1 Document Type Dictionary（doctype_dictionary 表）

IDP 团队维护的文件类型字典，每条记录包含：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识（如 `DT_1768532394726_5ad68d`）|
| `description` | **英文 AI 分类指令**（LLM Prompt），含识别特征、字段说明、分类逻辑 |
| `description_cn` | 中文版本（供内部参考）|
| `phase` | 阶段（可为 null）|
| `category` | 文件类别（如 "Personal Identity"）|
| `name` | AI 文件类型名称（如 "Mykad"）|

> 这些 description 字段**就是喂给 AI 的 prompt**，决定分类准确率。团队在持续迭代优化。

### 9.2 Field Extraction Schema

每个文件类型有独立的字段提取 schema，包含：
- `Field_Name`：标准化字段名（如 `id_no`, `customer_name`）
- `data_type`：数据类型
- `Region_Info`：字段所属区域（如 `customer_info`, `monthly_records`）
- `Is_Mandatory`：提取是否必须有值
- `Is_Critical`：是否需要高精度保证
- `Validation Rules`：校验逻辑

### 9.3 配置变更管控（Maker-Checker）

1. Maker（产品/运营）发起配置变更请求
2. Checker 审核批准
3. 系统自动生成新版本（SemVer：Major.Minor.Patch）
4. 历史版本保留，可追溯

---

## 十、产品流程设计要点

### 10.1 两个提交门

| 门 | 时机 | 规则 |
|----|------|------|
| 分类确认门 | 提交 OCR 之前 | 所有文件 AI 分类须经 Sales 确认，否则无法提交 |
| OCR 处理门 | 提交审批之前 | 处理中的文件不允许提交（Batch 2 引入队列管理）|

### 10.2 分类确认工作台（AI Classification Workstation）

- 左侧：PDF 预览 + 缩略图导航
- 右侧：AI 分类结果（含置信度，可手动修改）
- 支持**一文件多类型拆分**：将一个 PDF 按页范围拆分为不同文件类型
- 处于"处理中"状态的文件，其所在页面的其他文件亦不可提交

### 10.3 OCR 结果展示与 4 区域校验

OCR 结果展示工作台分 4 个区域（CED 或 CRA 查看）：

| 区域 | 内容 |
|------|------|
| 区域 1 | 字段提取结果（Extracted Fields）|
| 区域 2 | Consistency 校验结果 |
| 区域 3 | Formula / Date / Fix Value 校验结果 |
| 区域 4 | Exist / Eyeball 检查结果 |

各区域状态：Pass / Fail / Alert / Not Applicable

### 10.4 Defect 回传流（CRA → Sales）

CRA 发现文件问题时，不应只是"退回申请"，需要产生**精准的 Defect Note**，Sales 必须能准确知道要换什么、为什么换：

```
CRA 操作：
  选择有问题的文件 → 选择缺陷类型 → 填写说明

系统生成 Defect Note：
  ┌───────────────────────────────────────────────┐
  │ 文件：HP Agreement T&C                         │
  │ 问题类型：签名缺失                               │
  │ 说明：Manual 案例第 4 页缺少 Hirer 初签           │
  │                                               │
  │ 文件：Vehicle Invoice                           │
  │ 问题类型：金额规则违反                            │
  │ 说明：Booking fee RM 2,000 超过 OTR 1% 上限     │
  │       OTR = RM 180,000，上限 = RM 1,800        │
  └───────────────────────────────────────────────┘

Sales 收到任务后：
  - 知道具体哪份文件有问题
  - 知道具体原因（不需要致电 CRA 确认）
  - 重新上传后系统自动重跑该项规则
  - 通过后自动通知 CRA 复审
```

**设计原则**：Defect Note 的粒度要到字段级，Sales 无需二次沟通即可独立处理。

---

## 十一、Sales 减负交互设计要点

### 11.1 问题根源：比较基准的错位

引入 AIOCR 前，Sales 上传文件后**不承担任何核查责任**，一股脑提交给 CED。有了 AIOCR，Sales 需要确认分类、处理 flag，感知上是"多了工作"。

但这个对比基准是错的。正确的对比应该是：

```
没有 AIOCR 的新世界：
  Sales 提交 → CED 发现问题 → 打回 Sales → Sales 回头找客户 → 3-5天延误 → 再提交

有了 AIOCR 的新世界：
  Sales 提交时就发现问题 → 当场处理 → 一次性通过 → 审批周期缩短
```

Sales 的"额外工作"实际上是把原本发生在 CED 打回环节的工作量**提前**了，总量不变，但位置更靠前、更可控、周期更短。

**核心设计目标**：让 Sales 感受到"这个工具帮我提前发现了本会被打回的问题"，而不是"这个工具给我增加了核查责任"。

### 11.2 五条设计原则

#### 原则 1：默认是通过，只有异常才需要操作

不能让 Sales 对每一份文件都主动确认。大部分情况下 AI 置信度高，Sales 的体验应该是：

```
✗ 差体验：10 份文件 → 10 个确认弹窗 → Sales 逐一点"确认"

✓ 好体验：10 份文件 → AI 分类完成 → 底部一个"全部确认（10/10）"按钮
           → 只有 1 份置信度低 → 系统自动聚焦到那 1 份要求操作
```

**交互规则**：置信度 ≥ 阈值的文件默认为"待确认"（视觉上已归类，但非强制点击），批量确认一键完成；置信度低的文件单独高亮，要求 Sales 主动选择。

#### 原则 2：问题要实时浮现，不能在最后爆发

```
✗ 差体验：Sales 上传完 12 份文件 → 点"提交" → 系统返回 3 个报错 → Sales 懵了

✓ 好体验：Sales 每上传一份 → 实时反馈（格式 OK、AI 分类：Payslip 95%）
           → Payslip 上传后系统即刻提示"检测到只有 1 个月，需要 3 个月"
           → Sales 当场去找客户补材料，而不是在提交前才发现
```

**好处**：问题小而具体时，心理压力小；而不是积累成一大堆再爆发。

#### 原则 3：flag 的语气是"帮你发现"，不是"你做错了"

同样的问题，用语决定感受：

```
✗ 负面语气："错误：Payslip net pay 与 Bank Statement 不一致"

✓ 正面语气："发现潜在问题 ↓
             工资单显示到手 RM 5,800，但银行流水只收到 RM 5,200
             CED 通常会对此提问。常见原因：雇主扣了预支款
             [现在确认原因] [备注说明] [暂时跳过]"
```

让 Sales 感觉是系统在帮他**提前预判 CED 的疑问**，而不是在指责 Sales 上传了错误材料。

#### 原则 4：把 OCR 预填表单的收益放在操作负担之前

Sales 首次体验 AIOCR，应该先感受到"省了我的事"，再遇到"需要你确认"。

**交互时序设计**：
```
1. Sales 上传 Mykad
2. 系统识别后立刻将姓名、IC号、地址自动填入申请表对应字段
3. Sales 看到：「✓ 已自动填入：姓名、IC号、地址（来自 Mykad）」
4. 之后再出现分类确认提示
```

先给甜头，再要求付出。

#### 原则 5：Alert 级别的问题给 Sales 选择权，不硬拦截

Hard Rule 失败的文件，必须阻断，没有商量余地。但 Alert 级别的问题，可以让 Sales 做决策：

```
⚠️ 驾照有效期还有 2 个月到期（非必须，但 CED 可能会问）
   [现在替换] [知悉并继续]
```

让 Sales 感觉**有控制感**，而不是被系统牵着走。这也符合现实：有些情况确实有合理解释，不该一刀切拦截。

### 11.3 材料清单的展示方式

缺件提示是 Sales 最常见的交互场景。展示方式影响 Sales 的操作意愿：

```
✗ 差设计（合规检查清单式）：
  必填文件：
  ☐ Form BE
  ☐ Payslip (月份 2)
  ☐ Payslip (月份 3)
  以上文件未齐，不可提交

✓ 好设计（进度引导式）：
  申请完成度 7/10   ████████░░
  还差 3 步就可以提交：
  ① 添加 Form BE — 客户为受雇个人，此文件必须
  ② 添加 8月、9月工资单 — 已上传 10月，还需补 2 个月
  ③ 确认 Mykad 分类（AI 置信度较低）
```

进度条 + 具体原因 + 操作引导，比"缺件列表"更容易被接受。

### 11.4 Defect 打回时的体验设计

CRA 退回是 Sales 情绪最低落的时刻，设计要做两件事：

1. **降低认知负担**：Sales 打开退回通知，第一眼就知道要换什么，而不是需要去找 CRA 打电话问
2. **表达可完成性**：界面上要让 Sales 看到"还差 2 步就重新通过"，而不是一片红色

```
✓ 退回任务界面：
  CRA 退回原因（2 项）          进度：0/2 已修复

  1. HP Agreement T&C           [查看原文件] [重新上传]
     Manual 案例第4页缺少 Hirer 初签

  2. Vehicle Invoice             [查看原文件] [重新上传]
     Booking fee RM 2,000 超过 OTR 1% 上限

  修复完成后系统将自动通知 CRA 复审 →
```

---

## 十二、Batch 2 功能补充（待规划）

| 功能模块 | Batch 2 内容 |
|---------|-------------|
| 队列管理 | 智能排队、并发控制（Batch 1 无队列）|
| 手动重试 | OCR 失败后支持单文件重试触发 |
| 文件过期策略 | 超期未处理文件的状态管理与提醒 |
| 基于角色的删除 | 不同角色（Sales/CED/CRA）有不同删除权限 |
| Biometric MyKad | 放款阶段生物识别文件识别支持 |
| Fixed Deposit Slip | 定期存款单识别与校验 |
| 跨阶段文件复用 | 申请阶段文件在放款阶段的复用策略 |

---

## 十三、术语对照表

| 英文 | 中文 |
|------|------|
| CED | Credit Evaluation Department — 信贷审核团队，负责申请阶段的信用评估与审批 |
| CRA | Credit Administration — 信贷行政团队，负责签约后放款文件审查与资金拨付 |
| AA Reference Number | 申请参考编号（系统生成，跨文件贯通）|
| Hirer | 承租人（借款人）|
| EHP | 外聘合伙人（执行分期付款文件的外部代理）|
| VOC | 车辆所有权证 |
| FIS/JPJ | 陆路交通局电子系统 / 结果 |
| E-hakmilik | 电子所有权（FIS 处理后的电子产权凭证）|
| OTR | On-The-Road Price（含注册费、保险的落地价）|
| HPGA | 分期付款担保协议 |
| LOSO | Letter of Set-off（抵销授权书）|
| PBT | Payment Before Transfer（过户前放款）|
| IDP | 智能文件处理平台（AI OCR 引擎）|
| FPS | 文件存储系统 |
| CDM | 贷款申请入口（Sales 使用）|
| CVS | 信贷操作系统（CED 审批 / CRA 放款 共用）|
| SCRC | Shariah Compliance & Review Certificate（伊斯兰金融合规证明）|
| Defect Note | CRA 退回时生成的缺陷说明单，精确到文件+字段+原因 |

---

## 附录 A：申请阶段文件字段完成状态

（来源：`Document Lists and Category02-03.xlsx`，`OCR文件清单` Sheet）

所有申请阶段的 AI 文件类型，字段清单均已标注 `Y`（已完成定义），共约 **200 个文件类型实例**（含 Applicant/Seller/Guarantor 分 Subject 的重复文件类型）。

---

## 附录 B：放款阶段文件规则摘要

（来源：`Documents Listing_30_12_2025-CRA comments as at 14012026.xlsx`，final-sheet）

| 文件类型 | 字段数 | 特殊规则 |
|---------|-------|---------|
| HP Agreement T&C | ~15 | 页数按案例类型校验；Manual 每页需签名 |
| Second Schedule Part 1 | ~10 | 英马双语必须一致；第4(1)(b)(i)条必须有删除线 |
| Driving License | 4 | 到期日 > 当前日期（Hard Rule）|
| Biometric | 5 | E-acceptance 案不需要 Biometric；状态必须为 Pass/Matched |
| Vehicle Invoice | ~15 | Booking fee ≤ OTR × 1%；OTR 公式 |
| VOC | 7 | B.D.M 由 CRA 系统校验 |
| Roadtax/JPJ Receipt | 5 | 有效期 ≥ 今日 - 1天；区域（半岛/东马）由 CRA 校验 |
| Insurance Cover Note | ~10 | 不含 "Quotation"；含 "Insurance Cover Note"；二手车 Cover Period ≥ 1年 |
| Delivery Receipt | ~10 | Delivery Date 由 CRA 校验 |
| FIS/JPJ Result | 5 | 状态 = "Processed"（普通）/"Verified"（FBR）|
| HPGA | ~10 | MOA date 与 HP Agreement 一致 |
| Guarantor Waiver (Appendix I-V) | 3 | Appendix I & II = Hirer 签；III/IV/V = Guarantor 签 |
