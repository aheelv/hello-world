/* ==========================================================================
   config.js — 由 build-site.py 从 data/*.json 自动生成，勿手改。
   换站点方向 / 增删阶段 / 增删章节：修改 data/core.json 后重跑生成器。
   ========================================================================== */

window.SITE_CONFIG = {
  "site": {
    "name": "统计 · 智能学习体系",
    "short": "统计智能",
    "tagline": "从统计学到生成式 AI",
    "subtitle": "六阶段演进路线 · 可检索 · 可筛选 · 可持续更新",
    "description": "按统计学→大数据分析→机器学习→深度学习→神经网络→生成式AI的演进路线组织的完整学习体系，含学习路径、先修、难度、核心概念、目标能力、实践任务、评估标准、资源库与里程碑时间线。",
    "version": "v2.0",
    "footer": "统计 · 智能学习体系 · 六阶段演进路线 · 支持离线浏览",
    "updated": "2026-11-07"
  },
  "route": [
    "统计学",
    "大数据分析",
    "机器学习",
    "深度学习",
    "神经网络",
    "生成式AI"
  ],
  "routeNote": "本路线按「先掌握方法与训练范式，再深入网络结构与机制，最后进入生成式系统」的认知顺序组织。深度学习与神经网络互为表里：阶段四聚焦如何把深层模型训练好，阶段五拆解网络结构本身为何有效，因此顺序上先四后五。",
  "stages": [
    {
      "id": "s1",
      "name": "阶段 1 · 统计学",
      "short": "统计学",
      "weeks": "第 1–6 周",
      "goal": "建立统计思维，掌握从描述、概率到推断与因果的完整方法论",
      "color": "s1",
      "modules": [
        "m01",
        "m02",
        "m03",
        "m04",
        "m05",
        "m06",
        "m07",
        "m08"
      ],
      "href": "stages/statistics.html"
    },
    {
      "id": "s2",
      "name": "阶段 2 · 大数据分析",
      "short": "大数据",
      "weeks": "第 7–10 周",
      "goal": "在 TB 级、流式、分布式环境下仍能做出统计上可信的分析",
      "color": "s2",
      "modules": [
        "m11"
      ],
      "href": "stages/big-data.html"
    },
    {
      "id": "s3",
      "name": "阶段 3 · 机器学习",
      "short": "机器学习",
      "weeks": "第 11–15 周",
      "goal": "独立完成端到端建模，并给出统计上可辩护的评估结论",
      "color": "s3",
      "modules": [
        "m09",
        "m12"
      ],
      "href": "stages/machine-learning.html"
    },
    {
      "id": "s4",
      "name": "阶段 4 · 深度学习",
      "short": "深度学习",
      "weeks": "第 16–20 周",
      "goal": "掌握深层网络的训练方法论，能独立诊断并稳定一次训练",
      "color": "s4",
      "modules": [
        "m13"
      ],
      "href": "stages/deep-learning.html"
    },
    {
      "id": "s5",
      "name": "阶段 5 · 神经网络",
      "short": "神经网络",
      "weeks": "第 21–24 周",
      "goal": "理解主流架构的归纳偏置、复杂度与适用边界，能按任务选结构",
      "color": "s5",
      "modules": [
        "m14"
      ],
      "href": "stages/neural-networks.html"
    },
    {
      "id": "s6",
      "name": "阶段 6 · 生成式 AI",
      "short": "生成式AI",
      "weeks": "第 25–30 周",
      "goal": "读懂 2024–2026 前沿论文的统计论证，并能设计可靠评测与小规模对齐实验",
      "color": "s6",
      "modules": [
        "m10",
        "m15"
      ],
      "href": "stages/generative-ai.html"
    }
  ],
  "modules": [
    {
      "id": "m01",
      "num": "01",
      "title": "数据与统计思维",
      "level": "L1 入门",
      "levelKey": "lv-intro",
      "hours": "6 学时",
      "href": "modules/m01-data.html",
      "desc": "总体/样本、测量尺度、抽样方法与常见统计陷阱。",
      "tags": [
        "数据类型",
        "抽样",
        "研究设计"
      ],
      "prereq": "初中数学",
      "goals": [
        "区分四种测量尺度",
        "理解随机抽样与偏差",
        "识别幸存者偏差与辛普森悖论"
      ],
      "stage": "s1"
    },
    {
      "id": "m02",
      "num": "02",
      "title": "描述统计与可视化",
      "level": "L1 入门",
      "levelKey": "lv-intro",
      "hours": "6 学时",
      "href": "modules/m02-descriptive.html",
      "desc": "集中/离散趋势、分布形状、相关系数与图表选择。",
      "tags": [
        "均值中位数",
        "方差",
        "相关系数"
      ],
      "prereq": "模块 01",
      "goals": [
        "熟练计算各类统计量",
        "理解皮尔逊/斯皮尔曼适用场景",
        "按数据类型选图"
      ],
      "stage": "s1"
    },
    {
      "id": "m03",
      "num": "03",
      "title": "概率论基础",
      "level": "L1 入门",
      "levelKey": "lv-intro",
      "hours": "8 学时",
      "href": "modules/m03-probability.html",
      "desc": "样本空间、条件概率、贝叶斯公式、独立性与期望方差。",
      "tags": [
        "条件概率",
        "贝叶斯公式",
        "期望方差"
      ],
      "prereq": "模块 01–02",
      "goals": [
        "掌握加法/乘法法则",
        "熟练使用贝叶斯公式",
        "理解独立性"
      ],
      "stage": "s1"
    },
    {
      "id": "m04",
      "num": "04",
      "title": "随机变量与常见分布",
      "level": "L2 基础",
      "levelKey": "lv-base",
      "hours": "8 学时",
      "href": "modules/m04-distributions.html",
      "desc": "PMF/PDF/CDF、常用分布族与中心极限定理。",
      "tags": [
        "正态分布",
        "二项分布",
        "CLT"
      ],
      "prereq": "模块 03",
      "goals": [
        "掌握常用分布性质",
        "理解矩母函数",
        "掌握中心极限定理"
      ],
      "stage": "s1"
    },
    {
      "id": "m05",
      "num": "05",
      "title": "统计推断：估计与检验",
      "level": "L2 基础",
      "levelKey": "lv-base",
      "hours": "10 学时",
      "href": "modules/m05-inference.html",
      "desc": "矩估计、MLE、置信区间、假设检验、p 值与多重比较。",
      "tags": [
        "最大似然",
        "置信区间",
        "p 值"
      ],
      "prereq": "模块 04",
      "goals": [
        "会用 MLE 与矩估计",
        "构造并解释置信区间",
        "正确解读 p 值"
      ],
      "stage": "s1"
    },
    {
      "id": "m06",
      "num": "06",
      "title": "回归分析",
      "level": "L2 基础",
      "levelKey": "lv-base",
      "hours": "10 学时",
      "href": "modules/m06-regression.html",
      "desc": "最小二乘、高斯-马尔可夫、逻辑回归与正则化。",
      "tags": [
        "最小二乘",
        "逻辑回归",
        "岭/Lasso"
      ],
      "prereq": "模块 05",
      "goals": [
        "推导最小二乘估计",
        "诊断回归假设",
        "理解正则化统计动机"
      ],
      "stage": "s1"
    },
    {
      "id": "m07",
      "num": "07",
      "title": "贝叶斯统计与计算",
      "level": "L3 进阶",
      "levelKey": "lv-mid",
      "hours": "10 学时",
      "href": "modules/m07-bayesian.html",
      "desc": "共轭先验、MCMC 与变分推断（ELBO 完整推导）。",
      "tags": [
        "共轭先验",
        "MCMC",
        "ELBO"
      ],
      "prereq": "模块 05",
      "goals": [
        "理解贝叶斯更新",
        "掌握采样器与收敛诊断",
        "推导 ELBO"
      ],
      "stage": "s1"
    },
    {
      "id": "m08",
      "num": "08",
      "title": "实验设计与因果推断",
      "level": "L3 进阶",
      "levelKey": "lv-mid",
      "hours": "8 学时",
      "href": "modules/m08-experiment.html",
      "desc": "RCT、功效、A/B 测试、ANOVA、倾向得分与 DID。",
      "tags": [
        "RCT",
        "A/B 测试",
        "因果推断"
      ],
      "prereq": "模块 05",
      "goals": [
        "设计带功效分析的实验",
        "正确解读 A/B 测试",
        "掌握主流因果方法"
      ],
      "stage": "s1"
    },
    {
      "id": "m09",
      "num": "09",
      "title": "机器学习的统计基础",
      "level": "L3 进阶",
      "levelKey": "lv-mid",
      "hours": "10 学时",
      "href": "modules/m09-ml-stats.html",
      "desc": "偏差-方差、双重下降、交叉验证、信息准则与泛化理论。",
      "tags": [
        "偏差-方差",
        "交叉验证",
        "双重下降"
      ],
      "prereq": "模块 05–06",
      "goals": [
        "掌握误差分解",
        "设计严格评估协议",
        "理解过参数化泛化"
      ],
      "stage": "s3"
    },
    {
      "id": "m10",
      "num": "10",
      "title": "AI 前沿：统计学与大模型",
      "level": "L5 前沿",
      "levelKey": "lv-ai",
      "hours": "12 学时",
      "href": "modules/m10-ai-stats.html",
      "desc": "交叉熵、缩放定律、扩散模型、RLHF/DPO、共形预测与评测统计。",
      "tags": [
        "缩放定律",
        "扩散模型",
        "RLHF",
        "共形预测"
      ],
      "prereq": "模块 05–09",
      "goals": [
        "把 LLM 目标还原为 MLE",
        "理解前沿模型的统计原理",
        "掌握现代不确定性量化"
      ],
      "stage": "s6"
    },
    {
      "id": "m11",
      "num": "11",
      "title": "大数据分析的统计基础",
      "level": "L3 进阶",
      "levelKey": "lv-mid",
      "hours": "10 学时",
      "href": "modules/m11-big-data.html",
      "desc": "分布式计算、列式存储、流式窗口、近似算法与大规模实验。",
      "tags": [
        "MapReduce",
        "shuffle",
        "HyperLogLog",
        "流式"
      ],
      "prereq": "模块 01–05 + SQL",
      "goals": [
        "估算作业资源成本",
        "说明近似算法误差界",
        "设计分层分流与质量监控"
      ],
      "stage": "s2"
    },
    {
      "id": "m12",
      "num": "12",
      "title": "经典机器学习算法",
      "level": "L3 进阶",
      "levelKey": "lv-mid",
      "hours": "10 学时",
      "href": "modules/m12-ml-algorithms.html",
      "desc": "决策树、SVM、集成、聚类、降维与概率校准。",
      "tags": [
        "决策树",
        "SVM",
        "XGBoost",
        "PCA"
      ],
      "prereq": "模块 09",
      "goals": [
        "按任务选择算法族",
        "解释集成的偏差-方差机制",
        "完成无泄漏建模"
      ],
      "stage": "s3"
    },
    {
      "id": "m13",
      "num": "13",
      "title": "深度学习的训练范式",
      "level": "L4 高级",
      "levelKey": "lv-adv",
      "hours": "10 学时",
      "href": "modules/m13-deep-training.html",
      "desc": "计算图与反向传播、优化器、初始化归一化、规模化训练与缩放定律。",
      "tags": [
        "反向传播",
        "AdamW",
        "归一化",
        "混合精度"
      ],
      "prereq": "模块 09 + 线代/微积分",
      "goals": [
        "从零实现训练循环",
        "诊断训练故障",
        "拟合缩放定律"
      ],
      "stage": "s4"
    },
    {
      "id": "m14",
      "num": "14",
      "title": "神经网络架构谱系",
      "level": "L4 高级",
      "levelKey": "lv-adv",
      "hours": "10 学时",
      "href": "modules/m14-architectures.html",
      "desc": "MLP/CNN/RNN/注意力/Transformer/MoE/SSM 的归纳偏置与资源账。",
      "tags": [
        "CNN",
        "LSTM",
        "Transformer",
        "MoE"
      ],
      "prereq": "模块 13",
      "goals": [
        "手写注意力公式",
        "估算参数量与 FLOPs",
        "按任务选型"
      ],
      "stage": "s5"
    },
    {
      "id": "m15",
      "num": "15",
      "title": "生成式 AI 系统与方法",
      "level": "L5 前沿",
      "levelKey": "lv-ai",
      "hours": "12 学时",
      "href": "modules/m15-genai-systems.html",
      "desc": "VAE/扩散/流匹配、SFT/RLHF/DPO/GRPO、RAG、Agent 与 2024–2026 里程碑。",
      "tags": [
        "扩散模型",
        "DPO",
        "RAG",
        "多模态"
      ],
      "prereq": "模块 10 + 13–14",
      "goals": [
        "解释生成模型目标函数",
        "完成小规模对齐实验",
        "读懂近年技术报告"
      ],
      "stage": "s6"
    }
  ],
  "extras": [
    {
      "id": "home",
      "title": "学习总览",
      "href": "index.html",
      "desc": "六阶段演进路线与全站入口",
      "group": "总览"
    },
    {
      "id": "roadmap",
      "title": "学习路线图",
      "href": "roadmap.html",
      "desc": "六阶段路径、先修与进阶衔接",
      "group": "总览"
    },
    {
      "id": "resources",
      "title": "资源库（可筛选）",
      "href": "resources.html",
      "desc": "书籍/理论/论文/模型/课程/数据集/工具/开源，带来源与核验状态",
      "group": "工具"
    },
    {
      "id": "timeline",
      "title": "里程碑时间线",
      "href": "timeline.html",
      "desc": "1763–2026 关键节点与阶段归属",
      "group": "工具"
    },
    {
      "id": "glossary",
      "title": "术语表",
      "href": "glossary.html",
      "desc": "中英对照核心术语速查",
      "group": "工具"
    }
  ],
  "levels": [
    {
      "key": "lv-intro",
      "label": "L1 入门",
      "desc": "只需基础数学"
    },
    {
      "key": "lv-base",
      "label": "L2 基础",
      "desc": "概率与代数"
    },
    {
      "key": "lv-mid",
      "label": "L3 进阶",
      "desc": "线代与编程"
    },
    {
      "key": "lv-adv",
      "label": "L4 高级",
      "desc": "微积分与框架"
    },
    {
      "key": "lv-ai",
      "label": "L5 前沿",
      "desc": "读论文与复现"
    }
  ]
};
