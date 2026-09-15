# 06 放款模块（STP Disbursement）

本目录存放 STP 放款模块的参考资料与需求文档。

## 目录结构

```
06_放款/
├── 参考资料/                              ← 客户提供的原始资料
│   └── Appendix_CRA_Business_Rules_Defect_Code_signoff_version.xlsx
├── 01_CRA业务规则Appendix_完整翻译与解读.md   ← 资料消化文档（含 sign-off 阻塞点清单）
└── README.md
```

## 文档清单

| 文件 | 说明 |
|------|------|
| `01_CRA业务规则Appendix_完整翻译与解读.md` | CRA 放款文件审核业务规则的完整中文翻译、6 个 Sheet 结构解读、规则本质分析、31 项 sign-off 阻塞点 |

## 参考资料清单

| 文件 | 说明 |
|------|------|
| `Appendix_CRA_Business_Rules_Defect_Code_signoff_version.xlsx` | CRA 业务规则与缺陷代码总表（sign-off 版本）。6 个 Sheet，88 条主规则 |

## 上下游关联

| 模块 | 关系 |
|------|------|
| `05_签约/` | E-Acceptance vs Manual 决定放款文件的模板版本集合；生物识别结果由签约侧产出，放款侧只消费 |
| 根目录 `04_NonIndividual_需求明细文档_V3.md` | 第 16 章「后续链路概念：放款」已定义前置依赖（Signatory、FIS/Dealer/FBR/FBT、Host Acceptance） |
| 根目录 `04 CrediOS_FSD_HP_CED_20260105.docx` | CED 有条件批准（FD 质押金额/期限）是放款侧 LOSO/FD Receipt 校验的基准值来源 |
