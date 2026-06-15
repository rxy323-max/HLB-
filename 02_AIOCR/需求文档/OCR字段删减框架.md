# OCR 字段删减框架（决策规则 + 逐文件应用结果）

> 日期：2026-06-15  
> 定位：经办（OCR）输出规范 — 哪些文件的哪些字段必须处理  
> 依据：OCR字段清单原始Excel（353字段，23种文件）+ 系统调用图（4模块架构）

---

## 一、框架基础：OCR 的输出服务于谁？

OCR = **经办**，其抽取结果有且仅有 4 个下游消费者：

| 层级 | 消费者 | 触发机制 | Excel 对应 |
|------|--------|---------|-----------|
| L1 | 单文件质量校验（OCR 自身） | is_mandatory / is_critical | validation_rules 分段 |
| L2 | 跨文件交叉核验 | 250条交叉规则 → Alert → Forced CED | 规则 `rule` 列 |
| L3 | 收入核算 → STP 评分 | 56条收入规则 | income 字段组 |
| L4 | CED 人工审核展示 | CED 工作台屏幕 | `ced=True` |

**删减原则**：一个字段只要服务于以上任意一层，就不能删。只有 4 层都不用的字段，才是真正的删减候选。

---

## 二、5 条保留规则（任一命中 = 不可删）

### R1：Policy 或 CED 标记（硬保留）
```
policy = True  OR  ced = True  →  RETAIN
```
261 个字段，直接保留，无需进一步分析。

### R2：L1 质量信号（单文件校验必需）
```
is_critical = Y  OR  is_mandatory = Y  →  RETAIN
```
OCR 对该字段有格式/内容检查义务（如：身份证号格式、签发日期范围）。  
`N(Y)` 表示"条件临界"，也计入 R2。

### R3：跨文件对比锚点（L2 必需）
```
字段名 X 在文件 A 中 policy=F/ced=F，
但字段名 X 在另一文件 B 中 policy=T 或 ced=T
→ 文件 A 中的 X 必须 RETAIN
```
原因：若 B 中的 X 要与 A 中的 X 做交叉核验，A 必须先抽取出来。  
典型案例：`date_of_birth` 在护照（Passport）中是 policy=T，因此所有其他文件中的 `date_of_birth` 都受 R3 保护。

### R4：身份/车辆主键（防伪锚点）
```
身份证件文件（IC/WP/Passport/DL）上的 id_no / passport_no / fin_no
车辆文件（VOC/VSO）上的 registration_no / chassis_no / engine_no
→  RETAIN
```
主键字段是跨文件比对的唯一标识符。部分篡改（IC号正确但出生日期不符）是伪造的核心信号，必须完整抽取才能检测。

### R5：存在校验规则内容（L1/L2 执行必需）
```
rule 列有实质内容（非"无"/"－"）  →  RETAIN
```
即使规则是"eyeball check"（人工目视），也意味着系统要为 CED 或销售提供该字段值供核对。

---

## 三、应用结果：92 个候选字段的逐条判断

原 Excel 中 policy=False AND ced=False 共 92 个字段，经规则过滤：

| 结果 | 数量 | 说明 |
|------|------|------|
| RETAIN（命中 R2–R5） | 33 | 不可删 |
| DELETE — 已确认 | 38 | 4层均不服务，可删 |
| 灰色地带 — 需人工确认 | 21 | 涉及收入规则边界或业务判断 |

---

### 3.1 RETAIN 修正（原始标注有误，必须纠正）

以下字段被原始表格标为删减候选，但经规则检查应保留：

| 文件 | 字段 | 保留规则 | 说明 |
|------|------|--------|------|
| SG_Identity_Card | id_no | R3 + R4 | 新加坡申请人的唯一标识符，被13份文件交叉引用 |
| VOC | customer_name / owner_name | R3 | `customer_name` 在20+文件中为 policy=T，是客户姓名锚点 |
| VOC | id_no / owner_id_no | R3 + R4 | 车辆主人身份核验，被13份文件引用 |
| Passport | gender | R2 + R5 | is_critical=N(Y)（条件临界）且有 eyeball check 规则 |
| Passport | passport_no_old | R4 | 护照旧号是证件主键之一，防止新旧护照混用欺诈 |

---

### 3.2 RETAIN — 命中 R3（跨文件对比锚点）

| 文件 | 字段 | 锚点来源 |
|------|------|--------|
| Mykad(Blue) | date_of_birth | Passport.date_of_birth = policy=T |
| Mykad(Blue) | nationality | MyPR/Passport.nationality = policy=T |
| MyPR | date_of_birth | Passport |
| VISA | nationality, date_of_birth, date_of_issue | Passport/MyPR |
| Driving_Licence | nationality | Passport/MyPR |
| SG_Identity_Card | date_of_birth, nationality, date_of_issue | Passport |
| SG_Work_Permit | nationality, date_of_birth | Passport/MyPR |
| other_country_work_Permit | nationality, date_of_birth | Passport/MyPR |
| VSO | registration_no, chassis_no, engine_no, vehicle_make, vehicle_model, manufacture_yr, engine_capacity | VOC（均为 ced=T） |
| CRA Form | has_signature, signatory_date（2组） | CRA Form 内部 policy=T 字段 |

---

### 3.3 DELETE — 已确认可删（38字段）

| 文件 | 字段 | 删减理由 |
|------|------|--------|
| **Mykad(Blue)** | gender | 4层均无引用；性别不进任何风控规则 |
| **MyPR** | gender | 同上 |
| **VISA** | gender | 同上 |
| **SG_Identity_Card** | gender, race, country_of_birth, full_address | 均无跨文件引用；地址来自申请表，不来自证件 |
| **SG_Work_Permit** | gender | 同上 |
| **Driving_Licence** | —（nationality 保留 via R3） | 仅1个候选，已保留 |
| **VSO** | address（经销商地址）, phone（经销商电话） | 经销商联系信息，与信审无关 |
| **VOC** | fuel_type, body_type, gross_weight | 车辆属性不进信审/CED展示 |
| **Individual_bank_statement** | debit_amount | 银行流水借方金额不参与收入核算 |
| **Payslip** | socso_no | 社保号不进任何规则 |
| **EA_Form** | socso_no, employer_tin_no | 雇主注册号不进收入/风控规则 |
| **CP58** | payer_reg_no, payer_tax_no | 支付方税务号不进收入/风控规则 |
| **SPGA** | old_ic/pp_no/special_ID, salary_number | 旧证件号/薪资编号在破产报告中为冗余字段 |
| **Singapore_NOA** | relief_earned_income, relief_spouse, relief_child_qcr, relief_donations | NOA 中已有 total_chargeable_income，个别减免项不重复计算 |
| **Form B / Form BE** | gender（各1） | 同上，性别无规则引用 |
| **Form B** | citizen | Form B 申报人默认为马来西亚税务居民，国籍字段冗余 |
| **other_country_work_Permit** | passport_expiry | ⚠️ 见灰色地带说明 — 实为灰色地带，暂列此处待确认 |

---

### 3.4 灰色地带（21字段）— 需业务确认

这些字段规则层面无法机械判断，需业务/风控团队确认后才能定论：

#### 组 A：收入规则边界（L3 边界不清晰）
| 文件 | 字段 | 问题 |
|------|------|------|
| EA_Form | earning_tax_exempt_allowance | 免税津贴是否计入 DSR 分子？若计入则不可删 |
| Form B | relief_individual_and_dependents | 个人减免是否影响净申报收入计算？ |
| Form BE | relief_individual_and_dependents | 同上 |

**确认方式**：对照 56 条收入规则，查看 DSR 计算公式是否引用这些字段。

#### 组 B：CRA Form 担保人块（业务逻辑边界）
| 字段 | 问题 |
|------|------|
| other_customer_list / name / id_no / mobile / email / address | 若有担保人，是否需要 OCR 抽取担保人信息？目前 policy=F/ced=F，但担保人 ID 伪造是风险点 |
| company_name / registration_no* / tel / email / address | 企业担保方信息：若申请人是公司主体，这些是否应进 CED？ |
| signatories_list / name / id_no / mobile | 授权签署人信息：签署人不是申请人，目前不校验 |
| has_company_stamp | 公司印章确认：是否属于文件质量信号（应为 is_mandatory=Y）？ |

*注：company registration_no 触发 R3（VOC 中 registration_no=ced=T），已标为 RETAIN。

**确认方式**：与 CED 团队确认担保人字段是否在 CED 工作台需要展示。若需展示则改 ced=True。

#### 组 C：文件真实性信号（is_clear_copy 的定位）
| 文件 | 字段 | 问题 |
|------|------|------|
| Form B | is_clear_copy | 文件清晰度标记：是 OCR 提取的字段还是质检模块的输出？若是质检输出，不属于字段列表 |
| Form BE | is_clear_copy | 同上 |

**确认方式**：与 OCR 产品团队确认 is_clear_copy 是 OCR 字段（需抽取）还是质检模块评分（独立输出）。

#### 组 D：其他国工作证的护照有效期
| 文件 | 字段 | 问题 |
|------|------|------|
| other_country_work_Permit | passport_expiry | 护照过期 = 可能非法居留 = 信用风险。policy=F 但感觉应该是 policy=T 的漏标 |

**确认方式**：与风控团队确认护照有效期是否应进 STP 规则。若是，改 policy=True。

#### 组 E：Form B 自雇经营信息
| 文件 | 字段 | 问题 |
|------|------|------|
| Form B | business_name, business_activity | 自雇申请人的业务名称/类型是否影响信审评估？目前 policy=F |
| Form B | declarations_name, declarations_ic | 申报人≠申请人时（会计师代申报），是否是反欺诈信号？ |
| Form BE | declarations_name, declarations_ic | 同上 |

---

## 四、决策树（单字段使用）

```
给定一个字段 F：

1. policy=T 或 ced=T？
   是 → RETAIN（不可删）
   
2. is_critical=Y 或 is_mandatory=Y？
   是 → RETAIN（L1 质量信号）

3. 字段名 F 在其他文件类型中存在 policy=T 或 ced=T？
   是 → RETAIN（L2 跨文件锚点）

4. F 是当前文件的主键标识字段（id_no/registration_no/chassis_no/engine_no）？
   是 → RETAIN（防伪锚点）

5. rule 列有实质内容（非空/无/－）？
   是 → RETAIN（校验规则执行必需）

6. 全部否 → DELETE 候选（进入灰色地带人工确认后方可执行）
```

---

## 五、对原始删减表的修正清单

以下是与已知客户讨论结果**存在冲突**的字段，需要在下次会议中明确：

| 字段 | 原始标注 | 正确判断 | 修正规则 | 建议行动 |
|------|--------|--------|--------|--------|
| SG_Identity_Card.id_no | 删减 | 保留 | R3+R4 | 立即修正，此字段为申请人主键 |
| VOC.owner_name / owner_id_no | 删减 | 保留 | R3 | 修正，车主身份核验用 |
| Passport.gender | 删减 | 保留 | R2+R5 | 修正，有 eyeball check 规则 |
| VSO 车辆规格（7字段） | 可能删减 | 保留 | R3（锚在VOC） | 确认 VSO×VOC 交叉核验规则是否实装 |
| other_country_WP.passport_expiry | 删减 | 灰色地带 | — | 与风控确认是否是漏标 policy=T |

---

## 六、执行建议

**P1（立即执行）**：在 Excel 中新增 `deletion_rule` 列，对 92 个候选字段逐一填入 R1-R5 或"灰色地带-组X"。  
**P2（本周内）**：对灰色地带 21 字段拉业务/风控确认会（重点：收入规则边界、担保人块）。  
**P3（定稿）**：更新字段清单，删减字段列设为"已删"状态而非直接删行（保留历史记录）。  

