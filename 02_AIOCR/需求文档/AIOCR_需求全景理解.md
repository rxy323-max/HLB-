# AIOCR 需求全景理解

> **说明**：本文基于以下来源综合整理：
> - `AIOCR需求文档.pdf`（主文档，87页）
> - `PRD_File_Upload_CN.pdf`
> - `PRD_File_Management_CN.pdf`
> - `Document Lists and Category02-03.xlsx`（文件分类体系）
> - `Documents Listing_30_12_2025-CRA comments as at 14012026.xlsx`（CRA 字段规则）
> - `OCR_fields Sales Comments.xlsx (Vickie+HP CED).xlsx`（字段提取规范）
> - `Documents Listing_09-01-2026-CED_V2.0.xlsx`（IDP 文件类型字典 + CED 字段规则）

---

## 一、功能定位与系统架构

### 1.1 AIOCR 在贷款流程中的位置

```
Sales（CDM）→ 上传文件 → IDP（AI识别/OCR提取）→ CRA/CED（交叉校验）→ 审批
```

AIOCR 不是一个独立功能，而是贯穿两个阶段的能力：

| 阶段 | 文件来源 | 检验系统 | 核心动作 |
|------|---------|---------|---------|
| Application Submission | Sales 通过 CDM 上传 | OCR（IDP）提取 + Sales 确认 | AI 分类 → 字段抽取 → 人工确认 |
| Disbursement（放款） | CED 通过 CVS 操作 | OCR 提取 + CRA 校验规则 | AI 分类 → 字段抽取 → 4 区域校验结果 |

### 1.2 四段 Pipeline

```
① 文件采集（上传/检测）
      ↓
② AI 分类确认（Classification Workstation）
      ↓
③ LLM 字段提取（OCR/LLM Extraction，Gemini）
      ↓
④ 交叉校验（Cross-Validation Rules Engine）
```

每段之间均有**人工确认门**——特别是第②段：分类必须经 Sales/CED 人工确认后，系统才允许提交 OCR。

---

## 二、文件分类体系（三级）

### 2.1 层级结构

```
Phase（阶段）
 └─ Subject（主体）
     └─ Category（类别）
         └─ Document Type（AI 分类名称）
```

### 2.2 Application Submission 阶段完整分类

| Subject | Category | 主要 Document Type（AI 名称） |
|---------|---------|---------------------------|
| Applicant | Personal Identity | Mykad, MyPR, Passport, Malaysia Residence Pass, Singapore Identity card, SG Work Permit, SG Work Permit MOM, Work Permit, Driving License, Experian IBP |
| Applicant | Company Identity | Experian CP, SSM ROC, SSM ROB, Business Registration Sarawak, Trading License Sabah, Experian BP, SSM LLP, Experian LLP |
| Applicant | Applicant Income | Form B, Form BE, EA Form, CP 58, EC Form, Singapore NOA, Payslip, Individual Bank Statement, EPF Statement, PTPTN Letter, SPGA Report |
| Applicant | Collateral/Others | CRA Form, VSO, VOC, Form 8, JK 69, Bill of Lading, SCRC |
| Seller | Seller Documents | Mykad, Experian CP, SSM ROC... Seller Invoice, Information On Seller, CRA Form |
| Guarantor | Guarantor Personal Identity | Mykad, MyPR, Passport, Malaysia Residence Pass, SG Work Permit, Driving License, Experian IBP, CRA Form |
| Guarantor | Guarantor Company Identity | Experian CP, SSM ROC, SSM ROB... Experian LLP, CRA Form |
| Guarantor | guarantor Income | Form B, Form BE, EA Form, CP 58, EC Form, Singapore NOA, Payslip, Individual Bank Statement, EPF, PTPTN, SPGA |
| —— | Other Documents | Other Documents（兜底） |

### 2.3 Disbursement 阶段完整分类

| Category | Document Type |
|---------|--------------|
| CRA Identity/Company | Biometric（生物识别记录）, Mykad, MyPR... |
| CRA HP Agreement | HP Agreement T&C, Second Schedule Part 1, HP Guarantee Agreement (HPGA), Guarantor Waiver Rights & Liabilities (Appendix I-V) |
| CRA HP Form & Other Funding Docs | Vehicle Invoice, FD Receipt, Letter of Setoff (LOSO), HP276, HP566(2) Dealer Indemnity Letter, SI Form |
| CRA Vehicle Docs | VOC, Roadtax/JPJ Receipt, Insurance Cover Note, Delivery Receipt, FIS/JPJ Result, E-hakmilik copy, IBG Letter (dealer) |
| Other Documents | Other Documents |

> ⚠️ **Tab 隔离**：Application Submission 和 Disbursement 的文件列表完全独立，不互通。

---

## 三、OCR 文件分类字段命名规范

### 3.1 AI 分类名称 vs 原始文件名

部分文件的 AI 分类名称与 Sales 上传时的原始分类不同，对接开发时须用 AI 名称：

| 原始上传名 | AI 分类名（系统用） |
|-----------|-----------------|
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
| Malaysia Residence Pass | Malaysia Residence Pass |
| Other Country Work Permit | Work Permit |
| SPGA-i report | SPGA Report |
| Consent for Disclosure（CRA Form）| CRA Form |
| Vehicle sales order | VSO |
| Information On Seller/Non-Panel Dealer | Information On Seller / Non-Panel Dealer |
| Seller's invoice | Seller Invoice |

### 3.2 字段数据类型约定

| 类型 | 含义 |
|------|------|
| `string` | 普通文本 |
| `date` | 日期（YYYY-MM-DD） |
| `currency` | 金额（数字，无 RM 和千位逗号）|
| `boolean` | Y/N |
| `object` | 嵌套对象 |
| `object_array` | 对象数组（如多条月份薪资）|
| `array.string` | 字符串数组（如多个共同申请人）|

---

## 四、字段提取规格（关键文件详解）

### 4.1 字段关键属性

每个文件的每个字段有三个关键属性：

| 属性 | 含义 | 注意 |
|------|------|------|
| `Is_Mandatory` | OCR 是否必须提取到值，空则报警 | Y = 必取，N = 可选 |
| `Is_Critical` | 如果 OCR 取到了值，必须确保准确 | Y = 精度要求高，会做规则校验或人工 review |
| `Rule Type` | 校验方式 | Consistency / Formula / Date Compare / Fix Value / Exist / Eyeball Check |
| `Rule Level` | 规则严格度 | Hard Rule（阻断）/ Alert（提示，不阻断）|
| `Checking Sys` | 谁来执行规则 | OCR（IDP 自动）/ CRA（CRA 系统）/ `/`（仅人工 eyeball）|

### 4.2 核心高频文件字段速查

#### Mykad（Blue IC）
| 字段 | 标准名 | Mandatory | Critical | 备注 |
|------|-------|-----------|---------|------|
| 12位身份证号 | `id_no` | Y | Y | 与系统对比 |
| 姓名 | `customer_name` | Y | Y | **不做跨文件比对**，IC 名太多简写 |
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

### 4.3 Disbursement 阶段高频文件

#### HP Agreement T&C（分期付款合同）
- 页数规则：E-acceptance Conventional 8-9页 / Islamic 10页 / Manual Conventional 7-8页 / Manual Islamic 9页
- 关键提取：`aa_reference_number`, `hirer_name`, `nric_passport_no`, `mailing_address`, `loan_financing_terms`
- 公式校验：融资金额、利率、期限、月供四项互相验证
- 特殊规则：Manual 案例需 hirer 每页签名或初签

#### Vehicle Invoice（车辆发票）
- 关键字段：`dealer_name`, `hirer_name`, `chassis_number`, `vehicle_model`, `otr_price`, `loan_amount`, `deposit_amount`
- 公式：OTR 计算
- Booking fee ≤ OTR × 1%

#### VOC（车辆所有权证）
- 关键字段：`registration_number`, `chassis_number`, `engine_number`, `vehicle_make_model`, `year_made`, `bdm`
- 交叉验证：Insurance、FIS/JPJ、Roadtax 均需与 VOC 信息一致

#### FIS/JPJ Result
- 状态必须为 "Processed"（常规）或 "Verified"（FBR 案）
- `serial_number` 即 AA 参考号

---

## 五、校验规则体系（Cross-Validation）

### 5.1 六种规则类型

| 规则类型 | 说明 | 示例 |
|---------|------|------|
| Consistency | 与系统或其他文件字段完全匹配 | Hirer Name 与 CRA 系统记录一致 |
| Formula | 数学公式验证 | gross = basic + allowances；OTR 计算 |
| Date Compare | 日期先后/区间判断 | 驾照有效期 > 申请日；护照有效期 > 申请日 + 6个月 |
| Fix Value | 固定值存在性校验 | FIS 状态必须为 "Processed"/"Verified" |
| Exist | 字段/元素是否存在 | 签名是否存在 |
| Eyeball Check | 仅人工目视，不自动验证 | 发票内含 "Invoice" 字样 |

### 5.2 规则级别

| 级别 | 行为 |
|------|------|
| Hard Rule | 校验失败则**阻断**，不可跳过 |
| Alert | 校验失败则**提示警告**，CED/CRA 可人工处理后放行 |

### 5.3 典型跨文件校验链

```
Payslip → Bank Statement    (工资月份 & 到账金额 交叉)
VOC → Insurance Cover Note  (车架号 & 登记号 一致)
VOC → FIS/JPJ Result        (底盘号 & 发动机号 一致)
VOC → Roadtax               (登记号 一致；Roadtax 有效期校验)
Vehicle Invoice → VOC       (车型 & 底盘号 & 发动机号)
HP Agreement → AA Ref No    (所有 CRA 文件 AA 号统一)
HP Agreement → 2nd Schedule (融资条款四项互验)
Biometric → Hirer Name & NRIC (全匹配)
FD Receipt → Loan Condition (抵押金额 ≥ 条件批准要求)
```

### 5.4 执行系统分工

```
OCR 系统（IDP）负责：
  - 字段提取
  - Consistency 规则（与系统对比）
  - Formula 规则
  - Exist 规则

CRA 系统负责：
  - Hirer's date（OCR 提取，CRA 校验）
  - EHP witness Date（比对 hirer 日期）
  - MOA date
  - Delivery date
  - Deposit Date
  - FIS/JPJ Status（Fixed Value）
```

---

## 六、文件检测规则（5 层）

| 层级 | 检测项 | 处理方式 |
|------|--------|---------|
| L1 | 文件格式（非 PDF/JPG/PNG 等） | Hard Block |
| L2 | 文件大小超限 | Hard Block |
| L3 | 加密/密码保护 PDF | Hard Block |
| L4 | 文件损坏/无法读取 | Hard Block |
| L5 | 疑似伪造（防伪检测） | Soft Warning（提示，可继续）|

---

## 七、AI 分类的特殊场景与难点

### 7.1 需要特别区分的易混淆文件

| 易混淆文件对 | 区分方法 |
|------------|---------|
| Mykad vs Biometric MyKad（Disbursement） | Biometric 有物理芯片 + 指纹图标 + "STATUS PENGESAHAN CAP JARI" |
| Form B vs Form BE | Form B 有 "WHO CARRIES ON BUSINESS" + P&L 页 + serial 号以 "B" 开头 |
| SPGA-i（黄金报告）vs Experian IBP | SPGA-i 有 "SPGA INTELLIGENCE REPORT-(SPGA-I)" 标题 + "Grams (g)" 单位；IBP 有 "Shareholding %" |
| SSM ROC vs Experian CP | ROC 是政府官方摘录（带注册机关印章）；CP 是 Experian 商业报告 |
| SG Work Permit vs SG Work Permit MOM | WP = 卡片本体；MOM = MOM 网站/App 数字验证截图 |
| VOC vs Vehicle Ownership Card | VOC 依据 Road Transport Act 1987 Second Schedule；两者字段有差异 |
| Salary crediting（银行流水薪资入账） | 不是独立文件，是对 Individual Bank Statement 中特定交易行的验证 |

### 7.2 已知 AI 误判案例（来自 CED 实测）

| 文件 | 误判为 | 原因 & 解决 |
|------|--------|-----------|
| SPGA-i | Experian IBP | 表格结构相似；需强调 "Grams (g)" 关键字 |
| SG Driving License | Unknown | **不支持识别**，明确排除在支持范围之外 |
| PTPTN（手机邮件截图） | Unknown | 属正常行为；CED 会退回给 Sales |

### 7.3 Batch 1 不包含的文件类型（数据库已删除）

- **Biometric MyKad**（Disbursement 专用 Biometric）— 非 Batch 1
- **Rental（租赁协议）** — Batch 1 无
- **Fixed Deposit Slip** — Batch 1 不测
- **SG Driving License** — 不支持识别

---

## 八、LLM 字段提取配置（IDP 系统）

### 8.1 Document Type Dictionary（doctype_dictionary 表）

CED 团队维护的文件类型字典，每条记录包含：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识（如 `DT_1768532394726_5ad68d`） |
| `description` | **英文 AI 分类指令**（用于 LLM Prompt），含识别特征、字段说明、分类逻辑 |
| `description_cn` | 中文版本（供内部参考）|
| `phase` | 阶段（可为 null） |
| `category` | 文件类别（如 "Personal Identity"）|
| `name` | AI 文件类型名称（如 "Mykad"）|

> 这些 description 字段**就是喂给 AI 的 prompt**，决定分类准确率。CED 在持续优化这些描述。

### 8.2 Field Extraction Schema

每个文件类型有独立的字段提取 schema，包含：
- `Field_Name`：标准化字段名（如 `id_no`, `customer_name`）
- `data_type`：数据类型
- `Region_Info`：字段所属区域（如 `customer_info`, `monthly_records`）
- `Is_Mandatory`：提取是否必须有值
- `Is_Critical`：是否需要高精度保证
- `Validation Rules`：校验逻辑

### 8.3 配置变更管控

LLM 提示词和字段提取配置的变更需走 **Maker-Checker** 流程：

1. Maker（产品/运营）发起配置变更请求
2. Checker 审核批准
3. 系统自动生成新版本（SemVer：Major.Minor.Patch）
4. 历史版本保留，可追溯

---

## 九、产品流程设计要点

### 9.1 两个提交门

| 门 | 时机 | 规则 |
|----|------|------|
| 分类确认门 | 提交 OCR 之前 | 所有文件的 AI 分类必须经人工确认，否则无法提交 |
| OCR 处理门 | 提交审批之前 | 处理中的文件不允许提交（Batch 2 引入队列管理）|

### 9.2 分类确认工作台（AI Classification Workstation）

- 左侧：PDF 预览 + 缩略图导航
- 右侧：AI 分类结果（含置信度，可手动修改）
- 支持**一文件多类型拆分**：将一个 PDF 按页范围拆分为不同文件类型
- 处于"处理中"状态的文件，其页面上其他文件亦不可提交

### 9.3 OCR 结果展示与 4 区域校验

OCR 结果展示工作台分 4 个区域：

| 区域 | 内容 |
|------|------|
| 区域 1 | 字段提取结果（Extracted Fields） |
| 区域 2 | Consistency 校验结果 |
| 区域 3 | Formula/Date/Fix Value 校验结果 |
| 区域 4 | Exist/Eyeball 检查结果 |

各区域状态：Pass / Fail / Alert / Not Applicable

---

## 十、Batch 2 功能补充（待规划）

基于已知 Batch 1 边界，Batch 2 重点方向：

| 功能模块 | Batch 2 内容 |
|---------|-------------|
| 队列管理 | 智能排队、并发控制（Batch 1 无队列）|
| 手动重试 | OCR 失败后支持单文件重试触发 |
| 文件过期策略 | 超期未处理文件的状态管理与提醒 |
| 基于角色的删除 | 不同角色（Sales/CED/CRA）有不同删除权限 |
| Biometric MyKad | Disbursement 阶段生物识别文件识别支持 |
| Fixed Deposit Slip | 定期存款单识别与校验 |
| 更丰富的跨阶段文件复用 | Application Submission 文件在 Disbursement 阶段的复用策略 |

---

## 十一、术语对照表

| 英文 | 中文 |
|------|------|
| AA Reference Number | 申请参考编号（系统生成，跨文件贯通） |
| Hirer | 承租人（借款人）|
| EHP | 外聘合伙人（执行分期付款文件的外部代理）|
| VOC | 车辆所有权证 |
| FIS/JPJ | 陆路交通局电子系统 / 结果 |
| E-hakmilik | 电子所有权（FIS 处理后的电子产权凭证）|
| OTR | On-The-Road Price（含注册费、保险的落地价）|
| HPGA | 分期付款担保协议 |
| LOSO | Letter of Set-off（抵销授权书）|
| PBT | Payment Before Transfer（过户前放款）|
| CRA | 信贷风险审批部门（校验侧）|
| CED | 信贷执行部门（放款侧操作 CVS）|
| IDP | 智能文件处理平台（AI OCR 引擎）|
| FPS | 文件存储系统 |
| CDM | 贷款申请入口（Sales 使用）|
| CVS | 放款操作系统（CED 使用）|
| SCRC | Shariah Compliance & Review Certificate（伊斯兰金融合规证明）|

---

## 附录 A：Application Submission 文件字段完成状态

（来源：`Document Lists and Category02-03.xlsx` 的 `OCR文件清单` Sheet，字段 `字段清单完成标记`）

所有 Application Submission 阶段的 AI 文件类型，字段清单均已标注 `Y`（已完成定义），共约 **200 个文件类型实例**（含 Applicant/Seller/Guarantor 分 Subject 的重复文件类型）。

---

## 附录 B：Disbursement 阶段文件规则摘要

（来源：`Documents Listing_30_12_2025-CRA comments as at 14012026.xlsx`，final-sheet）

| 文件类型 | 字段数 | 特殊规则 |
|---------|-------|---------|
| HP Agreement T&C | ~15 | 页数按案例类型校验；Manual 每页需签名 |
| Second Schedule Part 1 | ~10 | 英马双语必须一致；第4(1)(b)(i)条必须有删除线 |
| Driving License | 4 | 到期日 > 当前日期（Hard Rule） |
| Biometric | 5 | E-acceptance 案不需要 Biometric；状态必须为 Pass/Matched |
| Vehicle Invoice | ~15 | Booking fee ≤ OTR × 1%；OTR 公式 |
| VOC | 7 | B.D.M 由 CRA 校验 |
| Roadtax/JPJ Receipt | 5 | 有效期必须 ≥ 今日 - 1天；区域（半岛/东马）由 CRA 校验 |
| Insurance Cover Note | ~10 | 不含 "Quotation"；含 "Insurance Cover Note"；二手车 Cover Period ≥ 1年 |
| Delivery Receipt | ~10 | Delivery Date 由 CRA 校验 |
| FIS/JPJ Result | 5 | 状态 = "Processed"（普通）/"Verified"（FBR） |
| HPGA | ~10 | MOA date 与 HP Agreement 一致 |
| Guarantor Waiver (Appendix I-V) | 3 | Appendix I & II = Hirer 签；III/IV/V = Guarantor 签 |
