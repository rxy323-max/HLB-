# Non-Individual 进件系统 — 角色体系专项说明

> 版本: v1.0
> 日期: 2026-05-07
> 目的：清晰定义 UBO/Owner/关联人/担保人/签约人 的概念边界、业务意义和系统交互
> 面向：产品经理（晓宇）、开发团队、业务/合规确认

---

## 一、为什么需要区分这些角色？

**背景**：Non-Individual（企业）申请车贷时，参与者可能同时有多个身份重叠——同一个人可能是股东、董事、担保人、签约人。

**问题**：如果产品经理和开发团队对这些角色没有统一理解，会导致：
- 系统字段设计混乱（把不同概念混在同一张表）
- 业务流程错乱（让 UBO 去做担保人的收入录入）
- 合规报送错误（UBO 信息漏报 CCRIS）

**解决思路**：按**维度**拆分角色——每个角色属于一个独立维度，同一个人可以在多个维度上同时有身份。

---

## 二、角色体系的三维框架

将所有参与者按 **三个独立维度** 分类：

```
第一维度：法律身份（这个人在申请中扮演什么合同角色？）
    └─ 主申请人 / 关联人（Guarantor / Non-Guarantor）

第二维度：所有权身份（这个人在企业中拥有多少 ownership？）
    └─ Owner / Partner / Shareholder / UBO

第三维度：签约权力（谁能代表企业签署贷款合同？）
    └─ 签约人（Signatory）
```

> ⚠️ **关键原则**：三个维度彼此独立，**可以叠加**。同一个人可以同时是 Guarantor + UBO + Signatory，但三个身份各自有不同的系统处理逻辑。

---

## 三、第一维度：法律身份（主申请人 / 关联人）

### 3.1 概念定义

这是**贷款申请层面**的角色定义，回答"这个人在这笔贷款申请中是什么身份"。

| 角色 | 中文 | 定义 | 是否在这笔贷款中承担债务 |
|------|------|------|----------------------|
| **主申请人（Primary Applicant）** | 主申请人 | 申请贷款的企业本身 | ✅ 承担企业债务 |
| **Guarantor（担保人）** | 担保人 | 为主申请人提供个人担保 | ✅ 承担连带担保责任（如果主申请人无力还款，银行可向担保人追偿） |
| **Non-Guarantor** | 非担保人关联人 | 作为联合申请人加入，但不提供担保 | ❌ 不承担担保责任 |

### 3.2 业务意义

- **Guarantor** 是银行的风险缓冲——当企业无力还款时，银行可以通过追偿担保人来收回资产
- **Non-Guarantor** 主要是流程需要（比如多个董事都想参与，但只有一个提供担保）
- **收入计算**：主申请人 + Guarantor 的收入**自动聚合**计算 DSR；Non-Guarantor 不计入 DSR

### 3.3 系统交互差异

| 处理项 | 主申请人 | Guarantor | Non-Guarantor |
|--------|---------|-----------|--------------|
| 录入企业信息 | ✅ | ❌ | ❌ |
| 录入个人信息 | ✅ | ✅ | ✅ |
| 录入收入信息 | ✅ | ✅ | ❌ |
| 查询 WT Whitelist | — | ✅（仅此角色） | ❌ |
| 查询 Income DB | — | ✅（仅此角色） | ❌ |
| 查询 CCRIS 信用报告 | ✅ | ✅ | ✅ |
| 签署贷款合同 | 必要 | 必要 | 可能参与 |
| DSR 计算 | ✅ | ✅（合并计算） | ❌ |

---

## 四、第二维度：所有权身份（Owner / Partner / Shareholder / UBO）

### 4.1 概念定义

这是**企业内部治理层面**的角色定义，回答"这个人在企业中拥有多少 ownership"。

| 角色 | 中文 | 定义 | 与企业的关系 |
|------|------|------|------------|
| **Owner（拥有人）** | 拥有人 | 企业资产的实际控制者 | 用于独资企业（D类）和合伙企业（E类） |
| **Partner（合伙人）** | 合伙人 | 合伙企业的成员 | 用于合伙企业（E类）和 PLT（F/G/H类） |
| **Shareholder / Shareowner（股东）** | 股东 | 持有公司股份的人或法人 | 用于 Sdn Bhd（A类）和 Berhad（B类） |
| **UBO（Ultimate Beneficial Owner）** | 最终实益控制人 | 最终实际控制企业的自然人 | **合规概念**，AML/CFT 要求银行必须识别 |

### 4.2 UBO 详解（重点）

#### 什么是 UBO？

UBO 是 AML/CFT（反洗钱/反恐怖融资）法规要求的概念。

**核心问题**：很多企业是"公司持公司"——A公司持有B公司，B公司持有C公司。在复杂的股权结构背后，**最终是谁在控制这个企业**？

UBO 的定义：**最终能够实际控制企业的自然人**（不通过层层公司，而是直接握有权力或大部分股份的最终那个人）。

#### UBO 的识别标准（马来西亚央行 BNM 要求）

| 持股比例 | UBO 定义 |
|---------|---------|
| 直接持股 | 直接持股 **≥ 25%** 的自然人 |
| 穿透持股 | 通过多层法人股东间接持股，最终持有 **≥ 25%** 的自然人 |
| 实际控制权 | 虽然持股不足25%，但通过其他方式实际控制企业（如：董事会多数席位、重大决策权） |

#### UBO vs 股东（Shareholder）

> 这是最容易混淆的地方。

| 对比项 | Shareholder（股东） | UBO（最终实益控制人） |
|--------|------------------|---------------------|
| **性质** | 法律/治理概念 | 合规/监管概念 |
| **范围** | 任何持股的人或法人 | **必须且只能是自然人** |
| **识别方式** | 公司章程/注册文件 | AML/CFT 穿透分析 |
| **是否需要穿透** | 第一层即可 | 需要穿透所有法人股东 |
| **报送要求** | 仅需部分股东 | **必须报送 BNM CCRIS** |

**举例说明**：

```
ABC Sdn Bhd 的股权结构：
├── Director A（持股5%，董事）
├── Director B（持股5%，董事）
├── XYZ Holdings Sdn Bhd（持股60%，法人股东）← Shareholder，但不是 UBO
│   └── Person X（持股XYZ 80%，自然人）        ← UBO #1
│   └── Person Y（持股XYZ 20%，自然人）
└── Person Z（持股30%，自然人）                ← UBO #2
```

- **Shareholder**：Director A、Director B、XYZ Holdings、Person Z（4个）
- **UBO**：Person X（通过XYZ间接控制48%=60%×80%）、Person Z（直接30%）（2个）
- **注意**：XYZ Holdings 是 Shareholder，但不是 UBO——UBO 必须是自然人

#### UBO 的 4 种识别模式

| 模式 | 适用实体类型 | 规则 | 交互 |
|------|------------|------|------|
| **模式1：自动绑定** | D（独资）、E（合伙）、L（东马） | Owner/Partner 自动成为 UBO，不可取消 | 系统自动标记，无需用户操作 |
| **模式2：职位确认** | J（社团） | 委员会成员列表，勾选 UBO | 用户录入成员时可勾选 |
| **模式3：强穿透** | A（Sdn Bhd）、C（外国分行）、F/G/H（PLT） | 必须穿透到持股≥25%的自然人 | 用户通过树形图手动 drill-down |
| **模式4：豁免** | B（Berhad上市公司）、K（政府） | 直接豁免，不需要识别 | 系统隐藏 UBO 录入区块 |

### 4.3 Owner / Partner 详解

**适用场景**：非公司制的企业类型

| 类型 | 适用角色 | UBO 识别方式 |
|------|---------|-------------|
| **D（独资，Sole Prop）** | Owner（老板） | Owner 自动成为 UBO（老板本人 = 企业 = UBO） |
| **E（合伙，Partnership）** | Partner（合伙人） | 所有 Partner 自动成为 UBO（连带责任） |
| **F/G/H（PLT）** | Partner（合伙人） | 持股>25% 的 Partner 成为 UBO |

**业务意义**：
- 独资和合伙企业的 Owner/Partner 承担**无限连带责任**——企业欠债 = 个人欠债
- 因此银行不需要额外担保人，但必须识别这些人的信用记录

---

## 五、第三维度：签约权力（Signatory / 签约人）

### 5.1 概念定义

这是**合同签署层面**的角色定义，回答"谁能代表企业签署贷款合同"。

| 角色 | 中文 | 定义 |
|------|------|------|
| **Signatory（签约人）** | 签约人 | 持有法律授权、能够代表企业签署贷款协议的人 |

### 5.2 签约人规则（按实体类型）

| 实体类型 | 签约主体 | 谁能签约 |
|---------|---------|---------|
| **A（Sdn Bhd）** | 公司 | 必须从 **BR授权的董事（Director）** 中选择；至少1名 |
| **B（Berhad）** | 公司 | 必须从 **BR授权的董事** 中选择 |
| **C（外国分行）** | 分行 | 总行授权的**本地授权代表** |
| **D（独资）** | 个人/商号 | **Owner（老板）本人** |
| **E（合伙）** | 合伙企业 | **全体合伙人**共同签署（无限连带责任） |
| **F/G/H（PLT）** | PLT企业 | **合规官或授权合伙人** |
| **J（社团）** | 社团 | **委员会授权成员** |
| **K（政府）** | 政府/法定机构 | **财政部授权官员** |

### 5.3 签约人 vs 担保人 vs UBO

这是最容易搞混的三者关系：

```
                    签约人（合同签署权）
                         ↕
    担保人 ←——————————————→ UBO
  （债务担保）           （所有权/控制权）
```

**举例**：

> **场景**：ABC Sdn Bhd 申请车贷
> - **UBO**：Person X（持股60%，穿透后发现）→ 报送 CCRIS
> - **Guarantor**：Director B（个人担保）→ 承担连带还款责任，录入收入、查CCR
> - **Signatory**：Director A（BR授权签字）→ 签署贷款合同
>
> **三者可能重叠**：
> - Person X 可以同时是 UBO + Guarantor（如果他既是股东又愿意担保）
> - Director A 可以同时是 Signatory + Guarantor（最常见的情况）
> - 但 UBO 和 Signatory 通常不是同一人——UBO 往往是幕后股东，Signatory 是前台管理者

---

## 六、角色叠加场景（最常见案例）

### 场景1：Sdn Bhd（A类）——最复杂，需全部三个维度

```
企业：ABC Sdn Bhd
申请人：XYZ Holdings Sdn Bhd（持股70%）+ Person A（持股20%）+ Person B（持股10%）

第一维度（法律身份）：
  主申请人 → ABC Sdn Bhd（企业）
  Guarantor → Person B（个人担保，持股10%的股东）
  Non-Guarantor → Person A（持股20%，联合申请人但不担保）

第二维度（所有权身份）：
  Shareholder → XYZ Holdings（法人）、Person A、Person B
  UBO → Person X（穿透XYZ Holdings 80% = 56%）+ Person A（直接20%）
        （注：Person B 不足25%不算UBO）

第三维度（签约权力）：
  Signatory → Director C（BR授权的董事）

结果：
  - Person B：Guarantor + Non-UBO + Non-Signatory
  - Person A：Non-Guarantor + UBO + Non-Signatory
  - Person X：UBO（通过穿透发现）+ Non-Guarantor + Non-Signatory
  - Director C：Signatory + Non-Guarantor + Non-UBO
```

### 场景2：Partnership（E类）——相对简单

```
企业：AB 合伙企业
申请人：Person A（合伙人A）+ Person B（合伙人B）

第一维度（法律身份）：
  主申请人 → AB 合伙企业（企业）
  Guarantor → Person A（合伙人，强制担保）
  Guarantor → Person B（合伙人，强制担保）
  （注：Partnership 的 Owner 强制作为 Guarantor）

第二维度（所有权身份）：
  Partner → Person A、Person B
  UBO → Person A（自动）+ Person B（自动）
        （Partnership 的全体 Partner = UBO）

第三维度（签约权力）：
  Signatory → Person A + Person B（全体合伙人共同签署）

结果：
  - Person A：Guarantor + UBO + Signatory（三人重叠）
  - Person B：Guarantor + UBO + Signatory（三人重叠）
```

### 场景3：Sole Prop（独资，D类）——最简单

```
企业：阿明茶餐室
申请人：阿明（Owner）

第一维度（法律身份）：
  主申请人 → 阿明茶餐室（企业/商号）
  Guarantor → 阿明（Owner 承担无限责任，通常不额外要求担保）
  （注：独资企业 Owner 本身已承担无限责任）

第二维度（所有权身份）：
  Owner → 阿明
  UBO → 阿明（自动，Owner = UBO）

第三维度（签约权力）：
  Signatory → 阿明本人

结果：
  - 阿明：Owner + UBO + Signatory（三人重叠，且是主申请人本人）
```

---

## 七、系统录入时的角色流程

### 7.1 主申请人录入流程（第一维度）

```
企业信息录入
    │
    ├─ [Entity Type = A/B/C] → 录入董事 + 股东 → 触发 UBO 穿透
    ├─ [Entity Type = D]     → 录入 Owner → Owner 自动标记为 UBO
    ├─ [Entity Type = E]     → 录入 Partner → 全体 Partner 自动标记为 UBO
    └─ [Entity Type = F/G/H] → 录入 Partner → 持股>25%的 Partner 成为 UBO

UBO 穿透（第二维度）
    │
    ▼
系统展示树形图
    │
    ├─ 直接持股 ≥25% 的个人股东 → 勾选为 UBO
    └─ 法人股东持股 ≥25% → 手动 drill-down 穿透
                            │
                            ▼
                        找到最终自然人 → 勾选为 UBO
    │
    ▼
添加关联人（第一维度）
    │
    ├─ 选择 "Guarantor" → 录入个人信息 → 查询后端6项信息 → 录入收入
    └─ 选择 "Non-Guarantor" → 录入个人信息 → 不录入收入
    │
    ▼
添加签约人（第三维度）
    │
    ▼
在已录入的关联人列表中勾选 "Set as Authorized Signatory"
    │
    ▼
系统根据 Entity Type 校验签约人资格
    ├─ Sdn Bhd → 必须至少1名 Director 作为 Signatory
    ├─ Partnership → 必须全体 Partner 作为 Signatory
    └─ PLT → 合规官或授权合伙人
```

### 7.2 收入聚合规则（三个维度的收入汇合点）

```
主申请人（企业）收入
    │
    ├─ 自动聚合 ──→ DSR 计算
    │
Guarantor 收入（第一维度担保人）
    │
    ├─ 自动聚合 ──→ DSR 计算
    │
Non-Guarantor 收入
    │
    └─ ❌ 不计入 DSR

UBO 信息（第二维度）
    │
    └─ 报送 CCRIS（合规要求，与收入无关）
```

---

## 八、UBO 穿透的系统交互设计（开发指引）

### 8.1 树形图数据结构

```javascript
// 每个节点
{
  type: "individual" | "corporate" | "enterprise",
  name: "姓名或公司名",
  idType: "IC / Passport / SSM ID",
  idNumber: "证件号码",
  equityStake: 25.5, // 持股比例（%）
  isUBO: false,     // 是否已标记为 UBO
  isDirector: true, // 是否为董事
  drillDownCount: 0, // 已穿透层数
  children: []      // 下层节点（仅 corporate 类型有）
}

// 企业根节点（申请企业本身）
{
  type: "enterprise",
  name: "ABC Sdn Bhd",
  entityType: "A",
  children: [/* 第一层股东 */]
}
```

### 8.2 Drill-down 穿透流程

```
Step 1: 显示第一层股东
  └─ [Person A] 持股15%  → 不足25%，不标记UBO，可选
  └─ [Person B] 持股30%  → 超过25%，标记 [Set as UBO] ✓
  └─ [XYZ Co Sdn Bhd] 持股55% → 法人股东，显示 [⊕ Drill-down] 按钮
      │
      ▼ 点击 Drill-down
Step 2: 输入法人股东 SSM ID，调用 Experian API 获取其股东
  └─ [Person C] 持股70% → 超过25%（55%×70%=38.5%），标记 [Set as UBO] ✓
  └─ [Person D] 持股30% → 超过25%（55%×30%=16.5%），不足25%，不标记
      │
      ▼ 若 Person D 持股法人股东，继续 drill-down...
```

### 8.3 UBO 豁免规则（系统前端行为）

| Entity Type | UBO 录入区块 | 系统行为 |
|------------|------------|---------|
| **A（Sdn Bhd）** | 显示 | 强制穿透，提交时校验至少1名 UBO |
| **B（Berhad上市）** | **隐藏** | 自动豁免，显示提示"上市公司豁免UBO穿透" |
| **C（外国分行）** | 显示 | 穿透到海外母公司，需手动 drill-down |
| **D（独资）** | **隐藏** | 自动标记 Owner 为 UBO |
| **E（合伙）** | **隐藏** | 自动标记全体 Partner 为 UBO |
| **F/G/H（PLT）** | 显示 | 穿透持股>25%的 Partner |
| **J（社团）** | 显示 | 职位确认模式，勾选 UBO |
| **K（政府）** | **隐藏** | 自动豁免，显示提示"政府机构豁免UBO穿透" |
| **L（东马）** | **隐藏** | 自动标记持牌人为 UBO |

---

## 九、核心概念对照表

| 概念 | 维度 | 回答问题 | 是否自然人 | 是否报送CCRIS | 收入计入DSR |
|------|------|---------|:---------:|:------------:|:---------:|
| **主申请人** | 法律身份（第一维） | 这笔贷款谁借？ | ❌（是企业） | ✅ | ✅（企业） |
| **Guarantor** | 法律身份（第一维） | 谁担保？ | ✅ | ✅ | ✅ |
| **Non-Guarantor** | 法律身份（第一维） | 还有谁参与申请？ | ✅ | ✅ | ❌ |
| **Owner** | 所有权（第二维） | 谁拥有这个企业？ | ✅ | ❌（不是UBO） | ❌ |
| **Partner** | 所有权（第二维） | 合伙企业的成员是谁？ | ✅ | ❌ | ❌ |
| **Shareholder** | 所有权（第二维） | 股东是谁（包括法人）？ | ❌（含法人） | ❌ | ❌ |
| **UBO** | 所有权（第二维） | 最终控制者是谁（穿透后）？ | ✅（必须是） | ✅ | ❌ |
| **Signatory** | 签约权力（第三维） | 谁能签字？ | ✅ | ❌ | ❌ |

---

## 十、给开发团队的通俗解释（用于需求讲解）

> 可以用这个比喻帮助开发理解：
>
> **想象企业申请贷款就像"买房"：**
> - **UBO** = 房产证上最终写名字的那个人（AML合规要求必须查清）
> - **Guarantor** = 联合贷款人，如果主贷人还不起，找担保人还（债务责任）
> - **Signatory** = 当年签合同的人（法律授权）
> - **Owner/Shareholder** = 公司股权本上的名字（企业内部治理）
>
> 四者可能重叠，也可能完全不同。

---

*文档结束*
