# 06_放款 — STP 放款（Disbursement）需求整理

> 本目录归档 STP 放款阶段的原始需求材料，并把「放款条件、流程、OCR 文件清单、上下游交互」四个主题的结论整理在本文件中。
> 上一阶段的 OCR 只服务于销售提交申请（STP 审核）；本阶段把 OCR 延伸到放款（Disbursement/CRA）环节。

---

## 参考资料清单

| 文件 | 说明 |
|------|------|
| `参考资料/05 CrediOS_FRS_HP_Disbursement_Modified_Based_on_Final_20260115.docx` | **放款主 FRS**（与仓库根目录 00–04 号 CrediOS FSD 同一系列）。含 Sales 放款提交、CRA Checker/Maintenance、Expert Rules、STP Processing Module、CRA Authorizer、Disbursement Procedure、文书生成/邮件、参数配置全链路 |
| `参考资料/Appendix - CRA Business Rules & Defect Code (signoff version).xlsx` | FRS 附录（signoff 版）。按文档逐条列出 CRA 专家规则：规则类型、Value to Verify、Base Value、对应 Defect ID/Code/Category。Sheet：Rule type（14 类规则）、Rule details for all（≈89 条有效规则）、个人/公司业务规则参考 |
| `参考资料/STP放款需求清单.xlsx` | HP Batch 3 放款需求功能点清单（中文，63 条），按一级功能点分组：担保人、Dealer、二手车、复新车、CILT、LOU Renewal、非个人、E-acceptance、E-Hakmilik、AIOCR、专家规则、文书/短信邮件、STP、报表等，含业务负责人与确认状态 |
| `参考资料/Business_Rule_Validation4.html` | CRA 规则校验工作台交互原型（三栏：规则列表 / 规则详情+公式+Confirm/Error/Edit 操作 / 文档预览），内置 22 条示例规则（日期、计算、固定值、地区、一致性 5 类） |

其他关联资料（仓库根目录）：`02 CrediOS_FSD_HP_AIOCR_1.4_20260106.docx`（OCR 双阶段 Tab：Application Submission / Disbursement）、`01 CrediOS_FSD_HP_Product_Sales_20260116_EN.docx`（状态机 30 Accepted → 37/38 Disbursed、放款文档生成触发表）。

---

## 1. STP 放款的条件

**STP 定义**（放款 FRS 2.4）：Sales 提交放款申请到 CRA 后，直至完成放款（funding），全程无需 CRA 团队人工介入。

### 1.1 业务场景资格（7 条限制，全部满足才可进 STP）
1. 个人客户（Individual）
2. 新车（New car）
3. 唯一受益人，且与 Dealer 管理系统中车商受益人一致
4. 无清偿（No payoff）
5. 非 FBT
6. 无定期存款质押（No FD pledge）
7. 车商不是 Floor Stock 批发融资商（依据 Dealer 管理模块新增的 Floor Stock Dealer 指标）

### 1.2 审批超期校验（90 天三层级对比，任一层不过则移交人工）
- a. 当前工作日期 ≤ 首次审批日期 + 90 天 → 允许；否则查 b/c
- b. 车辆注册日期缺失 → 不允许（FBR/FBT 场景）
- c. 车辆注册日期 ≤ 首次审批日期 + 90 天 → 允许；否则查 d/e
- d. LOU Renewal 日期缺失 → 不允许
- e. 当前工作日期 ≤ LOU Renewal 日期 + 90 天 → 允许；否则不允许
- 审批日、LOU 展期日均按 Day 1 起算；阈值 X=90 天为系统参数

### 1.3 流程前置条件
- AIOCR 交叉验证通过（cross-check passed）
- 「Automatic Routing to Expert Rules」开关为 ON，且专家规则全量校验通过
- 全局 `STP_SWITCH` 为 ON（General Constant 配置，默认 OFF；OFF 时 STP 案件降级到 CRA Authorizer 人工处理）

### 1.4 分支控制
- **Full maintenance indicator = Yes**：一键直通完成放款 + 协议文书生成 + 邮件外发
- **Full maintenance indicator = No**：仅自动完成放款步骤，随后案件转入 Post Maintenance 队列人工跟进（状态 Funded Pending Post Maintenance）
- 通过 STP 决策的案件强制记录 **STP Application indicator**（用于报表过滤）；柜员 ID 记录为 System teller ID（区别于人工的 Authorizer ID）

---

## 2. STP 放款的流程

```
Sales（Acceptance 完成后）
 ├─ Trigger Lodgment（E-Hakmilik，生成 E-Hakmilik slip）
 ├─ FIS Query（自动查询车辆 lodgement/注册状态；verified/processed；FBR/FBT、IHP 跳过自动查询）
 ├─ Dealer Information Query（FBR/FBT 资格：Undertaking Limit ≥ 贷款金额）
 ├─ 上传放款文件（无需预分类）→ OCR 自动分类 → Sales 确认分类结果
 └─ Submit 放款申请（触发 Host Acceptance：CIF / Facility / Collateral 创建）
        ↓
系统自动：文件分流分类 + 完整性校验 + OCR 提取 + 交叉验证
        ↓
预分流（Pre-sorting）
 ├─ OCR 交叉验证通过 + 自动路由开关 ON → CRA 专家规则自动校验
 │     ├─ 校验通过 → STP 决策模块
 │     └─ 校验失败 → CRA Checker/Maintenance 队列（标记「专家规则结果待确认」，自动登记 Defect Item）
 └─ 交叉验证失败 / 开关 OFF → CRA Checker/Maintenance 队列（标记「OCR Result Pending Confirmation」）
        ↓
STP 决策（1.1 资格 + 1.2 90天校验）
 ├─ 符合 → 按 OCR 结果自动填充放款数据，打 "STP" 标签 → STP Switch 判定
 │     ├─ SWITCH ON → 自动化放款处理（Automated Disbursement Processing）
 │     └─ SWITCH OFF → CRA Authorizer 人工处理
 └─ 不符合 → CRA Authorizer（人工授权，授权限额 = 批准贷款额 + 手续费 + GST/SST；授权人不得与最近的 checker/defect 处理人同人）
        ↓
放款执行（Disbursement Procedure，STP 与人工路径共用）
 1. Host Maintenance：同步 Hirer/Guarantor/CIF/抵押/额度到 HOST；维护 Agreement Date
    （STP + 人工签约：用 OCR 从纸质合同提取的签署日；STP + E-acceptance：用当前工作日）
 2. Account Creation（HOST）
 3. Disbursement 放款记账（HOST）
    ※ 以上各步接口超时可重试 X 次，超限或数据错误进入 Error Queue
 4. Hirer/Guarantor 文书自动生成（HP Agreement & T&C & Appendix + Covering Letter 合并 PDF，
    按客户语言选模板，生成加密（专属 PIN）+ 非加密两个版本自动挂附件）
 5. 邮件自动外发（放款后第 X 天发送，含加密文书附件）
        ↓
非 Full Maintenance 案件 → Post Maintenance / Post Authorization → 补充文书生成
```

放款后：LHDN 电子印花税批量 XML（E-acceptance 案件自动嵌入 Print Log.pdf 并与人工案件分流打包）、放款对账/绩效报表（按 STP Application indicator、AP_INDICATOR、Manual Process Indicator 过滤）。

---

## 3. 放款阶段需要 OCR 的文件清单

### 3.1 上传大类（AIOCR FSD「Financing Disbursement」Tab）
| 大类 | 文件 |
|------|------|
| Applicant Identity_CRA Docs | Driving License、Company Resolution、Director NRIC 等 |
| HP Agreement_CRA Docs | HP Agreement（Ind/Com、Conv/Islamic）、Guarantor Agreement（Ind/Com/Foreigner）、Appendix I–V 等 |
| Vehicle Related_CRA Docs | Vehicle Invoice、VOC、Road Tax、Insurance Cover Note、Puspakom（B5/B7/B2）、E-hakmilik 等 |
| Other Funding Related_CRA Docs | Application Form、2nd Schedule、SI Form、LOSO、Seller Invoice/IC、Bank Statement 等 |
| Other Documents | 仅存储，不做 OCR |

### 3.2 CRA 专家规则覆盖的文档明细（Appendix xlsx「Rule details for all」）
**通用必备**：Application Form（版本随申请日期映射：Vol7/Vol8/V020/V021）、HP Agreement（人工/E-acceptance 两套版本号）、Guarantee Agreement、2nd Schedule Part 1、Vehicle Invoice、Road Tax Disc/JPJ Receipt、Insurance Cover Note、Delivery Receipt（dealer/seller）、FIS/JPJ Result、Credit Note-Admin Fee（仅二手车）、Puspakom B7、Puspakom B2（仅复新车）、Bankruptcy Search、Terms & Conditions、Appendix 3/4、HP216（Seller Invoice）、HP276/546/556/566

**个人客户附加**：FD Pledge Receipt、LOSO（常规 10 页/伊斯兰 13 页）、Non Panel Dealer Loan Suspense Deposit Receipt、Puspakom B5/M.V.15、E-hakmilik、Seller's IC

**非个人客户附加**：Company Resolution、Bankruptcy Search、ROC/SSM Search/IBP（西马）或 Form I/Certificate of Practice（东马，需原件 sighted）、Partnership Mandate、PG11 检验报告、VR1、Permit

### 3.3 专家规则类型（14 类）
Date Consistency / Date ≥ 指定日期 / Date ≤ 指定日期 / 日期区间 / Fixed Value Comparison（如 Admin fee = RM270，参数 ADM_FEE_AMOUNT）/ Amount Range / Amount Consistency / Account Consistency / Term Consistency / 加减法验证（分项放款金额之和 = 贷款总额）/ 申请日期 vs 表单版本映射 / Region/Area Check（西马车商 ↔ 路税地区）/ Special Document Verification（场景性专用文件缺失，如 FD pledge 需 FD Pledge Receipt）/ Value is not existing（关键字段缺失）

每条规则挂接 Defect ID / Defect Code / Defect Category；专家规则校验不通过自动登记 Defect Item，二次提交通过后自动置为 Rectified。校验结果工作台交互见 `Business_Rule_Validation4.html`（Confirm Result / Error Result / Edit + Reason）。

---

## 4. 上下游交互

### 上游（放款的输入）
- **签约模块（05_签约）**：Acceptance 完成是放款前提；E-acceptance 案件协议日期默认当前工作日（可改），签约文书自动归档并作为 OCR 比对基准（Version 1 数据）
- **审批链路**：首次审批日期（90 天校验基准）、CED 批准额度（FD 质押金额/期限比对基准）
- **CILT**：VSO 阶段 Version 1 数据 vs 发票/VOC 提取 Version 2 数据比对；E-acceptance 场景保险费/注册费/运费不一致、人工场景 OTR 不一致 → 弹缺陷提示，用户取消则切入 CILT 变更流程；涉及 B2B/RBS SREF 审计字段的变更强制 Reason Code

### 放款阶段横向交互
- **FIS/JPJ**：E-Hakmilik lodgement 与车辆注册状态查询（verified/processed）；带缓存（FIS_AUTO_INQUIRY_SPAN）与总开关（FIS_INQUIRY_SWITCH）；FBR/FBT、IHP 跳过自动查询
- **Dealer 管理模块**：FBR/FBT Undertaking Limit 资格、Floor Stock Dealer 指标、Non-panel dealer 提示（First Deposit Receipt）；Authorizer 需登录 HOST 查车商实时可用额度
- **HOST 核心系统**：Host Acceptance（CIF/Facility/Collateral 创建，Sales 提交时触发）→ Host Maintenance（信息同步、Agreement Date）→ Account Creation → Disbursement 记账；超时重试 + Error Queue 机制；STP 案件用 System teller ID
- **AIOCR 引擎**：文件分类、字段提取、交叉验证；OCR 状态三色监控（绿/黄/红）；人工提前介入记 Manual Process Indicator=Y

### 下游（放款后输出）
- **文书与邮件**：Hirer/Guarantor 合并 PDF（加密规则——本地个人：生日+NRIC 后 4 位；外籍：生日+护照号；非个人：公司成立日+去横杠注册号）；Infobip/邮件模板支持多语言多版本与动态变量
- **LHDN**：电子印花税批量 XML；E-acceptance 嵌入 Print Log.pdf；担保人文书后缀 _G1/_G2
- **RBS / eTracker**：放款状态回查（first release date → IS FUNDED），客户侧显示 Disbursement 状态
- **报表/EDW**：放款每日对账（AP_INDICATOR 筛选）、HP 绩效报表（二手车借款人+担保人合并单条）、缺陷报表（多担保人姓名同格合并）、LHDN e-certificate upload report、STP Application indicator 过滤

---

## 待确认事项（来自需求清单标注）

- E-Hakmilik Lodgement >30D 反欺诈拦截：负责人待定，需求未确认
- E-Hakmilik 查询权限与处理权限分离：划分维度待确认
- Dealer LOU/E-hak 邮件发送标志：参数记录方案未定，相关邮件判断逻辑暂被注释
- Application Inquiry/To Do List 回车触发查询：前端整体未支持，需总体讨论
- 2027年1月 EIR 定价产品切换后，计算类校验规则如何快速适配（Appendix refer info 提出）
