# HLB Non-Individual 申请系统 — 项目上下文

> 每次新会话开始时，AI 读取此文件以恢复完整项目背景。

---

## 项目基本信息

- **项目名称**：HP (Hire Purchase) Non-Individual 贷款申请系统
- **所属银行**：Hong Leong Bank (HLB)
- **负责人**：晓宇
- **开发阶段**：设计阶段
- **目标上线日期**：7月25日

---

## 业务背景

本系统用于处理非个人客户（Non-Individual）的贷款申请，涵盖多种法律实体类型的 KYC 与信贷进件流程。

核心业务规则：
- **流程说明**：以下流程模块是基于当前企业申请内容总结的初步框架，**并非固定不变**，实际流程可能根据业务需求与系统设计进行动态调整与联调。
- **无电子签约**：Non-Individual 申请必须走线下纸质签署，不适用 E-Consent / E-Acceptance
- **签约人规则**：根据实体类型确定（详见"签约人规则"章节）

---

## 实体类型总览（A–L）

> 详细字段维度请参考腾讯文档 Sheet「01-企业类型总览」。

### 标准流程（8类）

| 类别 | 实体类型（EN） | 实体类型（CN） | Constitution Code | 法律地位 | 债务逻辑 | 监管机构 | ID Type | UBO 规则 |
|------|--------------|--------------|-----------------|---------|---------|---------|---------|---------|
| A | Sdn Bhd | 私人有限公司 | R - Sdn Bhd/Private Ltd | 独立法人 | 有限责任，以公司资产为限 | SSM（单一管辖） | Certificate of Incorporation（SSM ID） | 强穿透（持股 >25% 或实际控制权） |
| B | Berhad | 公众有限公司 | U - Bhd/Public Ltd Co | 独立法人 | 有限责任 | SSM + 证监会（SC） | Certificate of Incorporation（SSM ID） | 豁免/简化（Top 5 股东） |
| C | Branch | 外国分行 | 无直接映射（归入 Others） | 非独立法人 | 无限责任，海外母公司兜底 | SSM（需海外证明） | Foreign Business Registration（SSM ID） | 跨国穿透（追溯海外母公司） |
| D | Sole Proprietorship | 独资企业 | S - Sole Proprietor | 非独立法人 | 个人无限责任，老板与生意一体 | SSM（1956年商业注册法） | Business Registration（SSM ID） | 自动绑定（老板本人 = UBO） |
| E | Partnership | 常规合伙 | P - Partnership | 非独立法人 | 连带无限责任，全员连带 | SSM | Business Registration（SSM ID） | 自动绑定（全体合伙人 = UBO） |
| F | Local PLT | 本地有限责任合伙 | 无直接映射（归入 P 或 O） | 独立法人 | 有限责任 | SSM（2012年PLT法） | Registration Certificate | 穿透（>25% 利润分配权合伙人） |
| G | Foreign LLP | 外国 PLT | 无直接映射（归入 Others） | 独立法人 | 有限责任 | SSM（需海外母体证明） | Foreign Business Registration | 跨国穿透（追溯海外母公司） |
| H | Prof. LLP | 专业 PLT | 无直接映射（归入 P 或 O） | 独立法人 | 双层责任（商业有限/专业过失无限） | SSM + 行业协会（双重管辖） | Registration Certificate | 穿透（持证专业合伙人 >25%） |
| L | East MY SE | 东马特殊企业 | 无直接映射（地域特殊性） | 非独立法人 | 个人无限责任 | 东马地方议会（非 SSM） | Business Registration（地方 Trading License） | 自动绑定（持牌人 = UBO） |

### 特殊处理（3类）

| 类别 | 实体类型 | Constitution Code | 特殊规则 |
|------|---------|-------------------|---------|
| **I** | Virtual BE（无实体法地位） | 无映射（系统占位符） | **HP 不可办理**，前端直接隐藏此选项，引导转换为 A/D/F 类 |
| **J** | Virtual Soc.（非营利社团/协会） | A - Assoc/School/Society / C - Cooperative / T - Trade Union | 需强制委员会成员签 PG；职位确认模式 |
| **K** | Government（政府机构） | G/V/W/B/H/F（联邦/地方/法定机构） | 全面 AML 豁免白名单，免担保，跳过 UBO 识别 |

### 各实体类型的材料要求与催收规则

| 类型 | 进件材料 | 担保要求 | 签约主体 | 车辆注册 | 违约催收路径 |
|------|---------|---------|---------|---------|------------|
| A（Sdn Bhd） | Superform + BR + 审计报告 + 6个月流水 | 强制1-2名董事 PG | 公司（BR授权董事签字） | 公司名下 | 拖车拍卖 → 起诉公司清盘 → 执行PG追差额 |
| B（Berhad） | Superform + BR + 公开审计报表 | 大型Bhd通常豁免PG | 公司 | 公司名下 | 拖车拍卖 → 起诉公司（一般不涉及个人） |
| C（Branch） | Form 79/80 + 母公司授权 + 审计报表 | 必须由海外母公司提供 CG | 分行（本地授权代表签字） | 分行名下 | 拖车拍卖 → 查封分行资产 → 跨国起诉母公司 |
| D（Sole Prop） | Form A & D + 流水 + 报税表(B/BE) | 通常无须（已负无限责任） | 老板个人 | 个人/商号 | 拖车拍卖 → 向老板追讨差额 → 申请个人破产 |
| E（Partnership） | Form A & D + 合伙协议 + 全体合伙人报税表 | 无须额外担保 | 合伙企业 | 合伙企业名下 | 拖车拍卖 → 向全体合伙人追讨 → 连带破产 |
| F（Local PLT） | PLT证书 + 年度声明 + 决议 + 流水 | 强制核心合伙人 PG | PLT企业 | PLT企业名下 | 拖车拍卖 → 起诉PLT清算 → 执行PG |
| G（Foreign LLP） | 海外PLT证书 + 本地注册文件 + 决议 | 要求海外合伙人 PG 或海外母体 CG | 外国PLT本地分支 | 外国PLT名下 | 同C类，跨国追诉 |
| H（Prof. LLP） | PLT证书 + 有效执业证书 + 协会批准信 | 要求核心专业合伙人 PG | 专业PLT实体 | 专业PLT名下 | 拖车拍卖 → 起诉PLT → 执行PG资产 |
| J（Virtual Soc.） | ROS证书 + 委员会决议 | 强制主要委员会成员 PG | 社团实体 | 社团名下 | 拖车拍卖 → 追讨社团资产 → 追究签字人 |
| K（Government） | 财政部公函(LOU) | 财政兜底，免担保 | 政府部门/法定机构 | 政府部门名下 | 极少发生，财政协调，不走常规催收 |
| L（East MY SE） | Trading License + 老板报税表 | 通常无须（无限责任） | 老板个人 | 依东马JPJ规则 | 拖车拍卖 → 东马法庭追诉老板无限责任 |

---

## 核心流程模块

系统分为 **3 大模块**，强串行执行：

### Step 1：企业身份概况（Company Profile & Identification）
**核心动作**：Sales 输入企业 ID → 系统拉取数据（Experian/CIF）→ Sales 确认企业类型

**必填字段组**：
- ID Type1 + ID No.（默认 SSM ID；若为 SSM ID，则 ID Type2 必填用于 CIF 查询）
- New Business Registration No.（强制格式：2字母+7数字+1字母，如 AB1234567C）
- Company Name（Read-Only，来自 SSM）
- Establishment Date（日期选择，允许修正）
- Nature of Business（Group → Code → Full MSIC Code 三级联动）
- TIN（强制格式校验 onBlur，支持两种模式）
- Bumiputera Status（Yes/No）

**依赖输出**：此步骤确定的企业类型将控制 Step 2 和 Step 3 的 UI 展现。

---

### Step 2：关联角色与担保结构（Management, Shareholder & Guarantor）
**核心动作**：根据 Step 1 企业类型，动态展示需要录入的角色，Sales 补充人员信息。

**角色大类**：
- Guarantor（担保人）
- Owner（实益拥有人）
- Non-Guarantor（非担保人）

**企业类型 → 担保结构强依赖**：
| 企业类型 | 强制要求 |
|---------|---------|
| Partnership（E） | 全体 Partner 必填，自动标记为 Owner/Guarantor |
| PLT（F/G/H） | 全体 Partner 必填，全部标记为 Guarantor |
| Sdn Bhd / Berhad（A/B） | 不强制，但通常需至少一名 Director 作为 Guarantor |

**Experian 树状图（Drill-down）交互**：
1. 展示第一层股东（Individual + Corporate）
2. Corporate 股东右侧提供 `[⊕ Drill-down]` 按钮
3. 点击后弹窗输入公司 SSM ID，再次拉取下一层
4. 树状缩进展示，直到找到 >25% 自然人
5. 每个 Individual 股东旁提供 `[Set as UBO]` 勾选框

**UBO 识别 4 种模式**：
| 模式 | 适用类型 | 交互 |
|------|---------|------|
| 模式1：自动绑定 | D, E, L | 系统自动将 Owner/Partner 标记为 UBO，不可取消 |
| 模式2：职位确认 | J | 用户录入委员会成员时允许勾选为 UBO |
| 模式3：强穿透 | A, C, F, G, H | Drill-down 直到找到自然人，提供兜底选项 |
| 模式4：豁免/简化 | B, K | K 直接隐藏；B 展示 Top 5 股东勾选 |

---

### Step 3：财务与合规确认（Financials & Compliance）
**核心动作**：录入财务数据，完成合规问卷

**财务字段**：
- 近 2 年营业额（Actual + 分层区间）
- 员工数（Actual + 分层区间）
- 利润率、授权资本、实缴资本
- 主要收入证明、还款来源
- 月净申报收入（计算器得出）

**合规字段**：
- PEP 检查（政治公众人物 Yes/No）
- RCA 检查（PEP 关联人 Yes/No）
- UBO 无法识别兜底选项
- 高风险特征（代理股东/不记名股）
- KYC 方式、联系记录、客户意愿确认

---

## 签约人规则（Signatory for LOU/Agreement）

**关键原则**：Non-Individual 必须线下纸质签署，不适用电子签约。

| 实体类型 | 签约主体 | 签字人 |
|---------|---------|-------|
| Sdn Bhd / Berhad（A/B） | 公司 | BR（董事会决议）授权的董事 |
| Sole Prop（D） | 个人/商号 | 老板本人 |
| Partnership（E） | 合伙企业 | 全体合伙人共同签字 |
| PLT（F/G/H） | PLT | 合规官或授权合伙人 |

**系统交互要求**：
- 录入关联人时提供 `[Set as Authorized Signatory]` 勾选框
- Sdn Bhd：Sales 必须根据 BR 文件勾选至少一名 Director 作为 Signatory
- Partnership：系统自动将全体 Partner 标记为 Signatory

---

## 预填数据修改规则

| 数据项 | 修改权限 | 说明 |
|-------|---------|------|
| ID Type + ID No.（核心标识符） | **Read-Only** | 填错只能废弃申请重录 |
| Company Name | **Read-Only** | 必须与 SSM 数据一致 |
| Registered Address | **Read-Only** | 来自 Experian |
| Business/Office Address | 可修改 | 默认复制注册地址，允许 Sales 手工修改 |
| Directors/Shareholders 名单 | 可添加/覆盖 | 手动 Override 时系统记录日志 |

---

## TIN 校验规则

- **校验时机**：`onBlur`（失去焦点）+ 提交时兜底
- **格式模式**：
  - 模式1：`1A8N-1A12N`（如 AB1234567C）
  - 模式2：`2A7N-2A12N`
- **错误提示**：`Invalid TIN format. Expected: 1A8N-1A12N or 2A7N-2A12N`

---

## Constitution Code 映射表（Entity Type → BNM CCRIS 标准）

> 两套映射规则的**区别**：
> - **机构映射表**：Entity Type（A–L 系统内部枚举） → Constitution Code（BNM CCRIS 报送用），解决"系统选中的实体类型在向央行报送时应填什么代码"
> - **BNM CCRIS Constitution Code 清单**：Constitution Code 全量枚举，解决"BNM 标准中一共有哪些 Constitution Code，各自含义是什么"
>
> 参考腾讯文档 Sheet「机构映射表」。

### 机构映射表（Entity Type → Constitution Code）

| Entity Type | Constitution Code | 映射说明 |
|-------------|------------------|---------|
| A（Sdn Bhd） | R - Sdn Bhd/Private Ltd | 完全匹配 |
| B（Berhad） | U - Bhd/Public Ltd Co | 完全匹配 |
| C（Branch） | 无直接映射 | 附图2无单列，实际归入 Others |
| D（Sole Prop） | S - Sole Proprietor | 完全匹配 |
| E（Partnership） | P - Partnership | 完全匹配 |
| F（Local PLT） | 无直接映射 | 实际录入时强制归入 P 或 O |
| G（Foreign LLP） | 无直接映射 | 归入 Others |
| H（Prof. LLP） | 无直接映射 | 归入 P 或 O |
| I（Virtual BE） | 无映射 | 系统占位符，附图2无对应 |
| J（Virtual Soc.） | A/C/T | 对应协会/学校/社团/合作社/工会 |
| K（Government） | G/V/W/B/H/F | 覆盖联邦政府/地方/法定机构/预算外实体 |
| L（East MY SE） | 无直接映射 | 附图2无地域维度区分，需业务决策 |

### Constitution Code 全量清单（BNM CCRIS 报送标准）

> **用途**：金融机构向马来西亚央行（BNM）提交 CCRIS 信贷数据时，对借款人法律属性进行标准化分类。
> 参考腾讯文档 Sheet「03-报送规则」。

| 机构大类 | Code | 英文描述 | 中文说明 |
|---------|------|---------|---------|
| **私营企业与个人** | I | Individual | 个人 |
| | S | Sole Proprietor | 个体户 |
| | P | Partnership | 合伙 |
| | R | Sdn Bhd | 私人有限公司 |
| | U | Bhd | 公共有限公司 |
| **政府与公共机构** | V | Federal Govt | 联邦政府 |
| | W | Local Govt | 地方政府 |
| | B | Statutory Body | 法定机构 |
| | Y | NFPE | 非金融公共企业 |
| | F | ODBE-Oth Govt | 预算外政府实体 |
| **金融与同业机构** | Q | Central Bank | 央行 |
| | E | Islamic Bank | 伊斯兰银行 |
| | D | DNFI | 开发性金融机构 |
| | K | Finance Co | 财务公司 |
| | *(另有 L/M/J 等） | Merchant Bank / Discount House / Commercial Bank | 其他持牌金融同业 |

> **注意**：持牌金融同业（Commercial Bank、Finance Co 等）虽法律主体可能是 Bhd/Sdn Bhd，但在 CCRIS 报送中**不应**映射到 B(U) — 金融业务与普通商业实体严格区分。
> **政府关联企业（GLC/NFPE）**同理 — 直接映射到 B 会丢失政府背景属性。

- **设计系统**：`rxy323-max/design-system`（GitHub）
- 所有 HTML 原型须遵循该设计系统组件规范
- UI 层次清晰，去除冗余信息
- 表单字段：`onBlur` 即时校验，错误即时反馈

---

## 文件目录说明

```
HLB-NonIndividual/
├── CONTEXT.md          ← 本文件，项目上下文（每次会话必读）
├── docs/               ← 需求文档、FSD、Word 文件
├── assets/             ← 截图、流程图、Excel、参考图
└── prototypes/         ← HTML 交互原型输出
```

---

## 待确认事项 / 遗留问题

- [ ] Constitution Code 映射中：C/Branch、G/Foreign LLP、L/East MY SE 的最终归属（归入 Others 是否有业务风险，需与 BNM 确认）
- [ ] F/H（PLT 类）的 Constitution Code 选择 P 还是 O，需与合规确认
- [ ] UBO >25% 阈值是否所有实体类型统一（尤其是 Prof. LLP 的"持证合伙人"是否特指某一阈值）
- [ ] Experian API 的 Drill-down 调用限制（最多穿透几层）
- [ ] J（Virtual Soc.）的 Constitution Code：A/C/T 三个选项如何根据 ROS 证书类型自动预填

---

## 更新记录

| 日期 | 更新内容 |
|------|---------|
| 2026-05-07 | 初始化项目上下文文件 |
| 2026-05-07 | 根据「Non-Individual_申请功能需求.docx」补充完整业务逻辑、实体类型、UBO规则、签约规则、TIN校验等 |
| 2026-05-07 | 修正"流程强串行"描述为"初步框架，动态可调"；根据腾讯文档 Sheet 补充 Constitution Code 映射表、BNM CCRIS Constitution Code 全量清单、实体类型完整维度（法律地位/债务逻辑/材料/催收路径）；更新待确认事项 |
