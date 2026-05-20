# HLB Non-Individual HP 进件开发落地说明

> 目的：把 Sales 进件 V3 流程转成开发、接口、测试可执行的对象、状态和验收点。风险、CED、放款只保留进件侧触发点和依赖提示。

## 1. 页面清单

| 页面 | 路由建议 | 主要对象 |
|---|---|---|
| Application List | `/applications` | Application |
| Company Lock | `/applications/:id/company` | Primary Applicant |
| Context | `/applications/:id/context` | Case Context |
| Profile | `/applications/:id/profile` | Company Profile |
| Ownership & UBO | `/applications/:id/ownership` | Related Party / UBO |
| Guarantor & Income | `/applications/:id/income` | Guarantor / Income |
| Vehicle & Product | `/applications/:id/facility` | Vehicle / Facility / Dealer |
| Documents | `/applications/:id/documents` | Document / OCR Result |
| Review & Submit | `/applications/:id/review` | Readiness / Submission |

## 2. 核心数据对象

### Application

| 字段 | 说明 |
|---|---|
| applicationId | 系统主键 |
| applicationNo | 业务编号 |
| status | Draft / CompanyLocked / ReadyForSubmit / Submitted / Rework / Approved / Rejected |
| applicationType | Non-Individual |
| officerId | 当前销售 |
| branchCode | 案件归属分行 |
| channelType | Direct / Dealer / Digital / Dealer API |
| caseTags | HP Line、HP+Plus、FBR、FBT、Fleet、Manual Acceptance |

### Party

| 字段 | 说明 |
|---|---|
| partyId | 主键 |
| partyType | Individual / Non-Individual |
| legalRole | Primary / Guarantor / Non-Guarantor |
| ownershipRoles | Director / Shareholder / Owner / Partner / UBO |
| signingRole | Signatory / None |
| idType / idNo | 证件 |
| cifNo | ETB 命中时返回 |
| source | Experian / HOST / Manual / OCR |

### Company Profile

| 字段 | 说明 |
|---|---|
| entityType | A-L |
| constitution | BNM Constitution Code |
| basicGroup | 客户组别 |
| natureOfBusinessCode | 业务性质 |
| tin | TIN |
| countryOfOperation | 运营国家 |
| financialSnapshot | 近两年营业额、员工、资本 |

### Document

| 字段 | 说明 |
|---|---|
| documentId | 主键 |
| stage | Application / CED Condition / Disbursement |
| physicalFileId | 文件 |
| logicalDocumentType | AI 分类后的材料类型 |
| classificationStatus | Pending / Confirmed / Modified |
| extractionStatus | Pending / Extracted / Failed |
| validationStatus | Pending / Passed / Suspicious / Failed |
| sourcePartyId | Applicant / Guarantor / Seller |

## 3. 状态机

### 申请状态

```
Draft
 -> CompanyLocked
 -> ProfileInProgress
 -> StructureConfirmed
 -> FacilityCompleted
 -> DocumentsValidated
 -> ReadyForSubmit
 -> SubmittedToRisk
 -> SubmittedToCED
 -> SalesEnd
 -> Accepted
 -> SubmittedToDownstream
```

异常回流：

- CED Rework -> 对应步骤 InProgress
- KIV to Sales -> Documents / Profile / Income
- CDD Reject -> Sales Confirm Reject
- EDD Pending -> Temporary Queue

### 主体锁定状态

| 状态 | 说明 |
|---|---|
| Unchecked | 未查询 |
| Checking | 查询中 |
| Matched | 查到 |
| Locked | 用户确认锁定 |
| Failed | 查询失败 |
| Abandoned | 废弃重建 |

## 4. 接口触发点

| 触发点 | 接口/系统 | 说明 |
|---|---|---|
| Company Check | HOST CIF | 查询 ETB/NTB |
| Company Check | Experian/SSM | 拉企业注册、董事、股东 |
| Company Check | BCB Source | HP Line 白名单 |
| Add Guarantor | HOST CIF | 查询担保人 |
| Add Guarantor | WT Whitelist | 担保人收入豁免 |
| Add Guarantor | Income DB | 历史收入 |
| Pre-submit | AIOCR | 分类、抽取、交叉校验 |
| Submit | Risk Engine | Hard Rules、AML、CCRIS/CTOS、UW |
| CED Rework | Risk Engine | 重跑规则 |
| Acceptance/Disbursement | HOST | CIF/Facility/Collateral creation |
| Review 提示 | FIS/Dealer | 仅展示放款影响，不实现 CRA 放款流程 |

## 5. 权限

| 操作 | Sales Officer | Sales Support | Sales Manager | CED | CRA | Admin |
|---|---:|---:|---:|---:|---:|---:|
| 新建申请 | Y | Y | Y | N | N | N |
| 锁定企业 | Y | Y | Y | N | N | N |
| 修改 Branch | C | N | Y | N | N | Admin |
| 添加 Guarantor | Y | Y | Y | N | N | N |
| 标记 UBO | Y | Y | Y | View | N | N |
| 提交 Risk/CED | Y | Y | Y | N | N | N |
| CED Rework | N | N | N | Y | N | N |
| 查看放款影响提示 | Y | Y | Y | View | View | N |
| 参数配置 | N | N | N | N | N | Y |

## 6. 验收重点

### 主流程

- 销售可在不填写 Branch/Dealer 重表单的情况下先锁定企业。
- 企业锁定后，系统能展示 ETB/NTB、Entity Type、Constitution、HP Line 命中。
- ID Type + ID No 锁定后不可编辑。
- Channel/Branch 默认带出，只在例外场景要求处理。

### 角色与 UBO

- Experian 抽取后展示树形图和表格。
- 法人股东支持手动 drill-down。
- UBO 必须是自然人。
- 同一人可同时标记 Guarantor、UBO、Signatory。
- Non-Guarantor 不进入收入聚合。

### 收入与风险

- 主申请人 + Guarantor 收入聚合。
- WT/Income DB 仅对 Guarantor 触发。
- Review 页显示 Risk Ready 缺口。
- CED Rework 修改关键字段后可触发规则重跑。

### 文件与后续链路提示

- Application、CED Condition、Disbursement 材料分 Tab。
- 文件必须完成分类确认和关键字段校验后才能提交当前阶段。
- FIS/Dealer/FBR/FBT 在进件阶段只显示提示，不在本需求中实现 CRA 放款处理。

## 7. 测试场景

| 场景 | 预期 |
|---|---|
| A Sdn Bhd，法人股东 >25% | 要求 drill-down，未找到自然人 UBO 前 BNM Ready 不通过 |
| D Sole Prop | Owner 自动 UBO，通常不要求 Guarantor |
| E Partnership | 全体 Partner 自动 UBO，Partner 信息缺失时阻断提交 |
| HP Line 命中 | 弹窗选择 HP Line/普通案件，记录选择 |
| Branch 关闭 | 无法提交，提示改派 |
| Guarantor 收入缺失 | Risk Ready 提示缺口 |
| OCR 分类未确认 | Documents Ready 不通过 |
| CED Rework 添加 Guarantor | 保存后触发相关查询和风险规则重跑 |
