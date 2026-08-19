# CRA 工作台现状说明 —— 消化文档

> **源文件**：客户提供的 CRA 放款操作走查 PDF（23 页截图 + 中文标注）
> **文档用途**：记录加入 OCR 之前，CRA 放款环节的真实界面、字段、按钮与状态流。作为 STP/OCR 方案设计的现状基线。
> **日期**：2026-08-19

---

## 0. 一句话结论

CRA 工作台**已经有规则校验能力**——只是校验的是**数据维护字段**（必填、公式勾稽、金额平衡），不是**文件内容**。
文件侧现在只有一个 23 项的整份勾选清单（File Check List）和一个手工登记的缺陷清单（Defect List）。

**这个区分决定了 OCR 该往哪儿接**：接文件侧，不碰数据侧。

---

## 1. 角色与状态流

```
SalesOfficer            →  Checking and Maintenance  →  Authorizer      →  CRA Manager
（上传文件、Proceed To CRA）  （核文件、维护数据）          （复核、放款）      （e-Stamping）
```

| # | 状态 | 触发动作 | 处理角色 |
|---|------|----------|----------|
| 1 | `Approved` | 价格审批通过，acceptance 子状态 pending | SalesOfficer |
| 2 | `Pending RBS Creation` | Sales 点 **Proceed To CRA** | SYSTEM |
| 3 | `Pending Checking and Maintenance` | 自动流转 | Checker（例：v_kangyi） |
| 4 | `Pending Authorization` | Checker 点 **To Authorizer** | Authorizer（例：baconzhang） |
| 5 | `Pending e-Stamping` | Authorizer 点 **Trigger Interface**（放款支付成功） | — |
| 6 | `Disbursed` | LHDN 定时任务生成后，CRA Manager 上传 e-stamping 文件并点 **E-Stamping Complete** | CRA Manager |

> 状态流转全程记录在 **Status Log**（Step Name / From Status / To Status / Staff Name / Handling Officer / Remark / Reason）。

**关键观察**：列表页有一列 **`EACC / OCR`**，当前案件值为 **`Manual`**。
说明系统已预留了通道标识位——OCR 通道与 STP 候选标记可以挂在这一列上，不需要新增字段。

---

## 2. Sales 上传界面（文件中心）

入口：申请详情页右侧 **Documents** 按钮 → `Application Submission / Disbursement` 弹窗。

### 2.1 分区上传（Categorized Upload Area）

格式限制：
- **OCR 区**：`PDF, JPG, JPEG, PNG only`
- **非 OCR 区**：`PDF, JPG, JPEG, PNG, DOCX, XLSX`
- 大小：`5KB–20MB per file`

| 区 | 名称 | 收什么 |
|---|------|--------|
| 1 | **CRA Applicant Identity** | Driving License、Company Resolution、Director NRIC… |
| 2 | **CRA HP Agreement** | HP Agreement (Ind/Com/Islamic)、Guarantor Agreement (Ind/Com/Fgnar)、Appendix I–V… |
| 3 | **CRA Vehicle Related** | Application Form、2nd Schedule、SI Form、LOSO、Seller Invoice/IC、Bank Statement… |
| 4 | **CRA Other Funding Related** | Vehicle Invoice、VOC、Road Tax、Insurance Cover Note、Puspakom (B5/B7/B2)、E-hakmilik… |
| 5 | **Other Documents** | ⚠️ 标注 **`Non AI Scanning, Requires manual check`**，黄色高亮独立区 |

> 🔴 **第 5 区是分流依据错位的现场证据**：它按「能不能 AI 扫描」分区。
> 但一份**有明确规则**的文件，可能仅因为格式是 DOCX/XLSX、或影像质量差、或本期抽取未上线，就被丢进这个区，
> 从此再也没有规则核验的机会——规则还在规格里，却没有任何界面承载它。

### 2.2 File List 表结构

| 列 | 说明 |
|----|------|
| File Name / Subject | — |
| **Category** | 落在上述 5 个区中的哪一个 |
| **File Type** | 具体文件类型（Biometric / NRIC / Vehicle Invoice(dealer) / Insurance Cover Note / HP Application Form / 2nd Schedule Part I / HP Agreement T&C …），可 `Select File Type` 修改 |
| **OCR Flag** | 当前样例全为 `N` |
| File Status | 如 `Upload Succeeded` |
| **File OCR Status** | 独立于 File Status 的 OCR 处理状态 |
| Description / Upload Time / File Size / Source | Source 记录上传人（SalesOfficer1） |

**Tab 页**：`File List` ｜ **`Cross-Validation Results`**
→ 交叉校验结果已经是上传界面的一个 tab，说明系统侧已有承载规则结果的位置。

**提交按钮**：`Submit for Verification (Disbursement)`

---

## 3. CRA 工作台（Checker 视角）

入口：CRA → To Do List → 案件 **View** → `Disbursement:TTI/HP/2026/Y0273410`

### 3.1 左侧导航结构

```
Checking & Modification
├── Defect List
└── File Check List

Data Maintenance
├── Application Summary
├── Hirer/Guarantor Info
├── Facility Information
├── Dealer/Seller Info
├── FIS & Collateral & Purchase Info
└── Approval Information

Disbursement Maintenance
├── Summary
├── Transaction Maintenance
├── Transaction Review
├── Maintenance & Disbursement Interface Log
├── Transaction Log
├── Action Tools
└── LHDN E-Stamping Upload（Authorizer/Manager 阶段出现）
```

底部固定链接：`Attachment` / `CRA Report` / `E-acceptance`

### 3.2 Defect List

| 列 | NO. / CATEGORY / TYPE / RECTIFIED / SALES REMARK / CRA REMARK / VERIFIED / CREATE BY / RECTIFIED BY / ACTION |
|----|---|

- 样例为 `Total: 0 defect(s)`
- 右上角有 **Add Defect** 按钮 → **缺陷完全靠手工登记**
- `CATEGORY` / `TYPE` 两列正好对应规则 Appendix 里的 `DEFECT_CATEGORY` / `DEFECT_TYPE`
- 有 `RECTIFIED` / `VERIFIED` 两个状态列 + `SALES REMARK` / `CRA REMARK` 两个沟通字段
  → **退回 Sales 整改再回来复验的闭环已经存在**

> 💡 缺少的是 **`来源`** 列（系统判 / eyeball / CRA 手工）。
> 现有 `CREATE BY` 记的是人名，回答不了「这条缺陷是怎么产生的」。

### 3.3 File Check List

样例状态：**`Checked: 11 / 23`**，三组勾选框：

**Mandatory（8 项）**
Biometric Result ｜ HP Agreements ｜ FIS/JPI Result ｜ Application Form ｜ 2nd Schedule Part I ｜ Insurance ｜ NRIC/SSM/Passport ｜ Vehicle Invoice

**Conditional（5 项）**
Delivery Receipt ｜ Standing Instruction ｜ VOC ｜ FD pledge ｜ Roadtax/JPI Receipt

**Optional（10 项）**
Guarantee Agreement / Guarantor Right & Liabilities ｜ Settlement Cases: Redemption Statement, HP546, HP556 / HP276 ｜ Conditional Approval ｜ D/License ｜ FBR Docs: HP566, E-Hakmilik ｜ Direct Cases: Photocopy of Seller's NRIC, RAMCI / Bankruptcy Search ｜ Others: IBG Letter, Loan Suspense Receipt, Deviation Approval, Photo of Chattel (IHP) ｜ Used Car Docs: Appx 3, Appx 4, Puspakom, AP Docs (RECOND) ｜ Company / Business Docs: Company Reso, Disposal Reso, M&A, Partnership Mandate, SSM Search

> 🔴 **这是纯手工勾选，粒度是「整份文件」**。
> 勾上只代表「我看过、我认为可以」，不代表核了哪几条规则。
> 这正是 OCR 接入后最该改造的地方：有规则且全通过的文件应由系统自动回写勾选状态。

### 3.4 Data Maintenance —— 已经存在的规则校验 ⭐

**这一节是本次消化最重要的发现。** CRA 工作台并非「没有规则判断能力」，它已经有一批字段级校验：

| 屏 | 已有校验 | 类型 |
|----|----------|------|
| Application Summary | **Agreement Date 必填** | 必填校验 |
| FIS & Collateral & Purchase Info | **Total Price 公式校验**：Total Price 由 Purchase Price + Freight + Reg. Fee + Insurance 勾稽，且 Total Price 不能大于 Purchase Price | 算术勾稽 |
| FIS & Collateral & Purchase Info | **Insurance Indicator = Yes 时**，Insurance/Takaful Company、Type of Coverage、Amount Insured、Issued Date、Bank/Cust Arrange Insurance 变必填 | 条件必填 |
| Transaction Maintenance | **Handling Fee 必填**；选定 Payment Mode 后，对应支付方式的金额须 ≥ Total Handling Fee | 金额比较 |
| Transaction Review | **Total Collection = Total Funding Amount**，点 **Verify** 按钮 → 显示 `Transaction verification passed.` + `Verify Result: PASS` | 金额平衡 + **显式校验按钮与结果** |

> 💡 **Transaction Review 的 Verify 交互，是 CRA 台上已经跑通的「系统判 + 人确认」范式。**
> 它证明这个界面完全能承载「系统给结论、人看结论」的模式——只是目前只用在数据侧，没用在文件侧。

**校验类型对照**：这几条的算子（必填、算术勾稽、条件必填、金额比较）与 CRA Business Rules Appendix 的 14 种算子**高度同族**。
差别只在**数据来源**：这些字段来自系统录入，文件规则的字段来自 OCR 抽取。

### 3.5 Disbursement Maintenance

- **Transaction Maintenance**：Handling Fee（含 GST、Loan Amount、Tax Invoice、Supplier、Payment Mode）／ IBG（Reference No、Effective Date、Beneficiary Bank/Name/Acct）／ Transfer（Effective Date、To Account No/Name、Transfer Amount、Recipient Ref No）／ ADVICE
- **Transaction Review**：Additive Items（Approved Loan Amount、Handling Fee、GST、IBG Amount、Transfer Amount、Suspense Amount、Advice Amount）／ Deductive Item（Subsidy、Retention Sum）／ Total Collection vs Total Funding Amount → **Verify**
- **Maintenance & Disbursement Interface Log** / **Transaction Log**：接口调用记录（INSURANCE_COLL_MAINT、COLL_NAME_CODE_MAINT、FAC_COLL_INQUIRY_BY_CP、FUNDING_LOAN_ACCT_CRE、Loan Release by IBG、IBG Payment to EPP 等，含 Trunc Code / Status / Journal Sequence）
- **Action Tools**：Document Library ｜ Memo ｜ Disb. Slip ｜ Reason Code ｜ E-consent Report ｜ Amendment log ｜ Credit Memorandum

### 3.6 右侧固定面板 —— 案件级标记 ⭐

**LOU Renewal** 区块下的勾选项：

| 勾选项 | 备注 |
|--------|------|
| LOU Reassignment | |
| Promotion Package | |
| Hold Handling Fee | |
| **Used Car With Settlement** | 对应规则 38「二手车有赎楼」分支 |
| **Standing Instruction** | 对应 SI Form |
| **FBT** | |
| **FBR** | 对应发票日期区间右边界放宽等一整套分支 |
| **FD Pledge** | 对应 FD Receipt / LOSO 规则 53–56 |
| **CRA Completed** | |

三态/二态字段：`Customer Deleted (Yes/No)` ｜ `Full Maintenance (Yes/No)` ｜ `Refund Deposit` ｜ `AP Indicator` ｜ `CRA Remark`（可编辑）

摘要区：App. Ref. No. ／ Product Code（如 `F143`）／ Status ／ Applicant Name

> 🔴 **这批 case-level 标记就是 STP 准入规则表的现成起点。**
> FBR / FBT / FD Pledge / Used Car With Settlement / Standing Instruction / Full Maintenance / Refund Deposit / AP Indicator / Customer Deleted
> ——任一勾选，都代表案件进入了一个非标准分支，大概率不该 STP。
> 加上 Product Code、Loan Amount、有无 Guarantor、Dealer Panel/Non-Panel，STP 资格判据基本齐了。
> **不需要从零设计——右侧面板已经把「这个案件有什么特殊情况」结构化了。**

### 3.7 底部出口按钮

| 阶段 | 按钮 |
|------|------|
| Checker | `Save` ｜ `Exit Application` ｜ **`To CRA Defect`** ｜ **`To Sales Defect`** ｜ **`To Authorizer`** |
| Authorizer | `Save` ｜ `Exit Application` ｜ `To CRA Defect` ｜ `To Sales Defect` ｜ `Back To Checker&Maintenance` ｜ **`Trigger Interface`** |
| CRA Manager | `Exit Application` ｜ **`E-Stamping Complete`** |

> 💡 **`To Authorizer` 这个按钮就是 STP 该插入的位置。**
> STP 的本质不是跳过 CRA，是**跳过 Authorizer**：
> 资格合格 → 直接 Trigger Interface；不合格 → 走现有 To Authorizer 路径。

---

## 4. 现状能力盘点

| 能力 | 现状 | OCR 接入后 |
|------|------|-----------|
| 文件上传与分类 | ✅ 5 区分类 + File Type 明细 | 分区依据需从「能否 AI 扫描」改为「有无明确规则」 |
| 文件内容规则校验（L1） | ❌ 完全靠 CRA 经验 | **← OCR 要接的就是这里** |
| 数据维护字段校验（L2） | ✅ 必填 / 公式 / 条件必填 / 金额平衡 + Verify 按钮 | **不动** |
| STP 资格校验（L3） | ❌ 不存在 | 新增，挂在 `To Authorizer` 出口 |
| 缺陷登记与闭环 | ✅ Defect List + Sales/CRA Remark + Rectified/Verified | 需加 `来源` 列 |
| 文件清单勾选 | ✅ 23 项手工勾 | 有规则且全通过的项应由系统自动回写 |
| 通道标识 | ✅ 列表页 `EACC/OCR` 列（现值 Manual） | 复用为 OCR 通道 + STP 候选标记 |

---

## 5. 与其他文档的关联

| 文档 | 关系 |
|------|------|
| `06_放款/01_CRA业务规则Appendix_完整翻译与解读.md` | 那 86 条规则就是本文 **L1 层**的内容。本文提供它们的落地界面。 |
| `06_放款/参考资料/Appendix_CRA_Business_Rules_Defect_Code_signoff_version.xlsx` | Defect List 的 `CATEGORY` / `TYPE` 两列直接对应该表的 `DEFECT_CATEGORY` / `DEFECT_TYPE` |
| `05_签约/` | File Check List 的 `Biometric Result` 项、右侧 `E-acceptance` 链接，都是签约侧产出物 |
| 根目录 `04_NonIndividual_需求明细文档_V3.md` | 第 16 章「后续链路概念：放款」的前置依赖在此得到界面印证 |
