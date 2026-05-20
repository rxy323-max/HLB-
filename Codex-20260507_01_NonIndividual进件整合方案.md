# Codex-20260507 Non-Individual 进件整合方案

> 本文件是进件整合稿。字段细节不在本文重复展开，详细字段仍回到 `04_NonIndividual_需求明细文档_V2.md`、`企业提交信息.xlsx` 和原始 FSD 查询。

## 1. 产品定位

Non-Individual 申请应并入现有 HP 申请功能，而不是新建一套独立系统。

现网个人申请已有：

- Application Case Pool / To-do list 入口
- 左侧 Navigation
- Process Summary
- Identity Verification
- Application Details
- Applicant Information
- Guarantor Information
- Income Summary
- Asset Information
- Collateral & Seller
- Facility/Financing
- Risk Relate

Non-Individual 应继承这些模块，只在 Applicant Information、Guarantor Information、Income、Collateral & Seller、Documents/风险准备度中扩展企业特有信息。

## 2. 关键设计调整

### 2.1 不再把渠道/分行/销售放在第一步重填

原 V2 的阶段零把 Branch、Channel、Dealer、客户类型、Entity Type 放在入口统一填写。这个设计对销售不友好。

推荐：

- Officer、Branch、Region 从登录用户和组织权限自动带出。
- Channel/Dealer 在 Application Details 或 Collateral & Seller 中按场景确认。
- Entity Type 不要求销售一开始凭经验选择，而是通过 ID Type + ID No + SSM/Experian/HOST 查询后推荐。

### 2.2 第一关键动作是选择企业申请，和individual并列的另一个申请方式

Non-Individual 的所有后续规则都依赖企业主体：

- Entity Type
- Constitution
- ID Type
- UBO
- 担保要求
- 签约主体
- 车辆注册主体
- 材料清单
- BNM/CCRIS 报送

因此进件第一步应是：

```
Application Details 建立申请壳
-> Applicant Information 中锁定 Company Basic Information
-> 系统查询 CIF / Experian / SSM / HP Line
-> 用户确认企业主体
```

### 2.3 后续链路只作为进件准备度

风险、CED、放款不是本进件需求的展开重点。进件页面只需要显示：

- Risk Ready：是否具备提交风险引擎所需信息
- CED Ready：是否具备 CED 初审所需信息
- Disbursement Awareness：哪些字段/材料会影响后续放款
- BNM Ready：报送字段是否完整

## 3. 推荐导航结构

在现网个人申请 Navigation 基础上，Non-Individual 推荐如下：

```
Process Summary
Identity Verification
Application Details
Applicant Information
  Company Basic Information
  Company Profile
  Customer Classification
  Address Information
  Email Information
  Confirmation
  Management & Shareholder
  UBO Identification
  Applicant Income
Guarantor Information
Income Summary
Asset Information
  Investments & Savings
  Properties & EPF
Collateral & Seller
  Purchase Detail
  Vehicle Detail
  Dealer Info
  Insurance
Facility/Financing
  Repayment Schedule
Risk Relate
  AML
  Credit Summary
  TV-Check
  Exposure Summary
```

说明：

- `Personal Information` 不适用于企业主体，替换为 `Company Profile`。
- `Employment Information` 不适用于企业主体，替换为 `Management & Shareholder` 或放到 Applicant Income 前。
- `Emergency Contact` 对企业主体可隐藏或改成 `Contact Person`，待业务确认。
- `Applicant Income` 保留，但其内容是企业收入/财务材料/银行流水。
- `Risk Relate` 继承现网区域，用于展示后续链路结果，不作为 Sales 进件的主要编辑区域。

## 4. 页面职责

### 4.1 Application Details

继承现网个人申请模块，用于建立申请基本上下文。

字段建议：

- Application No.
- Application Type = Non-Individual
- Loan/Financing Type
- Product Group
- Officer / Branch / Region
- Channel Type
- Source Code / Campaign
- Dealer 来源标记

处理原则：

- Officer / Branch 默认自动带出。
- Dealer 不强制提前填写，除非从 Dealer API 或 Dealer 入口进入。
- 如果 Branch 已关闭，阻断提交并要求改派。

### 4.2 Applicant Information

这是 Non-Individual 扩展的核心模块。

#### Company Basic Information

作用：锁定企业主体。

包含：

- ID Type 1 / ID No. 1
- ID Type 2 / ID No. 2
- Enterprise Type
- Company Name
- CIF No.
- ETB/NTB
- HP Line hit

详细字段参考：

- `04_NonIndividual_需求明细文档_V2.md` 第3章阶段一
- `企业提交信息.xlsx` 第 2-19 行
- Product Sales FSD 4.3.1 - 4.3.3

#### Company Profile

作用：补齐企业经营和注册画像。

包含：

- Establishment Date
- No. of Years in Operation
- Nature of Business Group / Code
- Firm Type
- Board Type
- Annual Sales Turnover
- No. of Employee
- Paid Up Capital

详细字段参考：

- `企业提交信息.xlsx` Company Profile、Operations、Data about recent 2 years、Financials 分组

#### Customer Classification

作用：完成 BNM/CCRIS/客户分类。

包含：

- Basic Group
- Constitution
- Customer Sector Code
- Bumiputra/NRCC Code
- SMI Flag
- GP Ratings
- Existing/Proposed BNM Classification

详细字段参考：

- `企业提交信息.xlsx`
- `报送规则.png`
- `机构映射表.png`

#### Address Information / Email Information / Confirmation

继承现网个人申请页面结构，但字段换成企业主体和联系人。

注意：

- 企业必须有 Office Address。
- Guarantor 需有 Office Address 和 Registered Address。
- 黑名单国家地址需校验。
- Email 校验继承现网 Infobip 或统一邮箱校验逻辑。

#### Management & Shareholder

作用：管理董事、股东、合伙人、Owner、法人股东。

能力：

- 从 Experian 抽取
- 支持表格编辑
- 支持法人股东 drill-down
- 支持角色标签：Director、Shareholder、Owner、Partner、Signatory、Guarantor Candidate

详细规则参考：

- Product Sales FSD 4.8.5.1
- `06_角色体系专项说明...md`

#### UBO Identification

作用：确认最终自然人 UBO。

能力：

- 系统候选推荐
- 用户选择
- Customize 手工录入
- 豁免原因记录
- 未完成 UBO 时 BNM Ready 不通过

#### Applicant Income

作用：录入企业主体收入，后续与 Guarantor 收入汇总。

注意：

- 企业主体收入计入 DSR/DSCR。
- UBO、Director、Shareholder 不因其身份自动计入收入。
- 企业收入材料与 OCR/收入计算器关联。

## 5. Guarantor Information

继承现网 Guarantor Information 模块，但要支持：

- Guarantor / Director
- Guarantor / Shareholder
- Guarantor / Director / Shareholder
- Partner of Partnership
- Corporate Guarantor，若业务允许

添加 Guarantor 时复用身份查询组件，并触发：

- CIF Profile
- WT Whitelist
- Income DB
- App History
- Pre-Consent

字段和关系参考：

- `企业分角色定义.png`
- Product Sales FSD 4.8.2 - 4.8.4

## 6. Collateral & Seller / Facility

这两块继承现网个人申请。

Non-Individual 差异：

- 车辆注册主体可能是公司、老板个人、合伙企业、PLT、政府部门等。
- Dealer/FBR/FBT 是后续放款重要影响项，但进件阶段只做提示和标签。
- HP Line、HP+Plus、Fleet、IHP 作为 Case Tag 影响后续材料和审批。

## 7. Risk Relate

继承现网 Risk Relate 区域：

- AML
- Credit Summary
- TV-Check
- Exposure Summary

在 Sales 进件阶段，Risk Relate 更多是结果展示和状态提示。具体风险工作台、CED 操作不在本进件需求展开。

## 8. 给开发的实现原则

| 原则                                  | 说明                                                 |
| ----------------------------------- | -------------------------------------------------- |
| 保留现网 Navigation 容器                  | 不新增完全不同的深色侧边栏或独立向导                                 |
| Non-Individual 作为 Applicant Type 分支 | 复用个人申请页面和状态体系                                      |
| 字段按现有分组嵌入                           | 只替换不适用个人字段，如 Personal/Employment                   |
| 进件先企业主体                             | Company Basic Information 是 Non-Individual 的核心锁定步骤 |
| 后续链路只提示                             | 风险、CED、放款不在进件侧展开完整功能                               |

## 9. 未展开但必须保留引用的细节

以下内容不在本文重复展开，开发需要回到原始文档：

- 所有字段枚举和校验
- 11 类收入计算器
- OCR 分类和交叉校验完整规则
- Risk Engine 输入输出
- CED 工作台和 Rework 详细流程
- CRA 放款文件检查、FIS、FBR/FBT、Host Acceptance
