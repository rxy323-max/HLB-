# CRA Business Rules & Defect Code（sign-off version）—— 完整翻译与解读

> **源文件**：`06_放款/参考资料/Appendix_CRA_Business_Rules_Defect_Code_signoff_version.xlsx`
> **文档用途**：接手 STP 放款需求的第一份消化文档。翻译 + 结构解读 + 规则本质 + sign-off 阻塞点。
> **日期**：2026-08-11

---

## 0. 一句话结论

这份 Excel 是**把 CRA（Credit Administration，放款前置审核岗）人工核对一叠纸质文件的动作，翻译成机器可执行的断言**的规格书。它是 STP 放款能不能"直通"的唯一判据来源——**零 defect 才能 STP**。

它不是流程文档，是**规则字典 + 缺陷字典**。

---

## 1. 业务定位：这些规则在整条链路的哪个位置

```
Sales 进件 → Risk 风控 → CED 信审批准 → 签约(E-Acceptance / Manual)
                                              ↓
                                      Sales 上传放款材料
                                              ↓
                              ┌──────────────────────────────┐
                              │  ★ 本 Excel 的作用域 ★        │
                              │  OCR 抽取字段                 │
                              │  → 规则引擎逐条校验            │
                              │  → 产出 Defect 清单            │
                              └──────────────────────────────┘
                                              ↓
                        零 defect → STP 直通放款
                        有 defect → 退回 Sales 补件 / 转 CRA 人工
                                              ↓
                                   CRA Checker → CRA Authorizer → Funding
```

现状是 CRA 人工逐份核对（对应 `04_NonIndividual_需求明细文档_V3.md` 里的 "CRA Checker/Maintenance 检查放款材料"）。STP 的本质就是**用规则引擎替代这个人工核对环节**。

---

## 2. Sheet 地图：6 个 Sheet 的关系

| # | Sheet 名 | 中文 | 性质 | 行数 | 是否 sign-off 对象 |
|---|----------|------|------|------|-------------------|
| 1 | `Rule type` | 规则类型定义 | **引擎算子字典** | 14 条 | ✅ 是 |
| 2 | `Rule details for all` | 全量规则明细 | **主表 / 核心交付物** | 88 条 | ✅ **最重要** |
| 3 | `refer info` | 补充说明 | 散记 / 未决问题 | 5 条 | ⚠️ 需收口 |
| 4 | `ref-Business rules-individual` | 个人客户业务规则（参考） | **业务原始口径** | 32 行 | ❌ 参考 |
| 5 | `ref-Business rules-company` | 企业客户业务规则（参考） | **业务原始口径** | 66 行 | ❌ 参考 |
| 6 | `Company-discard` | 企业侧废弃稿 | 已合并入主表 | 46 行 | ❌ 废弃 |

**关键结构认知**：

```
   ref-individual  ┐
                   ├──→  提炼、去重、加 Rule Engine Type + Defect Code  ──→  Rule details for all
   ref-company     ┘                                                            ↑
                                                                                │
   Rule type ────────────── 提供 14 种可实现的算子 ─────────────────────────────┘
```

- Sheet 4/5 是**业务语言**（业务方写的、按场景铺开的文件清单，含大量"检查哪些字段"的 OCR 需求）
- Sheet 2 是**工程语言**（每条规则明确：用哪个算子、比什么值、跟什么基准比、失败产出哪个 defect）
- **Sign-off 应该签 Sheet 2，Sheet 4/5 作为附件溯源**

---

## 3. Sheet 1：`Rule type` —— 规则引擎的 14 种算子

这是整套规则的**原子能力清单**。开发只需实现这 14 种算子，88 条业务规则全部是它们的参数化实例。

| # | 英文类型 | 中文 | 含义 | 原表示例 |
|---|----------|------|------|----------|
| 1 | Date Consistency | 日期一致性 | 校验相关文件/字段之间的日期一致 | — |
| 2 | Date ≥ Specified Date | 日期不早于 | 某日期须在指定日期当天或之后 | — |
| 3 | Date ≤ Specified Date | 日期不晚于 | 某日期须在指定日期当天或之前 | — |
| 4 | Date falls within a specific date range | 日期落在区间内（含边界） | 某日期须在两个日期之间 | 发票日期须在申请日与交车日之间；FBR 无 DO 时可到当前日期 |
| 5 | Fixed Value Comparison | 固定值比对 | 与常量/参数比对 | Admin fee = RM 270（参数 `ADM_FEE_AMOUNT`） |
| 6 | Amount Range Validation | 金额区间校验 | 金额波动是否超出允许范围 | — |
| 7 | Amount Consistency | 金额一致性 | 相关文件/字段的金额须一致 | 如 Insurance Covering |
| 8 | Account Consistency | 账户一致性 | 账户信息在相关字段/文件间一致 | — |
| 9 | Term Consistency | 期限一致性 | 期限（如质押期）符合业务规则 | 如质押期限是否正确 |
| 10 | Arithmetic Calculation Verification | 算术计算校验 | 执行加减乘除勾稽 | 如放款金额汇总核对 |
| 11 | Application Date vs. Application Form Version Mapping | 申请日 ↔ 表单版本映射 | 申请表版本须与申请日期匹配 | Application Form 版本应与申请日期相匹配 |
| 12 | Region/Area Check | 区域校验 | 地域归属校验 | Dealer 地址若为西马，road tax 不能是东马属地 |
| 13 | Special Document Verification | 特殊文件校验 | 特定场景下的专用文件是否缺失 | FD pledge 场景是否上传 FD Pledge Receipt；non-FBR/FBT 是否上传 VOC |
| 14 | Value is not existing | 值缺失校验 | 特定场景下必需字段是否缺失 | — |

> ⚠️ 主表实际还用到了 **`File is not existing`（文件缺失）**（第 43、56 行），但 Sheet 1 没定义。**这是 sign-off 前必须补的第 15 个算子。**

---

## 4. Sheet 2：`Rule details for all` —— 88 条规则主表（完整翻译）

### 4.1 表头结构

| 列 | 原名 | 中文 | 说明 |
|----|------|------|------|
| A | Mandatory Document | 必备文件 | 规则挂在哪份文件上 |
| B | business rule checking | 业务规则 | 业务口径描述（自然语言） |
| C | Rule Engine Type | 引擎类型 | 取自 Sheet 1 的 14 种算子 |
| D | Value to Verify | 待验值 | 被校验的字段 |
| E | Base Value | 基准值 | 拿去比对的基准（另一字段/常量/公式） |
| F | DEFECT_ID | 缺陷 ID | 数值型，疑似旧系统主键 |
| G | DEFECT_CODE | 缺陷代码 | 字母+数字，如 A130 / S52 / I67 |
| H | DEFECT_CATEGORY | 缺陷分类 | `DFCxxxx` 格式 |
| I | DEFECT_CATEGORY | 缺陷分类（重名！） | 业务大类文字，如 `AGREEMENT - MASTER` |
| J | DEFECT_TYPE | 缺陷类型 | 缺陷的具体描述文案 |

> ⚠️ **H 和 I 两列同名 `DEFECT_CATEGORY`，但内容是两个完全不同的维度。** 这是数据模型问题，sign-off 前必须正名（建议：H = `DEFECT_CATEGORY_CODE`，I = `DEFECT_CATEGORY_NAME`）。

---

### 4.2 全量规则翻译（按文件分组）

#### ① Application Form（申请表）

| # | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|----------|------|------|-----------------|--------|
| 1 | Application date missing | 申请日期缺失 | Value is not existing | Application date → / | — |
| 2 | Application Form Version 版本映射 | 申请表版本必须与申请日期对应 | Date ≥ | Application date → 表单版本的生效日与失效日 | A79 / DFC0005 / APPLICATION FORM / Application form - OTHERS |

**版本对照（原文）**：
- 申请日 ≥ 2022/2/15 → 用 **Vol7 Jan 2022**
- 申请日 ≥ 2024/1/6 → 用 **Vol8 Jan 2024**
- 申请日 ≥ 2025/7/1 → 用 **V020 Jun 2025**
- 申请日 ≥ 2025/10/15 → 用 **V021 Oct 2025**
- 版本号位置：每页右下角
- 表中说明：**规则里设定启用日和失效日，两个版本可以并行一段时间**（不是简单的"最新版本"逻辑）

---

#### ② HP Agreement（租购合同主协议）

| # | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|----------|------|------|-----------------|--------|
| 3 | Hirer's date | 承租人签署日 **不得早于** 批准日 | Date ≥ | Hirer's date → approval date | 20 / A130 / DFC0002 / AGREEMENT - MASTER / Agreement and all printed documents - Wrongly Dated |
| 4 | Hirer's date missing | 承租人签署日缺失 | Value is not existing | Hirer's date | — |
| 5 | current date exceed hirer's date 5 days | 当前日期距签署日不得超过 5 天（5 为参数） | Date ≥ | Current date → Hirer's date + 5 − 1 | A155 / AGREEMENT - MASTER / Hirer and/or Witnessed Wrongly Dated (both shld be same date) |
| 6 | EHP witness Date | 见证人日期须与承租人签署日**一致** | Date Consistency | EHP witness Date → Hirer's date | 894 / A155 / DFC0002 |
| 7 | EHP witness Date missing | 见证人日期缺失 | Value is not existing | EHP witness Date | — |
| 8 | MOA date | MOA（承兑备忘录）日期不得早于批准日 | Date ≥ | MOA date → approval date | 20 / A130 / DFC0002 |
| 9 | MOA date missing | MOA 日期缺失 | Value is not existing | MOA date | 20 / A156 / DFC0002 / Memorandum of Acceptance Not Dated and/or Not Signed |
| 10 | HP Agreement version | 合同模板版本须在申请日时有效 | Date ≥ | Application date → 从文档模板管理取模板生效日 | — |

**HP Agreement 版本清单（原文）**：

- **Manual 版（8 个）**：`HP17NEW REV052025` / `HP17USED REV052025` / `HP17RECOND REV052025` / `ATB500NEW REV052025` / `ATB500USED REV052025` / `ATB500RECOND REV052025` / `IHP002NEW REV052025` / `IHP002USED REV052025`
- **E-Acceptance 版（11 个）**：`HP17NEWREV052025E` / `HP17USEDREV052025E` / `HP17RECONDREV052025E` / `ATB500NEWREV052025E` / `ATB500USEDREV052025E` / `ATB500RECONDREV052025E` / `IHP002NEW REV052025E` / `IHP002USED REV052025E` / `HP17 REV052025` / `ATB500 REV052025` / `IHP002 REV052025`

> 💡 **E-Acceptance 与 Manual 是两套独立模板（E 后缀）**——这条直接关联 `05_签约` 模块。签约方式决定用哪套模板，用错版本 = defect。

---

#### ③ Guarantee Agreement（担保协议 HPGA）

| # | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|----------|------|------|-----------------|--------|
| 11 | HPGA date tally with HPA MOA date | 担保协议日期须与主合同 MOA 日期一致 | Date Consistency | HPGA date → HP Agreement date | 901 / A153 / DFC0001 / AGREEMENT - GUARANTOR / Gtee Agrt wrongly dated and/or Schedule Table Wrongly Dated |
| 12 | EHP witness date | 见证人日期须与主合同日期一致 | Date Consistency | EHP witness date → HP Agreement date | DFC0001 / NO DATE |
| 13 | Guarantee Agreement Version | 担保协议版本须在申请日时有效 | Date ≥ | Application date → 模板生效日 | — |

**版本清单**：`HP26 REV052020` / `ATB500 REV052020` / `HLBBLSD HPLGNR 052020` / `HLIBLSD HPILGNR 052020`

---

#### ④ 2nd Schedule Part 1（第二附表第一部分 —— HP Act 法定披露表）

**这是全表算术勾稽最密集的部分，也是法律风险最高的部分。**

| # | 业务规则 | 中文 / 公式 | 算子 | Defect |
|---|----------|-------------|------|--------|
| 14 | Cash price/Deposit | `Cash price less deposit = 货物现金价 − 签约后应付金额（即定金）` | Arithmetic | 574 / S81 / DFC0049 / SECOND SCHEDULE PART I / Loan Amount is wrong |
| 15 | Balance originally payable | `原始应付余额 = Cash price less deposit + 运费 + 车辆注册费 + 保险费 + 期费总额` | Arithmetic | S52, S93 / DFC0050 / SECOND SCHEDULE PART I - OTHERS |
| 16 | Total amount of term charges | **传统**：`期数 ÷ 12 × 原始应付余额 × 年利率`<br>**伊斯兰**：`期数 ÷ 12 × 原始应付余额 × 实际利润率` | Arithmetic | S52 / DFC0050 |
| 17 | Balance incl. deposit | `含定金的原始应付余额 = 原始应付余额 + 签约后应付金额` | Arithmetic | S52 / DFC0050 |
| 18 | Difference | `现金价与总应付额之差 = 含定金应付余额 − 货物现金价` | Arithmetic | S52 / DFC0050 |
| 19 | Loan amount | `Cash price less deposit + 运费 + 保险费` **须等于系统中的贷款金额** | Arithmetic | S52 / DFC0050 |
| 20 | OTR Price | `货物现金价 + 运费 + 车辆注册费 + 保险费` **须等于系统中的 OTR 价** | Arithmetic | S52 / DFC0050 |
| 21 | **E-Acceptance Case** | 第二附表日期须**不晚于**申请日。但若 Second Schedule Part 1 有任何变更，会**自动生成新日期** | Date ≤ | 601 / S52 / DFC0050 / Second schedule wrongly dated |
| 22 | **Manual Case** | 第二附表日期须**不晚于**申请日 | Date ≤ | 601 / S52 / DFC0050 |
| 23 | 版本 | Manual: `HP46 REV022020`；E-Acceptance: `HP46 REV042022E` | Date ≥ | — |

> 💡 第 19、20 条的方向是**反的**：待验值写的是公式，基准值写的是系统值。也就是说这两条是"文件上的数 vs 系统里的数"，而 14–18 是"文件内部自洽"。**两类语义不同，规格上应该分开标注。**

---

#### ⑤ Vehicle Invoice（车辆发票）

| # | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|----------|------|------|-----------------|--------|
| 24 | Invoice date missing | 发票日期缺失 | Value is not existing | Invoice date | — |
| 25 | **Non-FBR** | 发票日期须落在【申请日 ~ 交车日】区间内 | Date range（含边界） | Invoice date → Application date & Delivery date | I67 / DFC0037 / INVOICE - VEHICLE INVOICE / Vehicle Invoice/Seller Invoice not dated |
| 26 | **FBR** | 发票日期须落在【申请日 ~ 当前日期】区间内 | Date ≥ | Invoice date → Application date | I67 / DFC0037 |
| 27 | Deposit date missing | 定金日期缺失 | Value is not existing | Deposit date | I117 / Vehicle Invoice - Without deposit's date |
| 28 | Deposit date | 定金日期须**不早于**承租人签约日（HPA 上的 Hirer date） | Date ≥ | Deposit date → Hirer date at HP Agreement | I72 / DFC0037 / wrong deposit date |
| 29 | Booking fee Date missing | **有 booking fee 金额则必须有 booking fee 日期** | Value is not existing | Booking fee Date | I123 / DFC0037 / Without Booking Fees Date |
| 30 | Booking fee 金额 | 订金不得超过 OTR 的 **x%**（x 可配置，现网 1%） | Arithmetic | Booking fee → ≤ x% × OTR | 462 / I91 / DFC0037 / Booking Fee > 1% |
| 31 | Booking fee Date | 订金日期须**不晚于**承租人签约日 | Date ≤ | Booking fee Date → Hirer date at HP Agreement | wrong booking fee date |

> 💡 **FBR = Funding Before Registration（注册前放款）**。它是一个贯穿全表的关键分叉：FBR 案件没有 VOC、没有交车单，所以日期区间的右边界从"交车日"放宽到"当前日期"，同时要额外提交 HP566(2)、HP576(1)、E-hakmilik。

---

#### ⑥ Road Tax Disc / JPJ Receipt（路税凭证）

| # | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|----------|------|------|-----------------|--------|
| 32 | Peninsular/East Malaysia | 依抵押物地址判定东西马归属：若抵押物在西马（SEMENANJUNG），路税不得为东马属地 | Region/Area Check | collateral state → 东马四地：**Sabah、Sarawak、Pulau Labuan、Pulau Langkawi**（或取其反集） | V8 / VOC / REGISTRATION CARD / Road Tax Paid in Semenanjung, Differ from collateral address |

> ⚠️ 原表此处标注 `todolist rules`，说明规则**尚未定稿**。且 Pulau Langkawi 实际属于西马 Kedah 州，被归入"东马四地"存疑，需业务确认。

---

#### ⑦ Insurance Cover Note（保险承保单）

| # | 业务规则 | 中文 / 公式 | 算子 | Defect |
|---|----------|-------------|------|--------|
| 33 | Sum insured amount | 保额须 **≥ max( 系统 OTR 价 × 0.8 , 系统贷款额 + 贷款额 × 年利率 )** | Arithmetic | 403 / I33 / DFC0035 / INSURANCE / Insurance sum insured insufficient |
| 34 | Used - 承保期至少 1 年 | `保险到期日 ≥ 路税起始日 + 1 年 − 1 天` | Date ≥ | 401 / I31 / DFC0035 / Insurance coverage less than one year |
| 35 | Used - 注册号 | 保单注册号须与 CRAR 一致（取自新/旧 VOC） | Fixed Value Comparison | I85 / Insurance - submitted but not complete |

---

#### ⑧ Delivery Receipt（交车单）

**Dealer 出具：**

| # | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|----------|------|------|-----------------|--------|
| 36 | New car | 新车：交车日须**不早于**注册日（依 VOC） | Date ≥ | Delivery date → registration date (VOC) | 208 / D23 / DFC0017 / DELIVERY RECEIPT / wrongly dated |
| 37 | Used car **without** settlement | 二手车（无赎楼）：交车日须**不早于**路税起始日 | Date ≥ | Delivery date → roadtax start date | D36 / Not Dated/Wrongly Dated |
| 38 | Used car **with** settlement | 二手车（有赎楼）：交车日须**不早于**保险起始日 | Date ≥ | Delivery date → insurance start date | D36 |

**Seller 出具：**

| # | 业务规则 | 中文 | 算子 | Defect |
|---|----------|------|------|--------|
| 39 | Used car without settlement | 交车日须**等于** MOA 日期 | Date Consistency | D36 |
| 40 | *(与 39 完全重复)* | — | — | D36 |
| 41 | 版本 | `HP66 REV022020` | Date ≥ | — |

> ⚠️ 第 39、40 行**完全重复**，且业务口径写的都是 "without settlement"，缺少 "with settlement" 分支。需业务澄清。

---

#### ⑨ FIS / JPJ Result（车辆产权查询结果，Sales 上传）

| # | 业务规则 | 中文 | 算子 | Defect |
|---|----------|------|------|--------|
| 42 | Status "Processed" | **FBR/FBT 案件**：FIS/JPJ 结果须为 `Verified`<br>**Non-FBR/FBT 案件**：须为 `Processed` | Fixed Value Comparison | F104 / FIS/JPJ Search / JPJ search via FIS system not submitted |
| 43 | Non-FBR 且状态非 Processed | 则**必须**提供 FIS/JPJ Result 文件 | **File is not existing** | — |

**（来自 `refer info` 的关键背景）**：FIS 结果有两类来源——
1. LOS 系统调 FIS 接口取得，一般仅用于 FBR/FBT；
2. 接口取不到时，Sales 去 FIS 网站人工查询。网站有两种查询方式：查 FIS 自有数据（**有 24 小时延迟**）、查 JPJ 实时数据（**需要预先取得客户同意**）。

> 💡 这条对 STP 影响巨大：**FIS 数据 24 小时延迟意味着"当天签约当天放款"的 STP 路径在某些场景下天然不成立。**

---

#### ⑩ Credit Note - Admin Fee（管理费收据，仅二手车）

| # | 业务规则 | 中文 | 算子 | Defect |
|---|----------|------|------|--------|
| 44 | Admin fee missing | 二手车：管理费金额缺失 | Value is not existing | F18 / FEES PENDING COLLECTION / Admin Fee receipt not submitted |
| 45 | Admin fee = RM 270 | 管理费须等于 **RM 270**（须可配置，参数名 `ADM_FEE_AMOUNT`） | Fixed Value Comparison | F101 / Admin Fee insufficient |
| 46 | 注册号一致 | 管理费收据上的注册号须与 VOC 一致 | Fixed Value Comparison | F19 / Admin Fee receipt with wrong details |

---

#### ⑪ Puspakom 检验报告（马来西亚官方车辆检验）

| # | 报告 | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|------|----------|------|------|-----------------|--------|
| 47 | **B7** | Recon | 翻新车：自检验日起 4 个月有效 | Date ≤ | registration date (VOC) → Inspection date + 4 月 − 1 天 | P19 / PUSPAKOM REPORT / B7 NOT CLEAR |
| 48 | **B7** | Used | 二手车：自检验日起 4 个月有效 | Date ≤ | roadtax start date → Inspection date + 4 月 − 1 天 | P4 / B7 not submitted |
| 49 | **B7** | missing | 翻新车与二手车：B7 缺失 | Special Document Verification | — | P8 / B7 result GAGAL（不合格） |
| 50 | **B2**（仅翻新车） | 有效期 | 自检验日起 4 个月 / **60 天**（原表两个口径并存） | Date ≤ | registration date (VOC) → Inspection date + 4 月 − 1 天 | P1 / B2 not submitted |
| 61 | **B5 / M.V.15** | 过户有效期 | 二手车（有赎楼）：自检验日起 2 个月有效。<br>**仅在 my task list 提示，不产生 defect**（X 为参数） | Date ≤ | Current date → B5 到期日 − X | 501 / P2 / DFC0046 / B5 expired |

> ⚠️ 第 50 行"4 个月"与"60 天"两个口径写在同一格里，**互相矛盾，必须澄清**。（Sheet 4/5 的业务原表写的是 60 天。）
>
> 💡 第 61 行是全表**唯一明确标注"只提示、不产生 defect"**的规则——说明规则引擎需要区分 **Defect（阻断）** 与 **Warning（提示）** 两个级别。这个分级在主表里没有字段承载，是 sign-off 前必须补的列。

---

#### ⑫ Bankruptcy Search（破产查询）

| # | 适用 | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|------|----------|------|------|-----------------|--------|
| 51 | 个人（Seller 提供给 Sales，1 种格式） | Issuance date within 1 month | 出具日起 1 个月内有效 | Date ≤ | Current date → Issuance date + 1 月 − 1 天 | C70 / COMPLIANCE |
| 68 | 企业 | 放款日期须在查询日后 **30 天**内 | Date ≤ | Current date → Bankruptcy Search Date + 30 − 1 天 | C70 / COMPLIANCE |

**份数要求（原文）**：
- **公司**：需 SSMID 和 ROC **两张**
- **个人**：按人维度**一张**，须包含新旧 NRIC
- **合伙**：**每人一张**，须包含新旧 NRIC

> ⚠️ 第 51 条（1 个月）与第 68 条（30 天）**阈值不一致**，且都指向同一个 defect code C70。需确认是否有意区分个人/企业。

---

#### ⑬ Additional for Individual（个人客户附加规则）

| # | 文件 | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|------|----------|------|------|-----------------|--------|
| 53 | FD Pledge Receipt | FD 金额须与 CED 有条件批准一致 | 定存质押金额 vs CED 批复金额 | Amount Consistency | FD amount → CED conditional approval FD Amount | F96 / FD PLEDGED AS SECURITY |
| 54 | Letter of Setoff (LOSO) | 有条件批准（如"FD 质押 RM100k 3 年"）金额比对 | LOSO 金额 vs CED 批复金额 | Amount Consistency | amount in LOSO → CED conditional approval FD Amount | F97 |
| 55 | LOSO | 期限比对 | LOSO 期限 vs CED 批复期限 | Fixed Value Comparison | term in LOSO → CED conditional approval FD Tenor | F95 / Letter of Set-Off not witnessed |
| 56 | LOSO | 有条件批准要求 FD 时，必须上传 LOSO | 文件缺失校验 | **File is not existing** | LOSO uploaded | — |
| 57 | Non Panel Dealer<br>Loan Suspense Deposit Receipt | 须存入待清算账户 `LOAN SUSPENSE LOAN` | 账户一致性（从分行信息查该分行的 loan suspense 账户，**传统与伊斯兰账户均可接受**） | Account Consistency | Loan Suspense account | 134 / A102 / DFC0009 / AUTHORISED LETTER FOR SETTLEMENT |
| 58 | 同上 | 收据定金日期 = 发票定金日期 | Date Consistency | Deposit date in receipt → Deposit date in Invoice | D5 / DEPOSIT |
| 59 | 同上 | 收据定金金额 = 发票定金金额 | Amount Consistency | Deposit amount → Deposit amount in Invoice | D6 / DEPOSIT |
| 60 | 同上 | 收据定金日期须不早于 HPA 承租人签约日 | Date ≥ | Deposit date → Hirer date at HP Agreement | D22 / DEPOSIT |
| 62 | E-hakmilik（电子产权） | FIS 签署日须不早于承租人签约日 | Date ≥ | FIS slip signing date → Hirer's agreement signing date | ⚠️ **误挂 Puspakom B5 的 defect（501/P2/DFC0046）** |
| 63 | Seller's IC（卖方身份证） | 放款前须完成原件查验，由 HLBB 员工签名并注明日期 | Date ≤ | Original sighted date → Current date | I103 / IC AND DRIVING LICENSE AND PASSPORT / IC of Seller not original sighted |

**LOSO 补充**：1 种格式，纯手工；传统版 10 页，伊斯兰版 13 页。

---

#### ⑭ Additional for Non-Individual（企业客户附加规则）

| # | 文件 | 业务规则 | 中文 | 算子 | 待验值 → 基准值 | Defect |
|---|------|----------|------|------|-----------------|--------|
| 65 | Company Resolution（董事会决议） | 授权人声明缺失 | 关键词识别：`"Anyone to sign"` / `"Authority given to"` | Value is not existing | 决议中的授权人声明 | C54 / DFC0013 / COMPANY RESOLUTION / not stated the authorised person to sign |
| 66 | Company Resolution | 决议日期须在【申请日 ~ 放款日(当前日期)】之间 | Date range（含边界） | Resolution date → system application date & Current date | C58 / Company Resolution - details wrong |
| 67 | Company Resolution | 决议文件缺失 | Special Document Verification | — | C59 / Not Submitted at all |
| 69 | ROC/SSM search / IBP（西马）<br>或 Lesen perniagaan (Form I) / Certificate of Practice（东马） | 须由 Sales 完成原件查验 | 查验日期须在【批准日 ~ 合同日】之间 | Date range | EHP sighted date → Between Approval date and Agreement date | C60 / COMPANY M&A / FORM24 / FORM49 |
| 70 | Partnership mandate（合伙授权书） | 日期须不晚于放款日 | 授权书日期须在【申请日 ~ 当前日期】之间 | Date range | The date in Partnership mandate | C63 / Partnership Mandate - details wrong |
| 71 | *(与 70 完全重复，仅 defect code 不同)* | 同上 | 同上 | Date range | 同上 | C66 / Partnership Mandate - not submitted |

---

#### ⑮ 商用车专用检验文件（PG11 / VR1 / Permit）

| # | 文件 | 车况 | 中文规则 | 算子 | 区间 | Defect |
|---|------|------|----------|------|------|--------|
| 72 | **PG11**（Laporan Pemeriksaan Awalan，初检报告） | 新车 | PG11 日期须在申请日之后、注册日之前 | Date range | Application date ~ Registration date | P10 / PUSPAKOM REPORT |
| 73 | PG11 | 二手车 | PG11 日期须在申请日之后、路税起始日之前 | Date range | Application date ~ Roadtax start date | P17 |
| 74 | **VR1** | 新车 | VR1 日期须在申请日之后、注册日之前 | Date range | Application date ~ Registration date | P12 |
| 75 | VR1 | 二手车 | VR1 日期须在申请日之后、路税起始日之前 | Date range | Application date ~ Roadtax start date | — |
| 76 | **Permit**（准证） | 新车 | Permit 日期须在申请日之后、注册日/路税起始日之前 | Date range | Application date ~ Registration date | P11 |
| 77 | Permit | 二手车 | 同上，右边界为路税起始日 | Date range | Application date ~ Roadtax start date | — |

---

#### ⑯ 纯版本校验类文件（无业务逻辑，只校验模板版本）

| # | 文件 | 版本 | 附加规则 |
|---|------|------|----------|
| 78 | Appendix 3 | `APPENDIX 3 REV022020` | — |
| 79 | Appendix 4 | Manual: `APPENDIX 4 REV022020`<br>E-Acceptance: `APPENDIX 4 REV042022E` | — |
| 80 | HP216（Seller Invoice 卖方发票） | `HP216 REV022020` | — |
| 81–82 | HP276 | `HP276 REV022020` | **上传 Redemption Statement（赎楼结清单）时，必须上传 HP276** |
| 83–84 | HP546 | `HP546 REV022020` | **上传 Redemption Statement 时，必须上传 HP546** |
| 85–86 | HP556 | `HP556 REV022020` | **上传 Redemption Statement 时，必须上传 HP556** |
| 87 | HP566 | `HP566 REV022020` | — |
| 88 | TERMS & CONDITIONS（合同条款） | `HP17 REV052025` \| `ATB500 REV052025` \| `IHP002 REV052025` | — |

> 💡 81–86 是典型的**条件必备文件（conditional mandatory）**：一旦出现 Redemption Statement（即二手车赎楼场景），HP276/HP546/HP556 三份文件同时变为必备。

---

## 5. Sheet 3：`refer info` —— 补充说明与未决问题（完整翻译）

这个 Sheet 只有 5 行，但**信息密度极高，且全是 sign-off 阻塞点**。

### 5.1 关于企业授权链

> **ROC/SSM search / IBP（西马）或 Lesen perniagaan (Form I) / Certificate of Practice（东马），须由 Sales 原件查验**
> → **SSM 中的董事必须出现在 Company Resolution 中。**
>
> *（备注：在 CED 环节已抽取，但无查验日期）*

### 5.2 关于 Partnership Mandate 与 Company Resolution 的本质

> Partnership mandate 针对的是合伙人，与 company resolution 同理——里面记录的是管理者。
>
> **这两个材料的目的是：声明谁有权利来签署贷款协议。**
>
> 如果 partnership 的所有人都已经在 HP Agreement 中签字，就不需要提供 Partnership mandate。
>
> Partnership mandate 和 Company Resolution 中有如下描述：
> - `"xxxx to apply"`
> - `"any one of xxx to ..."`
> - `"any two of xxx to ..."`
>
> **需要依据内容确定签名的人数和签名的人是否正确**——只需要 any one 或 any two 的那一个签名即可。

> 💡 这是全表**最难自动化**的一条：需要 OCR 读懂自然语言授权条款，解析出"需要几个人签、哪些人可签"，再回去核对 HPA 上的签名。

### 5.3 关于 NRIC（身份证）校验 —— ⚠️ 明确放弃

> **5. NRIC** - Authorised Director / All Partners / Sole-Prop 中执行 HPA 及相关文件的人的身份证。
> Company Resolution → Authorised Director 的 IC、护照。
>
> 判断 CRAR 中的 `Rel. to APP.` 字段：
> - 如果是 partner，**所有 partner 都需要提供 IC**
> - 如果是 sole prop，sole prop 需要提供
> - 所有 CRA report 下客户信息中的人都需要提供 IC 并校验
> - **如果 guarantor 不是 Authorised Director，还需要额外补充校验 Authorised Director 的 IC**
>
> **→ 原表批注：「沟通一下，系统不处理了，太过复杂」**

**校验点（3 条）**：
1. 身份证存在，且已原件查验（表明 Sales 看过，需要签名和日期）
2. 对比 Company Resolution，其中所有的人都需要有身份证
3. *（同上溯源逻辑）*

> ⚠️ **这是一个已被口头放弃、但未在主表中体现的决策。sign-off 时必须写进 Out of Scope，否则后续必然扯皮。**

### 5.4 关于生物识别（Biometric）

> **To obtain ALL partners Biometric** —— 获取所有合伙人的生物识别
> 校验：Verification status 须为 pass/successful。若 failed —— **必须提供护照或出生证明，并更新 remarks**
>
> **→ 原表批注：「非规则，放其他地方实现」**

> 💡 这条与 `05_签约` 模块的生物识别流程直接衔接（参见 `CLAUDE.md` 中 E-Acceptance 三次重试后的兜底逻辑）。**放款侧不重复校验，只消费签约侧的结果状态。**

### 5.5 关于 FIS 结果的两种来源

> FIS result 的样本有两类：
> 1. 从 LOS 查 FIS 接口拿到的，**一般只用于 FBR/FBT**
> 2. 用于正常情况——当 FIS 接口不能拿到结果时，Sales 可以去 FIS 网站上查询
>
> FIS 网站有两种查询方式：
> - 查询 **FIS 自己的数据**，数据有 **24 小时的延迟**
> - 查询 **JPJ 数据**，可以查询到实时结果。**这种方式查询时 Sales 需要预先取得客户的同意**

### 5.6 遗留问题（原文照录）

> **2027 年 1 月，切换 EIR 定价产品，计算校验的部分如何快速支持？**

> 💡 这直接指向第二附表的算术勾稽公式（第 16 条 `期数/12 × balance × rate`）。EIR（Effective Interest Rate）定价切换后，**Total term charges 的公式会变**。规格上必须把公式做成**可版本化的规则配置**，而不是硬编码。

---

## 6. Sheet 4：`ref-Business rules-individual` —— 个人客户场景矩阵（参考）

### 6.1 表结构（5 维索引 → 文件清单）

```
Customer Category │ Product Type │ Vehicle Category │ Dealership │ Code
   Individual     │ Conventional │      New         │   Panel    │ F143/SF143/FINP/SFINP
                  │   Islamic    │      Used        │ Used Panel │ F113/SF113/FIUP/SFIUP
                  │              │  Unreg. Recond   │  Direct    │ F110/SF110/FIUD/SFIUD
                                                          ↓
                              ┌──────────────────────┴──────────────────────┐
                              │  Standard（标准必备文件）  │  Additional（附加）  │
                              │  Mandatory Document       │  Guarantor / FD /   │
                              │  Document Check Against   │  SI / FBR /         │
                              │  Rules                    │  Settlement / IBG   │
                              │  business rule checking   │                     │
                              └───────────────────────────┴─────────────────────┘
```

**Code 命名规律**（重要）：
| Code | 含义 |
|------|------|
| `F143` / `SF143` | 个人 传统 新车 Panel（S 前缀 = Staff 员工件） |
| `FINP` / `SFINP` | 个人 伊斯兰 新车 Panel |
| `F113` / `SF113` / `FIUP` / `SFIUP` | 个人 二手车 Panel Dealer / 未注册翻新车 |
| `F110` / `SF110` / `FIUD` / `SFIUD` | 个人 二手车 Direct（卖方为个人） |

### 6.2 Individual - New - Panel 标准必备文件（13 份）

| # | 文件 | 比对对象 | 关键规则 |
|---|------|----------|----------|
| 1 | HP Agreement | CRA Report / Application form | **E-Acceptance 案件**：承租人及见证人日期须不早于**最新批准日**（查 CRA Report 的 Approval Authority History 及 Manual Approval Authority History 中的最新日期）<br>**Manual 案件**：须不早于 Approval Authority History 中最新的 Business/Pricing 批准日<br>**MOA 日期（Manual）**：须为当前日期，或最多从当前日期回溯 5 天 |
| 2 | HP Agreement T&C | CRA Report / HPA | **页数校验**：E-Acceptance 传统 8 页 / E-Acceptance 伊斯兰 10 页 / Manual 传统 7 页 / Manual 伊斯兰 9 页 |
| 3 | Second Schedule Part 1 | CRA Report / Invoice | 贷款条款与计算（见公式附件）；日期须不晚于申请日 |
| 4 | Application Form | CRA Report | 版本映射规则 |
| 5 | NRIC - Hirer & Guarantor | CRA Report / Biometric Result | — |
| 6 | Driving License (if any) | CRA Report | — |
| 7 | Biometric Result | NRIC | 出生地不得为高风险国家（**CED 也会查**）<br>**E-Acceptance 案件：不要求生物识别，但 CRA 状态须为 completed** |
| 8 | Vehicle Invoice | CRA Report / Second Schedule Part I | 发票日期 / 定金日期 / 订金规则 |
| 9 | VOC | CRA Report / NRIC | — |
| 10 | Roadtax / JPJ Receipt | CRA Report / VOC | 东西马归属校验<br>*备注：JPJ Receipt 可能有多条记录，需用 LKM 识别提取需要的记录；可能有多种 JPJ 模板，需要调研识别* |
| 11 | Insurance Cover Note | CRA Report | 保额公式；二手车承保期 ≥ 1 年；注册号比对（**新车没有**） |
| 12 | Delivery Receipt | CRA Report / VOC / Invoice / Application Form | 交车日 ≥ 注册日 |
| 13 | FIS/JPJ Result（Sales 上传） | CRA Report / VOC | 状态须为 Processed（FBR 为 Verified） |

### 6.3 Additional 触发条件（个人）

| 触发场景 | 附加文件 | 关键规则 |
|----------|----------|----------|
| **Guarantor** | HP Guarantee Agreement (HPGA) | HPGA 第 3 页日期与第 4 页协议日期须与 HPA 的 MOA 日期一致 |
| **Guarantor 非配偶** | Guarantor Waiver Rights & Liabilities (Appendix I–V) | — |
| **SI（自动扣款指令）** | SI Form（standing instruction，无样本） | — |
| **FBR** | a) HP566(2) Dealer Indemnity Letter<br>b) HP576(1) Acknowledgement by Hirer<br>c) E-hakmilik copy | **FBR 触发条件**：CRA Report 上的 FIS 结果状态为 `Verified` **且** 未提供 VOC<br>⚠️ **HP576 特殊逻辑**：现网已切换新版 HPA，新版 HPA 的 Part IV 中有一个条款——**需要识别提取；若有该条款，客户无需再签 HP576；若无，FBR 场景需签 HP576** |
| **IBG（跨行转账）** | IBG Letter | Dealer 地址比对发票、比对信头 |
| **FD 质押** | FD Receipt（2 种模板：manual / electronic，1 页）<br>Letter of Setoff (LOSO)<br>*（Charge of Deposit (COCD) —— 已删除）* | FD 金额与 CED 批复一致；如"FD 质押 RM100k 3 年" |
| **Non Panel Dealer** | Deposit Receipt / Loan Suspense Receipt（**仅 HLB**） | 发票定金日期与金额须与收据一致；须存入 `LOAN SUSPENSE LOAN` 账户 |
| **二手车/翻新车** | Puspakom B5 | 过户到期日 = 自检验日起 2 个月（Sales 上传日不能超过检测日后 2 个月） |

### 6.4 二手车 Direct（卖方为个人，F110）额外文件

| # | 文件 | 说明 |
|---|------|------|
| 3 | Deposit receipt | 发票定金日期须与定金收据/待清算收据一致 |
| 4 | **Seller Invoice** | 1 种格式，由 HLBB 出具给承租人，**LOAD$ 系统生成**，卖方手工签署后上传 |
| 5 | Seller's IC | 蓝卡 / 红卡 / 护照 |
| 6 | Bankruptcy search | 卖方提供给 Sales，1 种格式；交易日期须在 1 个月内 |
| 7 | **Delivery Receipt** | 同发票，HLBB 出具、LOAD$ 系统生成、卖方手工签署后上传；**取车日期须与 MOA 日期一致** |
| 8 | **IBG Letter** | 1 种格式，HLBB 出具、LOAD$ 系统生成、手工签署后上传 |
| 9 | **Bank Statement** | IBG letter 如果是 HLBB 的账号，**不需要提供**；如果不是，需要提供银行流水证明账户归属。只需提取客户信息、账户信息，用于比较 IBG letter 里的账户是否正确。**提供的 BS 可能只有一页，没有流水信息** |

---

## 7. Sheet 5：`ref-Business rules-company` —— 企业客户场景矩阵（参考）

### 7.1 与个人版的差异

企业版多了一个维度（`Vehicle Condition`），且列结构更细——多出 **`Each Field/Checking Criteria`（逐字段校验点）** 和 **`OCR and file checking`（OCR 与文件校验）** 两列，即企业版把「OCR 要抽哪些字段」和「抽完之后怎么判」拆开了。

**Code 命名**：
| Code | 含义 |
|------|------|
| `BHP143` / `ATBBHPINP` | 企业 新车 Panel |
| `BHP113` / `ATBBHPIUP` | 企业 二手车 Panel / 未注册翻新车 |
| `BHP110` / `ATBBHPIUD` | 企业 二手车 Direct |
| `BIHPNV` | **新车 Non-Act 商用车**（仅适用于 Conventional，即不受 HP Act 管辖的工业租购） |
| `BIHPUV` | 二手/重建/翻新 Non-Act 商用车 |

### 7.2 HP Agreement 的 10 个逐字段校验点（企业版）

| # | 字段 | 校验方式 |
|---|------|----------|
| 1 | AA reference number | — |
| 2 | Hirer's name | 须为公司名 |
| 3 | SSM ID / BR number | 比对 CRAR |
| 4 | Mailing & Collateral address | 比对 CRAR |
| 5 | Description of goods - Model/New | 比对 CRAR |
| 6 | Loan/financing terms（融资额/利率/期限/月供） | 比对 CRAR |
| 7 | **Hirer 签名 + 公司章 + 日期** | **Company Resolution 是另一个文件，需要和这个文件比对 hirer 签名；公司章比对 CRAR** |
| 8 | EHP 见证人签名、姓名、NRIC、日期 | 存在性校验 |
| 9 | MOA date | 同个人版 |
| 10 | HLBB/HLISB 授权签署人 | 同个人版 |

### 7.3 HP Agreement T&C（企业版）

| # | 校验点 |
|---|--------|
| 1 | AA reference number |
| 2 | Document name |
| 3 | **Paging must be in sequence**（页码须连续） |
| 4 | **每一页都须有承租人签字/缩写签名 + 公司章**——只要有其中一页没有 chop，**defect to sales** |

### 7.4 Application Form（企业版）逐字段

**Hirer 侧（9 项）**：AA reference number / Hirer name / SSM ID/BR number / 通信与抵押物地址 / 邮箱 / 勾选房屋所有权与通信地址 / 勾选车辆停放地与车辆类别 / 勾选条款 (i) 的同意 / **承租人签名 + 公司章** / 申请日期

**Guarantor 侧（6 项）**：Guarantor Name / NRIC 或护照号 / 通信地址 / 邮箱 / 勾选房屋所有权与通信地址 / Guarantor 签名 / 申请日期

### 7.5 企业主体证明文件矩阵（按注册时点与实体类型分叉）

| 实体场景 | 必备文件 |
|----------|----------|
| **13. SDN BHD，2017/1/31 之前注册** | Form 9 / ACT 777 / Akta syarikat 1965 / Section 17（注册证明）<br>Form 24 或 51（股东）—— *若 Form 24 与 SSM 的股份不一致，须补 Section 78 或 Section 51*<br>Form 49 & Section 58（董事变更）<br>全套 M&A 或 Section 36（M&A 废止时）<br>ROC/SSM search / Company Profile（CTC 不适用）或 Lesen perniagaan (Form I)/Certificate of Practice（东马）<br>**Company Resolution**<br>Form 13 或 Section 28（公司改名）或 Form 20（转 BHD） |
| **14. 2017/1/31 及之后注册** | Section 14（公司注册申请）<br>Section 58（董事/秘书任免）<br>ROC/SSM search / Company Profile<br>Company Resolution<br>Form 13 / Section 28 / Form 20 |
| **15. 独资 / Enterprise** | Form D/E（商业登记表）<br>ROC/SSM search / Company or Business Profile |
| **16. Partnerships（合伙）** | Form D/E 或 Trading license / Ordinan Perlesenan Perdagangan (Borang B)（东马）<br>ROC/SSM search / **IBP**<br>**Partnership mandate** |
| **17. LLP Partnerships** | Form D/E<br>ROC/SSM search（*need to check*）<br>**To obtain ALL partners Biometric**<br>**Partnership mandate**（*need to check*）<br>**Guarantee Agreement —— 所有合伙人都要签 HPGA**<br>**Guarantor Waiver Rights —— 所有合伙人都要签** |

> 🔴 **原表第 19 行有一条极关键的批注**：
> > **「16 到 27 行之间所有内容只看这一行，company 材料只看这一种」**
>
> 即：上表这一大堆企业注册文件，**实际只校验 `Company Resolution` 一份**。这是一次重大的范围收窄决策，但**主表（Sheet 2）里没有体现**。**sign-off 前必须确认这条是否成立。**

### 7.6 Company Resolution 的 5 个校验点

| # | 字段 | 说明 |
|---|------|------|
| 1 | HP ownership | — |
| 2 | Loan/financing amount | — |
| 3 | **Authorised signatory to execute HPA & documents** | 核心：谁有权签 |
| 4 | Director's Signatory & Name | — |
| 5 | Date | 主表第 66 条：须在申请日与放款日之间 |

**Partnership mandate 同构，多一条**：
> **6. 如果有 2 个合伙人且两人都签了文件，mandate 不适用**
> *（原表批注：「什么意思？」—— 业务方自己也没确认）*

### 7.7 Guarantor Waiver Rights（企业/合伙）签署矩阵

| Appendix | 签署人 |
|----------|--------|
| Appendix I & II | **Hirer 签**（承租人签名 + 公司章） |
| Appendix III, IV & V | **Guarantor 签**（担保人签名 + EHP 见证） |

**其余字段**：AA reference number / 担保人姓名、NRIC、通信地址 / 承租人名称、SSM ID/BR、通信地址 / EHP 或银行员工见证人姓名与 NRIC / 授信明细（融资额、利率、期限、月供、车辆品牌型号）

### 7.8 Non-Act 商用车（BIHPNV / BIHPUV）特有文件

| 文件 | 校验点 |
|------|--------|
| Laporan Pemeriksaan Awalan (PG11) | 品牌型号 / 底盘号 / 发动机号 / 出厂年份 / 检验日期 |
| VR1 | 底盘号 / 发动机号 / 品牌型号 / 出厂年份 |
| Permit | 品牌型号 / 底盘号 / 发动机号 / 出厂年份 / **检验与有效日期（有效期须大于当前日期）** |
| **Vehicle photo**（车辆照片，*图片处理*） | **须取得车辆正面与背面（含注册号）及侧面（含公司名称）** |
| Certificates of re-build（仅重建车） | 品牌型号 / 底盘号 / 发动机号 / 出厂年份 |

---

## 8. Sheet 6：`Company-discard` —— 企业侧废弃稿

47 行，内容已并入主表。**唯一的价值是保留了几条主表丢失的信息**：

| 保留信息 | 内容 |
|----------|------|
| HP Agreement 签名校验 | `must have Hirer Signature with company chop & date` → **Defect 23 / A14 / DFC0002 / Agreement Hirer's signature inconsistant`**（主表没有这条签名一致性规则！） |
| EHP witness Date 未填 | Defect 893 / A154 / `Hirer and/or Witnessed Not Dated`（与主表的 894/A155「Wrongly Dated」是**两个不同 defect**：未填 vs 填错） |
| Second Schedule 日期基准 | 此处基准值写的是 **`Acceptance date`**，而主表写的是 **`Application date`** ⚠️ **两者矛盾，必须澄清** |
| 高风险国家出生地 | 批注：**「CED 已拦截，可省略？」** |
| FIS/JPJ Result | 批注：**「非规则，FBR 统一实现」** |
| Insurance 承保期 | 批注：**「存疑」** |
| Permit 日期 | 此处写 `must after application date and before MOA date`，与主表的「before registration/roadtax start date」**不一致** ⚠️ |

---

## 9. 规则的灵魂

> 如果只能记住一件事：**这套规则在回答一个问题——"这叠纸，能不能证明这笔钱可以放？"**

拆开是 9 条内在逻辑。

### 灵魂 1 —— CRA Report 是唯一真相源

几乎每一条规则的 `Document Check Against` 都写着 **CRA Report（CRAR）**。CRAR 是系统里已经被 CED 批准的案件事实：金额、利率、期限、车辆、客户、地址。

> **系统数据是真相，纸质文件是待验证的副本。**

所有校验的方向都是「文件 → 对齐 CRAR」，而不是反过来。这决定了 STP 的技术形态：**不是"读懂文件"，而是"证明文件与系统一致"**——这比通用文档理解容易一个数量级，是 STP 可行的根本原因。

### 灵魂 2 —— 一条不可逆的时间轴（防倒签）

全表 88 条里超过一半是日期规则。它们共同定义了一条**隐含的法定时间轴**：

```
Application date
   ↓
Approval date（CED 批准）
   ↓
Hirer's date（承租人签约）  ═══  EHP witness date  ═══  MOA date     ← 三者必须同日
   ↓
HPGA date（担保协议，须 = HPA MOA date）
   ↓
Deposit date（≥ Hirer date）        Booking fee date（≤ Hirer date）
   ↓
Invoice date（在 Application ~ Delivery 之间）
   ↓
Registration date (VOC)  →  Road tax start date
   ↓
Delivery date（≥ Registration date）
   ↓
Funding date（= Current date）
```

**每一条日期规则都在防同一件事：倒签（back-dating）。**

在马来西亚 Hire Purchase Act 下，倒签会让合同的可执行性受质疑。所以规则不是"检查日期填没填"，是**"检查这份文件所声称的事件，有没有在它逻辑上不可能发生的时点发生"**。

典型：
- `Hirer's date ≥ approval date` —— 不能在批准前就签好合同
- `Second Schedule date ≤ application date` —— 法定披露必须在申请时就完成
- `Delivery date ≥ Registration date` —— 车没上牌不可能交付
- `Booking fee date ≤ Hirer date ≤ Deposit date` —— 订金在签约前，定金在签约后

### 灵魂 3 —— 第二附表必须自洽，且必须等于系统

Second Schedule Part I 是 **HP Act 强制的融资条款披露表**。第 14–20 条七个算术公式构成一个闭环：

```
Cash price less deposit  =  Cash price − Deposit
Total term charges       =  期数/12 × Balance originally payable × 年利率
Balance originally payable = Cash price less deposit + 运费 + 注册费 + 保险 + Total term charges
Balance incl. deposit    =  Balance originally payable + Deposit
Difference               =  Balance incl. deposit − Cash price
─────────────────────────────────────────────────────────────
Loan amount（推算）      ═══ 必须等于 ═══  系统中的贷款金额
OTR price（推算）        ═══ 必须等于 ═══  系统中的 OTR 价
```

**前 5 条是"文件内部自洽"，后 2 条是"文件对齐系统"。**

算错 = 向客户披露了错误的融资成本 = 违反 HP Act 披露义务。这是唯一一组**法律强制**的规则，也是**最不能降级、最不能"提示但放行"**的规则。

### 灵魂 4 —— 版本即法律条款

Application Form、HP Agreement、Second Schedule、Guarantee Agreement、Appendix 3/4、HP216/276/546/556/566、T&C —— 全都有版本号和生效日。

规则统一是：**`模板生效日 ≤ Application date ≤ 模板失效日`**，且明确写了**「两个版本可以并行一段时间」**。

> **用错版本 = 客户签了一份已失效的法律条款。**

而且 **E-Acceptance 和 Manual 是两套模板**（E 后缀），签约方式直接决定模板集合。这条把放款规则和 `05_签约` 模块硬绑定了。

### 灵魂 5 —— Code 是钥匙，必备文件是条件集合

不存在"所有案件都要交这些文件"。文件清单由 5 个维度决定：

```
Customer Category × Product Type × Vehicle Category × Dealership/Condition × Additional Flags
   Individual        Conventional     New              Panel                 Guarantor
   Non-Individual    Islamic          Used             Non-Panel             FD Pledge
                                      Recond           Direct                SI
                                      Non-Act 商用车                          FBR
                                                                             Settlement
                                                                             IBG
                              ↓
                     Code（F143 / BHP113 / BIHPNV / ...）
                              ↓
                     该 Code 下的 Mandatory Document List
```

> **STP 准入判定 = "这个 Code 对应的所有必备文件是否齐全，且其上挂的所有规则是否全部 pass"。**

这就是 STP 准入规则表的骨架——不需要另外发明，它已经在 Sheet 4/5 里了。

### 灵魂 6 —— 规则引擎的产物是 Defect 清单，不是布尔值

每条规则挂着 5 个 defect 字段（DEFECT_ID / CODE / CATEGORY×2 / TYPE）。这说明系统设计意图非常明确：

> **规则不通过 → 产出一条标准化 Defect → 进 Defect List → 退回 Sales 补件。**

不是"通过/不通过"，是"**具体哪里不对、属于哪一类、该找谁改**"。

这直接给出了 STP 的分流逻辑：

```
零 Defect                    → STP 直通放款
仅 Warning（如 B5 到期提醒）  → 提示但可 STP
有 Defect                    → 退回 Sales / 转 CRA 人工队列
```

> ⚠️ 但主表**没有 Severity 列**（只有第 61 条用文字备注写了"只提示不算 defect"）。**这是 sign-off 前必须补的关键字段。**

### 灵魂 7 —— 阈值必须是参数，不是常量

表里已经明确标注为参数的：`ADM_FEE_AMOUNT`（RM 270）、booking fee 上限 `x%`（现网 1%）、Hirer date + `5` 天、B5 提前提醒 `X` 天。

隐含但一定会变的：破产查询有效期（30 天 / 1 个月）、Puspakom B7（4 个月）/ B2（60 天）/ B5（2 个月）、保险系数（OTR × 0.8）、承保期（1 年）。

而 `refer info` 里那句 **「2027 年 1 月，切换 EIR 定价产品，计算校验的部分如何快速支持？」** 已经预告了：**连算术公式本身都要能换。**

> **规则配置化的深度决定这套系统的寿命。** 至少要做到：阈值参数化 + 公式可版本化 + 规则可按生效日期启停（与文件版本管理同构）。

### 灵魂 8 —— 企业客户的核心是"授权链"

企业侧所有额外复杂度，都在回答一个问题：**签字的这个人，真的有权代表公司签吗？**

```
SSM / ROC search（谁是董事）
      ↓  「SSM 中的董事必须出现在 Company Resolution 中」
Company Resolution / Partnership Mandate（谁被授权签）
      ↓  「"any one of" / "any two of" —— 需要几个人签」
HP Agreement 上的实际签名 + 公司章
      ↓
该签署人的 NRIC（证明这个人是这个人）
```

这条链上的每一环，`refer info` 都留下了「太过复杂」「什么意思？」「need to check」的批注。

> **这是 STP 的真正边界。** 个人客户的文件校验是"比对数值"，企业客户的授权链校验是"理解法律文本"。**建议 STP 首期只覆盖 Individual，Non-Individual 走人工或半自动。**

### 灵魂 9 —— 规则引擎不是唯一防线

表里有多处明确的"这条不在这里做"：

| 规则 | 批注 | 含义 |
|------|------|------|
| Biometric verification | 「非规则，放其他地方实现」 | 签约模块已做，放款侧只消费结果 |
| 出生地高风险国家 | 「CED 已拦截，可省略？」 | 上游已管控，避免重复 |
| FIS/JPJ Result | 「非规则，FBR 统一实现」 | 属流程分支，非字段校验 |
| NRIC 溯源校验 | 「系统不处理了，太过复杂」 | 明确放弃，落人工 |
| Puspakom B5 到期 | 「prompt in mytask list. Not add defect」 | 降级为提示 |

> **健康的规则体系一定有明确的"不管"清单。** 这些批注是这份表最诚实、也最有价值的部分——它们定义了 STP 的**范围边界**，必须原样写进需求文档的 Out of Scope 章节。

---

## 10. Sign-off 阻塞点清单

按优先级排列。**这些不解决，签了也是白签。**

### 🔴 P0 —— 结构性缺失（必须补字段/补章节）

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| 1 | **主表没有 Severity 列**（Defect vs Warning） | Sheet 2 全表 | 新增 `SEVERITY` 列：`BLOCK` / `WARN` / `INFO`。这是 STP 分流的直接依据 |
| 2 | **两列同名 `DEFECT_CATEGORY`** | Sheet 2 H/I 列 | 正名为 `DEFECT_CATEGORY_CODE`（DFCxxxx）与 `DEFECT_CATEGORY_NAME`（业务大类） |
| 3 | **`File is not existing` 算子未定义** | Sheet 1 缺失，Sheet 2 第 43/56 行在用 | 补入 Rule type，与 `Value is not existing`（字段缺失）明确区分 |
| 4 | **大量 DEFECT_ID / CODE / TYPE 为 TBD** | Sheet 2 约 60% 行 | 逐条补齐或明确"沿用现网 defect code 主数据" |
| 5 | **缺 STP 准入规则表** | 全表都没有 | 需从 Sheet 4/5 的 Code 矩阵提炼：哪些 Code + 哪些 Additional 组合允许 STP |
| 6 | **缺 OCR 置信度门槛** | 全表都没有 | 规则的输入来自 OCR。OCR 抽错字段会导致误判 defect。需定义：低置信度字段 → 转人工复核，而非直接判 defect |

### 🔴 P0 —— 规则互相矛盾（必须业务澄清）

| # | 矛盾点 | A 说法 | B 说法 |
|---|--------|--------|--------|
| 7 | **Second Schedule 日期基准** | 主表：`Application date` | Company-discard：`Acceptance date` |
| 8 | **Puspakom B2 有效期** | 主表第 50 行同格内：`4 个月` | 同格内 + Sheet 4/5：`60 天` |
| 9 | **破产查询有效期** | 第 51 行（个人）：`1 个月` | 第 68 行（企业）：`30 天` |
| 10 | **Permit 日期上界** | 主表第 76 行：`registration/roadtax start date` | Company-discard 第 41 行：`MOA date` |
| 11 | **企业注册文件范围** | Sheet 5 列了 7+ 份文件 | Sheet 5 第 19 行批注：**「company 材料只看 Company Resolution 这一种」** |
| 12 | **东马四地定义** | 表中列 `Sabah, Sarawak, Pulau Labuan, Pulau Langkawi` | **Pulau Langkawi 实际属西马 Kedah 州** |

### 🟡 P1 —— 已放弃但未记录（必须写进 Out of Scope）

| # | 项目 | 原批注 |
|---|------|--------|
| 13 | NRIC 溯源校验（partner/sole-prop/authorised director 全量比对） | 「沟通一下，系统不处理了，太过复杂」 |
| 14 | Biometric 校验 | 「非规则，放其他地方实现」 |
| 15 | 出生地高风险国家 | 「CED 已拦截，可省略？」—— **带问号，未定案** |
| 16 | FIS/JPJ Result 状态判定 | 「非规则，FBR 统一实现」 |
| 17 | Partnership mandate「2 个合伙人都签则 mandate 不适用」 | 「什么意思？」—— **业务方自己没确认** |
| 18 | Road tax 东西马规则 | 标注 `todolist rules` —— **规则未定稿** |
| 19 | LLP 的 ROC/SSM search 与 Partnership mandate | 标注 `need to check` ×2 |

### 🟡 P1 —— 数据质量（清理后再签）

| # | 问题 |
|---|------|
| 20 | 第 39/40 行 Delivery Receipt(seller) **完全重复**，且都写 "without settlement"，缺 "with settlement" 分支 |
| 21 | 第 70/71 行 Partnership mandate **完全重复**，仅 defect code 不同（C63 / C66） |
| 22 | 第 62 行 E-hakmilik 规则**误挂 Puspakom B5 的 defect**（501/P2/DFC0046/B5 expired） |
| 23 | 第 19/20 行 `Value to Verify` 与 `Base Value` **方向与其他行相反**（公式在待验值列，系统值在基准值列） |
| 24 | 文件版本校验统一用了 `Date ≥ Specified Date`，但 Sheet 1 有专门的 `Application Date vs. Application Form Version Mapping` 算子未被使用 |
| 25 | Company-discard 中有一条主表遗漏的规则：**HPA Hirer 签名一致性**（Defect 23 / A14 / `Agreement Hirer's signature inconsistant`） |
| 26 | Company-discard 区分了 `Not Dated`（893/A154）与 `Wrongly Dated`（894/A155），主表只保留了后者 |

### 🟢 P2 —— 前瞻性风险（写进 Assumption Log）

| # | 项目 | 说明 |
|---|------|------|
| 27 | **2027 年 1 月 EIR 定价切换** | 第二附表的 Total term charges 公式会变。需确认规则引擎是否支持公式版本化 |
| 28 | **FIS 数据 24 小时延迟** | 当接口取不到、Sales 改用网站查 FIS 自有数据时，数据延迟 24 小时。**这可能让"当日签约当日 STP 放款"在部分场景不成立** |
| 29 | **JPJ 实时查询需客户同意** | 走 JPJ 实时数据需 Sales 预先取得客户同意。同意的采集与留痕在哪个环节？ |
| 30 | **HP576 的条款识别** | 新版 HPA Part IV 中若存在某条款，则 FBR 场景无需签 HP576。这要求 OCR **识别合同条款文本**（而非字段），复杂度远高于其他规则 |
| 31 | **JPJ Receipt 多模板 / 多记录** | 原表标注「可能有多条记录需用 LKM 识别提取需要的记录；可能有多种 JPJ 模板，需要调研识别」——**尚未调研** |

---

## 11. 下一步建议

结合上一轮讨论的 sign-off 交付物清单，这份 Excel 直接对应其中 3 项：

| Sign-off 交付物 | 本 Excel 的贡献 | 还缺什么 |
|-----------------|-----------------|----------|
| **STP 准入规则表** | Sheet 4/5 的 Code × 文件矩阵 = 骨架 | 缺"哪些 Code 允许 STP"的判定；缺 Severity 分级 |
| **字段清单** | Sheet 5 的 `Each Field/Checking Criteria` = OCR 字段需求 | 缺字段级的数据类型、格式、置信度门槛 |
| **业务规则清单** | Sheet 2 = 主体（88 条） | 缺 P0 清单里的 6 项结构性字段；缺 12 条矛盾的澄清 |

**建议动作顺序**：
1. 把 §10 的 P0 清单（12 项）做成一页问题表，**先跟业务方过一轮**——不要等文档写完再问
2. 补齐主表的 `SEVERITY` 列，这是 STP 分流的地基
3. 从 Sheet 4/5 提炼 **Code → Mandatory Document → 允许 STP 与否** 的准入表
4. 确认「company 材料只看 Company Resolution」是否成立——**这一条直接决定企业客户 STP 的可行性**
5. 把 §10 的 P1「已放弃项」原样写进需求文档的 **Out of Scope** 章节，让客户签字时明确接受

---

**文档版本**：v1.0
**创建日期**：2026-08-11
**源文件**：`Appendix_ CRA Business Rules_ Defect Code_signoff version.xlsx`（6 sheets / 88 条主规则）
