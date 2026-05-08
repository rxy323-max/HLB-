# HLB Non-Individual HP 进件系统 — 需求明细文档 V3

> 状态：优化版  
> 日期：2026-05-07  
> 核心调整：本文聚焦 Sales 进件。风险、CED、放款只保留“概念链路和前置依赖”，用于解释进件字段为什么需要收，不展开成后续团队的完整需求。

## 1. 需求目标

本系统用于支持 HLB 银行贷款销售为 Non-Individual 客户创建 HP/IHP 车贷申请，并把申请以较高完整度提交到后续风险审批、CED 和放款链路。

V3 的产品目标不是把历史纸质表单搬到线上，而是降低销售录入成本，提高一次性提交质量，减少后续团队因主体、角色、材料、签字、报送字段不完整而退回。

## 2. 核心原则

| 原则 | 说明 |
|---|---|
| 企业主体优先 | 先确认 Primary Applicant，即企业身份、ID、Entity Type、CIF/ETB/NTB |
| 数据源驱动 | 每个字段标记来源：System、Login、Master Data、Experian、HOST CIF、OCR、Manual |
| 后续链路可视 | 对 Risk、CED、Disbursement、BNM Reporting 只显示进件侧准备状态 |
| 角色三维分离 | 法律身份、所有权身份、签约权力分开建模，可叠加显示 |
| 销售少填 | 银行内部归属尽量自动带出，只在例外和业务分叉时确认 |
| 可重跑可追溯 | CED Rework、字段修改、OCR 修正、材料替换均保留来源和审计记录 |

## 3. 用户与角色

| 用户 | 主要目标 |
|---|---|
| Sales Officer | 创建申请、补齐企业/角色/收入/车辆/产品/材料信息，提交审批 |
| Sales Support | 协助录入、补件、查看案件 |
| Sales Manager / HOS | 处理 Appeal、改派、例外确认、权限范围内审批 |
| CED Officer | 审核风险、收入、材料、Deviation、Exception，执行 Rework/KIV |
| CRA Checker/Maintenance | 检查放款材料、FIS、Dealer/FBR/FBT、Host Acceptance |
| CRA Authorizer | 放款授权、资金维护与最终确认 |
| Admin | 维护组织、分行、Dealer、产品、价格、材料清单、规则参数 |

## 4. 业务对象模型

| 对象 | 说明 |
|---|---|
| Application | 一笔 HP/IHP 贷款申请，包含主体、车辆、产品、材料、审批状态 |
| Primary Applicant | 主申请人，Non-Individual 场景下为企业 |
| Related Party | 企业相关方，包含 Director、Shareholder、Owner、Partner、UBO、Signatory |
| Guarantor | 对贷款承担担保责任的人或实体，收入计入 DSR |
| UBO | Ultimate Beneficial Owner，必须是自然人，主要用于 AML/BNM 合规 |
| Signatory | BR/决议授权签约人，决定合同/LOU/Agreement 签署合法性 |
| Facility | 贷款额度、期限、利率、产品、HP Line/HP+Plus 等信息 |
| Collateral | 车辆资产信息 |
| Document | 进件、CED 条件、放款阶段的材料及 OCR 结果 |
| Case Context | Officer、Branch、Channel、Dealer、Source、Campaign、Ownership |

## 5. 推荐主流程

```
0 新建申请
1 锁定企业主体
2 申请上下文确认
3 企业画像补齐
4 股权/UBO/角色结构
5 担保人与收入
6 车辆、Dealer、产品方案
7 材料上传与 OCR
8 提交前准备度检查
9 提交 Risk/CED
10 Sales End / Acceptance / Disbursement 联动
```

## 6. Step 0 新建申请

### 6.1 页面目标

建立最轻量的申请壳，避免销售在不知道企业主体前先处理大量内部归属字段。

### 6.2 字段

| 字段 | 必填 | 来源 | 规则 |
|---|---:|---|---|
| Application Type | Y | 用户选择/入口 | 本需求固定为 Non-Individual |
| Application No. | S | 系统生成 | `NI-YYYYMMDD-XXXXX` |
| Officer | S | 登录用户 | 默认只读 |
| Branch / Region | S | 登录用户组织覆盖 | 如果 Branch 关闭，阻断提交 |
| Create Date | S | 系统 | 自动记录 |

## 7. Step 1 锁定企业主体

### 7.1 页面目标

通过企业证件锁定 Primary Applicant，并自动推荐 Entity Type、Constitution、ETB/NTB、HP Line。

### 7.2 字段与规则

| 字段 | 必填 | 来源 | 规则 |
|---|---:|---|---|
| ID Type 1 | Y | 用户选择 | 默认 SSM ID；按企业类型过滤可选项 |
| ID No. 1 | Y | 用户输入/OCR | 按 ID Type 校验格式 |
| ID Type 2 | C | 用户选择 | ID Type 1 为 SSM ID 且 CIF 查询要求时必填 |
| ID No. 2 | C | 用户输入/OCR | 兼容旧 SSM/BR/CI/RC/FR |
| Enterprise Type | Y | 系统推荐 + 用户确认 | 由 SSM 12 位编码、旧 ID Type 或用户选择得出 |
| Constitution | Y | 系统映射 + 可覆盖 | A=R，B=U，D=S，E=P，J/K 多映射 |
| CIF No. | C | HOST | ETB 命中时返回 |
| ETB/NTB | S | HOST | 命中 CIF 为 ETB，否则 NTB |
| HP Line Hit | S | BCB Source | 命中时弹窗：普通案件 / HP Line 案件 |

### 7.3 关键交互

- 用户输入 ID 后点击 `Check & Lock Company`。
- 系统并行查询 CIF、Experian/SSM、HP Line。
- 返回企业识别卡片，展示 Company Name、ID、Entity Type、Constitution、ETB/NTB、HP Line。
- 用户确认后锁定主体。ID Type + ID No 不允许编辑，错误时需废弃申请重建。

## 8. Step 2 申请上下文确认

### 8.1 页面目标

在企业主体已锁定后，确认案件归属、来源和特殊标签。

### 8.2 字段

| 字段 | 必填 | 来源 | 显示策略 |
|---|---:|---|---|
| Officer / Staff ID | S | 登录态 | 顶部卡片只读 |
| Branch / Region | S | 组织主数据 | 默认只读，特殊权限可改派 |
| Channel Type | C | 来源/用户 | Direct 默认隐藏 Dealer 字段 |
| Dealer Code | C | Dealer 主数据 | 仅 Dealer/Indirect 显示 |
| Source Code | C | Lead/Dealer/用户 | 影响 Campaign/Greenlane |
| Campaign | C | 产品配置 | 产品步骤确认 |
| Case Tags | S | 系统 | HP Line、Fleet、HP+Plus、FBR/FBT、Manual Acceptance |

### 8.3 设计决策

银行内部渠道和分行不建议作为第一步重表单。它们是案件归属上下文，应在主体锁定后以只读卡片呈现；只有 Dealer/Indirect、跨分行、Branch 关闭、权限覆盖等场景才要求销售处理。

## 9. Step 3 企业画像补齐

| 分组 | 字段 | 必填 | 来源/规则 |
|---|---|---:|---|
| 注册信息 | Company Name、New BR No、Old Reg No、Establishment Date、Years in Operation | Y | Experian/SSM/OCR，成立年限自动算 |
| 组织分类 | Basic Group、Constitution、Country of Incorporation | Y | 根据 Entity Type 映射 |
| 经营信息 | Nature of Business Group、Nature of Business Code、Customer Sector、GP Ratings | Y | 主数据/配置，支持映射 |
| 税务地域 | Country/State of Operation、Place of Registration、TIN、FEN Resident Status | Y/C | TIN 校验严格格式 |
| 财务概况 | Annual Sales Turnover、No. of Employee、Paid Up Capital、Primary Income Doc | Y/C | 手填/OCR/计算 |
| 合规确认 | PEP、RCA to PEP、复杂结构、Nominee/Bearer Shares、Face-to-face | Y | 所有相关自然人参与 AML |

## 10. Step 4 股权、UBO 与角色结构

### 10.1 数据来源

Experian API 按类型选择：

| Entity Type | Option |
|---|---|
| A/B/C | CP |
| D/E | BP |
| F/G/H | LLP |

### 10.2 工作台能力

| 功能 | 规则 |
|---|---|
| Extract Structure | 查询董事、个人股东、法人股东 |
| Tree Diagram | 支持 pan/zoom，节点显示类型、持股、角色标签 |
| Table View | 支持编辑关系、持股比例、增删节点 |
| Drill-down | 法人股东 >25% 或无法识别 UBO 时手动输入下一层企业 ID 查询 |
| UBO Confirm | 从自然人候选中选择，或 Customize，或选择豁免 |
| Signatory Mark | 从授权董事/合伙人/委员会成员中标记签约人 |

### 10.3 UBO 规则

| 类型 | 规则 |
|---|---|
| A Sdn Bhd | 穿透至持股 >25% 或实际控制自然人 |
| B Berhad | 上市大型 Bhd 可豁免或 Top 5 简化，待合规确认 |
| C Branch | 跨国穿透至海外母公司自然人/控制人 |
| D Sole Prop | Owner 自动为 UBO |
| E Partnership | 全体 Partner 自动为 UBO |
| F/G/H PLT | 识别 >25% 利润分配权/核心合伙人 |
| J Society | 委员会成员职位确认 |
| K Government | 豁免 |
| L East MY SE | 持牌人自动为 UBO |

## 11. Step 5 担保人与收入

### 11.1 担保规则

| 类型 | 担保要求 |
|---|---|
| A | 通常 1-2 名董事 PG，建议系统按产品/政策配置强制性 |
| B | 大型 Bhd 通常豁免 PG |
| C | 海外母公司 CG 或本地授权代表，需业务确认 |
| D | Owner 无限责任，通常无需额外担保 |
| E | 全体 Partner/Owner 必须录入 |
| F/G/H | 核心/全部 Partner 作为 Guarantor，按配置控制 |
| J | 主要委员会成员 PG |
| K | 免担保 |
| L | 持牌人无限责任，通常无需担保 |

### 11.2 相关方查询

| 查询 | 主申请人 | Guarantor | Non-Guarantor/UBO |
|---|---:|---:|---:|
| CIF Profile | Y | Y | Y |
| WT Whitelist | N | Y | N |
| Income DB | N | Y | N |
| App History | Y | Y | Y |
| Pre-Consent | Y | Y | Y |
| HP Line | Y，仅企业 | N | N |

### 11.3 收入聚合

只有 Primary Applicant 和 Guarantor 的收入进入 DSR/DSCR。UBO、Director、Shareholder、Signatory 如未承担担保责任，不计入收入。

## 12. Step 6 车辆、Dealer 与产品方案

| 模块 | 字段/规则 |
|---|---|
| Vehicle | Make、Family、Model、Variant、YOM、New/Used/Recond、MV/RB、BNM 车辆分类 |
| Dealer | Dealer Code、Dealer Status、FBR/FBT Limit、Panel/Non-panel、资格提示 |
| Product | Conventional/Islamic、HP/IHP、HP Line、HP+Plus、Tenure、Loan Amount |
| Pricing | EIR、Flat Rate、Campaign、Price Rule、Deviation、Approval Matrix |

FBR/FBT 相关规则在放款阶段强校验，进件阶段展示 Case Tag 和后续资料提醒。

## 13. Step 7 材料上传与 OCR

### 13.1 分阶段材料

| 阶段 | 材料 |
|---|---|
| Application Submission | 企业注册、董事/股东、收入、车辆销售订单、Consent、KYC |
| CED Condition | CED 条件审批要求补件 |
| Disbursement | Agreement、Guarantor Agreement、Company Resolution、VOC、Road Tax、Insurance、E-Hakmilik |

### 13.2 提交门禁

提交风险/CED 前必须通过：

- 文件格式/大小/加密校验
- AI 分类确认
- OCR 抽取
- 关键字段人工确认
- 字段交叉校验
- 必需材料清单完整性

## 14. Step 8 提交前准备度

| 准备度 | 通过条件 |
|---|---|
| Risk Ready | Hard Rules 输入完整，AML/CDD/EDD 所需主体完整，收入/车辆/贷款方案完整 |
| CED Ready | OCR 差异处理、材料清单完整、风险标签和收入来源清楚 |
| Disbursement Ready | Signatory、Manual Acceptance、Host Acceptance、FIS/Dealer/FBR/FBT、车辆材料状态明确 |
| BNM Ready | Constitution、CCRIS 分类、TIN、UBO、ID Type/No 完整 |

## 15. 后续链路概念：风险与 CED

提交后会进入风险和 CED 链路。进件侧只需要保证后续能拿到必要信息，并把缺口提前提示给 Sales。

进件侧需要理解的概念：

- Risk 会使用申请表、OCR、内部数据、外部征信和规则输出审批结果。
- AML/CDD/EDD 覆盖企业、担保人、Owner、UBO 等相关方。
- CED 会基于 Sales 提交的信息核查收入、风险暴露、材料、Deviation 和 Exception。
- 如果 CED Rework，Sales 回到对应进件步骤补信息，系统应高亮被退回字段和资料来源。

## 16. 后续链路概念：放款

放款不是本进件需求的实现重点，但进件需要提前知道以下概念，避免后面卡住：

- 签约人、担保人、企业名下车辆注册会影响合同和放款材料。
- Dealer、FIS、FBR/FBT 会影响 CRA 放款判断。
- VOC、Road Tax、Insurance、Agreement 等属于放款材料，不应在进件早期强压给销售，但应在 Review 页提示后续需要。
- Host Acceptance 会创建或维护 CIF、Facility、Collateral，因此进件侧的企业主体、贷款方案、车辆信息必须稳定。

进件阶段不强制完成放款动作，只做“后续影响提示”和必要前置字段校验。

## 17. 待确认事项

| 优先级 | 事项 |
|---|---|
| 高 | Bhd 上市/大型客户 UBO 豁免或 Top 5 简化规则 |
| 高 | A 类 Sdn Bhd 是否强制 1-2 名董事 PG，还是按产品/额度配置 |
| 高 | F/G/H PLT “全部 Partner”还是“核心 Partner”作为 Guarantor |
| 高 | C Branch 的 Constitution 归属及海外母公司 CG/PG 规则 |
| 中 | Branch/Channel 是否允许 Sales 手动覆盖，覆盖权限归属 |
| 中 | FBR/FBT 在进件阶段是否只提示，还是提交前要求确认 |
| 中 | HP Line 命中后是否允许普通案件继续，是否需记录原因 |
| 中 | Non-Individual 是否完全不走 E-Consent/E-Acceptance，还是部分无担保场景保留 |
| 低 | 各收入计算器详细字段、公式和 OCR 字段映射 |
| 低 | 必需材料清单后台配置粒度 |
