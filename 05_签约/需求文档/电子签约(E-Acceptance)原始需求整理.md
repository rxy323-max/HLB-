# 电子签约（E-Acceptance）原始需求整理

> **文档性质**：本文档整理自 HLB 提供的三份原始需求资料，是 vendor 原版 FRS 的**中文重排与翻译**，不是新需求。目的是让原型设计和后续需求文档的迭代有一个可对照的基准，同时保留原文的按钮文案、字段名、状态值等英文原词，降低客户理解和适应成本。
>
> **原始资料来源**：
> 1. 《Auto Loan – eAcceptance – Training Deck (Updated Sept 2022)》—— 面向 Auto Loan Centre 销售/柜员的操作培训手册，FAQ + 分步截图说明
> 2. 《HP047 – LOAD$ HP: Biometric Thumbprint Authentication Request v1.7》—— 生物识别独立模块 FRS（Addendum）
> 3. 《HP075 – LOAD$ HP: Auto Loan E-Acceptance v5.3》—— E-Acceptance 主体功能 FRS
>
> **阅读提示**：三份文档的关系是——HP047 先于 HP075 立项，先把"生物识别"做成 LOAD$ 里一个独立可复用的模块（有自己的菜单、搜索、报表）；HP075 在此基础上把生物识别嵌入到 E-Acceptance 整体流程里，新增了 RIB 网银签署、e-Tracker 客户端、Amendment 修订、Infobip 短信等能力。Training Deck 是最终落地后针对一线人员的操作手册，可以看作"两份 FRS 需求最终长成的样子"。

---

## 目录

1. 项目背景与目标
2. 核心术语与概念层级
3. 准入范围（谁能走电子签）
4. LOAD$ 内部工作流（Letter Printing → 资金放款）
5. 生物识别机制（独立模块，HP047）
6. E-Acceptance 完整客户旅程（销售侧 + 客户侧）
7. Amendment / CILT 修订流程
8. 异常处理与容错
9. 报表与文档归档
10. 系统集成与接口
11. 配置参数（General Constant）汇总
12. 关键校验逻辑（Validator）汇总
13. 与当前原型的差异核对清单

---

## 1. 项目背景与目标

E-Acceptance 项目是 HLB 数字化转型的一部分，起因是新冠疫情期间需要减少客户到网点面签的需要。

**旧流程（纸质签约）**：客户申请贷款 → 电话 KYC → 与销售（EHP，Executive Hire Purchase）约定时间地点面签 → 现场用银行设备做指纹验证确认身份 → 在纸质协议上签字 → 银行整理纸质文件用于放款提交。

**新流程（电子签约）**：客户申请贷款 → 电话 KYC → 与销售约定时间地点做**第一次指纹验证**（确认身份）→ 验证成功后 **RIB 网银自动解锁** → 客户通过销售的平板打开 RIB 网银，阅读并接受贷款协议 → 客户接受后，销售引导客户做**第二次指纹验证**（确认签约意愿）→ 如遇后续贷款条件变更（CILT），客户会收到短信通知，登录 e-Tracker 远程查看变更并确认。

**目标客群（合规红线）**：仅限**无担保人的个人客户**，且**通过 Dealer 渠道**购车（含 Panel / Non-panel dealer），覆盖 New / Used / Recond 全部车辆类型。上线时间：2022年5月5日之后创建的申请。此流程仅供 Auto Loan Centre 使用。

**系统要求**：仅可通过 LOAD$ 系统 + Internet Explorer 浏览器 + 银行笔记本操作；离开办公室需连 VPN。

---

## 2. 核心术语与概念层级

原文明确区分了三个层级的概念，容易混淆，务必对齐：

| 术语 | 层级 | 定义 |
|---|---|---|
| **Acceptance**（签约） | 流程层级 | 整个"客户确认接受贷款协议"的业务流程 |
| **Signing**（签署） | 动作层级 | 流程中的具体签字/确认动作 |
| **E-Acceptance** | 流程 | 电子化的签约流程（整体） |
| **E-signing** | 动作 | 电子签字动作（线上完成） |
| **Paper Signing** | 动作 | 纸质签字动作（线下完成） |

**重要**：E-Acceptance 这个流程名称，实际上包含两种子实现方式——

- **E-Acceptance (Full)**：生物识别 ✅ + E-signing ✅，全程线上完成
- **E-Acceptance (Hybrid)**：生物识别 ✅ + Paper Signing（认证在线，签署仍走线下纸质）

**两者在前端展示上完全不做区分，都统一显示为"E-Acceptance"**，只是流程走到后面才会分化成不同路径（是否真的去 RIB 线上签，还是退回纸质签字）。这是原始设计的一个关键决策，与"Manual Acceptance"（完全没有线上生物识别，纯纸质）是三分类的第三种。

---

## 3. 准入范围（谁能走电子签）

### 3.1 E-Acceptance 整体准入条件（HP075）

三个条件**必须同时满足**：
1. Individual Hirer（个人客户，非公司）
2. 无担保人（Without Guarantor）
3. Purchase from = Dealer（通过经销商购车）

系统通过 `LOSA_APP_E_ACCEPTANCE_FLAG` 字段判定。不满足则显示 **Manual**（不可选电子签）；满足则显示 **Pending**，客户可以选 E-Acceptance 或 Manual Acceptance 二选一。

判定逻辑受两个开关控制（详见第 11 节）：
- `E_ACCEPTANCE_ON_OFF`：整体功能开关
- `E_ACCEPTANCE_GOLIVE_DATE`：只对上线日期之后创建的新申请生效，存量/pipeline 案件走旧流程旧界面

还有一个组合开关 `E_ACCEPTANCE_COMBO`，控制客户能否在 E-Acceptance 和 Manual 之间切换：
- `E[E]`：只能走电子签，不允许中途改手动（如果客户想改手动，系统报错拦截）
- `E[M]`：允许电子签、手动签、或两者组合（即前面讲过的 Manual→EA 双向转换）

### 3.2 生物识别独立准入矩阵（HP047，粒度更细）

HP047 里定义的生物识别准入矩阵比 E-Acceptance 整体准入更细，是按**申请人角色 × 客户类型 × 证件类型**的矩阵：

| 客户类型 | Primary Applicant | Guarantor | Owner |
|---|---|---|---|
| Individual（个人，Identity Card Blue/Red 均可） | YES | YES | YES |
| Corporate 各类（Commercial Bank / Company / Partnership 等） | N/A | N/A | YES / N/A（视角色而定，Owner 通常仍需要） |

关键点：**这份矩阵是可配置的**（Table Matrix，代码 `BIOMETRIC_CRITERIA_CHECK`），行内是"是否需要做生物识别扫描"，不代表是否走电子签流程——Guarantor 和 Corporate Owner 也可能被要求单独做生物识别（比如见证签字场景），但这与"是否可以走 E-Acceptance 整体流程"是两件事。

另有一个独立开关 `BIOMETRIC_CHECK_SELLER`，控制 **Seller (Direct)** 卖家本人是否也要做生物识别（值：`I` 个人卖家 / `C` 公司卖家 / `OFF` 关闭）。

### 3.3 生物识别是否强制（Mandatory）

另一张矩阵 `BIOMETRIC_MANDATORY_CHECK`，决定"做了没做完，是否卡流程"：

| | Individual - Primary | Individual - Guarantor | Individual - Owner | Corporate 各角色 |
|---|---|---|---|---|
| 是否强制 | YES | YES | YES | N/A |

只要命中 YES，**不完成生物识别扫描，工作流验证器会拦截，不让流程继续**（错误提示：`Please complete the Biometric scanning`）。命中 N/A 则生物识别是可选的（optional），不完成也能过。

> 补充：这与客户第 1 条反馈里提到的"外国人持 Passport 豁免 biometric、改用文件上传替代"是同一层逻辑的延伸——矩阵目前只区分 Identity Card Blue/Red（本国人两种证件），没有覆盖 Passport 客群的豁免路径，这是需要在新一轮需求里补充的差距点。

---

## 4. LOAD$ 内部工作流

HP075 定义了申请在 LOAD$ 里流转的四个关键步骤：

### 4.1 Letter Printing（信件打印步骤）
- 贷款 Approved 后，案件进入这一步
- LOAD$ 判断该申请是否符合 E-Acceptance 准入条件（见第3.1节），符合则显示状态 **Pending**，不符合显示 **Manual**
- 若销售选择走 E-Acceptance：客户需先完成生物识别（Identity Verification）才能跳转到 RIB 网银签署；**在收到 RIB 回传的接受确认标志（acceptance flag）之前，案件会一直卡在这一步**
- 收到 RIB 确认标志、且完成第二次生物识别（或 OTP 兜底）后，案件仍停留在 Letter Printing 步骤，**需要销售手动点击"Proceed with E-Acceptance"才会继续往下走**（这是个人为确认动作，不是全自动）
- 若客户不符合准入或 RIB 尚未回传确认，但销售却尝试点击"Proceed with E-Acceptance"硬推，系统会校验拦截

### 4.2 Sales Pending Fund Document（销售待补充放款文件）
- 案件带着 RIB 回传的接受标志流出 Letter Printing 后，系统会重新生成一轮**带客户电子签名的信件模板**
- 到这一步时，带客户签名的文件会自动挂到 File Attachment 页面，E-Acceptance 状态显示为 **Completed**

### 4.3 Letter Printing E-Acceptance（新增步骤）
- 这是 HP075 新增的一个工作流步骤，专门用来承载"初次签约"（initial acceptance）这个等待期
- 信贷审批通过后，案件先流到这个新步骤，等待客户完成初次签约
- 销售在这一步可选择两个动作：**Proceed with E-Acceptance** 或 **Proceed with Manual Acceptance**
- 若走电子签，客户完成 RIB 签约 + 第二次生物识别后，系统会**自动**把案件从这一步流转到 BAU 的 Letter Printing 步骤（这里是自动的，与 4.1 节讲的"需要销售手动点 Proceed"不矛盾——4.1 讲的是流出 Letter Printing 之后的动作，这里讲的是流出"初次签约等待步骤"进入 Letter Printing 的动作）
- 若走 Manual，销售选"Perform with Manual Acceptance"后，案件路由到 Letter Printing，按 BAU 原有校验逻辑走

### 4.4 CILT Appeal（贷款条件变更申诉）
- 只有**完成过初次签约**的案件，后续 CILT 才会被当作"Amendment（修订）"处理
- 如果 CILT 发生在客户还没做过任何签约动作之前，案件退回 Letter Printing E-Acceptance，直接当作一个全新的"初次签约"案件处理（不算修订）
- CILT 完成、可以让客户做修订确认了，销售需要点击 **Ready for Amendment Signing** 动作，触发协议在 e-Tracker 上变为"待修订确认"状态
- 客户在 e-Tracker 完成修订确认、LOAD$ 收到回执后，系统在 **E-Acceptance Log** 里盖上一条 **Hirer Amendment Acceptance** 记录
- 完成后，销售可以把案件正常流出 Letter Printing，继续走后续 BAU 步骤

> **重要备注（原文明确写出）**：如果 Amendment 发生在案件已经流出 Letter Printing 步骤之后，系统会拿新协议跟"上一次已接受的版本"做字段比对，**仍然要求客户在 e-Tracker 上再做一轮确认**。这说明 Amendment 校验不是一次性的，是每次案件推进前都要重新比对的持续机制。

---

## 5. 生物识别机制（独立模块，HP047）

### 5.1 定位

HP047 是先于 E-Acceptance 立项的独立需求，把"生物识别验证"做成 LOAD$ 里一个**通用可复用模块**（有自己的菜单入口、搜索页、详情页），后续 E-Acceptance / Manual Acceptance 都调用这个模块，而不是各自实现一套。

**这正好回答了客户反馈第 2 条**："Biometric 有个单独的入口，放在 e-Hakmilik 上面"——原始需求确实是这样设计的，是独立菜单，不是嵌在 E-Acceptance 弹窗里的子功能。

### 5.2 三种验证类型（Verification Type）

| 类型 | 用途 |
|---|---|
| **Identity Verification** | 电子签约前，验证客户身份（第一次生物识别） |
| **E-Acceptance Confirmation** | 客户在 RIB 完成签约意愿确认后，第二次生物识别，用来"确认签约意图"（不是身份验证，是意愿确认） |
| **Manual Acceptance Verification** | 走纯纸质签约流程时的生物识别（与电子签的两次验证是分开计数的） |

> 二次验证只在以下条件都满足时才会出现记录：该申请符合 E-Acceptance 准入 + 第一次验证已 Matched + 收到 RIB 的 acceptance flag = YES。否则不会生成第二次验证记录。

### 5.3 四种生物识别状态（Biometric Status）

| 状态 | 含义 |
|---|---|
| **Matched** | 匹配成功，验证完成 |
| **Unmatched** | 不匹配——需要检查是不是申请错了，或核实 MyKad 真伪 |
| **Error（附错误描述）** | 无读卡器 / 拉取列表报错 / 超时 / 未插卡 等技术性错误（可点 Restart Service 或 Back 重试） |
100%对应客户反馈第 6 条 |
| **Not Done** | 尚未执行过扫描 |

> **这正好回答客户反馈第 6 条**：match / unmatch / error / pending 四态——原文里第四态叫 **Not Done** 不是 "Pending"，语义等价（都是"还没做"），后续文档若采用客户说的 "Pending" 措辞，建议在术语表里注明与原文 Not Done 的对应关系，避免字段值对不上。

### 5.4 Start 与 Restart Service：两个独立按钮

**这正好回答客户反馈第 3 条**。原文明确区分：

- **Start Biometric Scan**（原名 Biometric Scan，改名而来）：开始一次新的验证流程，按顺序走 "Reader is ready → 插卡 Read MyKad → 放置拇指 → 验证完成"
- **Restart Service**：仅在**报错**场景下出现的补救按钮，用于设备层面重连（"无读卡器/拉取列表报错/超时/未插卡"时，操作提示是"点击 Restart Service 或点击 Back 重试"）

也就是说，Restart Service 不是 Start 的替代品，而是**报错后的专属恢复动作**，正常流程中不出现，只在设备连接失败时才浮现。上一轮我们把 Restart Service 整体删除是不准确的，需要恢复，但应仅绑定在 Error 状态下展示，而不是常驻按钮。

### 5.5 Biometric Search / Details 界面字段

**搜索页字段**（`App. Ref. No.`、`ID No.`、`Customer Name`、`Relationship`、`Biometric Status`、`Triggered Counter`、`Action`）——用于批量检索"哪些人还没做生物识别"。

**详情页字段**（对应客户反馈第 7 条要求的报表字段）：

| 字段 | 说明 |
|---|---|
| Staff ID | 当前操作扫描的柜员工号 |
| Date & Time Request | 发起验证请求的时间（多次触发只取最新一条） |
| Date & Time Response | 收到验证结果的时间 |
| Biometric Status | Matched / Unmatched / Error |
| Triggering Point | 触发时所在的工作流步骤（若跨多步骤触发，全部列出，取最新记录） |
| Triggering Counter | 累计触发次数（含 Error） |
| Remarks | 自由文本备注，有校验器强制要求填写（见 5.6） |

**这与客户反馈第 7 条列出的字段基本吻合**，唯一差异：客户反馈里多提到了 **App. Ref. No.**、**Name**、**ID No.**、**Verification Type** 四个字段——这些实际在原文的字段清单里也存在，只是分布在"Search 页"和"Details 页头部"两处，不在同一张表格里；整理成新需求文档时建议合并为一张完整字段清单。

### 5.6 生物识别的三条硬校验规则

1. **失败必须填 Remarks**：状态为 Unmatched 或 Error 时，Remarks 字段为空则拦截流程（错误提示："Biometric Status is Unmatched/Error without any remarks. Please input the remarks..."）
2. **最大重试次数**：`BIOMETRIC_ATTEMPT_COUNTER`（含 Error 的所有尝试次数），超过则报错 "Exceed maximum retry for biometric scanning"
3. **最大成功次数**（防止重复触发已成功的验证）：`BIOMETRIC_SUCCESSFUL_COUNTER`（仅计 Matched/Unmatched，不含 Error），超过则报错 "Exceed the number of successful attempt for biometric scanning"

两个计数器默认值都是 **999**（相当于业务侧几乎不限制，但机制存在，可配置收紧）。

### 5.7 设备与错误码对照

HP047 附录列出了两款设备（**SmarTec/Integrity** 和 **Sagem**）各自的错误码，统一映射到 LOAD$ 内部四种状态码（`0`=Matched, `-1`=读卡失败, `-2`=超时, `-3`=模板无效, `-4`=Unmatched, `-5`=设备序列号无效）。这是底层集成细节，原型演示不需要模拟这么细，但如果客户问起"具体报错文案"，可以参考这张表拟真。

---

## 6. E-Acceptance 完整客户旅程

### 6.1 销售侧操作步骤（对照 Training Deck 1.1–1.8）

1. **进入 Biometric Scanning**：用 App. No / IC No 搜索客户申请
2. **点击 Identity Verification 旁的编辑（铅笔）按钮**，进入生物识别扫描
3. **点击 Start Biometric Scan**
4. 系统提示 "Reader is ready" → 插入 MyKad → 点击 **Read MyKad**
5. 灯亮时客户将拇指放上扫描
6. 验证完成，移除拇指和 MyKad，点击 **Back**

若匹配成功 → **e-Acceptance 网银弹窗自动弹出**；若不匹配/失败 → 不弹出网银窗口。

### 6.2 客户在 RIB 端的操作（Review & Accept Documents）

7. 点击 **Next** 进入查看文件页面
8. 需要审阅并接受 **3 份文件**：Product Disclosure Sheet、2nd Schedule、HP Agreement（Used/Recond 车辆额外增加 Hirer Indemnity Form）
9. 逐份文件点击 **Confirm** 记录接受状态——**已接受打绿色勾，未接受留白**；已接受的文件仍可点击重新查看，接受记录不受影响
10. 全部文件接受完毕后，客户点击 **Submit**

### 6.3 第二次生物识别（E-Acceptance Confirmation）

11. 客户提交后，**行员需要回到 LOAD$ 的 Biometric Scanning 功能**，对 "E-Acceptance Confirmation" 这一项再次点击铅笔按钮，重复步骤 3-6 完成第二次验证
12. 若匹配成功 → 弹出 **"Thank You"** 完成页，客户初次签约流程结束；客户在 e-Tracker 端可看到"Agreement Signing"阶段变绿，并能下载 Product Disclosure Sheet 副本

### 6.4 OTP 兜底路径（第二次验证失败时）

若第二次生物识别 Unmatched，弹出提示要求走手机 OTP 验证：
1. 客户点击 **Receive OTP**
2. 系统发送 6 位数字 OTP 到手机
3. 客户在页面输入 OTP，或点击 **Resend OTP**
4. OTP 校验通过 → 同样弹出 "Thank You" 完成页

> 注意：OTP 只作为**第二次验证**（E-Acceptance Confirmation）的兜底，不适用于**第一次验证**（Identity Verification）——第一次验证失败没有 OTP 兜底，只能重试或转 Manual。这与我们当前原型的设计一致（EA Step 3 才有 OTP，Step 1 没有）。

### 6.5 E-Acceptance 完成后的放款流程

1. 文件齐备后，点击 **"Proceed with E-Acceptance"**，案件从 Letter Printing 流到 Pending Funding Document，状态从 Approved 变为 Accepted
2. 在附件夹里补齐剩余放款文件（HP Agreement、Second schedule Part 1、Product Disclosure Sheet、Customer Biometric Scanning Result、Appendix 4（Used/Recond 适用）等由系统自动挂载）
3. 补齐后点击 **"Route to CRA checker"** 进入放款流程

### 6.6 客户端状态查询（e-Tracker）

客户登录 **www.hlb.com.my/etracker** 可查看签约进度。E-Acceptance 完成后，"Agreement Signing"阶段会变绿，客户可下载 Product Disclosure Sheet。若柜员操作完初次签约后 e-Tracker 状态未更新，需要检查案件是否已经流出"Letter Printing E-Acceptance"步骤——若还卡在该步骤，需先执行 "Complete Initial Acceptance" 动作。

### 6.7 E-Acceptance 状态定义（贯穿多个界面复用）

| 状态 | 含义 |
|---|---|
| **Manual** | 不适用电子签，走手动签约 |
| **Pending** | 等待客户完成电子签 |
| **Fail** | 客户未能完成电子签（生物识别或 OTP 均失败），需转手动 |
| **Completed** | 电子签已完成 |
| **Blank** | 案件尚未走到签约阶段，不显示 |

> 该状态定义在 To-Do-List、Pool List、Application Inquiry、CRA Checker、CRA Maintenance 五个界面复用，共享同一套逻辑。

---

## 7. Amendment / CILT 修订流程

### 7.1 触发条件

CILT（贷款条件变更）发生在**客户已完成初次签约之后**，才会被当作 Amendment 处理。

### 7.2 销售侧操作

1. CILT 处理完成、案件流回 Letter Printing 队列后，销售点击 **"Ready for Amendment Acceptance"**（原文按钮名，与我们原型此前使用的措辞一致）
2. 点击后弹出成功提示
3. 销售进入 **E-Acceptance tab**，点击 **"Trigger Amendment SMS"** 按钮，通过 Infobip 网关给客户发短信通知，提醒客户到 e-Tracker 查看最新修订文件

**关键校验**：如果销售没有先完成上述修订签约流程，就直接点击"Proceed with E-Acceptance"想让案件流出，系统会报错拦截，不允许流出。

### 7.3 客户侧操作（e-Tracker Amendment Review）

1. 销售触发短信后，e-Tracker 页面状态更新，客户能看到提示
2. 客户点击 **"Review Now"** 按钮，进入修订确认页
3. 客户需要**逐份勾选** CILT 涉及的所有相关文件（Agreement、Second Schedule、PDS 等），勾选后点击 **"Confirm"** 按钮
4. **变更字段以黄色高亮显示**在更新后的文件中——这与我们上一轮做的 e-Tracker 预览弹窗设计（黄色高亮字段对比表）完全吻合，是原始需求就有的规定动作，不是我们自创的

### 7.4 Trigger Amendment SMS 按钮的四条状态规则

1. 仅当"存在待修订"时才 enable
2. 满足"修订文件已生成（indicator=Y）且尚未收到 Infobip 回执"时 enable
3. 一旦 LOAD$ 收到 Infobip 的任何回执（无论成功或失败）→ 立刻 disable，**不允许重复触发**
4. 若迟迟没有收到回执 → 系统会重新 enable 按钮，允许销售手动重新触发
5. 若文件生成本身失败（比如模板渲染报错）→ 按钮 disable

> **这里有个我们原型目前没做到位的点**：按钮不是无限可点的"Send"按钮，而是受 Infobip 回执状态严格管控的**一次性触发+失败重试**机制。当前原型的 Amendment 弹窗里 "Resend SMS" 是常驻可点的，与原始规则（有回执后必须 disable）不符，需要在下一轮原型迭代里对齐。

### 7.5 变更字段追踪与高亮机制

系统对四类文件的字段变化进行追踪，只要检测到变化，就在重新生成的文件里用不同字体颜色高亮标注（按修订轮次 index 区分颜色，支持累计多轮变更）：

**1. HP Agreement Part 1**：Name、Address、Description of Goods、New/Second-hand、Goods to be kept at、**Financial Amount**、**Interest Rate**、Total Amount、Balance originally payable、Annual Percentage Rate、**Duration of payment**、**Number of Installment**、Final Installment（共13个字段）

**2. HP Second Schedule Part 1**：Full Name、Short description of goods、Registration number、New/Second Hand、Address where goods kept、Cash price of goods、Deposit、Cash price less deposit、Freight charges、Vehicle registration fee、Insurance/Takaful、Rate per annum、Total amount of term charges、Balance originally payable、Annual Percentage Rate、Hire Purchase Price、差额说明、**Duration of Payment**、**Number of Installment**、**Amount of each Installment**、Final Installment（共21个字段）

**3. Appendix 4**：Dealer/Vendor、Vehicle Model、Engine No.、Chassis No.、Full Name（共5个字段）

**4. Product Disclosure Sheet**：Total amount financed、Tenure、Base Lending Rate、Interest Rate、Annual Percentage Rate、**Your monthly instalment**、Total repayment amount（共7个字段）

> **只有真正检测到字段变化的文件才会重新生成并推送给客户二次签署**，未变化的文件不会重复要求客户确认——这一点我们原型目前是"整份文件都标 Amended"，与原文"只针对有变化的文件推送"存在差异，值得在细化阶段对齐。

### 7.6 Amendment 完成后的归档规则（版本控制）

- **系统不会覆盖初始签署文件**：即使发生 Amendment，原始版本永久保留
- **每轮修订生成的文件作为独立新版本存储**，不覆盖任何历史版本
- 这与我们之前做的"View Version History（v1保留+v2生效）"设计方向一致

### 7.7 E-Acceptance Log 里的三种记录类型

| 类型 | 触发时机 |
|---|---|
| **Hirer Initial Acceptance** | 客户首次完成签约 |
| **Hirer Amendment Acceptance（第几次）** | 客户通过 e-Tracker 完成修订确认，按顺序编号（1st, 2nd, 3rd...） |
| **Bank Acceptance** | 银行方完成签约确认并放款时盖章 |

> 支持**多轮 Amendment**（"Times of Amendment"字段显示第几次），我们原型目前只做了单轮 Amendment，如果客户业务上确实存在多轮变更（比如先改利率、后又改期限），需要考虑多轮 Log 记录的展示。

---

## 8. 异常处理与容错

### 8.1 生物识别相关异常

| 异常场景 | 处理方式 |
|---|---|
| 设备报错（无读卡器/超时/未插卡） | 提示 "Error – no reader..." 并给出两个恢复选项：**Restart Service** 或 **点击 Back 重试** |
| MyKad 未识别/超时 | 提示插卡并点击 "Read Mykad" 重试 |
| 第一次验证 Unmatched | 检查是否申请错误或核实 MyKad 真伪；需填 Remarks 才能继续操作 |
| 第二次验证 Unmatched | 转 OTP 兜底路径 |
| 客户未在 RIB 完成 E-signing | 转 Manual（异常分支 B） |
| 客户不在 RIB 注册（没开网银） | 无法走 Full，需转 Manual/Hybrid（异常分支 D） |
| e-Tracker 状态异常 | 需人工排查（异常分支 E，原文未展开细节） |
| 签约流程中途中断，需要恢复 | 异常分支 F，原文未展开细节（可能需要向客户确认具体场景） |

**这正好回应客户反馈第 8 条**："流程中出现报错，需要提供返回功能"——原文里 Error 状态下明确提供"点击 Back 按钮返回"的选项，这与"Verify 按钮结果返回后消失，用户只能点 Back"的行为一致（HP047 Notes："The 'Verify' button will be disappeared after result returned from device and User only have option to click Back button. Back button will save the result in DB and return to the LOAD$ screen."）——也就是说 **Back 不是取消操作，是"保存当前结果并返回"**，这是一个重要的语义细节，不是简单的"放弃/取消"。

### 8.2 案件层面的校验拦截

系统在多个环节设置了 Validator（详见第12节），核心逻辑是"若关键动作未完成，禁止案件继续流转"，而不是允许"先流转、后补录"。

---

## 9. 报表与文档归档

### 9.1 E-Acceptance Print Log（弹窗内打印日志）

从 E-Acceptance 弹窗点击 **"Print Log"** 按钮生成，字段包含：

**Header（申请人信息）**：Name（含身份证号）、**Relationship to Application**、App. Ref. No.、Bank Name（按 Lending Type 判断显示 "Hong Leong Bank Berhad" 或 "Hong Leong Islamic Bank"）、Lending Type、Loan Account No.

**Table（逐笔签约记录）**：E-Acceptance Type（Hirer Initial / Hirer Amendment(N) / Bank Acceptance）、Product Disclosure Sheet（Y/Blank）、Second Schedule Part 1（Y/Blank）、HP Agreement & T&C（Y/Blank）、Appendix 4（Y/Blank，仅Used/Recond适用）、E-Acceptance Status（Completed）、E-Acceptance Date Time、**Remark**（按类型显示不同内容：Initial 显示 Biometric/OTP Acceptance；Amendment 不显示备注；Bank Acceptance 显示 "Funded"）

**这正好对应客户反馈第 10、11 条**：字段清单基本吻合，唯一差异是客户提到的字段名"Name Relationship to Application"应理解为两个独立字段（Name 和 Relationship to Application），书写时连在一起了。

### 9.2 Biometric Report（生物识别详情页报表）

在 Biometric Scanning Details 页面点击 **"Report"** 按钮下载，按**每个申请人单独生成**。字段沿用第5.5节详情页字段。

### 9.3 CRA Report

在 Application Screen 点击 "Report" 生成，新增两列：`Identity Verification (E)`、`Agreement Acceptance Type (E)`、`Status (E)`。注意：若为 E-Acceptance 案件，原有的"Customer Biometric (Non-E)"字段显示为 Blank（不适用）。

### 9.4 HP Funding Report

新增三个字段：`Identity Verification (E)`、`E-Acceptance Status (E)`、`Agreement Acceptance Type (E)`。

### 9.5 归档规则（对应客户反馈第 9 条）

**这正好回应客户反馈第 9 条**："For biometric performed via CrediOS no matter e-acceptance or manual acceptance, Biometric report is not mandatory to upload manually, CRA can view the report in doc library."

原文对应逻辑（`attachLetter` / `generateCRACompile` 函数逻辑）：
- 客户完成生物识别或 OTP 验证后，**系统自动**将已签署文件（HP Agreement Part 1、Second Schedule、Appendix 4、Product Disclosure Sheet）盖章后挂载到 Attachment 附件页
- **不需要柜员手动上传** Biometric Result Slip 作为放款文件——"under e-acceptance process customer biometric result slip is not required to be submitted. It will be auto-attached."（Training Deck FAQ 原文）
- CRA 可以直接在系统里查看这些自动挂载的文件

这与我们之前"移除 Document Library tab"的改动方向需要重新斟酒——**CRA 查看已归档文件的入口本身是原始需求明确要求的功能**，不应该被完全删除，而应该确认它现在挪到了哪个界面/tab，或是否需要保留一个简化版本供 CRA 查阅。

### 9.6 Defects Attachment 自动上传（放款前补件环节）

CRA Checker 打回"Defects Pending Rectification"时，柜员在 Defect Upload Document 页面：
1. 选择 Document Type
2. 若 **Upload Manual = No**：系统自动抓取最新版本文件挂载，**Browse 按钮禁用**，不需要手动选择文件上传
3. 若该文件类型在系统里确实找不到 → 提示 "document not exist, please select the document and upload"，此时允许切到 **Upload Manual = Yes** 走手动上传
4. Description 描述框会根据挂载的文件自动预填，但字段仍可编辑

---

## 10. 系统集成与接口

### 10.1 Infobip SMS 网关

- Amendment 通知短信固定走 **Infobip** 网关（不走原有的 M3Tech/Exchange 网关）
- 短信模板（Code: `EAA`，Description: E-Acceptance Amendment Notification）：

  > "HLB: Dear customer, please review and accept the changes to your loan/financing documents via the link below. www.hlb.com.my/etracker"

- 收件人固定为 Primary Customer

### 10.2 与 LOAD$ 服务对接的三个报文

1. **Application Status Inquiry**（`APL_STAT_INQ`）：新增字段 `hpAgreementInd`，用一个复合状态值（1-6）表达"电子签指示 + 第一次签署完成 + 是否待二次签署 + 二次签署完成"的组合状态，供 e-Tracker 判断进度条展示
2. **Document Inquiry**（`EHPA_ATTACH_INQ`）：新增
3. **Download Attachment Inquiry**（`DLOAD_ATTACH_INQ`）：新增

客户签约状态回传报文：**Acceptance Decision Message**（`LD0008`）

### 10.3 与 RIB 服务对接

生物识别状态和签约状态需要同步更新到 RIB，走新的接口报文（字段细节见 TRS 文档，本 FRS 未展开）。

### 10.4 定时任务（Scheduler）

| 任务名 | 用途变化 |
|---|---|
| `executeAutoCRAEmailTrigger` | 既有任务，逻辑迁移到新函数 `generateCRACompile` |
| `executeGenerateLHDNXMLFileJobTrigger` | 按签约类型（E-Acceptance/Manual）拆分生成不同的 LHDN 印花税申报文件 |
| `batchSendSmsTrigger` | 排除走 Infobip 的 Amendment 通知短信（避免重复发送） |

---

## 11. 配置参数（General Constant）汇总

| Constant Code | 作用 | 取值示例 |
|---|---|---|
| `E_ACCEPTANCE_ON_OFF` | 电子签整体开关 | ON / OFF |
| `E_ACCEPTANCE_GOLIVE_DATE` | 上线截止日期，只对之后创建的新案件生效 | DD/MM/YYYY 00:00 |
| `E_ACCEPTANCE_COMBO` | 是否允许电子签/手动签互相切换 | `E[E]`（仅电子签）/ `E[M]`（可切换） |
| `BIOMETRIC_ATTEMPT_COUNTER` | 生物识别最大重试次数（含Error） | 默认 999 |
| `BIOMETRIC_SUCCESSFUL_COUNTER` | 最大成功验证触发次数（不含Error） | 默认 999 |
| `BIOMETRIC_CHECK_SELLER` | 是否要求 Seller(Direct) 也做生物识别 | I（个人）/ C（公司）/ OFF |

---

## 12. 关键校验逻辑（Validator）汇总

| Validator | 校验内容 | 失败提示 |
|---|---|---|
| `ValidateEAcceptanceEligible` | 是否符合电子签准入（个人+无担保人+Dealer渠道） | "Application not eligible for E-Acceptance, please proceed with manual acceptance" |
| `ValidateEAcceptanceCombo` | 是否允许在 E-Acceptance 与 Manual 间切换 | "Application not allow to change to manual acceptance, please proceed with E-Acceptance" |
| `ValidateBiometricComplete` | 生物识别是否完成 | 依状态分三种提示（Matched放行 / Unmatched转手动 / Not Done要求先完成） |
| `isEAccptAmendmentComplete` | Amendment 是否已收到客户确认回执 | "Customer has not performed acceptance on the amendment request." |
| `ValidateEAcceptanceComplete` | 初次签约是否已收到 RIB 确认标志 | "Customer has not performed acceptance." |
| `5.1 MANDATORY CHECK`（HP047） | 命中矩阵 YES 但未完成生物识别 | "Please complete the Biometric scanning" |
| `5.2 UNSUCCESSFUL BIOMETRIC`（HP047） | Unmatched/Error 但 Remarks 为空 | "Biometric Status is Unmatched/Error without any remarks. Please input the remarks..." |

---

## 13. 与当前原型的差异核对清单

结合前面各节内容，以下是与我们当前 `e-acceptance-prototype.html` 原型的已知差异，按优先级排列供下一轮迭代参考：

| # | 原始需求 | 当前原型现状 | 建议 |
|---|---|---|---|
| 1 | Restart Service 是 **Error 状态专属**恢复按钮，非常驻 | 上一轮完全删除 | 恢复，但仅在 Error/设备连接失败态显示 |
| 2 | Biometric 有独立菜单入口（对应 e-Hakmilik 之上） | 嵌在 Acceptance tab 里 | 需与客户确认是否要在原型里做出独立入口的示意 |
| 3 | 生物识别状态含 **Not Done**（第四态），语义等价客户说的"Pending" | 目前只有 matched/unmatched(/skipped) | 补充 Error、Not Done 两态，注意与 EA 流程的 disconnected/ready 等设备态区分开 |
| 4 | 外国人 Passport 客群豁免生物识别，改传文件替代 | 无此分支 | 需求文档中矩阵未覆盖 Passport，需向业务确认新矩阵值，原型需加对应分支 |
| 5 | Trigger Amendment SMS 按钮收到回执后必须 disable，不可重复点 | 当前 "Resend SMS" 常驻可点 | 对齐为"发送后锁定，未收到回执前才允许 Resend" |
| 6 | 只有**检测到字段变化**的文件才重新生成推送客户 | 当前所有文件全标 Amended | 按第 7.5 节字段清单精确判断哪些文件真正变更 |
| 7 | Biometric Report / E-Acceptance Report 由 CRA 在系统内查看，**不需要手动上传** | 已删除 Document Library tab，查看入口不明确 | 需确认查看入口挪到哪里，不能完全删除 CRA 查阅能力 |
| 8 | Amendment 支持多轮（1st, 2nd, 3rd...），Log 按轮次编号 | 当前只做单轮 Amendment | 若客户业务需要多轮，需设计 Log 多轮次展示 |
| 9 | Error 场景下 "Back" 按钮语义是"保存当前结果并返回"，非取消 | 未明确区分 | 原型里返回类按钮的文案与行为需要与"取消"类按钮做区分 |
| 10 | 报表字段名是 App.Ref.No / Name / ID No / Staff ID / Verification Type / Date&Time Request/Response / Biometric Status / Triggering Point / Triggering Counter / Remarks | 原型左侧面板字段基本覆盖，但字段命名和分组需逐一核对 | 建议做一张字段级别的映射表 |

---

## 附：术语速查表（英文原词 → 中文，供文案对齐）

| 英文 | 中文 |
|---|---|
| Letter Printing | 信件打印步骤（工作流节点名，不翻译按钮文案） |
| Letter Printing E-Acceptance | 信件打印-电子签约步骤（新增工作流节点） |
| Sales Pending Fund Document | 销售待补充放款文件步骤 |
| Identity Verification | 身份验证（第一次生物识别） |
| E-Acceptance Confirmation | 电子签约确认（第二次生物识别） |
| Manual Acceptance Verification | 人工签约验证（生物识别） |
| Matched / Unmatched / Error / Not Done | 匹配 / 不匹配 / 错误 / 未执行 |
| Acceptance Flag | 接受标志（RIB回传给LOAD$，表示客户已在网银端接受协议） |
| CILT | Change In Loan Term，贷款条件变更 |
| Hirer Initial Acceptance | 借款人初次签约 |
| Hirer Amendment Acceptance | 借款人修订签约 |
| Bank Acceptance | 银行签约（放款时盖章） |
| Ready for Amendment Acceptance | 准备好接受修订签约（销售触发动作） |
| Trigger Amendment SMS | 触发修订短信通知 |
| Review Now | 立即查看（客户在 e-Tracker 的操作按钮） |
| Route to CRA checker | 路由至 CRA 复核 |
| Defect Upload Document | 缺陷补件上传页面 |

---

*文档整理时间：2026-07-21（对应 draft-v2 冻结快照同期）。若原始 vendor 文档后续有新版本，需要重新核对本整理稿的准确性。*
