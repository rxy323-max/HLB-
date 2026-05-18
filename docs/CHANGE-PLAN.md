# 修改计划 — 需求对齐 NonIndividual-Requirements-20260518

> 每改完一条，把 `[ ]` 改成 `[x]`。计划存在 `docs` 分支，对话压缩不会丢失。
> 所有修改均在 `feature/optimize-v2` 分支的 `components/ApplicationForm.tsx` 文件中进行。
> 需求来源：`docs/NonIndividual-Requirements-20260518.md`

---

## 批次 1 · 枚举值修正（改动小，影响数据正确性）

### 1-A  Constitution Code 选项补全

**文件位置：** `ApplicationForm.tsx`，`const CONSTITUTION_OPTIONS`（约第 84 行）

**现状：**
```ts
const CONSTITUTION_OPTIONS = [
  { value:'R', label:'R – Sdn Bhd / Private Ltd' },
  { value:'U', label:'U – Bhd / Public Ltd Co' },
  { value:'S', label:'S – Sole Proprietor' },
  { value:'P', label:'P – Partnership' },
  { value:'O', label:'O – Others' },
  { value:'A', label:'A – Assoc / School / Society' },
  { value:'B', label:'B – Statutory Body' },
  { value:'C', label:'C – Cooperative' },
  { value:'G', label:'G – Government Body' },
  { value:'I', label:'I – Individual' },
];
```

**目标（需新增 V / W / H / F / T 五个选项，并重新排序）：**
```ts
const CONSTITUTION_OPTIONS = [
  { value:'R', label:'R – Sdn Bhd / Private Ltd' },
  { value:'U', label:'U – Bhd / Public Ltd Co' },
  { value:'S', label:'S – Sole Proprietor' },
  { value:'P', label:'P – Partnership' },
  { value:'A', label:'A – Assoc / School / Society' },
  { value:'C', label:'C – Cooperative' },
  { value:'T', label:'T – Trade Union' },
  { value:'V', label:'V – Federal Govt' },
  { value:'W', label:'W – Local Govt' },
  { value:'B', label:'B – Statutory Body' },
  { value:'G', label:'G – Government Body' },
  { value:'H', label:'H – Fed Stat Auth' },
  { value:'F', label:'F – ODBE / Other Govt' },
  { value:'O', label:'O – Others' },
  { value:'I', label:'I – Individual' },
];
```

**依据：** 需求文档 §5.2 Constitution Code枚举值完整表

- [ ] 已完成

---

### 1-B  Basic Group 选项补全 + K 类不再自动推导

**文件位置：** `ApplicationForm.tsx`

**第一步 — 补全 BASIC_GROUP_OPTIONS（新增 32.0 / 33.0）：**

现状缺少：
```ts
{ value:'32.0', label:'32.0 – State Government' },
{ value:'33.0', label:'33.0 – Local Government' },
```

目标完整列表：
```ts
const BASIC_GROUP_OPTIONS = [
  { value:'11.0', label:'11.0 – Individual' },
  { value:'21.0', label:'21.0 – Sole Proprietors' },
  { value:'22.0', label:'22.0 – Partnerships' },
  { value:'24.0', label:'24.0 – Companies' },
  { value:'26.0', label:'26.0 – Limited Liability Partnership' },
  { value:'31.0', label:'31.0 – Federal / Central Government' },
  { value:'32.0', label:'32.0 – State Government' },
  { value:'33.0', label:'33.0 – Local Government' },
  { value:'34.0', label:'34.0 – Statutory Bodies' },
  { value:'43.0', label:'43.0 – Societies / Associations' },
  { value:'91.0', label:'91.0 – Others' },
];
```

**第二步 — K 类 Basic Group 改为手动选择（不自动推导）：**

现状：`ENTITY_TO_BASIC_GROUP` 中 `K:'31.0'`（写死联邦政府）

目标：K 类从 `ENTITY_TO_BASIC_GROUP` 中移除，M2 的 Basic Group 字段对 K 类不自动填充，显示下拉让用户从 31.0/32.0/33.0/34.0 中选。

具体代码修改：
- `ENTITY_TO_BASIC_GROUP` 中 K 改为空字符串：`K:''`
- M2 字段处加注释说明 K 类需手动选

**依据：** 需求文档 §5.2 Basic Group枚举值；§2.2.11 K类 Basic Group 31.0/32.0/33.0/34.0（视具体政府层级）

- [ ] 已完成

---

### 1-C  Constitution Code：K / J 类自动推导清空，改为受限手选

**文件位置：** `ApplicationForm.tsx`，`ENTITY_TO_CONSTITUTION`（约第 45 行）

**现状：**
- K → `'G'`（写死为 Government Body）
- J → `'A'`（写死为 Assoc）

**目标：**
- K 改为 `''`（空，让用户从 V/W/B/G/H/F 中手选）
- J 改为 `''`（空，让用户从 A/C/T 中手选）

即：
```ts
const ENTITY_TO_CONSTITUTION: Record<EntityCode,string> = {
  A:'R', B:'U', C:'O', D:'S', E:'P',
  F:'O', G:'O', H:'O',
  J:'',   // 手选：A / C / T
  K:'',   // 手选：V / W / B / G / H / F
  L:'S',
};
```

**同时：** M2 中的 Constitution 字段，当实体为 K 时，用 label 提示用户"Select based on government tier"；当实体为 J 时提示"Select society type"。

**依据：** 需求文档 §2.2.10 J类 Constitution Code A/C/T；§2.2.11 K类 Constitution Code V/W/B/G/H/F等

- [ ] 已完成

---

### 1-D  Customer Sector Code 枚举值替换

**文件位置：** `ApplicationForm.tsx`，M6 函数内 Customer Sector Code 的 `<Select>` options

**现状 options（错误）：**
```
SME – Small Medium Enterprise
Corporate
GLC – Government-Linked Company
NPO – Non-Profit Organization
```

**目标 options（按需求文档 §5.2）：**
```ts
[
  { value:'',                        label:'— Select —' },
  { value:'Bumi SME-Micro',          label:'Bumi SME – Micro' },
  { value:'Bumi SME-Small',          label:'Bumi SME – Small' },
  { value:'Bumi SME-Medium',         label:'Bumi SME – Medium' },
  { value:'Non-Bumi DBE',            label:'Non-Bumiputra Controlled DBE' },
  { value:'Non-Resident DBE',        label:'Non-Resident Controlled DBE' },
]
```

**依据：** 需求文档 §5.2 Customer Sector Code枚举值

- [ ] 已完成

---

### 1-E  GP Ratings 改为只读 + 基于 MSIC 自动推导

**文件位置：** `ApplicationForm.tsx`，M6 函数内 GP Ratings 字段

**现状：** 用户可手动选 GP1/GP2/GP3/GP4 的下拉框

**目标：**
1. 改为只读 `<Input value={derivedGpRating} readOnly/>`
2. 新增推导逻辑（在组件顶部 computed values 区域）：

```ts
// GP Rating auto-derived from MSIC group (read-only, system-generated)
const derivedGpRating = useMemo(() => {
  const gpMap: Record<string, string> = {
    A: 'GP 1', // Agriculture → Climate Change Mitigation
    B: 'GP 3', // Mining → No Significant Harm
    C: 'GP 2', // Manufacturing → Climate Change Adaptation
    D: 'GP 3', // Electricity
    F: 'GP 2', // Construction
    G: 'GP 4', // Wholesale & Retail → Remedial Efforts
    H: 'GP 4', // Transportation
    I: 'GP 4', // Accommodation & Food
    J: 'GP 4', // Information & Communication
    K: 'GP 3', // Financial & Insurance
    L: 'GP 4', // Real Estate
    M: 'GP 4', // Professional
    N: 'GP 4', // Administrative
  };
  return msicGroup ? (gpMap[msicGroup] || '—') : '—';
}, [msicGroup]);
```

3. 移除 `gpRatings` state 的 `<Select>` 替换为 `<Input value={derivedGpRating} readOnly/>`

**依据：** 需求文档 §5.2 GP Ratings "由系统基于Nature of Business Code自动映射生成，前端只读反显"

**注意：** GP 映射关系需要业务确认，以上为合理默认值，待确认后调整。

- [ ] 已完成

---

## 批次 2 · 角色系统修正

### 2-A  Relationship To Application 按实体类型过滤

**文件位置：** `ApplicationForm.tsx`，Add Guarantor 弹窗（`showAddGuar` 区域），`Relationship` 下拉

**现状：** 所有实体类型看到相同的 Relationship 选项列表

**目标：** 根据当前 `enterpriseType`（即 `et`）动态过滤可用角色

需新增的常量（放在文件顶部常量区）：
```ts
const RELATIONSHIP_BY_ENTITY: Record<string, { value: string; label: string; isGuarantor: boolean }[]> = {
  A: [
    { value:'Director/Guarantor',         label:'Director / Guarantor',            isGuarantor: true  },
    { value:'Gtr/Dir/Shareholder',        label:'Gtr / Dir / Shareholder',         isGuarantor: true  },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
    { value:'Guarantor/Shareholder',      label:'Guarantor / Shareholder',          isGuarantor: true  },
    { value:'Director',                   label:'Director (Non-Guarantor)',          isGuarantor: false },
    { value:'Director/Shareholder',       label:'Director / Shareholder (Non-Gtr)', isGuarantor: false },
    { value:'Shareholder',                label:'Shareholder',                       isGuarantor: false },
  ],
  B: [
    { value:'Director/Guarantor',         label:'Director / Guarantor',            isGuarantor: true  },
    { value:'Gtr/Dir/Shareholder',        label:'Gtr / Dir / Shareholder',         isGuarantor: true  },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
    { value:'Guarantor/Shareholder',      label:'Guarantor / Shareholder',          isGuarantor: true  },
    { value:'Director',                   label:'Director (Non-Guarantor)',          isGuarantor: false },
    { value:'Director/Shareholder',       label:'Director / Shareholder (Non-Gtr)', isGuarantor: false },
    { value:'Shareholder',                label:'Shareholder',                       isGuarantor: false },
  ],
  C: [
    { value:'Corporate Guarantor',        label:'Corporate Guarantor',              isGuarantor: true  },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
    { value:'Director',                   label:'Director (Non-Guarantor)',          isGuarantor: false },
    { value:'Director/Shareholder',       label:'Director / Shareholder (Non-Gtr)', isGuarantor: false },
    { value:'Shareholder',                label:'Shareholder',                       isGuarantor: false },
  ],
  D: [
    { value:'Sole Proprietorship',        label:'Sole Proprietorship (Owner)',       isGuarantor: false },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
  ],
  E: [
    { value:'Partner of Partnership',     label:'Partner of Partnership',            isGuarantor: true  },
  ],
  F: [
    { value:'Partner (LLP only)',         label:'Partner (LLP only)',                isGuarantor: true  },
    { value:'Director/Guarantor',         label:'Director / Guarantor',            isGuarantor: true  },
    { value:'Guarantor/Shareholder',      label:'Guarantor / Shareholder',          isGuarantor: true  },
    { value:'Director',                   label:'Director (Non-Guarantor)',          isGuarantor: false },
    { value:'Shareholder',                label:'Shareholder',                       isGuarantor: false },
  ],
  G: [
    { value:'Corporate Guarantor',        label:'Corporate Guarantor',              isGuarantor: true  },
    { value:'Partner (LLP only)',         label:'Partner (LLP only)',                isGuarantor: true  },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
    { value:'Director',                   label:'Director (Non-Guarantor)',          isGuarantor: false },
    { value:'Shareholder',                label:'Shareholder',                       isGuarantor: false },
  ],
  H: [
    { value:'Partner (LLP only)',         label:'Partner (LLP only)',                isGuarantor: true  },
    { value:'Director/Guarantor',         label:'Director / Guarantor',            isGuarantor: true  },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
    { value:'Director',                   label:'Director (Non-Guarantor)',          isGuarantor: false },
  ],
  J: [
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
    { value:'Director/Guarantor',         label:'Committee Member / Guarantor',    isGuarantor: true  },
    { value:'Director',                   label:'Committee Member (Non-Gtr)',       isGuarantor: false },
  ],
  K: [
    { value:'Director',                   label:'Authorised Officer (Non-Gtr)',     isGuarantor: false },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
  ],
  L: [
    { value:'Sole Proprietorship',        label:'Sole Proprietorship (Owner)',       isGuarantor: false },
    { value:'Guarantor',                  label:'Guarantor',                        isGuarantor: true  },
  ],
};
```

M7 Add Guarantor 弹窗里，将 Relationship 下拉改为：
```ts
const relationshipOptions = et
  ? RELATIONSHIP_BY_ENTITY[et] ?? []
  : [];
```
并用 `relationshipOptions` 渲染 `<Select>`。

同时：当用户选择的 relationship `isGuarantor === false` 时，该人员添加到 `directors` 表而非 `guarantors` 表（Non-Guarantor 走管理层，Guarantor 走担保人）。

**依据：** 需求文档 §4.4 完整角色映射表；§5.2 Role To Application枚举值

- [ ] 已完成

---

### 2-B  F 类合规官必须设为签署人的强制校验

**文件位置：** `ApplicationForm.tsx`，M7 函数底部的 Confirm 按钮

**现状：** 只有 banner 提示，没有强制校验

**目标：** 对 F 类实体，提交按钮校验逻辑增加：
- `directors` 中必须有至少一个 role 包含 `'Compliance Officer'`（或通过 relationship 标记）
- 且该人员的 `isSignatory === true`
- 否则 Confirm 按钮 disabled，并显示红色提示

具体：M7 内新增计算变量：
```ts
const fTypeComplianceOk = et !== 'F' || directors.some(d =>
  d.roles.includes('Compliance Officer') && d.isSignatory
);
```

M7 的 Confirm 按钮：
```tsx
<button
  onClick={() => completeModule(7)}
  disabled={!fTypeComplianceOk}
  ...>
  Confirm Related Parties →
</button>
{et === 'F' && !fTypeComplianceOk && (
  <p className="text-xs text-red-500 mt-1">
    Entity F requires a designated Compliance Officer set as Signatory.
  </p>
)}
```

**依据：** 需求文档 §4.8 F类 特殊约束"必须有指定Compliance Officer"

- [ ] 已完成

---

## 批次 3 · 待确认后再改

### 3-A  Nature of Business 编码体系确认

**问题：** 需求文档 §5.2 定义21个数字编码（1.0 TRADING / 2.0 WHOLESALE…）；
当前原型用 MSIC 字母分组（A-N），是不同体系。

**选项：**
- 方案 A：保留 MSIC 字母分组（当前）—— 字段内容不变，只是和文档表述不同
- 方案 B：替换为文档的21个数字编码

**需要业务方确认后再改。**

- [ ] 已确认选择：______
- [ ] 已完成

---

### 3-B  后台查询展示（6项）按角色区分

**文件位置：** M1 的 ApiRow 展示区域

**现状：** 展示 3 项（CIF/HOST, Experian/SSM, HP Line）

**目标：** 按需求文档 §4.6 展示完整 6 项，并标注"所有人"vs"仅担保人"：

| # | 查询名 | 数据源 | 适用 |
|---|---|---|---|
| 1 | CIF Profile | HOST | 所有申请人 |
| 2 | WT Whitelist | CrediOS | 仅担保人 |
| 3 | Income DB | HLB API | 仅担保人 |
| 4 | App History | CrediOS | 所有申请人 |
| 5 | Pre-Consent | e-Consent | 所有申请人 |
| 6 | HP Line | BCB Source | 仅 Non-Individual 主申请人 |

改动：在 M1 的查询结果区增加条目，并用不同颜色或 badge 区分适用范围。

- [ ] 已完成

---

### 3-C  UBO 树形可视化（复杂，单独排期）

**文件位置：** M7，UBO Identification 区域

**现状：** 仅有简单的 Drill Down 弹窗，无层级树、无有效持股比例计算

**需求（§3.4）：**
- 树状展示：第一层由 Experian 拉取
- 法人股东 >25% 显示 ⊕ Drill Down 按钮
- 点击后手动输入下一层股东，计算有效持股（55%×70%=38.5%）
- 个人股东 >25% 自动标记为 UBO 候选
- 可递归穿透多层

**规模：** 较大，建议单独开一个功能分支来做。

- [ ] 确认排期后开始

---

---

## 批次 4 · 模块顺序调整（需求文档 §1.2）

### 4-A  M0 / M1 解锁顺序待确认

**问题：** 需求文档 §1.2 分步录入流程表格中，Step 1（申请角色选择 / Role & Identity）排在 Step 0（渠道信息录入 / Channel Info）之前——即文档把 Step 1 列在首位。

| 文档顺序 | 步骤编号 | 模块名 |
|---|---|---|
| 第 1 行 | Step 1 | 申请角色选择（Role & Identity） |
| 第 2 行 | Step 0 | 渠道信息录入（Channel Info） |
| 第 3 行+ | Step 2–9 | 后续模块… |

**当前实现：** M0（Channel Info）开场解锁，M1（Role & Identity）在 M0 完成后解锁。

**两种解读：**
- 解读 A：Step 0 只是"准备步骤"，编号为 0 表示最低优先，实际可以任意时间填，Role & Identity 才是第一个主要操作——但 Channel Info 仍先解锁（维持现状）
- 解读 B：文档明确把 Role & Identity 排首位，Channel Info 应该后填（两者顺序对调）

**需业务方确认后再改。**

- [x] 已确认选择：M1 先开（Role & Identity 先锁定企业），M1 完成后同时解锁 M0 和 M2
- [x] 已完成：moduleStatus 初始值 M1 active，completeModule(1) 同时解锁 M0+M2，滚动到 M2

---

## 批次 5 · 左侧导航栏视觉还原（对照主线稳定版）

### 5-A  侧边栏整体视觉差异清单

对照分支：`stable/prototype-v1.0-初稿定稿-20260508`

| 项目 | 稳定版（主线）| 当前版（feature/optimize-v2）| 需恢复？ |
|---|---|---|---|
| 顶部标题 | `☰ Navigation` | `Modules`（小型大写）| ✅ 需改 |
| 状态指示器 | StatusIcon：○ idle / ✓ complete / ✗ error | 彩色圆点：灰/蓝/绿 | 讨论 |
| 菜单结构 | 层级树（父项 + 子项缩进）| 平铺列表 | ⚠️ 见说明 |
| 顶级字号 | `text-sm` | `text-xs` | ✅ 需改 |
| 底部区标题 | `Risk Relate` | `Other Sections` | ✅ 需改 |
| 底部区内容 | 6项：AML / Credit Summary / UW Result / Customer / TV-Check / Exposure Summary | 4项：Collateral / Facility / Income / Risk·AML | ✅ 需改 |
| 底部区字色 | `text-gray-400`（置灰，表示次级）| `text-gray-500` | ✅ 需改 |

**关于菜单结构：** 稳定版是层级树（Identity Verification 下挂 Company Basic、Company Profile 等子项）；当前版是 10 个平铺模块。两者功能架构已经不同，不能原样恢复。建议在平铺模块的基础上，恢复稳定版的**视觉风格**（字号、颜色、标题样式），而不是恢复层级结构。

### 5-B  具体修改内容

**文件位置：** `ApplicationForm.tsx`，`NavSidebar` 函数（约第 722 行）及 `EXTRA_NAV` 常量（约第 334 行）

**改动 1 — 顶部标题：**

现状：
```tsx
<span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Modules</span>
```
目标：
```tsx
<span className="text-sm font-semibold text-gray-700">☰ Navigation</span>
```

**改动 2 — 模块列表字号（顶级项从 xs 改回 sm）：**

现状：`text-xs border-l-2`
目标：`text-sm border-l-2`（和稳定版一致）

**改动 3 — 状态指示器（两个方案，需选其一）：**

- 方案 A（保留彩色圆点）：维持现状，视觉更直观
- 方案 B（恢复 StatusIcon 样式）：
  ```tsx
  // locked → 无图标（opacity 已处理）
  // active → ● 蓝点
  // complete → ✓ 绿色
  ```
  建议方案 B，和稳定版风格一致

**改动 4 — 底部区还原（EXTRA_NAV + 标题 + 6 个风险项）：**

现状 EXTRA_NAV（4 项）：
```ts
{ id:'collateral',    label:'Collateral' },
{ id:'facility',      label:'Facility' },
{ id:'incomeSummary', label:'Income Summary' },
{ id:'aml',           label:'Risk / AML' },
```

目标 — 拆为两组，和稳定版对齐：
```ts
// 上组（Other Sections，较重要）
{ id:'collateral',    label:'Collateral & Seller' },
{ id:'facility',      label:'Facility / Financing' },
{ id:'incomeSummary', label:'Income Summary' },

// 下组（Risk Relate，次级，text-gray-400）
{ id:'aml',           label:'AML' },
{ id:'credit',        label:'Credit Summary' },
{ id:'uw',            label:'UW Result' },
{ id:'customer',      label:'Customer' },
{ id:'tvcheck',       label:'TV-Check' },
{ id:'exposure',      label:'Exposure Summary' },
```

NavSidebar 底部相应渲染为两个独立 section，中间加分隔线。

- [x] 已确认方案：选 B（恢复 ○/✓ 字符图标，与稳定版一致）
- [x] 5-A/5-B 已完成：NavSidebar 重写，顶部 ☰ Navigation，text-sm 字号，✓/● 图标，Other Sections + Risk Relate 两组

---

## 改动顺序总结（更新版）

```
优先级 0（需先确认，不动代码）：
  → 4-A：M0/M1 顺序 — 确认是否对调
  → 5-B：状态指示器 — 确认选 A（圆点）还是 B（图标）

批次 0（视觉）：  5-B  ← 视觉还原，不影响业务逻辑，建议优先改，效果立竿见影
批次 1（枚举值）：1-A → 1-B → 1-C → 1-D → 1-E   ← 约 1-2 小时
批次 2（角色系统）：2-A → 2-B                       ← 约 1-2 小时
批次 3（待确认/复杂）：先确认 3-A，再做 3-B，3-C 单独排期
批次 4（顺序）：  4-A（确认后）
```

**建议改动顺序：** 5-B（视觉）→ 1-A/B/C/D/E（枚举值）→ 2-A/B（角色）→ 确认后做 3-A/4-A

---

## 每次开始新 session 的检查口令

把以下内容发给 Claude，可以快速恢复上下文：

> 请读取 `/home/user/HLB-/docs/CHANGE-PLAN.md`，告诉我哪些条目还没完成，下一步要改什么。
