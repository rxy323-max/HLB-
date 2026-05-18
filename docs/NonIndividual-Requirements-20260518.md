
# Non-Individual申请需求明细

## 功能模块概览

### 1.1模块及内容一览

| 模块编号 | 模块名称 | 说明 |
| --- | --- | --- |
| M1 | 申请入口与身份验证 | 入口功能 |
| M2 | 实体类型自动识别与路由 | 核心差异化逻辑 |
| M3 | 企业身份信息录入 | 主表单功能 |
| M4 | 关联人管理 | 担保人/股东/董事管理 |
| M5 | UBO穿透识别 | AML合规核心 |
| M6 | 材料上传与管理 | AIOCR模块功能 |
| M7 | 提交风控审核 （默认进CED） | 核心风控 |
| M8 | 审批工作流（回退） | 风险审批跟进 |
| M9 | BNM CCRIS报送（新） | 监管报送 |
| M10 | 放款跟进（新材料） | 业务流程闭环 |
| M10 | 异常处理中心 | 运营支撑 |


### 1.2分步骤录入流程

| 步骤 | 模块名称 | 说明 |
| --- | --- | --- |
| 1 | 申请角色选择 | 通过id和cif查询客户信息，CIF Number，Name / ID Type |
| 0 | 渠道信息录入 | 渠道、来源等信息 |
| 2 | 企业身份概况 | 录入或确认企业基础身份信息、企业类型、注册/识别信息等 |
| 3 | 业务运营详情 | 录入企业经营情况、主营业务、经营年限、业务规模等 |
| 4 | 财务与经营数据 | 录入财务数据、营收、利润、负债、经营表现等 |
| 5 | 地域与税务 | 录入企业所在地、经营区域、税务相关信息 |
| 6 | 合规审查 | 录入或确认合规、监管、风险审查相关信息 |
| 7 | 关联方信息 | 录入股东、董事、担保人、UBO、关联企业等相关方信息 |
| 8 | 地址与联系信息 | 录入企业注册地址、经营地址、联系人及联系方式 |
| 9 | 业务确认与同意 | 完成信息确认、声明、授权及同意事项 |


## 二、实体类型定义

### 2.1实体类型表
系统支持12种Entity Type（A~L），根据SSM ID或等效证件的第5-6位自动判定。

| 类型码 | 实体名称(英文) | 实体名称(中文) | 法律地位 | 债务逻辑 | 活跃状态 |
| --- | --- | --- | --- | --- | --- |
| A | Private Limited Company(Sdn Bhd) | 私人有限公司 | 独立法人 | 有限责任 | 活跃 |
| B | Berhad(Bhd) | 公众有限公司 | 独立法人 | 有限责任 | 活跃 |
| C | Branch of a Foreign Company | 外国分行 | 非独立法人 | 无限责任(母公司兜底) | 活跃 |
| D | Sole Proprietorship | 独资企业 | 非独立法人 | 个人无限责任 | 活跃 |
| E | General Partnership | 常规合伙 | 非独立法人 | 连带无限责任 | 活跃 |
| F | Local PLT | 常规有限责任合伙 | 独立法人 | 有限责任 | 活跃 |
| G | Foreign PLT | 外国PLT | 独立法人 | 有限责任 | 活跃 |
| H | Professional PLT | 专业PLT | 独立法人 | 双层责任机制 | 活跃 |
| I | Virtual BE | 虚拟商业企业 | 无实体法地位 | N/A | 非活跃 |
| J | Virtual Soc. | 虚拟社团/协会 | 非营利社团 | 视章程 | 非活跃 |
| K | Government | 政府/法定机构 | 法定实体 | 主权兜底 | 非活跃 |
| L | East Malaysia SE | 东马特殊企业 | 非独立法人 | 个人无限责任 | 活跃 |


### 2.2各实体类型详细定义

#### 2.2.1 A类-Sdn Bhd（私人有限公司）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM（单一管辖） |
| ID Type | Certificate of Incorporation(SSM ID) 新版格式：201901XXXXXX 旧版格式：XXXXXX-W |
| UBO规则 | 向上穿透识别持股>25%或拥有实际控制权的自然人 |
| 最小化材料 | Superform+董事会决议(BR，需明确购车融资金额)+审计报告+6个月银行流水 验证标准：SSM状态Active，BR授权额度符合章程 |
| 担保要求 | 强制要求1-2名董事个人担保(PG) |
| 签约主体 | 公司 |
| 签字人 | BR授权董事 |
| Constitution Code | R-Sdn Bhd/Private Ltd |
| Basic Group | 24.0-Companies |
| 催收路径 | 拖车拍卖→起诉公司清盘→执行担保人(PG)追偿差额 |


#### 2.2.2 B类-Berhad（公众有限公司）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM+证监会(SC) |
| ID Type | Certificate of Incorporation(SSM ID) 旧版后缀：-T |
| UBO规则 | 豁免/简化：上市公司通常豁免，直接采纳前5名大股东名册 |
| 最小化材料 | Superform+董事会决议+公开审计报表 验证标准：BR授权额度是否符合章程规定 |
| 担保要求 | 大型Bhd通常豁免PG |
| 签约主体 | 公司 |
| 签字人 | BR授权高管 |
| Constitution Code | U-Bhd/Public Ltd Co |
| Basic Group | 24.0-Companies |
| 催收路径 | 拖车拍卖→起诉公司；一般不涉及个人追偿 |


#### 2.2.3 C类-Branch（外国分行）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM（需海外证明文件） |
| ID Type | Foreign Business Registration(SSM ID) 旧版后缀：-X |
| UBO规则 | 跨国穿透：需追溯海外母公司股权结构，找持股>25%自然人 |
| 最小化材料 | Form 79/80+母公司授权+分行审计报表+母公司审计报表 验证标准：核实本地代表授权有效期 |
| 担保要求 | 必须由海外母公司提供企业担保(CG) |
| 签约主体 | 分行（代表母公司） |
| 签字人 | 本地授权代表 |
| Constitution Code | O-Others（无直接映射） |
| Basic Group | 24.0-Companies |
| 催收路径 | 拖车拍卖→查封分行资产→跨国起诉母公司履行CG |


#### 2.2.4 D类-Sole Proprietorship（独资企业）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM（1956年商业注册法） |
| ID Type | Business Registration(SSM ID) 新版格式：201903XXXXXX 旧版格式：XXXXXX-A（如001234-A） |
| UBO规则 | 直接确认：登记的老板本人即UBO，无需穿透 |
| 最小化材料 | Form A&D+6个月银行流水+个人报税表(B/BE) 验证标准：严查老板个人的CCRIS/CTOS信用 |
| 担保要求 | 通常无须担保人（本身已负无限责任） |
| 签约主体 | 老板个人 |
| 签字人 | 老板本人 |
| Constitution Code | S-Sole Proprietor |
| Basic Group | 21.0-Sole Proprietors |
| 催收路径 | 拖车拍卖→直接向老板个人追讨差额→申请老板个人破产 |


#### 2.2.5 E类-Partnership（常规合伙）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM |
| ID Type | Business Registration(SSM ID) |
| UBO规则 | 直接确认：全体合伙人均为UBO |
| 最小化材料 | Form A&D+合伙协议+全体合伙人报税表 验证标准：核对合伙协议中的借贷权力条款 |
| 担保要求 | 无须额外担保 |
| 签约主体 | 合伙企业 |
| 签字人 | 全体合伙人需共同签署 |
| Constitution Code | P-Partnership |
| Basic Group | 22.0-Partnerships |
| 催收路径 | 拖车拍卖→向全体合伙人追讨差额→申请连带破产 |


#### 2.2.6 F类-Local PLT（常规有限责任合伙）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM（2012年PLT法） |
| ID Type | Registration Certificate(SSM ID) 格式：LLP0000001-LGN |
| UBO规则 | 穿透规则：识别享有>25%利润分配权的合伙人 |
| 最小化材料 | PLT证书+年度声明+决议+银行流水 验证标准：必须有指定"合规官(Compliance Officer)" |
| 担保要求 | 强制要求核心合伙人提供PG |
| 签约主体 | PLT企业 |
| 签字人 | 合规官或授权合伙人 |
| Constitution Code | P或O（无直接映射时归入Others） |
| Basic Group | 26.0-Limited Liability Partnership |
| 催收路径 | 拖车拍卖→起诉PLT清算→执行担保人(PG)追偿 |


#### 2.2.7 G类-Foreign PLT（外国PLT）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM（需海外母体证明） |
| ID Type | Foreign Business Registration(SSM ID) 格式：LLP0000001-FGN |
| UBO规则 | 跨国穿透：追溯海外母体LLP的核心合伙人 |
| 最小化材料 | 海外PLT证书+本地注册文件+决议 验证标准：核实本地合规官身份 |
| 担保要求 | 要求海外合伙人PG或海外母体CG |
| 签约主体 | 外国PLT本地分支 |
| 签字人 | 授权本地代表 |
| Constitution Code | P或O（无直接映射） |
| Basic Group | 26.0-Limited Liability Partnership |
| 催收路径 | 同C类，涉及跨国追诉 |


#### 2.2.8 H类-Professional PLT（专业PLT）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | SSM+行业协会（双重管辖） |
| ID Type | Registration Certificate(SSM ID Default) |
| UBO规则 | 必须是持证专业合伙人(>25%) |
| 最小化材料 | PLT证书+有效执业证书+协会批准信 验证标准：一票否决—执业证过期则拒绝进件 |
| 担保要求 | 要求核心专业合伙人提供PG |
| 签约主体 | 专业PLT实体 |
| 签字人 | 授权执业合伙人 |
| Constitution Code | P或O（无直接映射） |
| Basic Group | 26.0-Limited Liability Partnership |
| 催收路径 | 拖车拍卖→起诉PLT→执行担保人(PG)资产 |


#### 2.2.9 I类-Virtual BE（虚拟商业企业）

| 维度 | 定义 |
| --- | --- |
| 状态 | inactive for HP—不可办理 |
| ID Type | Dummy Id-Business Enterprise |
| 处理方式 | 系统占位符。必须转换为A/D/F类方可继续办理 |


#### 2.2.10 J类-Virtual Soc.（虚拟社团/协会）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | 社团注册局(ROS) |
| ID Type | Dummy Id-Society,Assoc.&Others |
| UBO规则 | 职位确认：UBO为核心委员会成员（主席、财政等） |
| 最小化材料 | ROS证书+委员会决议 验证标准：章程需允许信贷买车 |
| 担保要求 | 强制要求主要委员会成员签署PG |
| 签约主体 | 社团实体 |
| 签字人 | 授权之委员会成员 |
| Constitution Code | A/C/T（Assoc/School/Society/Cooperative/Trade Union） |
| Basic Group | 43.0-Societies/Associations |
| 催收路径 | 拖车拍卖→追讨社团资产→视章程追究签字人 |


#### 2.2.11 K类-Government（政府/法定机构）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | 财政部/法案设立 |
| ID Type | Government And Its Agencies |
| UBO规则 | 全面豁免：防洗钱白名单 |
| 最小化材料 | 政府部门/财政部公函(LOU) 验证标准：核实公函真实性及预算批文 |
| 担保要求 | 财政兜底，免担保 |
| 签约主体 | 政府部门/法定机构 |
| 签字人 | 获授权长官 |
| Constitution Code | V/W/B/G/H/F等（多对一映射） |
| Basic Group | 31.0/32.0/33.0/34.0（视具体政府层级） |
| 催收路径 | 极少发生；违约由财政协调，不走常规催收 |


#### 2.2.12 L类-East Malaysia SE（东马特殊企业）

| 维度 | 定义 |
| --- | --- |
| 管辖机构 | 东马地方议会（非SSM） |
| ID Type | Business Registration（实质为地方政府Trading License） |
| UBO规则 | 直接确认：执照上的持牌人即UBO |
| 最小化材料 | Trading License（东马执照）+老板报税表 验证标准：人工严查地方执照有效期限 |
| 担保要求 | 同D类，通常无须担保人 |
| 签约主体 | 老板个人 |
| 签字人 | 老板本人 |
| Constitution Code | 类似S处理（无直接映射） |
| Basic Group | 21.0-Sole Proprietors |
| 催收路径 | 拖车拍卖→在东马法庭发起诉讼追究老板无限责任 |


## 角色体系与关联人管理

### 4.1 Relationship To Application
```
选择关联人角色 (Relationship To Application)            
│          ├── Guarantor（担保人）                                  
│          │       • Director/Guarantor                            
│          │       • Gtr/Dir/Shareholder                           
│          │       • Guarantor                                     
│          │       • Guarantor/Shareholder                         
│          │       • Partner of Partnership                        
│          │       • Corporate Guarantor                           
│          │                                                            
│          ├── Owner（所有者）                                      
│          │       • Partner of Partnership                         
│          │       └── Sole Proprietorship                         
│          │                                                            
│          └── Non-Guarantor（非担保人）                             
│                  • Director                                       
│                  • Director/Shareholder                           
```

│                  └── Shareholder               

### 4.2 贷款角色+公司所有权角色+签约权

| 概念 | 维度 | 回答问题 | 是否自然人 | 报送CCRIS | 收入计入DSR |
| --- | --- | --- | --- | --- | --- |
| 主申请人 | 贷款角色（第一维） | 这笔贷款谁借？ | ❌ （企业） | ✅ | ✅ （企业） |
| Guarantor | 贷款角色（第一维） | 谁担保？ | ✅ | ✅ | ✅ |
| Non-Guarantor | 贷款角色（第一维） | 还有谁参与申请？ | ✅ | ✅ | ❌ |
| Owner | 所有权 （第二维） | 谁拥有这个企业？ | ✅ | ❌ | ❌ |
| Partner | 所有权 （第二维） | 合伙企业的成员是谁？ | ✅ | ❌ | ❌ |
| Shareholder | 所有权 （第二维） | 股东是谁（包括法人）？ | ❌ （法人） | ❌ | ❌ |
| UBO | 所有权 （第二维） | 最终控制者是谁（穿透后）？ | ✅ （必须） | ✅ | ❌ |
| Signatory | 签约权力（第三维） | 谁能签字？ | ✅ | ❌ | ❌ |


### 4.3角色类别总览
系统定义三大角色类别、共11种角色。当主借人为Non-Individual时，根据Entity Type可添加以下人员作为联合申请人：

#### 基础单一角色（4种）：单一贷款角色or所有权角色 

| 角色 | 英文 | 中文 | 与贷款关系 | 风控含义 |
| --- | --- | --- | --- | --- |
| Director | Director | 董事 | Non Guarantor | 授权签字人，不承担个人连带责任（除非欺诈） |
| Shareholder | shareholder | 股东 | Non Guarantor | 以认缴出资额为限承担有限责任 |
| Guarantor | Guarantor | 担保人 | Guarantor | 具有不可撤销代偿义务 |
| UBO | Ultimate Beneficial Owner | 最终实益控制人 | Non Guarantor | AML合规核心，>25%持股/投票权自然人 |


#### 信贷复合角色（4种）

| 角色英文 | 中文 | 担保属性 |
| --- | --- | --- |
| Director/shareholder | 董事兼股东 | Non Guarantor |
| Guarantor/shareholder | 担保人兼股东 | Guarantor |
| Director/Guarantor | 董事兼担保人 | Guarantor |
| Guarantor/Director/shareholder | 三合一 | Guarantor |


#### 特定架构角色（3种）

| 角色 | 中文 | 担保属性 | 适用Entity Type |
| --- | --- | --- | --- |
| Sole Proprietorship | 独资经营者 | Owner | D |
| Partner of Partnership | 常规合伙人 | Owner/Guarantor | E |
| Partner(LLP only) | LLP合伙人 | Guarantor | F |


### 4.4 完整角色映射表
以下表格定义了每种角色在Individual和Corporate主借人场景下的适用性：

| Relationship Type(Type) | Individual主借适用 | Corporate主借适用 | 角色类别 |
| --- | --- | --- | --- |
| Director/Guarantor | ✅Y | ❌N | Guarantor |
| Guarantor | ✅Y | ❌N | Guarantor |
| Guarantor/Director/Shareowner(Gtr/Dir/Shareowner) | ✅Y | ❌N | Guarantor |
| Guarantor/Shareowner | ✅Y | ❌N | Guarantor |
| Partner of Partnership | ✅Y | ❌N | Owner/Guarantor |
| Partner(LLP only) | ✅Y | ❌N | Guarantor |
| Sole Proprietorship | ✅Y | ❌N | Owner |
| Director(Non-Guarantor) | ✅Y | ❌N | Non-Guarantor |
| Director/Shareowner(Non-Guarantor) | ✅Y | ❌N | Non-Guarantor |
| Shareowner(Shareholder) | ✅Y | ✅Y | Non-Guarantor |
| Ultimate Beneficial Owner(UBO) | ✅Y | - | Non-Guarantor |


### 4.5 关系维度定义
每个关联人在系统中维护三个维度的关系：

| 维度 | 说明 | 示例取值 |
| --- | --- | --- |
| 和主借人(公司)的关系 | 该自然人在企业中的职位 | Director,shareholder,owner… |
| 和这笔贷款的关系 | 在本次贷款中的角色 | Guarantor,Non Guarantor,owner |
| 和主借人(个人)的关系 | 人际关系（如主借人为个人时） | Spouse,Father,Mother,Child,Brother,Sister,Friend,Relative… |


### 4.6 后端信息查询规则（6项查询）
所有申请人都需经过后端查询，但不同角色的查询范围有差异：

| 序号 | Service Name | Data Source | 所有申请人 | 仅担保人 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | CIF Profile | HOST | ✅ | - | 区分ETB/NTC，获取基本信息 |
| 2 | WT Whitelist | CrediOS | - | ✅ | 查询白名单资格（豁免收入认证） |
| 3 | Income DB | HLB API | - | ✅ | 获取历史收入数据(Gross/Net) |
| 4 | App History | CrediOS | ✅ | - | 查询该ID的历史车贷记录 |
| 5 | Pre-Consent | e-Consent | ✅ | - | "获客优先"场景预同意签署记录 |
| 6 | HP Line | BCB Source | - | ✅* | *仅Non-Individual主申请人；命中时弹窗选择案件类型 |

核心规则：由于担保人将与主申请人合并计算DSR并查询CCRIS，因此担保人必须执行第2（WT Whitelist）、3（Income DB）、5（Pre-Consent）项查询。

### 4.7 不同实体担保要求

| 实体类型 | 担保要求 | 签约主体 | 签字人 |
| --- | --- | --- | --- |
| A(Sdn Bhd) | 强制1-2名董事PG | 公司 | BR授权董事 |
| B(Bhd) | 大型通常豁免PG | 公司 | BR授权高管 |
| C(Branch) | 必须海外母公司CG | 分行 | 本地授权代表 |
| D(Sole Prop) | 通常无须PG | 老板个人 | 老板本人 |
| E(Partnership) | 无须额外担保 | 合伙企业 | 全体合伙人 |
| F(Local PLT) | 强制核心合伙人PG | PLT企业 | 合规官/授权合伙人 |
| G(Foreign PLT) | 海外合伙人PG或CG | 外国PLT分支 | 授权本地代表 |
| H(Prof.PLT) | 强制核心专业合伙人PG | 专业PLT | 授权执业合伙人 |
| J(Virtual Soc.) | 强制委员会成员PG | 社团实体 | 授权委员会成员 |
| K(Government) | 财政兜底免担保 | 政府/法定机构 | 获授权长官 |
| L(East MY SE) | 通常无须PG | 老板个人 | 老板本人 |


### 4.8 签约主体与签字人规则汇总

| Entity Type | 签约主体 | 签字人 | 担保要求 | 特殊约束 |
| --- | --- | --- | --- | --- |
| A | 公司 | BR授权董事 | 非强制(通常1名PG) | - |
| B | 公司 | BR授权高管 | 通常豁免PG | - |
| C | 分行(代表母公司) | 本地授权代表 | 必须母公司CG | 需核查母公司授权有效期 |
| D | 老板个人 | 老板本人 | 无需PG | - |
| E | 合伙企业 | 全体合伙人 | 所有Owner必须填 | 全体共同签署 |
| F | PLT企业 | 合规官/授权合伙人 | 所有Partner加为G | 必须有指定Compliance Officer |
| G | 外国PLT本地分支 | 授权本地代表 | 海外PG/CG | - |
| H | 专业PLT | 授权执业合伙人 | 核心专业PG | 执业证必须有效 |
| J | 社团实体 | 授权委员会成员 | 委员会PG | 章程须允许信贷买车 |
| K | 政府/法定机构 | 获授权长官 | 免担保 | 财政兜底 |
| L | 老板个人 | 老板本人 | 无需PG | 人工严查地方执照 |


### 4.9系统录入时的角色流程
企业信息
财务
组织架构
关联人、ubo、签字

## 三、UBO及交互说明

### 3.1 UBO识别标准（马来西亚央行BNM要求）

| 实体类型 | UBO规则 | 说明 |
| --- | --- | --- |
| A(Sdn Bhd) | 穿透原则 | 向上穿透识别持股>25%或拥有实际控制权的自然人 |
| B(Bhd) | 豁免/简化 | 上市公司通常豁免，或直接采纳前5名大股东名册 |
| C(Branch) | 跨国穿透 | 需追溯海外母公司股权结构 |
| D(Sole Prop) | 直接确认 | 登记的老板本人即UBO，无需穿透 |
| E(Partnership) | 直接确认 | 全体合伙人均为UBO |
| F(Local PLT) | 穿透规则 | 识别享有>25%利润分配权的合伙人 |
| G(Foreign PLT) | 跨国穿透 | 追溯海外母体LLP的核心合伙人 |
| H(Prof.PLT) | 穿透规则 | 必须是持证专业合伙人(>25%) |
| I(Virtual BE) | N/A | 系统占位符，不可办理 |
| J(Virtual Soc.) | 职位确认 | UBO为核心委员会成员(主席、财政等) |
| K(Government) | 全面豁免 | 防洗钱白名单 |
| L(East MY SE) | 直接确认 | 执照上的持牌人即UBO |


### 3.2第一层自动抽取（Experian API）

| 字段 | 说明 | 数据来源 |
| --- | --- | --- |
| Active Directors | 活跃董事列表 | Experian API—Option CP/BP/LLP |
| Individual Shareholders>25% | 持股>25%的个人股东 | Experian API |
| Corporate Shareholders | 法人股东 | Experian API |

API调用逻辑：
Private Ltd（A/B/C）→Option CP
Sole Prop/Partnership（D/E）→Option BP
PLT（F/G/H）→Option LLP
API调用参数：

| Key | Value | Mandatory | Remark |
| --- | --- | --- | --- |
| ProductType | IBP/CP/BP/OA/OR/ECP/EBP/LLP/SGCB/SGECB/SGII | Yes | IBP/OA=Individual;CP/ECP/OR=Company;BP/EBP=Business;LLP=PLT |
| EntityName | Name of the entity | Yes | - |
| EntityId | Name/IC No/Passport/Business No/Company ID/Registration ID | Yes | - |


### 3.3第二层开始手动穿透
重要：受Experian API限制，无法自动穿透法人股东
穿透规则：
若法人股东持股>25%，必须手动钻取其下一层股东
操作：点击法人股东节点→手动输入该公司的股东信息
可重复穿透：第二层→第三层→第四层，直到找到最终个人UBO
每层穿透均需录入：姓名+ID+持股比例+持股公司
total sharehold≠100%，no need to check

### 3.4树形图及前端展示
系统以树形图展示股东结构：
Step 1:显示第一层股东
└─[Person A]持股15%→不足25%，不标记UBO，可选
└─[Person B]持股30%→超过25%，标记[Set as UBO]✓
└─[XYZ Co Sdn Bhd]持股55%→法人股东，显示[⊕Drill-down]按钮
│
▼点击Drill-down
Step 2:手动输入法人股东SSM ID，获取其股东
└─[Person C]持股70%→超过25%（55%×70%=38.5%），标记[Set as UBO]
└─[Person D]持股30%→超过25%（55%×30%=16.5%），不足25%，不标记
│
▼若Person D持股法人股东，继续drill-down...

| Entity Type | UBO录入区 | 系统行为 |
| --- | --- | --- |
| A（Sdn Bhd） | 显示 | 强制穿透，提交时校验至少1名UBO |
| B（Berhad上市） | 隐藏 | 自动豁免，显示提示"上市公司豁免UBO穿透" |
| C（外国分行） | 显示 | 穿透到海外母公司，需手动drill-down |
| D（独资） | 隐藏 | 自动标记Owner为UBO |
| E（合伙） | 隐藏 | 自动标记全体Partner为UBO |
| F/G/H（PLT） | 显示 | 穿透持股>25%的Partner |
| J（社团） | 显示 | 职位确认模式，勾选UBO |
| K（政府） | 隐藏 | 自动豁免，显示提示"政府机构豁免UBO穿透" |
| L（东马） | 隐藏 | 自动标记持牌人为UBO |


## 数据来源说明

### 5.1数据来源一览

| 层级分类 | 数据来源/系统 | 典型产出/使用结果 |
| --- | --- | --- |
| Data Entry&Frontend Sources | Dealer API | 新订单、车辆资料、附件材料、自动建单数据 |
| Data Entry&Frontend Sources | Gemini OCR | 身份信息、收入字段、财务字段、文件分类结果 |
| Data Entry&Frontend Sources | Manual Entry | 人工录入字段、修正字段、审批备注 |
| External 3rd Party APIs | Experian API(IT) | 董事信息、股东信息、持股比例、UBO股权树 |
| External 3rd Party APIs | CCRIS BNM | 信用报告、债务记录、贷款记录、负债率计算输入 |
| External 3rd Party APIs | CTOS | CTOS报告、诉讼记录、商业信用信息 |
| External 3rd Party APIs | FIS 金融信息服务数据库 | 车辆品牌、车型、变体、指导价、估值、e-Hakmilik状态 |
| External 3rd Party APIs | Infobip | 邮箱验证结果、OTP发送记录、短信/邮件通知状态 |
| Internal HLB Systems | HOST RBS/AS400 | CIF信息、内部贷款敞口、车商额度、账户信息 |
| Internal HLB Systems | Ascend | 信用卡额度、分期余额、总负债计算输入 |
| Internal HLB Systems | HLB Income API/Green Earth | 历史收入数据、Gross/Net收入、流水记录 |
| Internal HLB Systems | BCB Source | HP Line资格、预批复白名单查询结果 |
| Internal HLB Systems | EIWS 企业影像工作流系统 | 申请文件、合同、日志、归档记录 |
| Risk&Decision Engines | SIRON AML | AML筛查结果、CDD/EDD状态、PEP/制裁名单命中结果 |
| Risk&Decision Engines | Instinct | 欺诈预警、风险命中规则、人工调查触发结果 |
| Risk&Decision Engines | CMSS 信用管理评分系统 | A Score、评分指标、策略变量 |
| Risk&Decision Engines | AIP 预审规则引擎 | Excellent/Pass/Refer/Fail等初步结果 |
| Human Review Units | FMU 反欺诈管理部 | FMU调查结论、风险确认结果、处理建议 |
| Human Review Units | CED/CRA | 审批决定、DSCR等计算结果、放款处理结果 |


### 5.2枚举值详细定义

#### Role To Application枚举值

| 角色类别 | 枚举值 | 中文 | 担保属性 | 适用Entity Type |
| --- | --- | --- | --- | --- |
| Guarantor（担保人） | Director/Guarantor | 董事兼担保人 | Guarantor | A,B,F,H |
|  | Gtr/Dir/Shareholder | 担保人/董事/股东 | Guarantor | A,B |
|  | Guarantor | 担保人 | Guarantor | A~L(全部) |
|  | Guarantor/Shareholder | 担保人兼股东 | Guarantor | A,B,F,H |
|  | Partner of Partnership | 合伙人 | Owner/Guarantor | E |
|  | Corporate Guarantor | 企业担保人 | Guarantor | C,G |
| Owner（所有者） | Sole Proprietorship | 独资经营者 | Owner | D |
| Non-Guarantor（非担保人） | Director | 董事 | Non-Guarantor | A,B,C,F,G,H |
|  | Director/Shareholder | 董事兼股东 | Non-Guarantor | A,B,F,H |
|  | Shareholder | 股东 | Non-Guarantor | A,B,F,H |


#### Enterprise Type枚举值
见实体类型总览表。

#### Basic Group枚举值

| 代码 | 英文描述 | 中文说明 | 适用Entity Type |
| --- | --- | --- | --- |
| 11.0 | Individual | 个人 | - |
| 12.0 | Commercial Bank | 商业银行 | - |
| 13.0 | Islamic Bank | 伊斯兰银行 | - |
| 21.0 | Sole Proprietors | 个体户 | D,L |
| 22.0 | Partnerships | 合伙企业 | E |
| 24.0 | Companies | 公司 | A,B,C |
| 26.0 | Limited Liability Partnership | 有限责任合伙 | F,G,H |
| 31.0 | Federal/Central Government | 联邦/中央政府 | K |
| 32.0 | State Government | 州政府 | K |
| 33.0 | Local Government | 地方政府 | K |
| 34.0 | Statutory Bodies | 法定机构 | K |
| 43.0 | Societies/Associations | 社团/协会 | J |
| 91.0 | Others | 其他 | 兜底 |


#### Constitution Code枚举值

| 代码 | 英文描述 | 中文说明 | 映射自Entity Type |
| --- | --- | --- | --- |
| I | Individual | 个人 | （个人客户） |
| S | Sole Proprietor | 个体户 | D,L |
| P | Partnership | 合伙 | E |
| R | Sdn Bhd/Private Ltd | 私人有限公司 | A |
| U | Bhd/Public Ltd Co | 公众有限公司 | B |
| A | Assoc/School/Society | 社团/学校/社会 | J |
| C | Cooperative | 合作社 | J |
| T | Trade Union | 工会 | J |
| V | Federal Govt | 联邦政府 | K |
| W | Local Govt | 地方政府 | K |
| B | Statutory Body | 法定机构 | K |
| G | Government Body | 政府机构 | K |
| H | Fed Stat Auth | 联邦法定机构 | K |
| F | ODBE-Oth Govt | 其他政府实体 | K |
| Y | NFPE | 非金融公共企业 | GLC类 |
| Q | Central Bank | 央行 | （金融同业） |
| E | Islamic Bank | 伊斯兰银行 | （金融同业） |
| D | DNFI | 开发性金融机构 | （金融同业） |
| K | Finance Co | 财务公司 | （金融同业） |
| N | Int’l Org’n | 国际组织 | （国际机构） |
| O | Others | 其他 | C,F,G,H(兜底) |


#### Entity Type→Constitution Code完整映射

| Entity Type | Constitution Code | 英文描述 | 中文说明 | 映射状态 |
| --- | --- | --- | --- | --- |
| A.Private Limited Company(Sdn Bhd) | R | Sdn Bhd/Private Ltd | 私人有限公司 | ✅完全匹配 |
| B.Berhad(Bhd) | U | Bhd/Public Ltd Co | 公众有限公司 | ✅完全匹配 |
| C.Branch of a Foreign Company | O | Others | 其他 | ⚠️无直接映射 |
| D.Sole Proprietorship | S | Sole Proprietor | 个体户 | ✅完全匹配 |
| E.General Partnership | P | Partnership | 合伙 | ✅完全匹配 |
| F.Local PLT | P或O | Partnership/Others | 合伙/其他 | ⚠️无直接映射 |
| G.Foreign PLT | P或O | Partnership/Others | 合伙/其他 | ⚠️无直接映射 |
| H.Professional PLT | P或O | Partnership/Others | 合伙/其他 | ⚠️无直接映射 |
| I.Virtual BE |  |  | 虚拟ID | ❌无映射 |
| J.Virtual Soc. | A | Assoc/School/Society | 社团/学校/社会 | ✅涵盖 |
|  | C | Cooperative | 合作社 | ✅涵盖 |
|  | T | Trade Union | 工会 | ✅涵盖 |
| K.Government | V | Federal Govt | 联邦政府 | ✅涵盖 |
|  | W | Local Govt | 地方政府 | ✅涵盖 |
|  | B | Statutory Body | 法定机构 | ✅涵盖 |
|  | G | Government Body | 政府机构 | ✅涵盖 |
|  | H | Fed Stat Auth | 联邦法定机构 | ✅涵盖 |
|  | F | ODBE-Oth Govt | 其他政府 | ✅涵盖 |
| L.East Malaysia SE | S | Sole Proprietor | 个体户 | ⚠️类似D类 |


#### Nature of Business枚举值

| 编码 | 英文描述 | 中文描述 |
| --- | --- | --- |
| 1.0 | TRADING | 贸易 |
| 2.0 | WHOLESALE | 批发 |
| 3.0 | MANUFACTURING | 制造 |
| 4.0 | CONSTRUCTION | 建筑 |
| 5.0 | PLANTATION | 种植业 |
| 6.0 | HUSBANDRY | 畜牧业 |
| 7.0 | INSURANCE | 保险 |
| 8.0 | BANKING | 银行 |
| 9.0 | WAREHOUSING | 仓储 |
| 10.0 | TRANSPORTATION | 运输 |
| 11.0 | Agriculture | 农业 |
| 12.0 | Fisheries | 渔业 |
| 13.0 | Restaurant/Hotel Operator | 餐饮/酒店运营 |
| 14.0 | Hawkers/Petty Traders | 小贩/小商贩 |
| 15.0 | Mining/Quarrying | 采矿/采石 |
| 16.0 | Franchise | 特许经营 |
| 17.0 | IT&Telecommunication | IT与电信 |
| 18.0 | Business Services | 商业服务 |
| 19.0 | Clinics(Medical/Dental/Veterinary/Pharmacists) | 诊所/医疗机构 |
| 20.0 | Professional Firms(Accounting/Audit/Tax Consultant) | 专业机构(会计等) |
| 21.0 | Professional Firms(Engineers,Architects&Surveyor) | 专业机构(工程建筑等) |


#### Customer Sector Code枚举值

| 代码 | 英文描述 | 中文说明 |
| --- | --- | --- |
| - | Bumi SME-Micro | 微型土著企业 |
| - | Bumi SME-Small | 小型土著企业 |
| - | Bumi SME-Medium | 中型土著企业 |
| - | Non-Bumiputra Controlled DBE | 非土著控制发展银行企业 |
| - | Non-Resident Controlled DBE | 非居民控制发展银行企业 |


#### 和收入、员工数联动，具体数字填写，联动可改。

#### GP Ratings（ESG环境社会风险评估）

| 代码 | 英文描述 | 中文描述 |
| --- | --- | --- |
| GP 1 | Climate Change Mitigation | 减缓气候变化—业务是否有助于减少温室气体排放 |
| GP 2 | Climate Change Adaptation | 适应气候变化—是否增强抵御气候灾害能力 |
| GP 3 | No Significant Harm to Environment | 无重大环境损害—不能拆东墙补西墙 |
| GP 4 | Remedial Efforts to Promote Transition | 促进转型的补救措施—针对正在努力转型的业务 |

GP Ratings由系统基于Nature of Business Code自动映射生成，前端只读反显。

## 六、材料上传与验证

### 6.1 各实体类型最小材料清单

| Entity Type | 必传材料 | 验证标准 |
| --- | --- | --- |
| A | Superform / 董事会决议(BR) / 审计报告 / 6个月流水 | SSM Active; BR明确购车金额 |
| B | Superform / 董事会决议 / 公开审计报表 | BR授权额度符合章程 |
| C | Form 79/80 / 母公司授权 / 分行审计报表 / 母公司审计报表 | 本地代表授权有效 |
| D | Form A&D / 6个月流水 / 个人报税表(B/BE) | 严查CCRIS/CTOS |
| E | Form A&D / 合伙协议 / 全体合伙人报税表 | 核对借贷权力条款 |
| F | PLT证书 / 年度声明 / 决议 / 银行流水 | 必须有Compliance Officer |
| G | 海外PLT证书 / 本地注册文件 / 决议 | 核实本地合规官身份 |
| H | PLT证书 / 有效执业证书 / 协会批准信 | 执业证过期→一票否决 |
| J | ROS证书 / 委员会决议 | 章程允许信贷买车 |
| K | 财政部/政府部门公函(LOU) | 公函真实性+预算批文 |
| L | Trading License(东马执照) / 老板报税表 | 人工严查执照有效期 |


### 6.2 OCR材料清单

## 七、异常处理与错误提示

### 7.1 异常分类与处理流程

| 异常类型 | 影响 | 处理流程 | 超时规则 | 恢复方式 |
| --- | --- | --- | --- | --- |
| 材料缺失 | 无法完成初步审核 | 发送补件通知 → 客户提交 → 重新验证 | 7个工作日未补件 → 自动关闭 | 重新提交材料 |
| 身份验证失败 | 无法确认合法性 | 人工介入核查 → 补充证明 → 重新验证 | 3次失败 → 永久拒绝 | 更换证明文件 |
| UBO穿透失败 | AML合规不通过 | 协助梳理股权结构 → 提供穿透证明 | 14个工作日无法完成 → 拒绝 | 补充股权结构文件 |
| 担保人不达标 | 担保不充分 | 更换担保人 / 补充额外担保 / 降低额度 | 3次更换仍不达标 → 拒绝 | 更换担保人或降低额度 |
| H类执业证过期 | 一票否决 | 拒绝 → 更新执业证 → 重新申请 | - | 更新执业证后重新进件 |
| J类章程不合规 | 业务不允许 | 社团修改章程 → 重新注册 → 重申请 | 流程复杂 | 提前确认章程 |
| C类母公司授权过期 | 授权存疑 | 要求更新母公司授权 → 重新认证 | 30日内未更新 → 自动暂停 | 更新授权文件 |
| 信用不良(CCRIS) | 风险升高 | 提高利率 / 额外担保 / 降低额度 / 拒绝 | - | 视严重程度分级处理 |
| AML命中黑名单 | 合规红线 | 直接拒绝 → 上报合规 → 记录黑名单 | - | 不可申诉 |
| I类(Virtual BE) | 不可办理 | 引导转换类型 → A/D/F类重新申请 | - | 转换实体类型 |


### 7.2 错误提示文案规范
系统所有错误提示和一期功能保持一致。

| 错误级别 | 前缀样式 | 示例文案 |
| --- | --- | --- |
| Error （阻断性） | [ERR-xxx] | [ERR-001] SSM ID格式无效。请输入正确的新版格式（201901XXXXXX）或旧版格式（XXXXXX-W）。 |
| Warning（警告性） | [WAR-xxx] | [WAR-001] 该企业SSM状态为Inactive，是否继续？（需要审批例外权限） |
| Info （提示性） | [INF-xxx] | [INF-001] 已为您自动填充ETB客户基本信息，请核对后修改。 |


## 附录: 术语表

| 术语 | 英文全称 | 中文含义 |
| --- | --- | --- |
| SSM | Suruhanjaya Syarikat Malaysia | 马来西亚公司注册局 |
| BNM | Bank Negara Malaysia | 马来西亚央行（国家银行） |
| CCRIS | Central Credit Reference Information System | 中央信用资讯参考系统 |
| CTOS | Credit Tip-Off Service | 马来西亚私营征信机构 |
| HP | Hire Purchase | 分期付款购买（车辆融资主要方式） |
| PG | Personal Guarantee | 个人担保 |
| CG | Corporate Guarantee | 企业担保 |
| UBO | Ultimate Beneficial Owner | 最终实益控制人 |
| AML | Anti-Money Laundering | 反洗钱 |
| KYC | Know Your Client | 了解你的客户 |
| PLT | Limited Liability Partnership | 有限责任合伙 |
| BR | Board Resolution | 董事会决议 |
| LOU | Letter of Undertaking | 承诺函/公函 |
| MSIC | Malaysian Standard Industrial Classification | 马来西亚标准工业分类 |
| GP | Guiding Principles | 指导原则（BNM ESG框架） |
| Bumi | Bumiputra | 土著/马来人 |
| NRCC | Non-Resident Controlled Company | 非居民控制企业 |
| ETB | Existing to Bank | 银行现有客户 |
| NTB | New to Bank | 银行新客户 |
| DOR | Date of Registration | 注册日期 |
| CIF | Customer Information File | 客户信息档案 |
| JPJ | Jabatan Pengangkutan Jalan | 马来西亚陆路交通局 |
| ROS | Registrar of Societies | 社团注册局 |
| SME | Small and Medium Enterprise | 中小企业 |
| MNC | Multinational Corporation | 跨国公司 |
| GLC | Government-Linked Company | 政府关联公司 |
| NFPE | Non-Financial Public Enterprise | 非金融公共企业 |
| DNFI | Development Financial Institution | 开发性金融机构 |

