# HLB LOAD$ — 签约模块原型 项目记忆

> 每次新会话直接读这个文件，不需要重新看代码。更新后 push 到 GitHub。

---

## 项目概述

**产品**：HLB LOAD$ 内部系统 — 签约模块（E-Acceptance 原型）  
**目标**：可交互 HTML 单文件原型，供销售人员演示和客户体验  
**语言**：全英文（对外版本，不是内部文档）  
**仓库**：`https://github.com/rxy323-max/HLB-`  
**预览链接**：`https://htmlpreview.github.io/?https://github.com/rxy323-max/HLB-/blob/main/05_%E7%AD%BE%E7%BA%A6/%E9%9C%80%E6%B1%82%E6%96%87%E6%A1%A3/e-acceptance-prototype.html`

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `05_签约/需求文档/e-acceptance-prototype.html` | **主原型文件（当前 v8，持续迭代）** |
| `05_签约/需求文档/_v4_reference.html` | v4 快照，保留为参考，不修改 |

---

## 设计决策（已确定，不可逆转）

1. **bio-layout 两栏布局**：左栏 230px（#fafafa 背景，Customer/Sales/Transaction Details 信息）+ 右栏居中（设备 SVG + 状态内容）
2. **devViz() 设备图**：MyKad Reader + 连接指示点 + Computer，三种状态（disconnected/scanning/connected）
3. **RIB 是外部系统**：原型里不模拟 RIB 门户界面，只展示 LOAD$ 侧的等待/完成状态
4. **全英文**：所有按钮、状态文字、提示均为英文
5. **不放引导说明文字**：页面只有功能按钮和状态，无蓝色引导框或解释性文字
6. **E-Acceptance 不支持担保人**：有担保人时 E-Acceptance 按钮禁用，只能用 Manual

---

## E-Acceptance 三步流程

### Step 1 — Identity Verification（生物识别身份验证）
设备状态机：`disconnected` → `scanning` → `ready`（已连接，等待扫描）→ `matched` / `unmatched`

- **匹配**：显示 Verified OK，Proceed to Step 2
- **不匹配（1/3, 2/3）**：显示重试次数警告，可以重试
- **不匹配（3/3）**：显示红色 auto-switch banner，强制切换到 Manual Acceptance
- **失败时 Remarks**：不匹配时需要填写 Remarks 才能继续

### Step 2 — Review & Accept at RIB（外部系统审阅）
- 等待状态：显示 spinning 图标，"Customer reviewing at RIB Portal"
- 完成状态：绿色确认，Proceed to Step 3
- 不模拟 RIB 内部界面

### Step 3 — E-Acceptance Confirmation（二次生物识别确认）
设备状态机同 Step 1

- **匹配**：Complete E-Acceptance
- **不匹配（1/3, 2/3）**：重试
- **不匹配（3/3）**：OTP 兜底流程（发 SMS → 输入 6 位 OTP → 验证成功）

### 完成后
- 显示完成状态（via Biometric 或 via OTP）
- 若有 Amendment：显示变更文档高亮，触发 SMS 通知客户

---

## Manual Acceptance 流程

两种子模式（无担保人 / 有担保人）：

**无担保人（单人）**：
- Primary 申请人的生物识别卡片
- 状态：disconnected / ready / matched / unmatched / skipped

**有担保人（双人）**：
- Primary + Guarantor 各自独立的 bio-layout 卡片
- 各自有独立状态
- 每人都可以 Skip（跳过生物识别，人工处理）

**文档签署部分**：
- 展示需要签署的文档列表（HP Application Form、HP Agreement with T&C 等）
- 每份文档可以查看 / 下载

---

## Dev Tool 场景清单（应保持完整）

### E-Acceptance
| 场景 key | 说明 |
|---------|------|
| `ea-s1-disc` | Step 1: 设备未连接 |
| `ea-s1-ready` | Step 1: 设备已连接，等待扫描 |
| `ea-s1-matched` | Step 1: 匹配成功（第1次）|
| `ea-s1-fail1` | Step 1: 失败 1/3 |
| `ea-s1-fail2` | Step 1: 失败 2/3 |
| `ea-s1-fail3` | Step 1: 失败 3/3 → 强制切 Manual |
| `ea-s2-wait` | Step 2: RIB 等待中 |
| `ea-s2-done` | Step 2: RIB 已完成 |
| `ea-s3-ready` | Step 3: 设备就绪 |
| `ea-s3-fail1` | Step 3: 失败 1/3 |
| `ea-s3-fail2` | Step 3: 失败 2/3 |
| `ea-s3-otp` | Step 3: 失败 3/3 → OTP 兜底 |
| `ea-complete` | 全流程完成（Biometric）|
| `ea-amendment` | 完成 + Amendment 触发 |

### Manual Acceptance
| 场景 key | 说明 |
|---------|------|
| `m-ng-disc` | 无担保人，设备未连接 |
| `m-ng-ready` | 无担保人，就绪 |
| `m-ng-matched` | 无担保人，匹配成功 |
| `m-ng-fail` | 无担保人，失败（可继续） |
| `m-ng-skip` | 无担保人，跳过 |
| `m-g-disc` | 有担保人，双人均未连接（默认） |
| `m-g-p-matched` | Primary 完成，Guarantor 进行中 |
| `m-g-both-matched` | 双人均匹配成功 |
| `m-g-skip` | 双人均跳过 |

---

## 状态对象结构（S）

```javascript
S = {
  mode: 'ea' | 'manual',
  hasGuarantor: true | false,
  // EA flow
  eaStep: 1 | 2 | 3,
  s1Dev: 'disconnected' | 'scanning' | 'ready' | 'matched' | 'unmatched',
  s1Attempts: 0~3,
  s1Remarks: '',           // 失败时必填
  s2RibDone: false,
  s3Dev: 'disconnected' | 'scanning' | 'ready' | 'matched' | 'unmatched',
  s3Attempts: 0~3,
  eaComplete: false,
  eaViaOTP: false,         // 是否通过 OTP 完成
  amendmentRequired: false,
  smsSent: false,
  // Manual
  mBioPrimary:   { dev, done, attempts, skipped },
  mBioGuarantor: { dev, done, attempts, skipped },
}
```

---

## 当前 v8 状态与待办

### 已完成
- [x] bio-layout 两栏 CSS 恢复（来自 v4）
- [x] devViz() SVG 设备图
- [x] leftPanel() 左栏信息函数
- [x] Step 1/2/3 基础流程
- [x] Manual Acceptance 双人 bio-layout 卡片
- [x] 按钮 onclick 改为命名函数（修复 CSP/htmlpreview 问题）
- [x] applyMode() 自动切 Acceptance 标签

### 待补全（从 v4/v5 继承）
- [ ] S1: `ready` 状态（设备已连接但等待扫描）
- [ ] S1: 失败 2/3、3/3 强制切 Manual + auto-switch banner
- [ ] S1: Remarks 文本框（失败时必填）
- [ ] S3: OTP 兜底流程（3/3失败 → SMS → 输入OTP）
- [ ] Amendment 流程（完成后变更文档 + SMS 通知）
- [ ] Manual: Skip 选项
- [ ] Manual: 无担保人单人模式
- [ ] Manual: 文档签署列表
- [ ] leftPanel 补齐：Triggering Point、Trigger Counter、Remarks 行
- [ ] 达到上限的 attempt-badge 警告样式
- [ ] Switch to Manual 确认弹窗（EA 进行中切换时二次确认）
- [ ] Document History 弹窗

---

## 技术注意事项

1. **htmlpreview CSP 限制**：innerHTML 里的 onclick 属性不能包含 `()=>{}` 箭头函数或 `{...}` 块。所有按钮动作必须提取为顶层命名函数。
2. **文件是单 HTML 文件**：所有 CSS + HTML + JS 在一个文件里，约 700 行（扩充后会更多）
3. **推送方式**：修改后 `git add + commit + push origin main`，htmlpreview 链接不变
4. **模板字符串**：JS 里的 template literals `` `...` `` 正常可用，只有 innerHTML 的 onclick 属性内不行
