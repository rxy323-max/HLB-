# HLB Non-Individual 进件系统 — 需求明细文档 V2

> 版本: v2.0
> 日期: 2026-05-07
> 状态: 整合版（交互流程v2 + 业务规则 + 字段明细 + 利率/WT逻辑）
> 依据: HP Product Sales FSD + CED FSD + General Function FSD + 用户确认

---

## 第1章 文档概述与项目背景

### 1.1 项目基本信息

| 项目属性 | 值 |
|---------|---|
| 项目名称 | HP (Hire Purchase) Non-Individual 贷款申请系统 |
| 所属银行 | Hong Leong Bank (HLB) |
| 负责人 | 晓宇 |
| 开发阶段 | 设计阶段 |
| 目标上线日期 | 7月25日 |

### 1.2 业务背景

本系统用于处理非个人客户（Non-Individual）的贷款申请，涵盖多种法律实体类型的 KYC 与信贷进件流程。

**核心业务原则**：
- **流程说明**：以下流程模块是基于当前企业申请内容总结的初步框架，**并非固定不变**，实际流程可能根据业务需求与系统设计进行动态调整与联调
- **无电子签约**：Non-Individual 申请必须走线下纸质签署，不适用 E-Consent / E-Acceptance
- **签约人规则**：根据实体类型确定（详见第9章"签约人规则"）

### 1.3 设计原则

| # | 原则 | 说明 |
|---|------|------|
| 1 | **倒推法** | 从拨款所需数据倒推到信息录入，确保无遗漏 |
| 2 | **数据来源优先** | 每个字段明确来源（API抽取/手动录入/系统生成），减少录入负担 |
| 3 | **角色分层** | 主申请人（企业）、关联人（UBO/担保人）、担保人收入独立录入后自动聚合 |
| 4 | **差异化配置** | 根据实体类型自动切换字段集、必需材料清单、审批路径 |

### 1.4 文档结构说明

| 章节 | 覆盖范围 | 主要来源 |
|------|---------|---------|
| 第1章 | 文档概述与项目背景 | CONTEXT.md |
| 第2章 | 实体类型体系（A-L完整定义） | CONTEXT.md |
| **第2.5章** | **角色体系专项说明（UBO/关联人/担保人/签约人）** | **06_角色体系专项说明.md** |
| 第3章 | 完整交互流程（12个阶段） | 05_交互流程v2.md |
| 第4章 | 车辆信息与贷款方案 | 05_交互流程v2.md |
| 第5章 | 文档上传与风险审核 | 05_交互流程v2.md |
| 第6章 | 审批、拨款与CCRIS报送 | 05_交互流程v2.md |
| 第7章 | 利率定价与财务试算 | 利率_白名单_WT录入逻辑.md |
| 第8章 | WT白名单与收入认证 | 利率_白名单_WT录入逻辑.md |
| 第9章 | 系统规则、校验与合规 | CONTEXT.md + 交互流程v2.md |

---

## 第2章 实体类型体系

### 2.1 实体类型总览（12类）

> 详细字段维度请参考腾讯文档 Sheet「01-企业类型总览」。

#### 标准流程（8类）

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

---

## 第2.5章 角色体系专项说明（三大维度）

> ⚠️ **重要前置说明**：Non-Individual 进件系统中，最容易混淆的是 **UBO / 关联人 / Owner / 担保人 / 签约人** 这几个概念。
>
> 本章提供专项说明，详细定义请参考：`06_角色体系专项说明_UBO_关联人_担保人_签约人.md`

### 2.5.1 三维角色框架

所有参与者按 **三个独立维度** 分类，同一个人可以在多个维度上同时有身份：

```
第一维度：法律身份（贷款申请层面的角色）
    └─ 主申请人 / Guarantor（担保人）/ Non-Guarantor

第二维度：所有权身份（企业内部治理层面）
    └─ Owner / Partner / Shareholder / UBO（最终实益控制人）

第三维度：签约权力（谁能代表企业签合同）
    └─ Signatory（签约人）
```

> ⚠️ **关键原则**：三个维度彼此独立，**可以叠加**。同一人可同时是 Guarantor + UBO + Signatory，但三个身份各有不同的系统处理逻辑。

### 2.5.2 核心概念对照（快速参考）

| 概念 | 维度 | 是否自然人 | 报送CCRIS | 收入计入DSR |
|------|------|:---------:|:---------:|:---------:|
| **主申请人** | 法律身份 | ❌（是企业） | ✅ | ✅（企业） |
| **Guarantor** | 法律身份 | ✅ | ✅ | ✅ |
| **Non-Guarantor** | 法律身份 | ✅ | ✅ | ❌ |
| **Owner** | 所有权 | ✅ | ❌（不是UBO） | ❌ |
| **Partner** | 所有权 | ✅ | ❌ | ❌ |
| **Shareholder** | 所有权 | ❌（含法人） | ❌ | ❌ |
| **UBO** | 所有权 | ✅（必须是） | ✅ | ❌ |
| **Signatory** | 签约权力 | ✅ | ❌ | ❌ |

### 2.5.3 角色叠加举例

**Sdn Bhd（A类）最复杂场景**：

| 人 | Guarantor（法律） | UBO（所有权） | Signatory（签约） |
|----|:---------:|:---------:|:---------:|
| Director A | ✅ | ❌（不足25%） | ✅（BR授权签字） |
| Person B（持股30%） | ❌ | ✅（直接UBO） | ❌ |
| Person C（穿透持股XYZ 56%） | ✅（自愿担保） | ✅（穿透UBO） | ❌ |
| XYZ法人股东 | ❌（法人不能担保） | ❌（不是自然人） | ❌ |

**独资（D类）最简单场景**：

| 人 | Guarantor | UBO | Signatory |
|----|:---------:|:---------:|:---------:|
| 阿明（老板） | 阿明 = Owner本人（无限责任，通常不额外要求） | ✅（自动） | ✅（本人） |

### 2.5.4 UBO 识别4种模式（与2.1章节对应）

| 模式 | 适用类型 | UBO 如何产生 | 系统行为 |
|------|---------|------------|---------|
| **模式1：自动绑定** | D, E, L | Owner/Partner 自动成为 UBO，不可取消 | 系统自动标记，隐藏 UBO 录入区 |
| **模式2：职位确认** | J | 用户录入委员会成员时勾选 UBO | 显示勾选框 |
| **模式3：强穿透** | A, C, F, G, H | Drill-down 直到找到持股≥25%的自然人 | 显示树形图 + Drill-down 按钮 |
| **模式4：豁免** | B（上市）, K | 直接豁免 | 隐藏 UBO 录入区，显示豁免提示 |

### 2.5.5 系统交互核心规则（开发实现要点）

**1. UBO ≠ Shareholder**
- Shareholder 可以是法人（公司），UBO 必须是自然人
- Shareholder 只取第一层，UBO 需要穿透所有法人股东

**2. UBO ≠ Guarantor**
- UBO 是合规概念，不承担债务责任
- Guarantor 是债务担保角色，承担连带还款责任
- 一个人可以是 UBO + Guarantor（最常见：持股股东同时担保）

**3. Signatory ≠ Guarantor**
- Signatory 是法律授权签字人
- Non-Individual 必须从 BR 授权的董事/合伙人中选择
- 一个案子可以没有 Guarantor，但不能没有 Signatory

**4. 收入聚合只看第一维度**
- DSR 计算只聚合：主申请人（企业）+ Guarantor 的收入
- UBO 的收入不计入 DSR（UBO 是合规概念，不是债务人）

---

#### 特殊处理（3类）

| 类别 | 实体类型 | Constitution Code | 特殊规则 |
|------|---------|-------------------|---------|
| **I** | Virtual BE（无实体法地位） | 无映射（系统占位符） | **HP 不可办理**，前端直接隐藏此选项，引导转换为 A/D/F 类 |
| **J** | Virtual Soc.（非营利社团/协会） | A - Assoc/School/Society / C - Cooperative / T - Trade Union | 需强制委员会成员签 PG；职位确认模式 |
| **K** | Government（政府机构） | G/V/W/B/H/F（联邦/地方/法定机构） | 全面 AML 豁免白名单，免担保，跳过 UBO 识别 |

### 2.2 各实体类型的业务规则矩阵

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

### 2.3 UBO 识别 4 种模式

| 模式 | 适用类型 | 交互 |
|------|---------|------|
| 模式1：自动绑定 | D, E, L | 系统自动将 Owner/Partner 标记为 UBO，不可取消 |
| 模式2：职位确认 | J | 用户录入委员会成员时允许勾选为 UBO |
| 模式3：强穿透 | A, C, F, G, H | Drill-down 直到找到自然人，提供兜底选项 |
| 模式4：豁免/简化 | B, K | K 直接隐藏；B 展示 Top 5 股东勾选 |

---

## 第3章 完整交互流程（12阶段）

> 本章覆盖从申请入口到拨款的全流程12个阶段。每个阶段明确目标、字段、来源方式和业务规则。

---

### 阶段零：申请入口与渠道识别

**目标**：建立申请上下文，识别是直客还是渠道客户

| 步骤 | 字段 | 字段类型 | 必填 | 来源方式 | 说明 |
|------|------|---------|:----:|---------|------|
| 0.1 | 入口类型 | Select/Dropdown | Y | 枚举选择 | `Direct`（直客）/ `Dealer`（渠道） |
| 0.2 | 申请编号 | System Generated | S | 系统生成 | 格式: `NI-YYYYMMDD-XXXXX` |
| 0.3 | 渠道信息 — Branch Code | Select/Dropdown | Y | 主数据选择 | 营业部分支机构 |
| 0.4 | 渠道信息 — Channel Type | Select/Dropdown | Y | 枚举选择 | Branch / Digital / Dealer |
| 0.5 | 渠道信息 — Dealer Code | Text + Validation | C | 主数据选择 + 手动输入验证 | ⭐用户确认决策#3：系统提供主数据选择，同时允许手动输入后验证 |
| 0.6 | 渠道信息 — Reference No | Text | C | 条件必填/系统生成 | 若选择 Dealer，自动生成：`DEALERCODE-YYYYMMDD-XXXX` |
| 0.7 | 客户类型 | Radio | Y | 枚举选择 | `New`（新客）/ `Existing`（存量客户 — 可带出 CIF 资料） |
| 0.8 | Entity Type（实体类型） | Select/Dropdown | Y | 枚举选择 | 共12类，见第2章实体类型总览 |

**Entity Type 速查表**：

| Type | 名称 | Constitution Code | 特殊规则 |
|------|------|-----------------|---------|
| A | Sdn Bhd（私人有限公司） | `CP` | 担保人非强制；需穿透UBO |
| B | Berhad（公众有限公司） | `CP` | 担保人非强制；需穿透UBO |
| C | 外国分行 | `CP` | 需穿透UBO |
| D | Sole Proprietorship（独资） | `BP` | 所有Owner必须填写 |
| E | Partnership（合伙） | `BP` | 所有Owner必须填写；Partner角色 |
| F | PLT（本地有限合伙） | `LLP` | 所有Partner需加为Guarantor |
| G | PLT（外国有限合伙） | `LLP` | 所有Partner需加为Guarantor |
| H | PLT（专业有限合伙） | `LLP` | 律师/会计等专业机构 |
| I | Virtual BE（虚拟，仅活跃） | — | 极少用 |
| J | 社团 | `OA/OR` | 需确定Constitution |
| K | 政府 | `OR` | 通常豁免UBO穿透 |
| L | 东马特殊企业 | 按实 | 需进一步确认类型 |

---

### 阶段一：企业身份识别与合规查询

**目标**：通过企业注册号识别企业身份，触发后端API拉取SSM资料

| 步骤 | 字段 | 字段类型 | 必填 | 来源方式 | 校验规则 | 说明 |
|------|------|---------|:----:|---------|---------|------|
| 1.1 | SSM Registration No / Business Registration No | Text + OCR | Y | 手动录入 + OCR辅助 | 格式校验 | 录入后触发 SSM 验证 |
| 1.2 | 企业名称（Entity Name） | Read-Only Display | S | API自动填充 | — | SSM验证后带回 |
| 1.3 | 注册地址 | Read-Only Display | S | API自动填充 | — | SSM验证后带回 |
| 1.4 | Entity Type | Select/Dropdown | Y | 枚举选择（预填来自阶段0.8） | — | 确认/修改 |
| 1.5 | Constitution Code | Select/Dropdown | Y | 系统自动映射 | — | 根据 Entity Type 自动推荐，可手动覆盖 |
| 1.6 | BNM CCRIS Entity Category | Read-Only Display | S | 系统自动填充 | — | 根据 Constitution Code 映射 |
| 1.7 | SSM 验证状态 | Read-Only Display | S | 系统显示 | — | Pass / Warning / Fail |
| 1.8 | CIF Profile 查询（ETB/NTC） | System Generated | S | HOST API 自动 | — | 区分新客/存量客户，带出基本信息 |
| 1.9 | HP Line 查询 | System Generated | C | BCB Source API | — | 命中时弹窗选择普通案件或HP Line案件 |

**Constitution Code × BNM CCRIS Category 映射规则**：

| Constitution Code | BNM CCRIS Category Code | 说明 |
|------------------|------------------------|------|
| `CP` | `02`（公司） | Sdn Bhd / Berhad / 外国分行 |
| `BP` | `01`（商业） | Sole Prop / Partnership |
| `LLP` | `07`（LLP） | 本地/外国/专业PLT |
| `OA` | `03`（机构） | 社团/其他机构 |
| `OR` | `03`（机构） | 政府/法定机构 |

---

### 阶段二：企业基本信息录入

**目标**：补充 SSM 以外的企业信息

| 分类组 | 字段组 | 关键字段 | 来源 |
|--------|--------|---------|------|
| Enterprise Identity Overview | SSM 注册信息 | Registration No, Name, Entity Type | API（阶段1） |
| Company Profile | 公司概况 | 成立日期、实缴资本、股东总数、雇员人数 | 手动录入 |
| Address & Contact | 地址联系 | 注册地址、通讯地址、联系电话、邮箱 | API（地址可修改） |
| Regional & Tax | 地域税务 | SSM 州区域、报税状态、TIN、SST、Tourism Tax | 手动录入 |
| Compliance Review | 合规确认 | 是否在黑名单、PEP筛查 | 系统查询 |

**数据来源总结**：
- `Experian API`：董事、股东、注册资料
- `HOST CIF`：ETB客户基本信息
- `SSM 验证`：注册号、名称、地址
- `手动录入`：其余字段

**Step 1 必填字段组补充**（来自CONTEXT.md核心流程模块）：

| 字段 | 字段类型 | 必填 | 说明 |
|------|---------|:----:|------|
| ID Type1 + ID No. | Select/Dropdown + Text | Y | 默认 SSM ID；若为 SSM ID，则 ID Type2 必填用于 CIF 查询 |
| New Business Registration No. | Text | Y | 强制格式：2字母+7数字+1字母，如 AB1234567C |
| Company Name | Read-Only Display | S | 来自 SSM |
| Establishment Date | Date | Y | 日期选择，允许修正 |
| Nature of Business | Cascading Select | Y | Group → Code → Full MSIC Code 三级联动 |
| TIN | Text | Y | 强制格式校验 onBlur，支持两种模式（详见9.3节） |
| Bumiputera Status | Radio | Y | Yes/No |

---

### 阶段三：UBO穿透识别 ⭐核心规则

**目标**：识别最终实益控制人，确保合规穿透

#### 3.1 自动抽取（Experian API）

| 字段 | 字段类型 | 数据来源 | 说明 |
|------|---------|---------|------|
| Active Directors | List (System Fetched) | Experian API — Option CP/BP/LLP | 活跃董事列表 |
| Individual Shareholders > 25% | List (System Fetched) | Experian API | 持股>25%的个人股东 |
| Corporate Shareholders | List (System Fetched) | Experian API | 法人股东 |

**API调用逻辑**：
- `Private Ltd`（A/B/C）→ Option `CP`
- `Sole Prop/Partnership`（D/E）→ Option `BP`
- `PLT`（F/G/H）→ Option `LLP`

#### 3.2 树形图展示（Tree Diagram）

系统以**树形图**展示股东结构：

```
[ABC Sdn Bhd]（申请企业）
├── [Director A] — 持股10%
├── [Director B] — 持股10%
├── [Shareholder C] — 持股40%
│   └── [Sub-Co Sdn Bhd]（法人股东）← 需手动穿透
│       └── [Person X] — 持股100%
└── [Director D] — 持股40%
```

#### 3.3 手动穿透（Manual Drill-Down）

> ⚠️ **重要**：受 Experian API 限制，无法自动穿透法人股东

**穿透规则**：
- 若法人股东持股>25%，**必须手动钻取**其下一层股东
- 操作：点击法人股东节点 → 手动输入该公司的股东信息
- 可重复穿透：第二层 → 第三层 → 第四层，直到找到最终个人UBO
- 每层穿透均需录入：`姓名 + ID + 持股比例 + 持股公司`

**Experian 树状图（Drill-down）交互细节**（来自CONTEXT.md）：
1. 展示第一层股东（Individual + Corporate）
2. Corporate 股东右侧提供 `[⊕ Drill-down]` 按钮
3. 点击后弹窗输入公司 SSM ID，再次拉取下一层
4. 树状缩进展示，直到找到 >25% 自然人
5. 每个 Individual 股东旁提供 `[Set as UBO]` 勾选框

#### 3.4 UBO 确认

- 从树形图中选择持股>25% 的**最终个人股东**作为 UBO
- 或选择"豁免"（满足豁免条件）
- 或选择 `Customize` 手动输入 UBO 信息
- UBO字段：`姓名 + ID Type + ID Number + 持股比例 + 穿透路径`

**UBO 标签**：Ultimate Beneficial Owner — 最终实益控制人

#### 3.5 豁免条件

| 豁免场景 | 说明 |
|---------|------|
| 政府机构 | Entity Type = K（政府） |
| 上市公司 | Berhad（A类+B类中的上市公司） |
| 持牌金融机构 | 具有金融牌照的机构 |

---

### 阶段四：关联人管理（Other Applicants）

**目标**：添加担保人/非担保人联合申请人

#### 4.1 角色类型定义

| Relationship to Primary | 适用实体类型 | 角色说明 |
|------------------------|------------|---------|
| **Guarantor** | 所有类型 | 个人担保人（强制/非强制见下方规则） |
| **Guarantor / Director / Shareowner** | A/B/C/D/E/F/G/H | 同时担任多角色 |
| **Director (Non-Guarantor)** | A/B/C | 仅董事不担保 |
| **Director / Shareowner (Non-Guarantor)** | A/B/C | 董事兼股东但不担保 |
| **Partner / Partner of Partnership** | E/F/G/H | 合伙人（E类必填） |
| **Owner / Sole Proprietorship** | D | 独资老板 |
| **Shareowner** | A/B/C | 股东 |
| **Ultimate Beneficial Owner (UBO)** | A/B/C | UBO角色 |

#### 4.2 实体类型 × 担保要求

| 实体类型 | 担保要求 | 依据 |
|---------|---------|------|
| **A/B/C（Sdn Bhd / Berhad / 外国分行）** | 非强制；通常用一名董事作担保人 | HP Product FSD |
| **D（独资）** | Owner 自动作为主申请人 | — |
| **E（合伙）** | **所有 Owner 必须填写**（作为担保人） | HP Product FSD |
| **F/G/H（PLT类）** | **所有 Partner 需加为 Guarantor** | HP Product FSD |

#### 4.3 关联人录入流程

```
添加关联人
    │
    ▼
[身份查询] — 输入 IC / Passport → 查询 CIF → 带出基本信息
    │
    ├─ ETB客户：自动带出姓名、证件、联系方式
    └─ NTC客户：手动录入
    │
    ▼
[角色选择] — 选择 Relationship to Application
    │
    ▼
[后端信息查询]（6项，仅担保人走全部查询）
    ├─ CIF Profile（所有申请人）
    ├─ WT Whitelist（仅担保人）— 查询豁免收入资格
    ├─ Income DB（仅担保人）— 获取历史收入
    ├─ App History（所有申请人）
    ├─ Pre-Consent（所有申请人）
    └─ HP Line（仅主申请人）
    │
    ▼
[新增关联人到申请人列表]
    │
    ▼
[重复以上步骤添加下一个关联人]
```

#### 4.4 复用逻辑（⭐用户确认决策#1 / 设计决策#1）

> **HP Product FSD 原文**：
> "每次添加新申请人都需要**复用上述提到的个人或非个人客户身份查询模块**。"

**复用设计**：
- 同一企业法人/股东/董事信息**可在同一企业档案中复用**
- 若同一关联人（姓名+证件号一致）在系统中已存在，直接带出历史信息
- 不同贷款申请：关联人信息**每笔贷款重新录入**（但可从历史档案快速复制）
- 担保人状态独立维护（`Primary` / `Guarantor`），变更有审计日志

#### 4.5 年龄限制

| 角色 | 年龄限制 | 说明 |
|------|---------|------|
| **Guarantor** | ≥ 18 且 ≤ 75 | 硬性限制 |
| **UBO** | 建议 ≥ 18 | 无硬性限制 |

---

### 阶段五：收入信息录入

**目标**：录入主申请人（企业）和担保人收入，用于DSR计算

#### 5.1 收入聚合规则

| 优先级 | 来源 | 适用对象 | 说明 |
|:-----:|------|---------|------|
| 1 | HLB ETB Income API | 主申请人 + 担保人 | 输入身份信息时自动查询；含雇主信息和收入 |
| 2 | WT Income API | 担保人（白名单豁免） | 第二优先级 |
| 3 | 手动录入（11种计算器） | 所有需补充收入的申请人 | 见下方计算器清单 |

**聚合规则**：
- 主申请人 + 担保人收入 → **自动聚合**计算DSR
- 其他角色（Non-Guarantor）：不需要录入收入
- 系统独立维护每个申请人的状态

#### 5.2 11种收入计算器

| # | 计算器类型 | 数据来源 | 适用场景 |
|---|-----------|---------|---------|
| 1 | 银行流水计算器 | 6个月银行流水（OCR） | 流水收入验证 |
| 2 | Form B 计算器 | 公司Form B | 企业净利润 |
| 3 | EA Form 计算器 | 雇主EA Form | 雇员收入 |
| 4 | EC Form 计算器 | 雇员委员会EC | 雇员佣金/奖金 |
| 5 | NOA 计算器 | 税务局NOA | 税局确认收入 |
| 6 | 工资单计算器 | 3个月工资单 | 固定雇员收入 |
| 7 | EPF Statement 计算器 | EPF结单 | 退休金积累推算 |
| 8 | Commission Calculation | 佣金收入文件 | 浮动收入 |
| 9 | Rental Income 计算器 | 租赁协议 | 租金收入 |
| 10 | Dividend Income 计算器 | 股息记录 | 股息收入 |
| 11 | Trust Income 计算器 | 信托文件 | 信托收入 |

#### 5.3 银行流水交叉验证（OCR特殊规则）

| 验证场景 | 规则 |
|---------|------|
| 工资流水 | 比较工资单/佣金单中的 `Net` 数字是否在当月银行流水中找到 |
| EA + CP58 冲突 | 若同时提交EA Form + CP58，验证雇主名称是否相同；不同则弹窗让Sales选择信任哪个 |
| 收入采纳 | Sales决定：接受OCR结果 或 手动输入最终收入值 |

**Step 3 财务字段补充**（来自CONTEXT.md核心流程模块）：

| 字段 | 字段类型 | 必填 | 说明 |
|------|---------|:----:|------|
| 近 2 年营业额 Actual | Number | Y | — |
| 近 2 年营业额 分层区间 | Select/Dropdown | Y | — |
| 员工数 Actual | Number | Y | — |
| 员工数 分层区间 | Select/Dropdown | Y | — |
| 利润率 | Number | C | — |
| 授权资本 | Number | C | — |
| 实缴资本 | Number | C | — |
| 主要收入证明 | File Upload | C | — |
| 还款来源 | Text | Y | — |
| 月净申报收入 | Number (Calculator) | Y | 计算器得出 |

**Step 3 合规字段补充**（来自CONTEXT.md核心流程模块）：

| 字段 | 字段类型 | 必填 | 说明 |
|------|---------|:----:|------|
| PEP 检查 | Radio | Y | 政治公众人物 Yes/No |
| RCA 检查 | Radio | Y | PEP 关联人 Yes/No |
| UBO 无法识别兜底选项 | Checkbox | C | — |
| 高风险特征 | Checkbox | C | 代理股东/不记名股等 |
| KYC 方式 | Select/Dropdown | Y | — |
| 联系记录 | Text | C | — |
| 客户意愿确认 | Checkbox | Y | — |

---

## 第4章 车辆信息与贷款方案

---

### 阶段六：车辆信息录入

**目标**：选择车辆并录入车辆信息，用于LTV计算和BNM报送

#### 6.1 分步选择（⭐用户确认决策#2 / 设计决策#2）

> 车辆选择：**分步选择（品牌 → 车型 → 变体）**

| 步骤 | 操作 | 字段类型 | 数据来源 |
|------|------|---------|---------|
| 6.1 | 选择品牌（Brand） | Select/Dropdown + Search | FIS 数据库 — 下拉选择 |
| 6.2 | 选择车型（Model） | Select/Dropdown + Search | FIS 数据库 — 根据品牌筛选 |
| 6.3 | 选择变体（Variant） | Select/Dropdown + Search | FIS 数据库 — 根据车型筛选 |
| 6.4 | 选择年份（Year） | Select/Dropdown | FIS 数据库 — 根据变体筛选 |
| 6.5 | 车辆说明（Description） | Read-Only Display | 系统自动组合：`Brand + Model + Variant + Year` |

**支持关键词搜索**：在品牌/车型选择器中提供搜索框，支持按关键词过滤

#### 6.2 车辆附加信息

| 字段 | 字段类型 | 来源 | 说明 |
|------|------|---------|------|
| BNM 车辆分类 | Read-Only Display | 系统自动 | 依据车辆类型（Sedan/SUV/LCVC/其他） |
| 绿色车辆标识 | Checkbox | 系统自动 | 符合环保标准的车辆标记 |
| 车辆指导价（Indicative Price） | Read-Only Display | FIS 数据库 | LTV计算基础 |
| LTV（贷款成数） | Read-Only Display (Calc) | **系统计算** | 指导价 × LTV% |
| VIN（车架号） | Text | 手动录入 | 17位车架号 |
| 发动机号 | Text | 手动录入 | — |
| 车险信息 | Text | 手动录入 | 保险单号、保险公司 |
| 车龄 | Read-Only Display (Calc) | 系统计算 | 当前年份 - 出厂年份 |

#### 6.3 BNM 车辆分类与 LTV 上限

| BNM Category | 说明 | LTV上限参考 |
|-------------|------|------------|
| Sedan | 轿车 | 90% |
| SUV | 运动型多用途车 | 90% |
| LCVP（轻型商用车） | 轻型客货车 | 85% |
| HCVP（重型商用车） | 重型商用车 | 80% |
| 其他 | 特种车辆 | 按实 |

---

### 阶段七：贷款方案与产品信息

**目标**：选择产品方案，手动录入利率，试算DSR

#### 7.1 产品方案选择

| 方案类型 | 说明 | 费用结构 |
|---------|------|---------|
| **HP**（Hire Purchase） | 标准分期付款 | 利率 + 手续费 |
| **HP+Plus** | HP增强版，含额外服务包 | 利率 + 服务包费用（自动汇总） |
| **Lease**（融资租赁） | 资产所有权归租赁公司 | 租金计算方式不同 |

#### 7.2 利率录入（⭐用户确认决策#5 / 设计决策#5）

> **利率：销售可手动录入**

| 字段 | 字段类型 | 说明 | 录入方式 |
|------|---------|------|---------|
| 贷款金额（Loan Amount） | Number | — | 用户输入 |
| 贷款期限（Tenure） | Number | — | 用户输入（月份） |
| **EIR（有效利率）** | Number | 销售手动录入 | **手动输入** |
| 名义利率（NPR） | Read-Only Display | **系统逆向计算** | 根据EIR自动算 |
| BLR + Spread | Read-Only Display | **系统逆向计算**（浮动利率） | 根据EIR算Spread |
| 伊斯兰融资利率 | Read-Only Display | **系统逆向计算** | 根据EIR算 |
| 头期款（Down Payment） | Number | 手动录入或系统推荐 | 用户输入 |
| **月供金额（Instalment）** | Read-Only Display (Calc) | **系统计算** | 基于贷款参数计算 |

**利率逆向计算引擎**：
- 输入 EIR → 自动算出名义利率
- 输入 BLR + Spread → 自动算出 EIR
- 伊斯兰利率独立计算逻辑

#### 7.3 DSR 试算（前端实时计算）

| 指标 | 计算公式 | 通过阈值 |
|------|---------|---------|
| DSR（债务收入比） | （月供 + 其他债务）/ 月收入 | ≤ 60%（参考值） |
| LTV（贷款成数） | 贷款金额 / 车辆指导价 | ≤ 90% |
| 净收入 | 总收入 - 固定支出 | > 0 |

#### 7.4 财务试算结果展示

系统展示试算结果：
- 每月还款额
- 总利息支出
- 贷款期限
- DSR评分（颜色标识：绿/黄/红）
- LTV评分（颜色标识）

---

## 第5章 文档上传与风险审核

---

### 阶段八：文档上传与AI识别

**目标**：上传必需材料，AI OCR自动分类和提取，系统交叉验证

#### 8.1 必需材料清单（按实体类型差异化）

| 材料 | Sdn Bhd | Berhad | Partnership | PLT | Sole Prop |
|------|:-------:|:------:|:-----------:|:---:|:---------:|
| SSM 注册文件 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 董事/合伙人证件 | ✅ | ✅ | ✅ | ✅ | — |
| UBO证件 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 担保人证件 | 条件 | 条件 | ✅ | ✅ | ✅ |
| 企业银行流水（6个月） | ✅ | ✅ | ✅ | ✅ | ✅ |
| Form B（近2年） | 条件 | ✅ | ✅ | ✅ | ✅ |
| EA Form（担保人） | 条件 | 条件 | ✅ | ✅ | ✅ |
| 公司章程（M&A） | ✅ | ✅ | — | 条件 | — |
| Partnership Agreement | — | — | ✅ | 条件 | — |
| TIN Certificate | ✅ | ✅ | ✅ | ✅ | ✅ |
| SST Certificate | 条件 | 条件 | 条件 | 条件 | 条件 |
| Tourism Tax License | 条件 | 条件 | 条件 | 条件 | 条件 |
| 车辆发票/报价单 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 车险文件 | ✅ | ✅ | ✅ | ✅ | ✅ |
| e-Consent 签署记录 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 地址证明 | ✅ | ✅ | ✅ | ✅ | ✅ |

#### 8.2 AI OCR 处理流程

```
上传文档
    │
    ▼
[AI 自动分类] — 按文档类型自动归类（ID / 银行流水 / 工资单 / Form B...）
    │
    ▼
[OCR 识别] — Gemini MultiModal MLM 提取结构化字段
    │
    ▼
[交叉验证]
    ├─ 证件信息 vs 录入信息 → 字段匹配验证
    ├─ 地址信息跨文档一致性验证
    ├─ 收入字段：工资单Net vs 银行流水当月入账
    └─ EA Form + CP58：雇主名称一致性检查
    │
    ▼
[异常处理]
    ├─ 格式异常 / 加密文件 / 损坏文件 / 反伪造检测
    ├─ 字段值不匹配 → 弹窗让Sales确认采纳哪个
    └─ 文档冲突 → 弹窗让Sales选择
    │
    ▼
[收入采纳决策] — Sales 决定：接受OCR结果 或 手动输入
    │
    ▼
[材料清单确认] — 基于矩阵规则，明确最终材料情况
```

---

### 阶段九：风险引擎自动审核

**目标**：系统自动执行多层级风险检查，输出通过/拒绝/需人工判断

#### 9.1 审核层级（按顺序执行）

```
[1] HLB 硬性规则检查
    ├─ 年龄限制（主申请人/Guarantor）
    ├─ Entity Type + 产品组合限制
    ├─ LTV上限（车辆分类 × 实体类型）
    ├─ DSR上限
    └─ 禁止行业/客户名单

[2] AML / SIRON 合规检查
    ├─ PEP 筛查
    ├─ 黑名单/制裁名单核查
    ├─ 高风险地区/行业
    └─ 可疑交易模式识别

[3] CCRIS / CTOS 信用报告
    ├─ 主申请人信用记录
    ├─ Guarantor 信用记录（单独查询）
    └─ UBO/关联人信用记录（若适用）

[4] CMSS（担保人评分系统）
    ├─ 担保人收入验证
    ├─ 担保人信用评分
    └─ 担保能力评估

[5] AIP（自动审批指标）
    ├─ 自动评分卡
    ├─ 定价等级
    └─ 建议利率区间

[6] FMU（车辆融资单元）
    ├─ 车辆残值评估
    ├─ 车龄限制
    └─ 车辆状态核查
```

#### 9.2 审核结果

| 结果 | 状态码 | 后续动作 |
|------|--------|---------|
| ✅ 自动通过 | `Approve` | 进入 CED 审批 |
| ❌ 自动拒绝 | `Reject` | 显示拒绝原因，不可进入人工审批 |
| ⚠️ 需人工判断 | `Manual Review` | 进入 CED 工作台 |

---

## 第6章 审批、拨款与CCRIS报送

---

### 阶段十：CED 信用评估与审批

**目标**：人工审批（含分级审批），使用辅助工具

#### 10.1 CED 工作台面板

| 面板 | 内容 |
|------|------|
| 客户面板 | 企业概况 + 关联人列表 + 收入汇总 |
| **收入面板** | 收入来源（分类展示）+ 收入计算器结果 |
| 抵押品面板 | 车辆信息 + 估值 + LTV |
| 风险面板 | 风险引擎结果 + 评分卡 |
| **审批结论** | Approve / Reject / Refer + 原因记录 |

#### 10.2 分级审批规则

| 职位 | 审批权限 |
|------|---------|
| Sales Officer | 提交申请 |
| Sales Manager | ≤ 审批阈值金额 |
| Branch Manager | 中等金额 |
| Regional Manager | 高金额 |
| Credit Manager | 最高权限 |

**25个审批代码组**：根据金额、风险等级、产品类型组合确定所需审批层级

---

### 阶段十一：BNM CCRIS 报送

**目标**：生成合规报送数据，覆盖实体、车辆、贷款、UBO信息

#### 11.1 CCRIS 报送字段（核心）

| 分类 | 字段 | Constitution Code映射 | 数据来源 |
|------|------|---------------------|---------|
| 实体标识 | Entity Name + Registration No | 根据Entity Type | 阶段1/2 |
| CCRIS Category | BNM Category Code | 自动映射 | 阶段1 |
| Constitution Code | Constitution Code | 系统推荐 | 阶段1 |
| UBO 信息 | UBO Name + ID + 持股比例 | — | 阶段3 |
| 车辆信息 | VIN + 车辆分类 | — | 阶段6 |
| 贷款信息 | 贷款金额 + 期限 + 利率 | — | 阶段7 |
| ESG 评分 | ESG Score | — | 系统计算 |

---

### 阶段十二：拨款流程

**目标**：STP/CRA 审查 → 账户创建 → 合同签署 → 拨款

#### 12.1 签署顺序

```
[Phase 1] 主申请人
    → 身份证认证（ID card authentication）
    → 音频指纹识别（Audio fingerprint recognition）

[Phase 2] 所有 Guarantor（顺序由Officer自选）
    → 身份证认证
    → 音频指纹识别

[Phase 3] Contract Signing Confirmation（Portal）
    → 客户在Portal点击Submit
    → 提示："Your bank officer will now scan your thumbprint"
```

#### 12.2 含担保人案件的签署规则

> HP Product FSD 原文：
> "Applications including a guarantor are automatically converted to a **manual process**."

| 场景 | 流程类型 |
|------|---------|
| 仅主申请人（无担保人） | 电子流程（支持Portal签署） |
| 含担保人 | **手动流程**（必须线下/当面签署） |

#### 12.3 e-Hakmilik 签署内容

- 申请人状态（主申请人+担保人）
- 同意/接受/e-Hakmilik 登记
- 申请人（主申请人+担保人）
- 车辆信息（卖方+车型）
- 贷款信息（贷款金额+购车价格）
- 分行+客户经理

---

### 异常处理与催收路径

#### A. 数据异常
- SSM 验证失败 → 弹窗提示，允许手动覆盖（需备注）
- 证件 OCR 识别失败 → 提示手动输入
- Experian API 超时 → 提示重试或手动录入

#### B. 审核异常
- 硬性规则拒绝 → 显示拒绝代码，不允许继续
- 需人工判断 → 挂起，进入 CED 人工审批队列
- CED 重运行 → 触发条件变更后重新跑风险引擎

#### C. 合同签署异常
- 担保人未完成签署 → 全案挂起
- 电子签署失败 → 自动切换手动流程
- e-Consent 超时 → 催办提醒

---

### 数据来源总览

| 数据来源 | 支持功能 | 关键字段 |
|---------|---------|---------|
| **SSM 验证** | 阶段1 | 企业名称、注册号、注册地址 |
| **HOST CIF** | 阶段1 | ETB客户基本信息 |
| **Experian API** | 阶段3/4 | 董事、股东、持股比例 |
| **BCB Source** | 阶段1 | HP Line 查询 |
| **e-Consent** | 阶段4/8 | 预同意签署记录 |
| **CrediOS WT Whitelist** | 阶段4/5 | 豁免收入资格（仅Guarantor） |
| **HLB Income API** | 阶段5 | 历史收入数据（Gross/Net） |
| **FIS 数据库** | 阶段6 | 车辆品牌/车型/变体/指导价 |
| **Gemini OCR** | 阶段8 | 文档字段自动提取 |
| **SIRON AML** | 阶段9 | 黑名单/PEP筛查 |
| **CCRIS/CTOS** | 阶段9 | 信用报告 |
| **CMSS** | 阶段9 | 担保人评分 |
| **AIP** | 阶段9 | 自动审批评分卡 |
| **FMU** | 阶段9 | 车辆残值 |
| **手动录入** | 所有阶段 | 销售根据实际情况录入 |

---

## 第7章 利率定价与财务试算

> 来源: CrediOS FSD HP Product Sales V2.3 (2026-01-16), Section 4.12 Loan Program Entry

### 7.1 利率录入方式概述

| 属性 | 值 |
|------|---|
| 录入模式 | 销售可手动录入利率 |
| 系统自动推荐 | 是 — 系统提供**利率逆向计算引擎 (Interest Rate Back Calculation Engine)** 自动计算 |

### 7.2 利率逆向计算引擎 (Section 4.12.4)

**触发机制**: 当 EIR (有效利率) 字段发生变化时 (OnBlur 或实时计算)，系统自动根据利率类型和贷款/融资类型逆向计算并显示名义利率。

| 场景条件 | 输入值 | 逆向计算输出字段 | 业务含义 |
|---------|--------|----------------|---------|
| **固定利率** (Regular Fixed) | EIR | 固定利率 (Fixed Interest Rate) | 客户通常理解的"利息" |
| **浮动利率** (Regular Floating) | EIR | 利差 (Spread) | Spread = EIR - 基准利率<br/>显示结构: BLR [3.0%] + Spread [1.5%] |
| **伊斯兰融资利率** | EIR | 伊斯兰融资利率 | 伊斯兰金融专用签约利润率 (通常等于 APR) |

### 7.3 利率校准定义与算法标准 (Section 4.12.5)

系统需要支持多套利率基准并行计算，以满足内部定价、客户展示和向央行 (BNM) 监管报告的不同需求。

| 利率期限 (Term) | 适用场景 (Usage) | 计算/值获取逻辑 | 说明 |
|----------------|-----------------|----------------|------|
| **利率 (BNM CIR)** | BNM 监管报告 | 基于固定利率或利润率的名义利率 | 向央行报送 |
| **APR** | 利息和月供计算 | 包含: 补贴<br/>排除: 补贴、保留金额、手续费 | 未来 HPAA 实施后将由 EIR 替代 |
| **EIR (系统)** | 衡量银行实际收益率 (含费用收入) | 包含: 补贴<br/>排除: 补贴、保留金额、手续费 | 系统内部使用 |
| **BNM EIR** | 央行监管报告 | 排除: 补贴、保留金额、手续费 | 必须符合央行规定 |

### 7.4 价格判断逻辑 (Section 4.12.3)

**利率输入与验证**：
1. **激活输入框**: 前端进行最大最小利率验证
2. **NON-STP 判断**: 根据是否为 NON-STP 进行判断
3. **浮动利率场景**: 实时计算浮动利率的 Spread

**三档提示信息**：

| 情况 | 提示类型 | 提示内容 |
|------|---------|---------|
| 标准自动审批 (NON-STP) | 标准提示 | 标准自动审批 (NON-STP) ≥ cc.cc% |
| 需要额外价格审批 | 错误提示（允许提交） | 您当前提交的利率价格需要额外价格审批 |
| 无法提交 | 错误信息 | 不得低于 dd.dd%，或高于 ee.ee% |

### 7.5 HP+Plus 产品费用结构 (Section 4.12.2)

如果销售人员选择 HP+Plus 产品，系统自动汇总对应费用项目：

| 费用名称 | 频率 | 金额 |
|---------|------|------|
| Maintenance Fee（维护费） | 月度 | （待配置） |
| Processing Fee（处理费） | 单次 | （待配置） |
| Setup Fee（设置费） | 单次 | （待配置） |

### 7.6 财务试算字段定义 (Section 4.12.6)

基于上述利率和贷款本金，系统自动计算以下指标，试算后需保留月供和还款计划。

**默认试算规则**:
- 如果贷款发放日为当天，还款日为下月对应日 (或下月最后一天)
- 贷款发放日也可由销售人员在页面指定

| 字段 | 定义 |
|------|------|
| Tenure | 期限（月） |
| Period | 期数 |
| Repayment Day | 还款日 |
| Repayment Date | 还款日期 |
| Rate | 年利率（EIR 计算） |
| Calculation Method | 两位数法（使用利率计算）/ 余额递减法（使用 EIR 计算） |

---

## 第8章 WT白名单与收入认证

> 来源: CrediOS FSD HP Product Sales V2.3, Section 4.5 & 4.9

### 8.1 WT Whitelist 概述

**WT Whitelist** 是 CrediOS 系统中的一个功能，用于查询白名单资格（豁免收入认证）。

### 8.2 收入数据来源优先级

| 优先级 | 服务名称 | 数据来源 | 特殊逻辑 | 业务说明 |
|:-----:|---------|---------|---------|------|
| 1 | CIF Profile | HOST | 区分现有客户 (ETB)/新客户 (NTB)，获取基本信息 | 如果获取失败/超时，新客户允许手动录入 |
| 2 | **WT Whitelist** | **CrediOS** | **查询白名单资格（豁免收入认证）** | 如果不在白名单中，则需要标准提交流程 |
| 3 | Income DB | HLB API | 获取在线历史收入数据 (Gross/Net) | 字段留空，需手动录入 |
| 4 | App History | CrediOS | 查询该 ID 作为主申请人的历史汽车贷款申请记录 | 不显示历史记录部分 |

### 8.3 豁免条件

**WT Whitelist 豁免收入的条件**:
- 客户在 CrediOS 系统的白名单中
- 白名单客户无需提交标准收入证明材料

**非白名单客户**:
- 需要进行标准提交
- 必须提供收入证明文件

### 8.4 担保人收入特殊规则

| 收入来源 | 适用对象 | 说明 |
|---------|---------|------|
| WT Whitelist | **仅适用于担保人** | 查询担保人的白名单资格 |
| Income DB | **仅适用于担保人** | 获取担保人的历史收入数据 |
| CIF Profile | 主申请人/担保人 | 区分 ETB/NTB |

### 8.5 WT Income 处理流程

1. **WT Income API 查询**: 查询 HLB Proxy Income API
   - 如果可用，返回数据并标记来源 (WT Income)
2. **手动录入**: 如果 API 不可用或销售选择不使用现有数据，允许手动录入收入数据
3. **数据复用**: 单个客户如有多笔符合条件的收入记录，销售可手动选择是否复用现有收入数据

### 8.6 收入数据三层结构

| 层级 | 说明 |
|------|------|
| **Level 1: Case Level** | 主申请人和担保人的收入信息分别录入，收入统一计入客户收入 |
| **Level 2: Applicant Level** | 每个申请人可按以下细粒度录入收入信息 |
| **Level 3: Classification** | 用户可上传不同材料，系统按不同分类汇总 |

**最终目标**: 计算客户的总收入 (Gross Income) 和净收入 (Net Income)，供风控方分析客户的收入负债比，决定最终可批准贷款金额。

---

## 第9章 系统规则、校验与合规

### 9.1 签约人规则（Signatory for LOU/Agreement）

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

### 9.2 预填数据修改权限表

| 数据项 | 修改权限 | 说明 |
|-------|---------|------|
| ID Type + ID No.（核心标识符） | **Read-Only** | 填错只能废弃申请重录 |
| Company Name | **Read-Only** | 必须与 SSM 数据一致 |
| Registered Address | **Read-Only** | 来自 Experian |
| Business/Office Address | 可修改 | 默认复制注册地址，允许 Sales 手工修改 |
| Directors/Shareholders 名单 | 可添加/覆盖 | 手动 Override 时系统记录日志 |

### 9.3 TIN 校验规则

| 属性 | 值 |
|------|---|
| **校验时机** | `onBlur`（失去焦点）+ 提交时兜底 |
| **格式模式1** | `1A8N-1A12N`（如 AB1234567C） |
| **格式模式2** | `2A7N-2A12N` |
| **错误提示** | `Invalid TIN format. Expected: 1A8N-1A12N or 2A7N-2A12N` |

### 9.4 Constitution Code 映射表

#### 机构映射表（Entity Type → Constitution Code）

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

#### Constitution Code 全量清单（BNM CCRIS 报送标准）

> **用途**：金融机构向马来西亚央行（BNM）提交 CCRIS 信贷数据时，对借款人法律属性进行标准化分类。

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
| | *(L/M/J 等)* | Merchant Bank / Discount House / Commercial Bank | 其他持牌金融同业 |

> **注意**：持牌金融同业（Commercial Bank、Finance Co 等）虽法律主体可能是 Bhd/Sdn Bhd，但在 CCRIS 报送中**不应**映射到 B(U) — 金融业务与普通商业实体严格区分。
> **政府关联企业（GLC/NFPE）**同理 — 直接映射到 B 会丢失政府背景属性。

---

### 9.5 待确认事项 / 遗留问题

| # | 待确认事项 | 优先级 |
|---|-----------|--------|
| 1 | Constitution Code 映射中：C/Branch、G/Foreign LLP、L/East MY SE 的最终归属（归入 Others 是否有业务风险，需与 BNM 确认） | 高 |
| 2 | F/H（PLT 类）的 Constitution Code 选择 P 还是 O，需与合规确认 | 高 |
| 3 | UBO >25% 阈值是否所有实体类型统一（尤其是 Prof. LLP 的"持证合伙人"是否特指某一阈值） | 中 |
| 4 | Experian API 的 Drill-down 调用限制（最多穿透几层） | 中 |
| 5 | J（Virtual Soc.）的 Constitution Code：A/C/T 三个选项如何根据 ROS 证书类型自动预填 | 低 |

### 9.6 5项设计决策答案汇总

| # | 决策点 | 结论 | 来源 |
|---|--------|------|------|
| 1 | 关联人复用 | 同一企业档案可复用；不同贷款**每笔重新录入**（从档案快速复制） | HP Product FSD §4.8 |
| 2 | 车辆选择 | **分步选择**（品牌→车型→变体），支持关键词搜索 | 用户确认 |
| 3 | 经销商代码 | **主数据选择** + 允许手动输入后验证 | 用户确认 |
| 4 | UBO穿透 | API自动抽取董事/股东 → 树形图展示 → **手动drill-down穿透**法人股东多层 | HP Product FSD §4.8.5 |
| 5 | 利率定价 | **销售可手动录入**；系统提供利率逆向计算引擎作为辅助 | HP Product FSD §4.12 + 用户确认 |

### 9.7 关键术语对照表

| 英文术语 | 中文含义 |
|---------|---------|
| Interest Rate Back Calculation Engine | 利率逆向计算引擎 |
| EIR (Effective Interest Rate) | 有效利率 |
| APR (Annual Percentage Rate) | 年化利率 |
| BNM (Bank Negara Malaysia) | 马来西亚央行 |
| BLR (Base Lending Rate) | 基准贷款利率 |
| SBR (Standardised Base Rate) | 标准基准利率 |
| Spread | 利差 |
| WT (Whitelist) | 白名单 |
| NON-STP | 非标准自动审批 |
| HP (Hire Purchase) | 分期付款购买 |
| HP+Plus | HP 增强版产品 |
| Lease | 融资租赁 |
| CIR (Central Bank of Malaysia Interest Rate) | 央行利率 |
| CIF (Customer Information File) | 客户信息文件 |
| ETB (Existing to Bank) | 现有客户 |
| NTB (New to Bank) | 新客户 |
| STP (Straight Through Processing) | 直通处理 |
| UBO (Ultimate Beneficial Owner) | 最终实益控制人 |
| SSM (Suruhanjaya Syarikat马来西亚) | 马来西亚公司委员会 |
| CCRIS (Central Credit Reference Information System) | 中央信用参考信息系统 |
| CED (Credit Evaluation Department) | 信用评估部 |
| AIP (Auto Indicator Pricing) | 自动定价指标 |
| CMSS (Credit Management Support System) | 信贷管理支持系统 |
| FMU (Finance Management Unit) | 融资管理单元 |
| AML (Anti-Money Laundering) | 反洗钱 |
| SIRON (System for Information Reporting) | 信息报告系统 |
| PEP (Politically Exposed Person) | 政治公众人物 |
| CTOS (Credit Tip-Off Service) | 信用提示服务 |
| MSIC (Malaysia Standard Industrial Classification) | 马来西亚标准行业分类 |
| EPF (Employees Provident Fund) | 雇员公积金 |
| NOA (Notice of Assessment) | 税务评估通知 |
| TIN (Tax Identification Number) | 税务识别号 |
| SST (Sales and Service Tax) | 销售与服务税 |
| e-Hakmilik | 电子地契登记 |
| FBR (Flat Rate) | 平板利率 |
| LTV (Loan-to-Value) | 贷款成数 |
| DSR (Debt Service Ratio) | 债务收入比 |
| OCR (Optical Character Recognition) | 光学字符识别 |
| FIS (Financial Information System) | 金融信息系统 |
| LOU (Letter of Undertaking) | 承诺函 |
| PG (Personal Guarantee) | 个人担保 |
| CG (Corporate Guarantee) | 企业担保 |
| M&A (Memorandum & Articles of Association) | 公司章程 |
| BR (Board Resolution) | 董事会决议 |
| ROS (Registrar of Societies) | 社团注册局 |
| PLT (Perkongsian Liabiliti Terhad) | 有限合伙（马来语） |
| NPF (Net Profit Fee?) | 净利润费（待确认） |
| Margin | 利润率（待确认） |

---

*文档结束*
