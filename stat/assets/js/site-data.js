/* 由 build-site.py 自动生成，勿手改。修改 data/*.json 后重新运行。 */
window.SITE_DATA = {
 "meta": {
  "schema": "2.0",
  "siteName": "统计 · 智能学习体系",
  "short": "统计智能",
  "tagline": "从统计学到生成式 AI",
  "subtitle": "六阶段演进路线 · 可检索 · 可筛选 · 可持续更新",
  "description": "按统计学→大数据分析→机器学习→深度学习→神经网络→生成式AI的演进路线组织的完整学习体系，含学习路径、先修、难度、核心概念、目标能力、实践任务、评估标准、资源库与里程碑时间线。",
  "version": "v2.0",
  "footer": "统计 · 智能学习体系 · 六阶段演进路线 · 支持离线浏览",
  "updated": "2026-11-07",
  "route": [
   "统计学",
   "大数据分析",
   "机器学习",
   "深度学习",
   "神经网络",
   "生成式AI"
  ],
  "routeNote": "本路线按「先掌握方法与训练范式，再深入网络结构与机制，最后进入生成式系统」的认知顺序组织。深度学习与神经网络互为表里：阶段四聚焦如何把深层模型训练好，阶段五拆解网络结构本身为何有效，因此顺序上先四后五。",
  "verificationLegend": {
   "verified": "已核验：本轮检索命中官方论文页 / 出版社页 / 官方仓库 / 官方公告",
   "canonical": "权威共识：学界通行引用的经典条目，链接为官方固定入口，年份按通行引用；未在本轮逐条打开复核",
   "pending": "待核验：年份、版次、出处或状态存在不确定，暂不作为定论引用"
  },
  "authorityLegend": {
   "official": "一级 · 官方一手（出版社 / 期刊 / 会议 / 官方仓库 / 官方公告）",
   "academic": "二级 · 学术机构（大学课程页 / 综述 / 研究机构）",
   "community": "三级 · 社区维护（开源社区 / 百科 / 聚合站点）"
  },
  "difficultyLegend": {
   "1": "L1 入门 · 只需基础数学",
   "2": "L2 基础 · 需概率与代数",
   "3": "L3 进阶 · 需线代与编程",
   "4": "L4 高级 · 需微积分与框架经验",
   "5": "L5 前沿 · 需读论文与复现能力"
  }
 },
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
 ],
 "stages": [
  {
   "id": "s1",
   "num": 1,
   "slug": "statistics",
   "color": "s1",
   "name": "统计学",
   "short": "统计学",
   "en": "Statistics",
   "tagline": "从数据到推断的语言",
   "era": "18 世纪至今 · 一切后续阶段的地基",
   "weeks": "第 1–6 周",
   "hours": 48,
   "goal": "建立统计思维，掌握从描述、概率到推断与因果的完整方法论",
   "difficulty": {
    "min": 1,
    "max": 2,
    "label": "L1 → L2"
   },
   "prereq": [
    "初中代数与基本函数（一次函数、指数、对数直觉）",
    "会读表格、会画折线图/柱状图",
    "Python 或电子表格基础为非必需，但能显著加快练习"
   ],
   "path": [
    {
     "step": "1",
     "n": "数据与统计思维",
     "d": "总体/样本、测量尺度、抽样偏差、研究设计",
     "m": "m01"
    },
    {
     "step": "2",
     "n": "描述统计与可视化",
     "d": "集中/离散趋势、分布形状、相关与图表选择",
     "m": "m02"
    },
    {
     "step": "3",
     "n": "概率论基础",
     "d": "条件概率、贝叶斯公式、期望方差",
     "m": "m03"
    },
    {
     "step": "4",
     "n": "随机变量与分布族",
     "d": "PMF/PDF/CDF、常用分布、中心极限定理",
     "m": "m04"
    },
    {
     "step": "5",
     "n": "统计推断",
     "d": "MLE、置信区间、假设检验、p 值、功效",
     "m": "m05"
    },
    {
     "step": "6",
     "n": "回归分析",
     "d": "最小二乘、逻辑回归、正则化与诊断",
     "m": "m06"
    },
    {
     "step": "7",
     "n": "贝叶斯与计算",
     "d": "共轭先验、MCMC、变分推断与 ELBO",
     "m": "m07"
    },
    {
     "step": "8",
     "n": "实验设计与因果",
     "d": "RCT、A/B 测试、ANOVA、倾向得分、DID",
     "m": "m08"
    }
   ],
   "concepts": [
    {
     "n": "总体 / 样本 / 参数 / 统计量",
     "d": "把「想知道的」与「能观测的」分开，是所有推断的起点。"
    },
    {
     "n": "随机变量与分布",
     "d": "用函数描述不确定性；PDF 本身不是概率，积分才是。"
    },
    {
     "n": "中心极限定理",
     "d": "无论总体形状如何，样本均值近似正态——推断统计的基石。"
    },
    {
     "n": "最大似然估计",
     "d": "选择让已观测数据最可能出现的参数；后来成为所有神经网络训练目标的原型。"
    },
    {
     "n": "置信区间与 p 值",
     "d": "量化不确定性；也是被误读最多的两个概念。"
    },
    {
     "n": "偏差-方差权衡",
     "d": "模型复杂度与泛化误差的基本张力，贯穿到深度学习。"
    },
    {
     "n": "贝叶斯更新",
     "d": "后验 ∝ 似然 × 先验；为 VAE、扩散模型与不确定性量化提供语言。"
    },
    {
     "n": "随机化与因果",
     "d": "相关不等于因果；随机化是识别因果效应最干净的手段。"
    }
   ],
   "competencies": [
    "能把一个含糊的业务问题改写成可检验的统计问题",
    "能对一份陌生数据做出完整、无误导的描述分析与可视化",
    "能手工推导并计算置信区间、检验统计量，且正确解释 p 值",
    "能识别混杂、幸存者偏差、辛普森悖论与多重比较陷阱",
    "能设计带功效分析的简单随机实验并写出结论边界"
   ],
   "tasks": [
    {
     "n": "Titanic 描述分析",
     "d": "对一份真实表格数据计算均值/中位数/分位数/IQR，画箱线图与直方图，写 300 字结论并指出至少一个误导风险。",
     "level": "基础",
     "deliverable": "Notebook + 结论短文"
    },
    {
     "n": "Bootstrap 置信区间",
     "d": "对偏态样本用重采样构造 95% CI，与基于正态假设的 t 区间对比，解释差异。",
     "level": "基础",
     "deliverable": "可复现脚本 + 对比图"
    },
    {
     "n": "A/B 测试全流程复盘",
     "d": "给定转化率数据，先定 α 与功效再算样本量，做两比例检验，写出含效应量与业务建议的报告。",
     "level": "进阶",
     "deliverable": "实验报告"
    },
    {
     "n": "辛普森悖论数值复现",
     "d": "构造一个分组后方向反转的 2×2×2 数据集，用数字说明为何聚合结论错误。",
     "level": "进阶",
     "deliverable": "数据表 + 推导"
    },
    {
     "n": "从零实现 MLE",
     "d": "对伯努利与正态总体分别写出对数似然、求导解出估计量，并与矩估计对比。",
     "level": "挑战",
     "deliverable": "推导 + 数值验证"
    }
   ],
   "assessment": [
    {
     "n": "概念准确性",
     "standard": "能正确说出 95% 置信区间与 p 值的频率学派含义，且不把它们解释为「假设为真的概率」。"
    },
    {
     "n": "计算可复现",
     "standard": "给出的例题数值可以独立复算，中间步骤完整、符号一致。"
    },
    {
     "n": "陷阱识别",
     "standard": "对给定案例能指出至少 2 类偏差/混杂，并说明如何规避。"
    },
    {
     "n": "实验设计",
     "standard": "能先算样本量再收数据，明确 α、功效、主要指标与护栏指标。"
    },
    {
     "n": "衔接 readiness",
     "standard": "能解释「样本量增大时统计结论为何仍可能失效」，从而理解进入大数据阶段的必要性。"
    }
   ],
   "bridge": {
    "to": "s2",
    "text": "当数据规模超出单机内存、数据不再是一次性抽好的静态样本，独立同分布、可精确计算等假设开始松动。下一阶段把统计推断放进分布式与流式系统里重新审视。"
   },
   "modules": [
    "m01",
    "m02",
    "m03",
    "m04",
    "m05",
    "m06",
    "m07",
    "m08"
   ]
  },
  {
   "id": "s2",
   "num": 2,
   "slug": "big-data",
   "color": "s2",
   "name": "大数据分析",
   "short": "大数据",
   "en": "Big Data Analytics",
   "tagline": "当推断遇上规模",
   "era": "2000 年代至今 · 分布式与流式范式",
   "weeks": "第 7–10 周",
   "hours": 32,
   "goal": "在 TB 级、流式、分布式环境下仍能做出统计上可信的分析",
   "difficulty": {
    "min": 2,
    "max": 3,
    "label": "L2 → L3"
   },
   "prereq": [
    "阶段一全部内容（尤其抽样、估计、置信区间）",
    "Python 熟练：函数、迭代器、pandas 基本操作",
    "SQL 基础：GROUP BY / JOIN / 窗口函数",
    "命令行与文件系统基本概念"
   ],
   "path": [
    {
     "step": "1",
     "n": "规模带来的统计问题",
     "d": "为何 n 变大后 p 值会失效、抽样不再 i.i.d.、偏差被放大",
     "m": "m11"
    },
    {
     "step": "2",
     "n": "分布式计算模型",
     "d": "MapReduce、Spark RDD/DataFrame、分区与 shuffle、数据倾斜",
     "m": "m11"
    },
    {
     "step": "3",
     "n": "存储与格式",
     "d": "列式存储、Parquet/Arrow、分区、数据湖与仓、事务与一致性",
     "m": "m11"
    },
    {
     "step": "4",
     "n": "流式与窗口",
     "d": "事件时间/处理时间、水位线、滑动窗口、精确一次语义",
     "m": "m11"
    },
    {
     "step": "5",
     "n": "近似与草图算法",
     "d": "Bloom Filter、HyperLogLog、Count-Min Sketch、蓄水池采样",
     "m": "m11"
    },
    {
     "step": "6",
     "n": "大规模实验与数据质量",
     "d": "分层哈希分流、护栏指标、血缘、缺失与漂移监控",
     "m": "m11"
    }
   ],
   "concepts": [
    {
     "n": "分区与 shuffle",
     "d": "分布式聚合的成本中心；理解它才能解释作业为何慢、为何 OOM。"
    },
    {
     "n": "批式 vs 流式",
     "d": "有界数据与无界数据的语义差异，决定窗口、状态与迟到数据处理。"
    },
    {
     "n": "列式存储与向量化",
     "d": "只读取需要的列；Parquet/Arrow 让单机也能做十亿行聚合。"
    },
    {
     "n": "近似算法与误差界",
     "d": "用可控误差换内存与时间；必须能写出误差概率/相对误差上界。"
    },
    {
     "n": "分流与可交换性",
     "d": "哈希分桶保证组间独立；这是大规模 A/B 测试统计有效性的前提。"
    },
    {
     "n": "数据漂移与血缘",
     "d": "分布随时间变化会让校准好的模型与阈值静默失效。"
    },
    {
     "n": "可扩展统计估计",
     "d": "分治合并、在线更新、随机梯度；把估计量改造成可并行的形式。"
    }
   ],
   "competencies": [
    "能估算一个分析作业的数据量、内存与网络 shuffle 成本",
    "能为同一指标选择精确算法或近似算法，并说明误差与资源权衡",
    "能设计分层随机分流与护栏指标，避免网络效应与提前窥探",
    "能用 DuckDB/Polars/Spark 完成十亿行级聚合与可复现报告",
    "能识别并定位数据倾斜、重复计数、迟到数据导致的统计偏差"
   ],
   "tasks": [
    {
     "n": "十亿行聚合",
     "d": "生成 1 亿行以上合成日志，分别用 pandas、DuckDB、Polars 完成分组统计，记录耗时与峰值内存。",
     "level": "基础",
     "deliverable": "基准脚本 + 对比表"
    },
    {
     "n": "近似去重",
     "d": "实现 HyperLogLog 或用现有库，与精确集合对比，画出相对误差随基数变化的曲线。",
     "level": "进阶",
     "deliverable": "实现/调用 + 误差曲线"
    },
    {
     "n": "Spark 倾斜诊断",
     "d": "构造长尾 key 数据，观察 stage 耗时分布，用 salting / 两阶段聚合修复并量化改进。",
     "level": "进阶",
     "deliverable": "Spark UI 截图说明 + 前后对比"
    },
    {
     "n": "流式窗口统计",
     "d": "用事件时间与水位线计算 5 分钟滑动均值，注入迟到事件并解释结果变化。",
     "level": "挑战",
     "deliverable": "流式作业 + 语义说明"
    },
    {
     "n": "分层 A/B 分流",
     "d": "实现哈希分桶，验证各层正交性与组间协变量平衡，写一份分流校验报告。",
     "level": "挑战",
     "deliverable": "分流器 + 平衡性检验"
    }
   ],
   "assessment": [
    {
     "n": "规模意识",
     "standard": "能在写 SQL 前估算数据量、shuffle 体积与内存占用，并据此选择引擎。"
    },
    {
     "n": "误差可解释",
     "standard": "对任何近似结果能给出误差界或置信陈述，而不是只报一个数。"
    },
    {
     "n": "统计有效性",
     "standard": "能说明大样本下 p 值失效的原因，改用效应量/置信区间/序贯方法。"
    },
    {
     "n": "可复现",
     "standard": "作业参数、数据版本、随机种子与口径全部记录，结果可重跑一致。"
    },
    {
     "n": "衔接 readiness",
     "standard": "能把清洗好的特征稳定产出为训练/验证/测试集，理解数据泄漏在管线层面的来源。"
    }
   ],
   "bridge": {
    "to": "s3",
    "text": "数据管线打通后，瓶颈从「算得动」转为「预测得准」。下一阶段把统计推断变成可学习的模型：经验风险最小化、正则化与严格评估协议。"
   },
   "modules": [
    "m11"
   ]
  },
  {
   "id": "s3",
   "num": 3,
   "slug": "machine-learning",
   "color": "s3",
   "name": "机器学习",
   "short": "机器学习",
   "en": "Machine Learning",
   "tagline": "从推断到预测",
   "era": "1950 年代至今 · 统计学习范式",
   "weeks": "第 11–15 周",
   "hours": 40,
   "goal": "独立完成端到端建模，并给出统计上可辩护的评估结论",
   "difficulty": {
    "min": 2,
    "max": 4,
    "label": "L2 → L4"
   },
   "prereq": [
    "阶段一（尤其回归、最大似然、偏差-方差）",
    "阶段二的数据管线与 SQL",
    "线性代数：向量、矩阵乘法、特征值直觉",
    "Python + NumPy/pandas/scikit-learn"
   ],
   "path": [
    {
     "step": "1",
     "n": "机器学习的统计视角",
     "d": "ERM、偏差-方差、泛化、双重下降",
     "m": "m09"
    },
    {
     "step": "2",
     "n": "评估协议",
     "d": "训练/验证/测试、k 折与分层、数据泄漏、AIC/BIC",
     "m": "m09"
    },
    {
     "step": "3",
     "n": "经典算法族",
     "d": "线性/逻辑回归、决策树、SVM、朴素贝叶斯、KNN",
     "m": "m12"
    },
    {
     "step": "4",
     "n": "集成与无监督",
     "d": "Bagging/Boosting、随机森林、XGBoost、聚类与 PCA",
     "m": "m12"
    },
    {
     "step": "5",
     "n": "模型选择与校准",
     "d": "超参搜索、多重比较、概率校准、Brier 分数",
     "m": "m09"
    },
    {
     "step": "6",
     "n": "工程与上线前检查",
     "d": "特征管线、版本、监控、公平性与可解释性",
     "m": "m12"
    }
   ],
   "concepts": [
    {
     "n": "经验风险最小化",
     "d": "训练即估计：用样本平均损失逼近期望损失。"
    },
    {
     "n": "偏差-方差分解",
     "d": "把泛化误差拆成系统性偏差、估计方差与不可约噪声。"
    },
    {
     "n": "正则化",
     "d": "L1/L2 既是复杂度惩罚，也可理解为拉普拉斯/高斯先验（呼应阶段一）。"
    },
    {
     "n": "交叉验证与数据泄漏",
     "d": "任何在切分前用到全数据的操作都会让评估失真。"
    },
    {
     "n": "集成与Boosting",
     "d": "Bagging 降方差、Boosting 降偏差，是偏差-方差权衡的工程化。"
    },
    {
     "n": "双重下降",
     "d": "过参数化后测试误差再次下降，修正经典 U 型曲线认知。"
    },
    {
     "n": "校准",
     "d": "预测概率是否可信；准确率之外必须检查 Brier 分数与可靠性图。"
    }
   ],
   "competencies": [
    "能把业务目标翻译成可优化的损失函数与可解释的评估指标",
    "能设计无泄漏的训练/验证/测试协议并说明每一折的用途",
    "能对同一问题比较 3 类以上模型，并给出带不确定性的结论",
    "能诊断过拟合、欠拟合、类别不平衡与分布偏移",
    "能解释正则化、集成与超参选择背后的统计动机"
   ],
   "tasks": [
    {
     "n": "表格数据端到端",
     "d": "在一份公开表格数据集上完成特征管线、3 类模型对比、5 折分层 CV 与 Bootstrap 置信区间。",
     "level": "基础",
     "deliverable": "Notebook + 模型卡"
    },
    {
     "n": "数据泄漏诊断",
     "d": "复现「先全量标准化再切分」「时间序列随机切分」两类泄漏，量化评估虚高幅度并修正。",
     "level": "进阶",
     "deliverable": "对照实验 + 说明"
    },
    {
     "n": "AIC/BIC 与正则化路径",
     "d": "手算两个模型的 AIC/BIC，绘制 Ridge/Lasso 系数随 λ 变化路径，解释差异。",
     "level": "进阶",
     "deliverable": "计算 + 系数路径图"
    },
    {
     "n": "校准评估",
     "d": "比较未校准与 Platt/等距回归校准后的 Brier 分数与可靠性图，讨论阈值决策。",
     "level": "挑战",
     "deliverable": "可靠性图 + 决策分析"
    },
    {
     "n": "偏差-方差数值实验",
     "d": "对同一 x₀ 重复采样训练，实测分解式中的三项并验证等式成立。",
     "level": "挑战",
     "deliverable": "实验脚本 + 数值核对"
    }
   ],
   "assessment": [
    {
     "n": "评估严谨性",
     "standard": "能说明验证集与测试集不得互相污染，且能主动检查泄漏。"
    },
    {
     "n": "结论带不确定性",
     "standard": "模型对比给出置信区间或显著性检验，而非只比大小。"
    },
    {
     "n": "统计动机",
     "standard": "能解释每个方法对应哪个统计假设、违背时会怎样。"
    },
    {
     "n": "工程可复现",
     "standard": "随机种子、版本、特征口径固定，结果可复跑。"
    },
    {
     "n": "衔接 readiness",
     "standard": "能说清「特征工程成为瓶颈」为何自然导向表示学习与深层网络。"
    }
   ],
   "bridge": {
    "to": "s4",
    "text": "当人工特征成为瓶颈，让模型自己学表示就成了下一步。阶段四聚焦深层模型如何被训练出来：计算图、反向传播、优化与规模化训练。"
   },
   "modules": [
    "m09",
    "m12"
   ]
  },
  {
   "id": "s4",
   "num": 4,
   "slug": "deep-learning",
   "color": "s4",
   "name": "深度学习",
   "short": "深度学习",
   "en": "Deep Learning",
   "tagline": "把深层模型训练出来",
   "era": "2006 年至今 · 训练范式与规模化",
   "weeks": "第 16–20 周",
   "hours": 40,
   "goal": "掌握深层网络的训练方法论，能独立诊断并稳定一次训练",
   "difficulty": {
    "min": 3,
    "max": 4,
    "label": "L3 → L4"
   },
   "prereq": [
    "阶段三全部内容",
    "多元微积分：偏导、链式法则；线性代数：矩阵求导直觉",
    "PyTorch 或 JAX 基本张量操作",
    "GPU / 显存 / 浮点精度的基本概念"
   ],
   "path": [
    {
     "step": "1",
     "n": "计算图与自动微分",
     "d": "前向/反向、链式法则、梯度检查",
     "m": "m13"
    },
    {
     "step": "2",
     "n": "训练循环与优化器",
     "d": "SGD/动量/Adam、学习率调度、warmup、梯度裁剪",
     "m": "m13"
    },
    {
     "step": "3",
     "n": "初始化与归一化",
     "d": "Xavier/He、Batch/Layer/RMSNorm、残差连接",
     "m": "m13"
    },
    {
     "step": "4",
     "n": "正则化与泛化",
     "d": "weight decay、dropout、数据增强、早停、标签平滑",
     "m": "m13"
    },
    {
     "step": "5",
     "n": "规模化训练",
     "d": "混合精度、梯度累积、数据/张量/流水并行、检查点",
     "m": "m13"
    },
    {
     "step": "6",
     "n": "缩放定律与训练诊断",
     "d": "Kaplan → Chinchilla → 过训练 → 测试时计算；loss spike 定位",
     "m": "m13"
    }
   ],
   "concepts": [
    {
     "n": "反向传播",
     "d": "链式法则在计算图上的高效实现；本质是复用中间梯度而非重复求导。"
    },
    {
     "n": "梯度消失 / 爆炸",
     "d": "连乘导致梯度量级失衡；残差、归一化与初始化是三大对策。"
    },
    {
     "n": "自适应优化器",
     "d": "Adam 用一阶/二阶矩估计调整每参数步长；与统计中的自适应估计相通。"
    },
    {
     "n": "归一化",
     "d": "稳定激活分布，使更大学习率与更深网络可行。"
    },
    {
     "n": "混合精度与并行",
     "d": "FP16/BF16 换吞吐，数据/张量/流水并行换规模。"
    },
    {
     "n": "缩放定律",
     "d": "损失随参数量、数据量、算力呈幂律；训练预算分配的理论依据。"
    },
    {
     "n": "损失设计",
     "d": "交叉熵 = 负对数似然 = KL 相关量，把阶段一的 MLE 贯穿到底。"
    }
   ],
   "competencies": [
    "能从零写出可训练的 MLP 与反向传播，并用梯度检查验证",
    "能读懂训练日志，定位不收敛、loss spike、过拟合与数值溢出",
    "能设计消融实验，区分「结构贡献」与「调参贡献」",
    "能用缩放定律做数量级估算：给定算力如何分配 N 与 D",
    "能在有限显存下用混合精度/累积/检查点完成一次完整训练"
   ],
   "tasks": [
    {
     "n": "NumPy 实现 MLP",
     "d": "不依赖框架实现两层网络、交叉熵与反向传播，用数值梯度校验解析梯度。",
     "level": "基础",
     "deliverable": "实现 + 梯度检查报告"
    },
    {
     "n": "CIFAR-10 训练与消融",
     "d": "训练一个小 CNN，逐一消融数据增强、weight decay、warmup，记录验证曲线。",
     "level": "进阶",
     "deliverable": "消融表 + 曲线图"
    },
    {
     "n": "优化器对比",
     "d": "在相同预算下比较 SGD+动量、AdamW、调度策略，解释收敛速度与泛化差异。",
     "level": "进阶",
     "deliverable": "对比实验"
    },
    {
     "n": "缩放定律拟合",
     "d": "在 3 个以上模型尺度上拟合 L(N) 幂律，预测第 4 个尺度并验证误差。",
     "level": "挑战",
     "deliverable": "拟合代码 + 外推验证"
    },
    {
     "n": "训练故障复盘",
     "d": "故意制造 FP16 溢出、错误归一化位置、数据泄漏，记录症状与定位过程。",
     "level": "挑战",
     "deliverable": "故障手册"
    }
   ],
   "assessment": [
    {
     "n": "实现正确性",
     "standard": "手写反向传播通过数值梯度检查（相对误差 < 1e-6 量级）。"
    },
    {
     "n": "诊断能力",
     "standard": "对给定训练曲线能给出至少 2 个可检验假设与对应验证操作。"
    },
    {
     "n": "实验规范",
     "standard": "消融实验只变一个因素，记录种子、预算与完整超参。"
    },
    {
     "n": "理论连接",
     "standard": "能说明交叉熵损失与最大似然估计的等价关系。"
    },
    {
     "n": "衔接 readiness",
     "standard": "训练已稳定后，能提出「为什么这个结构有效」的问题，自然进入架构剖析。"
    }
   ],
   "bridge": {
    "to": "s5",
    "text": "会训练之后，真正决定能力上限的是结构带来的归纳偏置。阶段五回到网络本身：从卷积、循环到注意力与 Transformer，拆解每一种结构为何有效、代价是什么。"
   },
   "modules": [
    "m13"
   ]
  },
  {
   "id": "s5",
   "num": 5,
   "slug": "neural-networks",
   "color": "s5",
   "name": "神经网络",
   "short": "神经网络",
   "en": "Neural Network Architectures",
   "tagline": "结构即先验",
   "era": "1943 年至今 · 架构谱系与归纳偏置",
   "weeks": "第 21–24 周",
   "hours": 32,
   "goal": "理解主流架构的归纳偏置、复杂度与适用边界，能按任务选结构",
   "difficulty": {
    "min": 3,
    "max": 5,
    "label": "L3 → L5"
   },
   "prereq": [
    "阶段四全部内容",
    "能独立实现 Transformer 的前向传播",
    "理解矩阵乘法复杂度与大 O 记号",
    "读过至少 2 篇架构类原始论文"
   ],
   "path": [
    {
     "step": "1",
     "n": "从感知机到 MLP",
     "d": "通用近似定理、深度 vs 宽度、激活函数",
     "m": "m14"
    },
    {
     "step": "2",
     "n": "卷积网络",
     "d": "局部感受野、权值共享、平移等变、层次化特征",
     "m": "m14"
    },
    {
     "step": "3",
     "n": "循环网络",
     "d": "BPTT、LSTM/GRU 门控、长程依赖与串行瓶颈",
     "m": "m14"
    },
    {
     "step": "4",
     "n": "注意力与 Transformer",
     "d": "QKV、缩放点积、多头、位置编码、复杂度",
     "m": "m14"
    },
    {
     "step": "5",
     "n": "现代变体",
     "d": "残差/Pre-LN、ViT、GNN 消息传递、MoE 稀疏激活、SSM",
     "m": "m14"
    },
    {
     "step": "6",
     "n": "架构比较与选型",
     "d": "参数量/FLOPs/显存估算、外推性、归纳偏置对照",
     "m": "m14"
    }
   ],
   "concepts": [
    {
     "n": "归纳偏置",
     "d": "结构内置假设（局部性、平移等变、顺序性），决定样本效率与外推能力。"
    },
    {
     "n": "缩放点积注意力",
     "d": "$\\mathrm{Attention}(Q,K,V)=\\mathrm{softmax}(QK^\\top/\\sqrt{d_k})V$，复杂度 $O(n^2 d)$。"
    },
    {
     "n": "残差连接",
     "d": "让梯度有恒等通路，使上百层网络可训练。"
    },
    {
     "n": "位置编码",
     "d": "注意力本身置换不变，必须显式注入顺序信息。"
    },
    {
     "n": "混合专家 MoE",
     "d": "总参数大但每 token 只激活一部分，解耦容量与计算量。"
    },
    {
     "n": "状态空间模型 SSM",
     "d": "以线性递推替代二次注意力，面向长序列的复杂度折中。"
    },
    {
     "n": "参数量与 FLOPs",
     "d": "能把结构图换算成资源账，是读懂技术报告的前提。"
    }
   ],
   "competencies": [
    "能手写自注意力公式并说明每一步的维度与复杂度",
    "能解释 Transformer 相对 RNN 在并行性与长程依赖上的取舍",
    "能估算给定配置的参数量、KV Cache 与训练 FLOPs",
    "能按任务（图像/序列/图/长文本）选择结构并给出理由",
    "能阅读架构论文并复现其核心模块"
   ],
   "tasks": [
    {
     "n": "NumPy 自注意力",
     "d": "实现缩放点积与多头注意力，用简单序列验证掩码与因果性。",
     "level": "基础",
     "deliverable": "实现 + 形状断言"
    },
    {
     "n": "参数量核算",
     "d": "对一个给定 Transformer 配置逐层核算参数量，并与框架输出核对一致。",
     "level": "基础",
     "deliverable": "核算表 + 验证脚本"
    },
    {
     "n": "架构对照实验",
     "d": "在同一小数据集上比较 MLP/CNN/小型 Transformer 的收敛速度、参数量与泛化。",
     "level": "进阶",
     "deliverable": "对照表 + 分析"
    },
    {
     "n": "从零训练小语言模型",
     "d": "用 nanoGPT 类实现训练字符/词级 LM，观察注意力图并讨论上下文长度成本。",
     "level": "挑战",
     "deliverable": "模型 + 注意力可视化"
    },
    {
     "n": "长序列方案评估",
     "d": "对比 FlashAttention、稀疏注意力、SSM 在复杂度与实测显存上的差异。",
     "level": "挑战",
     "deliverable": "评测报告"
    }
   ],
   "assessment": [
    {
     "n": "公式准确",
     "standard": "能正确写出注意力公式、说明除以 $\\sqrt{d_k}$ 的原因。"
    },
    {
     "n": "复杂度意识",
     "standard": "能指出标准注意力对序列长度二次增长，并说出至少两种缓解思路。"
    },
    {
     "n": "选型论证",
     "standard": "选型理由落在归纳偏置与资源约束上，而非只凭排行榜。"
    },
    {
     "n": "复现能力",
     "standard": "能按论文复现一个核心模块并用单元测试验证。"
    },
    {
     "n": "衔接 readiness",
     "standard": "能解释「架构 + 规模 + 对齐」如何共同构成生成式 AI 系统。"
    }
   ],
   "bridge": {
    "to": "s6",
    "text": "当 Transformer 架构、海量数据与规模化训练三者叠加，再经偏好对齐，就得到生成式 AI。最后一阶段回到统计主线：最大似然、信息论、偏好模型、共形预测与可靠评测。"
   },
   "modules": [
    "m14"
   ]
  },
  {
   "id": "s6",
   "num": 6,
   "slug": "generative-ai",
   "color": "s6",
   "name": "生成式 AI",
   "short": "生成式AI",
   "en": "Generative AI",
   "tagline": "统计主线的最前沿",
   "era": "2020 年至今 · 大模型与生成系统",
   "weeks": "第 25–30 周",
   "hours": 48,
   "goal": "读懂 2024–2026 前沿论文的统计论证，并能设计可靠评测与小规模对齐实验",
   "difficulty": {
    "min": 4,
    "max": 5,
    "label": "L4 → L5"
   },
   "prereq": [
    "阶段四与阶段五全部内容",
    "阶段一的 MLE、KL 散度、假设检验与共形预测基础",
    "能读懂 arXiv 论文中的目标函数与消融表",
    "具备 GPU 或云端算力的基本使用经验"
   ],
   "path": [
    {
     "step": "1",
     "n": "语言模型的统计本质",
     "d": "自回归分解、交叉熵、KL、困惑度、tokenizer",
     "m": "m10"
    },
    {
     "step": "2",
     "n": "缩放定律演进",
     "d": "Kaplan → Chinchilla → 过训练 → 测试时计算",
     "m": "m10"
    },
    {
     "step": "3",
     "n": "生成模型族",
     "d": "VAE/ELBO、GAN、DDPM、分数匹配、流匹配",
     "m": "m15"
    },
    {
     "step": "4",
     "n": "对齐与偏好学习",
     "d": "SFT、Bradley-Terry、RLHF/PPO、DPO、GRPO",
     "m": "m15"
    },
    {
     "step": "5",
     "n": "系统能力",
     "d": "RAG、工具调用、Agent、多模态、长上下文、推理模型",
     "m": "m15"
    },
    {
     "step": "6",
     "n": "可靠评测与不确定性",
     "d": "基准污染、置信区间、共形预测、LLM-as-judge 偏误",
     "m": "m10"
    }
   ],
   "concepts": [
    {
     "n": "自回归最大似然",
     "d": "$p(x)=\\prod_t p(x_t\\mid x_{<t})$；训练目标就是阶段一学过的对数似然。"
    },
    {
     "n": "交叉熵 / KL / 困惑度",
     "d": "同一个量的三种说法；困惑度是「等效每词分支数」。"
    },
    {
     "n": "缩放定律及其修正",
     "d": "参数、数据、算力按幂律协同；2022 年 Chinchilla 修正配比，2024 年后推理成本与测试时计算成为新轴。"
    },
    {
     "n": "ELBO 与变分推断",
     "d": "VAE 与扩散模型共用的目标；$\\log p(x)=\\mathrm{ELBO}+KL(q\\|p)$。"
    },
    {
     "n": "分数匹配与流匹配",
     "d": "学习去噪方向或速度场；SD3/FLUX 等 2024 年后主流图像系统转向流匹配。"
    },
    {
     "n": "Bradley-Terry 与偏好优化",
     "d": "成对偏好概率 $\\sigma(r_w-r_l)$；DPO 把它化为分类损失，GRPO 去掉 critic。"
    },
    {
     "n": "共形预测",
     "d": "分布无关、有限样本覆盖保证；但保证是边缘的，且依赖可交换性。"
    },
    {
     "n": "评测统计",
     "d": "基准饱和与污染、多重比较、配对检验、置信区间与评测方差。"
    }
   ],
   "competencies": [
    "能把一篇新论文的目标函数还原为最大似然 / KL / 偏好模型",
    "能解释 2024–2026 推理模型、MoE、流匹配背后的统计动机",
    "能设计带置信区间与抗污染的评测方案，并识别 LLM-as-judge 偏误",
    "能完成小规模 SFT / LoRA / DPO 实验并写出可复现实验记录",
    "能对生成结果施加共形预测式的覆盖保证，并说明其失效条件"
   ],
   "tasks": [
    {
     "n": "困惑度换算",
     "d": "给定平均交叉熵，计算困惑度，并解释温度、词表大小对数值的影响。",
     "level": "基础",
     "deliverable": "计算 + 解释"
    },
    {
     "n": "缩放定律外推",
     "d": "用公开的小型 IsoFLOP 数据拟合幂律，讨论 Chinchilla 配比与过训练的差别。",
     "level": "进阶",
     "deliverable": "拟合 + 讨论"
    },
    {
     "n": "LoRA 微调与对照",
     "d": "在小模型上做 LoRA 微调，对比全量微调的参数量、显存与效果。",
     "level": "进阶",
     "deliverable": "实验记录 + 资源对比"
    },
    {
     "n": "DPO 偏好实验",
     "d": "构造小规模偏好对，实现 DPO 损失，观察 β 与长度偏置的影响。",
     "level": "挑战",
     "deliverable": "实现 + 消融"
    },
    {
     "n": "可靠评测报告",
     "d": "对两个模型做配对评测，给出 bootstrap 置信区间、污染检查与多重比较校正。",
     "level": "挑战",
     "deliverable": "评测报告"
    },
    {
     "n": "共形覆盖验证",
     "d": "在分类/多选任务上做 split conformal，实测边缘覆盖率并展示子群覆盖失衡。",
     "level": "挑战",
     "deliverable": "覆盖率表 + 局限说明"
    }
   ],
   "assessment": [
    {
     "n": "理论还原",
     "standard": "能把 LLM 训练损失写成负对数似然，并说明与 KL 的关系。"
    },
    {
     "n": "前沿可读性",
     "standard": "对 2024–2026 的技术报告能指出其统计假设、目标函数与消融是否充分。"
    },
    {
     "n": "评测严谨",
     "standard": "给出置信区间、说明污染与多重比较，不以单次排行榜分数下结论。"
    },
    {
     "n": "不确定性诚实",
     "standard": "能说明共形预测保证的是边缘覆盖、依赖可交换性，并列出失效场景。"
    },
    {
     "n": "闭环",
     "standard": "能回到阶段一的推断语言，指出整个 AI 系统里哪些结论是统计上站得住的、哪些不是。"
    }
   ],
   "bridge": {
    "to": "s1",
    "text": "走到前沿之后，最稀缺的能力反而是最初的统计严谨性：假设是否成立、估计是否有偏、结论是否有不确定性。建议带着新的问题回到阶段一与资料库，形成持续迭代的闭环。"
   },
   "modules": [
    "m10",
    "m15"
   ]
  }
 ],
 "modules": [
  {
   "id": "m01",
   "num": "01",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m02",
   "num": "02",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m03",
   "num": "03",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m04",
   "num": "04",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m05",
   "num": "05",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m06",
   "num": "06",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m07",
   "num": "07",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m08",
   "num": "08",
   "stage": "s1",
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
   ]
  },
  {
   "id": "m09",
   "num": "09",
   "stage": "s3",
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
   ]
  },
  {
   "id": "m10",
   "num": "10",
   "stage": "s6",
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
   ]
  },
  {
   "id": "m11",
   "num": "11",
   "stage": "s2",
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
   ]
  },
  {
   "id": "m12",
   "num": "12",
   "stage": "s3",
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
   ]
  },
  {
   "id": "m13",
   "num": "13",
   "stage": "s4",
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
   ]
  },
  {
   "id": "m14",
   "num": "14",
   "stage": "s5",
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
   ]
  },
  {
   "id": "m15",
   "num": "15",
   "stage": "s6",
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
   ]
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
 "resources": [
  {
   "id": "b01",
   "t": "book",
   "n": "《统计学》",
   "en": "Statistics",
   "by": "贾俊平 等",
   "y": 2016,
   "yNote": "版次待核验",
   "src": "中国人民大学出版社",
   "url": "",
   "auth": "academic",
   "st": [
    "s1"
   ],
   "d": 1,
   "v": "pending",
   "note": "具体版次与年份未在本轮核验，仅列为国内通行入门教材",
   "desc": "国内高校广泛使用的统计学入门教材，本土案例与习题完整。"
  },
  {
   "id": "b02",
   "t": "book",
   "n": "《统计学：从数据到结论》",
   "en": "Statistics: Concepts and Controversies / Moore",
   "by": "David S. Moore 等",
   "y": 2013,
   "yNote": "中译本年份待核验",
   "src": "机械工业出版社（中译本）",
   "url": "",
   "auth": "academic",
   "st": [
    "s1"
   ],
   "d": 1,
   "v": "pending",
   "note": "中译本版次年份待核验",
   "desc": "统计思维优先的入门教材，弱计算、重直觉与实验设计逻辑。"
  },
  {
   "id": "b03",
   "t": "book",
   "n": "《统计学习方法》",
   "en": "Statistical Learning Methods",
   "by": "李航",
   "y": 2012,
   "src": "清华大学出版社",
   "url": "",
   "auth": "academic",
   "st": [
    "s1",
    "s3"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "中文机器学习经典，公式推导紧凑，适合作为统计到 ML 的桥梁。"
  },
  {
   "id": "b04",
   "t": "book",
   "n": "《机器学习》（西瓜书）",
   "en": "Machine Learning",
   "by": "周志华",
   "y": 2016,
   "src": "清华大学出版社",
   "url": "",
   "auth": "academic",
   "st": [
    "s3"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "中文机器学习全景教材，覆盖主流算法与一点理论。"
  },
  {
   "id": "b05",
   "t": "book",
   "n": "An Introduction to Statistical Learning（第 1 版）",
   "en": "ISLR with Applications in R",
   "by": "James, Witten, Hastie, Tibshirani",
   "y": 2013,
   "src": "Springer",
   "url": "https://www.statlearning.com/",
   "auth": "official",
   "st": [
    "s1",
    "s3"
   ],
   "d": 2,
   "v": "verified",
   "note": "",
   "desc": "统计学习最通行的入门教材；官网提供免费 PDF。"
  },
  {
   "id": "b06",
   "t": "book",
   "n": "An Introduction to Statistical Learning（第 2 版）",
   "en": "ISLR, 2nd Edition",
   "by": "James, Witten, Hastie, Tibshirani",
   "y": 2021,
   "src": "Springer",
   "url": "https://www.statlearning.com/",
   "auth": "official",
   "st": [
    "s1",
    "s3"
   ],
   "d": 2,
   "v": "verified",
   "note": "官网明确写明第 2 版 2021 年出版",
   "desc": "新增深度学习、生存分析、多重检验与 BART 等章节。"
  },
  {
   "id": "b07",
   "t": "book",
   "n": "An Introduction to Statistical Learning with Python",
   "en": "ISLP",
   "by": "James, Witten, Hastie, Tibshirani, Taylor",
   "y": 2023,
   "src": "Springer",
   "url": "https://www.statlearning.com/",
   "auth": "official",
   "st": [
    "s1",
    "s3"
   ],
   "d": 2,
   "v": "verified",
   "note": "官网写明 Python 版 2023 年出版",
   "desc": "ISLR 的 Python 版本，实验部分改用 Python 生态。"
  },
  {
   "id": "b08",
   "t": "book",
   "n": "The Elements of Statistical Learning（第 2 版）",
   "en": "ESL",
   "by": "Hastie, Tibshirani, Friedman",
   "y": 2009,
   "src": "Springer",
   "url": "https://hastie.su.domains/ElemStatLearn/",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "统计学习理论经典参考书，数学深度显著高于 ISLR。"
  },
  {
   "id": "b09",
   "t": "book",
   "n": "Pattern Recognition and Machine Learning",
   "en": "PRML",
   "by": "Christopher M. Bishop",
   "y": 2006,
   "src": "Springer",
   "url": "",
   "auth": "official",
   "st": [
    "s3",
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "贝叶斯视角的机器学习经典，VAE / 变分推断的重要背景读物。"
  },
  {
   "id": "b10",
   "t": "book",
   "n": "Deep Learning",
   "en": "Deep Learning",
   "by": "Goodfellow, Bengio, Courville",
   "y": 2016,
   "src": "MIT Press",
   "url": "https://www.deeplearningbook.org/",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "深度学习奠基性教材，官网提供免费在线版。"
  },
  {
   "id": "b11",
   "t": "book",
   "n": "Probabilistic Machine Learning: An Introduction",
   "en": "PML Vol.1",
   "by": "Kevin P. Murphy",
   "y": 2022,
   "src": "MIT Press",
   "url": "https://probml.github.io/pml-book/",
   "auth": "official",
   "st": [
    "s3",
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "多所高校课程大纲列为 2022 年出版",
   "desc": "概率视角的现代机器学习教材，覆盖从回归到深度生成模型。"
  },
  {
   "id": "b12",
   "t": "book",
   "n": "Probabilistic Machine Learning: Advanced Topics",
   "en": "PML Vol.2",
   "by": "Kevin P. Murphy",
   "y": 2023,
   "yNote": "年份待核验",
   "src": "MIT Press",
   "url": "https://probml.github.io/pml-book/",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "pending",
   "note": "出版年份在本轮检索中出现 2022 / 2023 两种说法，待核验",
   "desc": "进阶卷，覆盖变分推断、生成模型、强化学习与因果。"
  },
  {
   "id": "b13",
   "t": "book",
   "n": "Mining of Massive Datasets（第 3 版）",
   "en": "MMDS",
   "by": "Leskovec, Rajaraman, Ullman",
   "y": 2021,
   "src": "Cambridge University Press",
   "url": "https://www.mmds.org/",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 3,
   "v": "verified",
   "note": "高校课程大纲列为 2021 年第 3 版，官网免费下载",
   "desc": "大规模数据算法教材：MapReduce、局部敏感哈希、流算法、PageRank。"
  },
  {
   "id": "b14",
   "t": "book",
   "n": "Designing Data-Intensive Applications",
   "en": "DDIA",
   "by": "Martin Kleppmann",
   "y": 2017,
   "src": "O'Reilly",
   "url": "",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 3,
   "v": "canonical",
   "note": "第 2 版是否出版及年份待核验，此处仅记录第 1 版",
   "desc": "分布式数据系统的经典：复制、分区、事务、一致性与流批一体。"
  },
  {
   "id": "b15",
   "t": "book",
   "n": "Bayesian Data Analysis（第 3 版）",
   "en": "BDA3",
   "by": "Gelman, Carlin, Stern, Dunson, Vehtari, Rubin",
   "y": 2013,
   "src": "CRC Press",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "贝叶斯统计标准参考书，含 MCMC 与后验检查。"
  },
  {
   "id": "b16",
   "t": "book",
   "n": "Computer Age Statistical Inference",
   "en": "CASI",
   "by": "Bradley Efron, Trevor Hastie",
   "y": 2016,
   "src": "Cambridge University Press",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s3"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "从频率学派到贝叶斯再到机器学习的统计思想史。"
  },
  {
   "id": "b17",
   "t": "book",
   "n": "Information Theory, Inference, and Learning Algorithms",
   "en": "ITILA",
   "by": "David J.C. MacKay",
   "y": 2003,
   "src": "Cambridge University Press",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "信息论与推断的统一叙述；理解交叉熵/KL 的优质来源。"
  },
  {
   "id": "b18",
   "t": "book",
   "n": "The Book of Why",
   "en": "The Book of Why",
   "by": "Judea Pearl, Dana Mackenzie",
   "y": 2018,
   "src": "Basic Books",
   "url": "",
   "auth": "official",
   "st": [
    "s1"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "因果之梯与因果图的科普入门，配合形式化教材使用。"
  },
  {
   "id": "b19",
   "t": "book",
   "n": "Mostly Harmless Econometrics",
   "en": "MHE",
   "by": "Angrist, Pischke",
   "y": 2009,
   "src": "Princeton University Press",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s2"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "计量经济学中因果识别的经典，DID / IV / RD 的常用参考。"
  },
  {
   "id": "b20",
   "t": "book",
   "n": "Hands-On Machine Learning（第 3 版）",
   "en": "Hands-On ML with Scikit-Learn, Keras & TensorFlow",
   "by": "Aurélien Géron",
   "y": 2022,
   "src": "O'Reilly",
   "url": "",
   "auth": "official",
   "st": [
    "s3",
    "s4"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "工程实践导向，代码完整，适合作为动手主线。"
  },
  {
   "id": "b21",
   "t": "book",
   "n": "Designing Machine Learning Systems",
   "en": "ML Systems Design",
   "by": "Chip Huyen",
   "y": 2022,
   "src": "O'Reilly",
   "url": "",
   "auth": "official",
   "st": [
    "s2",
    "s3"
   ],
   "d": 3,
   "v": "verified",
   "note": "多所高校课程大纲列为 2022 年参考书",
   "desc": "从数据管线到部署监控的系统化工程视角。"
  },
  {
   "id": "b22",
   "t": "book",
   "n": "R for Data Science（第 2 版）",
   "en": "R4DS",
   "by": "Wickham, Çetinkaya-Rundel, Grolemund",
   "y": 2023,
   "src": "O'Reilly",
   "url": "https://r4ds.hadley.nz/",
   "auth": "official",
   "st": [
    "s1",
    "s2"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "数据整理与探索性分析的实践手册，官网免费。"
  },
  {
   "id": "b23",
   "t": "book",
   "n": "Causal Inference for The Brave and True",
   "en": "Causal Inference for The Brave and True",
   "by": "Matheus Facure",
   "y": 2020,
   "yNote": "年份待核验",
   "src": "在线开源书",
   "url": "",
   "auth": "community",
   "st": [
    "s1"
   ],
   "d": 2,
   "v": "pending",
   "note": "在线书持续更新，初版年份待核验",
   "desc": "用 Python 代码讲因果推断的开放教材。"
  },
  {
   "id": "b24",
   "t": "book",
   "n": "Theoretical Foundations of Conformal Prediction",
   "en": "Conformal Prediction Theory",
   "by": "Angelopoulos, Barber, Bates",
   "y": 2024,
   "yNote": "出版状态待核验",
   "src": "书稿 / 在线预印",
   "url": "",
   "auth": "academic",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "pending",
   "note": "检索到书稿条目，但正式出版年份与出版社待核验",
   "desc": "共形预测理论证明的统一整理，面向研究者。"
  },
  {
   "id": "t01",
   "t": "theory",
   "n": "贝叶斯定理",
   "en": "Bayes' Theorem",
   "by": "Thomas Bayes / Pierre-Simon Laplace",
   "y": 1763,
   "src": "An Essay towards solving a Problem in the Doctrine of Chances",
   "url": "",
   "auth": "academic",
   "st": [
    "s1",
    "s6"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "后验 ∝ 似然 × 先验；从统计推断一直贯穿到变分推断与生成模型。"
  },
  {
   "id": "t02",
   "t": "theory",
   "n": "最小二乘法",
   "en": "Least Squares",
   "by": "Legendre / Gauss",
   "y": 1805,
   "yNote": "1805 Legendre、1809 Gauss",
   "src": "学术史通行引用",
   "url": "",
   "auth": "academic",
   "st": [
    "s1",
    "s3"
   ],
   "d": 1,
   "v": "canonical",
   "note": "两人贡献的优先权归属在史料中有争议，此处并列",
   "desc": "最小化残差平方和；在高斯误差假设下等价于最大似然。"
  },
  {
   "id": "t03",
   "t": "theory",
   "n": "中心极限定理",
   "en": "Central Limit Theorem",
   "by": "Laplace / Lyapunov 等",
   "y": 1810,
   "yNote": "逐步完善于 19–20 世纪",
   "src": "概率论教科书通行引用",
   "url": "",
   "auth": "academic",
   "st": [
    "s1"
   ],
   "d": 2,
   "v": "canonical",
   "note": "精确年份按首次形式化版本有不同说法",
   "desc": "样本均值近似正态，是置信区间与检验的理论支柱。"
  },
  {
   "id": "t04",
   "t": "theory",
   "n": "信息论：熵 / 交叉熵 / KL 散度",
   "en": "Information Theory",
   "by": "Claude Shannon",
   "y": 1948,
   "src": "A Mathematical Theory of Communication, Bell System Technical Journal",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": " LLM 的交叉熵损失正是负对数似然，与 KL 散度只差常数项。"
  },
  {
   "id": "t05",
   "t": "theory",
   "n": "最大似然估计",
   "en": "Maximum Likelihood Estimation",
   "by": "R.A. Fisher",
   "y": 1922,
   "src": "Philosophical Transactions of the Royal Society A",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s3",
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "选择使观测数据概率最大的参数；现代训练目标的原型。"
  },
  {
   "id": "t06",
   "t": "theory",
   "n": "Neyman–Pearson 引理与假设检验",
   "en": "Neyman–Pearson Lemma",
   "by": "Neyman, Pearson",
   "y": 1933,
   "src": "Philosophical Transactions of the Royal Society A",
   "url": "",
   "auth": "official",
   "st": [
    "s1"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "在给定第一类错误下最大化功效，奠定检验理论。"
  },
  {
   "id": "t07",
   "t": "theory",
   "n": "置信区间",
   "en": "Confidence Interval",
   "by": "Jerzy Neyman",
   "y": 1937,
   "src": "Philosophical Transactions of the Royal Society A",
   "url": "",
   "auth": "official",
   "st": [
    "s1"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "频率学派的区间估计；常与贝叶斯可信区间对比。"
  },
  {
   "id": "t08",
   "t": "theory",
   "n": "Bootstrap 重采样",
   "en": "Bootstrap",
   "by": "Bradley Efron",
   "y": 1979,
   "src": "Annals of Statistics",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s3",
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "用重采样估计统计量分布；LLM 评测置信区间常用手段。"
  },
  {
   "id": "t09",
   "t": "theory",
   "n": "VC 维与统计学习理论",
   "en": "VC Dimension / SLT",
   "by": "Vapnik, Chervonenkis",
   "y": 1971,
   "src": "Theory of Probability and its Applications",
   "url": "",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "用容量度量刻画泛化界，PAC 与结构风险最小化的基础。"
  },
  {
   "id": "t10",
   "t": "theory",
   "n": "PAC 可学习性",
   "en": "Probably Approximately Correct",
   "by": "Leslie Valiant",
   "y": 1984,
   "src": "Communications of the ACM",
   "url": "",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "把「学得到」形式化为概率与误差的联合保证。"
  },
  {
   "id": "t11",
   "t": "theory",
   "n": "偏差-方差分解",
   "en": "Bias–Variance Decomposition",
   "by": "Geman, Bienenstock, Doursat 等",
   "y": 1992,
   "src": "Neural Networks",
   "url": "",
   "auth": "official",
   "st": [
    "s3",
    "s4"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "把期望误差拆为偏差²、方差与噪声，解释过拟合/欠拟合。"
  },
  {
   "id": "t12",
   "t": "theory",
   "n": "EM 算法",
   "en": "Expectation-Maximization",
   "by": "Dempster, Laird, Rubin",
   "y": 1977,
   "src": "Journal of the Royal Statistical Society B",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "含隐变量模型的极大似然迭代；与变分推断同源。"
  },
  {
   "id": "t13",
   "t": "theory",
   "n": "潜在结果框架（Rubin 因果模型）",
   "en": "Potential Outcomes",
   "by": "Donald Rubin",
   "y": 1974,
   "src": "Journal of Educational Psychology",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s2"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "用 Y(1)/Y(0) 定义因果效应，指出根本难题与随机化的作用。"
  },
  {
   "id": "t14",
   "t": "theory",
   "n": "Bradley–Terry 偏好模型",
   "en": "Bradley–Terry Model",
   "by": "Bradley, Terry",
   "y": 1952,
   "src": "Biometrika",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "成对比较概率模型；RLHF 奖励模型与 DPO 的统计根基。"
  },
  {
   "id": "t15",
   "t": "theory",
   "n": "感知机与通用近似定理",
   "en": "Perceptron / Universal Approximation",
   "by": "Rosenblatt / Cybenko, Hornik",
   "y": 1958,
   "yNote": "通用近似定理 1989 / 1991",
   "src": "Psychological Review / Mathematics of Control, Signals and Systems",
   "url": "",
   "auth": "official",
   "st": [
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "从单层线性分类器到「足够宽的网络可逼近任意连续函数」。"
  },
  {
   "id": "t16",
   "t": "theory",
   "n": "反向传播",
   "en": "Backpropagation",
   "by": "Rumelhart, Hinton, Williams",
   "y": 1986,
   "src": "Nature",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "链式法则在计算图上的高效复用，使多层网络可训练。"
  },
  {
   "id": "t17",
   "t": "theory",
   "n": "共形预测",
   "en": "Conformal Prediction",
   "by": "Vovk, Gammerman, Shafer",
   "y": 2005,
   "src": "Algorithmic Learning in a Random World, Springer",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "分布无关、有限样本的覆盖保证；代价是依赖可交换性且只保证边缘覆盖。"
  },
  {
   "id": "t18",
   "t": "theory",
   "n": "神经缩放定律",
   "en": "Neural Scaling Laws",
   "by": "Kaplan 等（OpenAI）",
   "y": 2020,
   "src": "arXiv:2001.08361",
   "url": "https://arxiv.org/abs/2001.08361",
   "auth": "official",
   "st": [
    "s4",
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "损失随 N、D、C 呈幂律；后被 Chinchilla 修正配比。"
  },
  {
   "id": "t19",
   "t": "theory",
   "n": "Chinchilla 计算最优配比",
   "en": "Compute-Optimal Scaling",
   "by": "Hoffmann 等（DeepMind）",
   "y": 2022,
   "src": "arXiv:2203.15556",
   "url": "https://arxiv.org/abs/2203.15556",
   "auth": "official",
   "st": [
    "s4",
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "已核验 arXiv 编号为 2203.15556（易与 InstructGPT 2203.02155 混淆）",
   "desc": "参数与 token 应同比例增长，约 20 token/参数；70B 模型胜过 280B Gopher。"
  },
  {
   "id": "t20",
   "t": "theory",
   "n": "双重下降",
   "en": "Double Descent",
   "by": "Belkin 等 / Nakkiran 等",
   "y": 2019,
   "yNote": "2019 提出，2020 系统化",
   "src": "PNAS / arXiv",
   "url": "",
   "auth": "official",
   "st": [
    "s3",
    "s4"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "过参数化区域测试误差二次下降，修正经典 U 型偏差-方差曲线。"
  },
  {
   "id": "t21",
   "t": "theory",
   "n": "变分推断与 ELBO",
   "en": "Variational Inference / ELBO",
   "by": "统计与机器学习社区逐步形成",
   "y": 1999,
   "yNote": "年份为通行近似，待核验",
   "src": "综述性文献",
   "url": "",
   "auth": "academic",
   "st": [
    "s1",
    "s6"
   ],
   "d": 4,
   "v": "pending",
   "note": "ELBO 的确切首次提出年份难以归属，此处只标通行年代",
   "desc": "用可优化下界近似难算的边缘似然；VAE 与扩散模型的核心。"
  },
  {
   "id": "t22",
   "t": "theory",
   "n": "测试时计算缩放",
   "en": "Test-Time Compute Scaling",
   "by": "OpenAI o1 / Snell 等 / DeepSeek-R1",
   "y": 2024,
   "src": "2024–2025 系列工作",
   "url": "https://arxiv.org/abs/2501.12948",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "具体首篇论文归属有争议，此处以 DeepSeek-R1 官方论文作为可核验锚点",
   "desc": "把算力从训练转移到推理，长思维链与可验证奖励成为新扩展轴。"
  },
  {
   "id": "p01",
   "t": "paper",
   "n": "A Mathematical Theory of Communication",
   "en": "Shannon 1948",
   "by": "Claude Shannon",
   "y": 1948,
   "src": "Bell System Technical Journal",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "信息论开山之作，定义熵与信道容量。"
  },
  {
   "id": "p02",
   "t": "paper",
   "n": "A Few Useful Things to Know about Machine Learning",
   "en": "Domingos 2012",
   "by": "Pedro Domingos",
   "y": 2012,
   "src": "Communications of the ACM 55(10)",
   "url": "",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "关于泛化、过拟合与特征工程的十二条经验，适合入门后复盘。"
  },
  {
   "id": "p03",
   "t": "paper",
   "n": "MapReduce: Simplified Data Processing on Large Clusters",
   "en": "MapReduce",
   "by": "Dean, Ghemawat",
   "y": 2004,
   "src": "OSDI 2004",
   "url": "",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "把大规模计算抽象为 map/shuffle/reduce，开启分布式数据处理时代。"
  },
  {
   "id": "p04",
   "t": "paper",
   "n": "Resilient Distributed Datasets",
   "en": "Spark RDD",
   "by": "Zaharia 等",
   "y": 2012,
   "src": "NSDI 2012",
   "url": "",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "基于内存与血缘的容错抽象，取代反复落盘的 MapReduce。"
  },
  {
   "id": "p05",
   "t": "paper",
   "n": "Random Forests",
   "en": "Random Forests",
   "by": "Leo Breiman",
   "y": 2001,
   "src": "Machine Learning",
   "url": "",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "Bagging + 随机特征选择，降方差的经典集成方法。"
  },
  {
   "id": "p06",
   "t": "paper",
   "n": "ImageNet Classification with Deep Convolutional Neural Networks",
   "en": "AlexNet",
   "by": "Krizhevsky, Sutskever, Hinton",
   "y": 2012,
   "src": "NeurIPS 2012",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "GPU 训练 + ReLU + dropout，深度学习复兴的标志。"
  },
  {
   "id": "p07",
   "t": "paper",
   "n": "Deep Residual Learning for Image Recognition",
   "en": "ResNet",
   "by": "He, Zhang, Ren, Sun",
   "y": 2015,
   "src": "arXiv:1512.03385 / CVPR 2016",
   "url": "https://arxiv.org/abs/1512.03385",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "残差连接让上百层网络可训练，成为后续架构的默认组件。"
  },
  {
   "id": "p08",
   "t": "paper",
   "n": "Auto-Encoding Variational Bayes",
   "en": "VAE",
   "by": "Kingma, Welling",
   "y": 2013,
   "src": "arXiv:1312.6114 / ICLR 2014",
   "url": "https://arxiv.org/abs/1312.6114",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "用重参数化技巧训练变分下界，连接阶段一的 ELBO。"
  },
  {
   "id": "p09",
   "t": "paper",
   "n": "Generative Adversarial Nets",
   "en": "GAN",
   "by": "Goodfellow 等",
   "y": 2014,
   "src": "arXiv:1406.2661 / NeurIPS 2014",
   "url": "https://arxiv.org/abs/1406.2661",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "生成器与判别器的极小极大博弈，开创了另一条生成路线。"
  },
  {
   "id": "p10",
   "t": "paper",
   "n": "Neural Machine Translation by Jointly Learning to Align and Translate",
   "en": "Bahdanau Attention",
   "by": "Bahdanau, Cho, Bengio",
   "y": 2014,
   "src": "arXiv:1409.0473 / ICLR 2015",
   "url": "https://arxiv.org/abs/1409.0473",
   "auth": "official",
   "st": [
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "注意力机制首次在 seq2seq 中显式建模对齐。"
  },
  {
   "id": "p11",
   "t": "paper",
   "n": "Attention Is All You Need",
   "en": "Transformer",
   "by": "Vaswani 等",
   "y": 2017,
   "src": "arXiv:1706.03762 / NeurIPS 2017",
   "url": "https://arxiv.org/abs/1706.03762",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "纯注意力架构，奠定此后所有大模型的骨架。"
  },
  {
   "id": "p12",
   "t": "paper",
   "n": "BERT: Pre-training of Deep Bidirectional Transformers",
   "en": "BERT",
   "by": "Devlin 等",
   "y": 2018,
   "yNote": "arXiv 2018，NAACL 2019",
   "src": "arXiv:1810.04805",
   "url": "https://arxiv.org/abs/1810.04805",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "掩码语言模型预训练 + 微调范式。"
  },
  {
   "id": "p13",
   "t": "paper",
   "n": "Language Models are Few-Shot Learners",
   "en": "GPT-3",
   "by": "Brown 等",
   "y": 2020,
   "src": "arXiv:2005.14165 / NeurIPS 2020",
   "url": "https://arxiv.org/abs/2005.14165",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "175B 参数与上下文学习，把规模本身变成能力。"
  },
  {
   "id": "p14",
   "t": "paper",
   "n": "Scaling Laws for Neural Language Models",
   "en": "Kaplan Scaling Laws",
   "by": "Kaplan 等",
   "y": 2020,
   "src": "arXiv:2001.08361",
   "url": "https://arxiv.org/abs/2001.08361",
   "auth": "official",
   "st": [
    "s4",
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "损失随算力/参数/数据呈幂律，提出参数优先的配比建议。"
  },
  {
   "id": "p15",
   "t": "paper",
   "n": "Training Compute-Optimal Large Language Models",
   "en": "Chinchilla",
   "by": "Hoffmann 等",
   "y": 2022,
   "src": "arXiv:2203.15556 / NeurIPS 2022",
   "url": "https://arxiv.org/abs/2203.15556",
   "auth": "official",
   "st": [
    "s4",
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮已核验 arXiv 编号",
   "desc": "修正配比：模型与数据同比例增长，约 20 token/参数。"
  },
  {
   "id": "p16",
   "t": "paper",
   "n": "Training Language Models to Follow Instructions with Human Feedback",
   "en": "InstructGPT / RLHF",
   "by": "Ouyang 等",
   "y": 2022,
   "src": "arXiv:2203.02155 / NeurIPS 2022",
   "url": "https://arxiv.org/abs/2203.02155",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮已核验 arXiv 编号为 2203.02155",
   "desc": "SFT → 奖励模型 → PPO 三段式对齐流程，Bradley-Terry 的工程化。"
  },
  {
   "id": "p17",
   "t": "paper",
   "n": "Denoising Diffusion Probabilistic Models",
   "en": "DDPM",
   "by": "Ho, Jain, Abbeel",
   "y": 2020,
   "src": "arXiv:2006.11239 / NeurIPS 2020",
   "url": "https://arxiv.org/abs/2006.11239",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "把生成建模化为逐步去噪，与分数匹配等价。"
  },
  {
   "id": "p18",
   "t": "paper",
   "n": "Score-Based Generative Modeling through SDEs",
   "en": "Score SDE",
   "by": "Song 等",
   "y": 2021,
   "src": "arXiv:2011.13456 / ICLR 2021",
   "url": "https://arxiv.org/abs/2011.13456",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "canonical",
   "note": "",
   "desc": "用随机微分方程统一扩散与分数匹配。"
  },
  {
   "id": "p19",
   "t": "paper",
   "n": "High-Resolution Image Synthesis with Latent Diffusion Models",
   "en": "LDM / Stable Diffusion",
   "by": "Rombach 等",
   "y": 2022,
   "src": "arXiv:2112.10752 / CVPR 2022",
   "url": "https://arxiv.org/abs/2112.10752",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号",
   "desc": "在 VAE 潜空间做扩散，大幅降低训练与推理成本。"
  },
  {
   "id": "p20",
   "t": "paper",
   "n": "Flow Matching for Generative Modeling",
   "en": "Flow Matching",
   "by": "Lipman 等",
   "y": 2022,
   "yNote": "arXiv 2022，ICLR 2023",
   "src": "arXiv:2210.02747 / ICLR 2023",
   "url": "https://arxiv.org/abs/2210.02747",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号与 ICLR 2023",
   "desc": "回归速度场的连续归一化流；SD3 与 FLUX 的理论基础。"
  },
  {
   "id": "p21",
   "t": "paper",
   "n": "Flow Straight and Fast（Rectified Flow）",
   "en": "Rectified Flow",
   "by": "Liu, Gong, Liu",
   "y": 2022,
   "yNote": "arXiv 2022，ICLR 2023",
   "src": "arXiv:2209.03003 / ICLR 2023",
   "url": "https://arxiv.org/abs/2209.03003",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号",
   "desc": "直线路径 + reflow，让少步采样成为可能。"
  },
  {
   "id": "p22",
   "t": "paper",
   "n": "Scaling Rectified Flow Transformers for High-Resolution Image Synthesis",
   "en": "Stable Diffusion 3 / MMDiT",
   "by": "Esser 等",
   "y": 2024,
   "src": "arXiv:2403.03206 / ICML 2024",
   "url": "https://arxiv.org/abs/2403.03206",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中 arXiv 编号与 Stability AI 官方研究页",
   "desc": "整流流 + MMDiT 双流注意力，验证验证损失可预测生成质量。"
  },
  {
   "id": "p23",
   "t": "paper",
   "n": "Direct Preference Optimization",
   "en": "DPO",
   "by": "Rafailov 等",
   "y": 2023,
   "src": "arXiv:2305.18290 / NeurIPS 2023",
   "url": "https://arxiv.org/abs/2305.18290",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮已打开 arXiv 摘要页核验",
   "desc": "把 KL 约束的 RLHF 化为闭式解 + 简单分类损失，无需在线采样。"
  },
  {
   "id": "p24",
   "t": "paper",
   "n": "DeepSeekMath: Pushing the Limits of Mathematical Reasoning（GRPO）",
   "en": "GRPO",
   "by": "Shao 等（DeepSeek）",
   "y": 2024,
   "src": "arXiv:2402.03300",
   "url": "https://arxiv.org/abs/2402.03300",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号",
   "desc": "组相对策略优化，去掉 critic，为后来的 R1 推理训练铺路。"
  },
  {
   "id": "p25",
   "t": "paper",
   "n": "DeepSeek-V3 Technical Report",
   "en": "DeepSeek-V3",
   "by": "DeepSeek-AI",
   "y": 2024,
   "yNote": "2024-12 提交，2025-02 修订",
   "src": "arXiv:2412.19437",
   "url": "https://arxiv.org/abs/2412.19437",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中 arXiv 编号与官方 GitHub",
   "desc": "671B 总参数 / 37B 激活的 MoE，MLA + 无辅助损失负载均衡 + FP8 训练。"
  },
  {
   "id": "p26",
   "t": "paper",
   "n": "DeepSeek-R1: Incentivizing Reasoning Capability via RL",
   "en": "DeepSeek-R1",
   "by": "DeepSeek-AI",
   "y": 2025,
   "yNote": "2025-01 arXiv；后发表于 Nature 645",
   "src": "arXiv:2501.12948 / Nature",
   "url": "https://arxiv.org/abs/2501.12948",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中 arXiv 编号与 Nature 卷页信息",
   "desc": "纯 RL 激励推理能力，R1-Zero 无 SFT 冷启动即可涌现自我检查。"
  },
  {
   "id": "p27",
   "t": "paper",
   "n": "Qwen2.5 Technical Report",
   "en": "Qwen2.5",
   "by": "Qwen Team（阿里巴巴）",
   "y": 2024,
   "src": "arXiv:2412.15115",
   "url": "https://arxiv.org/abs/2412.15115",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮检索命中官方引用条目中的 arXiv 编号",
   "desc": "0.5B–72B 全系列开源模型，18T token 预训练。"
  },
  {
   "id": "p28",
   "t": "paper",
   "n": "Qwen3 Technical Report",
   "en": "Qwen3",
   "by": "Qwen Team（阿里巴巴）",
   "y": 2025,
   "src": "arXiv:2505.09388",
   "url": "https://arxiv.org/abs/2505.09388",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号及提交日期",
   "desc": "思考/非思考模式统一框架 + 思考预算，Apache 2.0 开源，覆盖 119 种语言。"
  },
  {
   "id": "p29",
   "t": "paper",
   "n": "s1: Simple test-time scaling",
   "en": "s1 / budget forcing",
   "by": "Muennighoff 等（斯坦福等）",
   "y": 2025,
   "src": "arXiv:2501.19393",
   "url": "https://arxiv.org/abs/2501.19393",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮已打开 arXiv 摘要页与项目主页核验",
   "desc": "仅 1000 条精选样本 + 预算强制，展示测试时计算的高样本效率。"
  },
  {
   "id": "p30",
   "t": "paper",
   "n": "A Gentle Introduction to Conformal Prediction",
   "en": "Conformal Prediction 综述",
   "by": "Angelopoulos, Bates",
   "y": 2021,
   "src": "arXiv:2107.07511",
   "url": "https://arxiv.org/abs/2107.07511",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号",
   "desc": "分布无关不确定性量化的标准入门文献。"
  },
  {
   "id": "p31",
   "t": "paper",
   "n": "Conformal Language Modeling",
   "en": "Conformal LM",
   "by": "Quach 等",
   "y": 2024,
   "src": "arXiv:2306.10193 / ICLR 2024",
   "url": "https://arxiv.org/abs/2306.10193",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号与 ICLR 2024 出处",
   "desc": "用校准的停止与拒绝规则为自由生成构造候选集覆盖保证。"
  },
  {
   "id": "p32",
   "t": "paper",
   "n": "Language Models with Conformal Factuality Guarantees",
   "en": "Conformal Factuality",
   "by": "Mohri, Hashimoto",
   "y": 2024,
   "src": "arXiv:2402.10978",
   "url": "https://arxiv.org/abs/2402.10978",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中该 arXiv 编号",
   "desc": "把答案拆成事实声明并校准「退让到多具体」，兼顾正确性与信息量。"
  },
  {
   "id": "p33",
   "t": "paper",
   "n": "LoRA: Low-Rank Adaptation of Large Language Models",
   "en": "LoRA",
   "by": "Hu 等",
   "y": 2021,
   "yNote": "arXiv 2021，ICLR 2022",
   "src": "arXiv:2106.09685",
   "url": "https://arxiv.org/abs/2106.09685",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "冻结主干、训练低秩增量，使消费级硬件可微调大模型。"
  },
  {
   "id": "p34",
   "t": "paper",
   "n": "FlashAttention: Fast and Memory-Efficient Exact Attention",
   "en": "FlashAttention",
   "by": "Dao 等",
   "y": 2022,
   "src": "arXiv:2205.14135 / NeurIPS 2022",
   "url": "https://arxiv.org/abs/2205.14135",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "IO 感知的精确注意力，避免物化 n×n 矩阵。"
  },
  {
   "id": "p35",
   "t": "paper",
   "n": "Detecting hallucinations with semantic entropy",
   "en": "Semantic Entropy",
   "by": "Farquhar 等",
   "y": 2024,
   "src": "Nature 630(8017), 625–630",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮检索命中 Nature 卷期页码，未直接打开 nature.com 页面",
   "desc": "按语义聚类再算熵，比序列 log-prob 更可靠地检测幻觉。"
  },
  {
   "id": "p36",
   "t": "paper",
   "n": "Chinchilla Scaling: A replication attempt",
   "en": "Chinchilla 复现",
   "by": "Besiroglu 等（Epoch AI）",
   "y": 2024,
   "src": "arXiv / Epoch AI",
   "url": "",
   "auth": "academic",
   "st": [
    "s4",
    "s6"
   ],
   "d": 5,
   "v": "pending",
   "note": "本轮仅从二手综述得知该复现研究及其结论，arXiv 编号待核验",
   "desc": "指出原始拟合的技术误差与过窄置信区间，但定性结论成立。"
  },
  {
   "id": "p37",
   "t": "paper",
   "n": "Beyond Chinchilla-Optimal: Accounting for Inference",
   "en": "Inference-aware scaling",
   "by": "Sardana 等",
   "y": 2024,
   "src": "arXiv",
   "url": "",
   "auth": "academic",
   "st": [
    "s4",
    "s6"
   ],
   "d": 5,
   "v": "pending",
   "note": "本轮仅见二手引用，arXiv 编号与确切标题待核验",
   "desc": "把推理服务成本纳入目标，解释为何 2024 后小模型被刻意过训练。"
  },
  {
   "id": "p38",
   "t": "paper",
   "n": "Scaling LLM Test-Time Compute Optimally",
   "en": "Test-time compute",
   "by": "Snell 等",
   "y": 2024,
   "src": "arXiv",
   "url": "",
   "auth": "academic",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "pending",
   "note": "本轮未打开官方论文页，arXiv 编号待核验；可用 s1 与 R1 论文作为已核验替代",
   "desc": "系统比较并行采样与串行修正的测试时算力分配。"
  },
  {
   "id": "p39",
   "t": "paper",
   "n": "The Llama 3 Herd of Models",
   "en": "Llama 3 技术报告",
   "by": "Meta AI",
   "y": 2024,
   "src": "arXiv",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "pending",
   "note": "本轮未打开官方 arXiv 页，报告编号待核验；模型发布信息见 llama-models 仓库",
   "desc": "405B 稠密模型的预训练、后训练与多轮 DPO 配方。"
  },
  {
   "id": "p40",
   "t": "paper",
   "n": "SimPO / IPO / KTO / ORPO 等偏好优化变体",
   "en": "Preference optimization variants",
   "by": "Meng 等 / Azar 等 / Ethayarajh 等 / Hong 等",
   "y": 2024,
   "src": "2024 年系列论文",
   "url": "https://arxiv.org/html/2509.11298v2",
   "auth": "academic",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "通过一篇 2025 年 RLHF 目标统一性综述核验了这些方法及其年份归属",
   "desc": "围绕长度偏置、参考模型依赖与成对标签形式对 DPO 做修正。"
  },
  {
   "id": "m01",
   "t": "model",
   "n": "感知机",
   "en": "Perceptron",
   "by": "Frank Rosenblatt",
   "y": 1958,
   "src": "Cornell Aeronautical Laboratory",
   "url": "",
   "auth": "academic",
   "st": [
    "s5"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "最早的可学习线性分类器，神经网络的起点。"
  },
  {
   "id": "m02",
   "t": "model",
   "n": "LeNet-5",
   "en": "LeNet-5",
   "by": "Yann LeCun 等",
   "y": 1998,
   "src": "Proceedings of the IEEE",
   "url": "",
   "auth": "official",
   "st": [
    "s5"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "卷积 + 池化的早期成功案例，用于手写数字识别。"
  },
  {
   "id": "m03",
   "t": "model",
   "n": "支持向量机",
   "en": "SVM",
   "by": "Cortes, Vapnik",
   "y": 1995,
   "src": "Machine Learning",
   "url": "",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "最大间隔分类与核技巧，统计学习理论的代表作。"
  },
  {
   "id": "m04",
   "t": "model",
   "n": "LSTM",
   "en": "Long Short-Term Memory",
   "by": "Hochreiter, Schmidhuber",
   "y": 1997,
   "src": "Neural Computation",
   "url": "",
   "auth": "official",
   "st": [
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "门控机制缓解长程依赖，主导序列建模近二十年。"
  },
  {
   "id": "m05",
   "t": "model",
   "n": "随机森林",
   "en": "Random Forest",
   "by": "Leo Breiman",
   "y": 2001,
   "src": "Machine Learning",
   "url": "",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "Bagging 决策树，表格数据长期强基线。"
  },
  {
   "id": "m06",
   "t": "model",
   "n": "AlexNet",
   "en": "AlexNet",
   "by": "Krizhevsky 等",
   "y": 2012,
   "src": "ILSVRC 2012 / NeurIPS",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "深度学习在视觉任务上的转折点。"
  },
  {
   "id": "m07",
   "t": "model",
   "n": "ResNet",
   "en": "ResNet",
   "by": "He 等（微软亚研）",
   "y": 2015,
   "src": "CVPR 2016",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "残差连接成为此后几乎所有深网的默认组件。"
  },
  {
   "id": "m08",
   "t": "model",
   "n": "Transformer",
   "en": "Transformer",
   "by": "Vaswani 等（Google）",
   "y": 2017,
   "src": "NeurIPS 2017",
   "url": "",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "纯注意力架构，后续所有大模型的共同骨架。"
  },
  {
   "id": "m09",
   "t": "model",
   "n": "BERT",
   "en": "BERT",
   "by": "Devlin 等（Google）",
   "y": 2018,
   "src": "NAACL 2019",
   "url": "",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "双向预训练编码器，主导 2019–2020 的 NLP。"
  },
  {
   "id": "m10",
   "t": "model",
   "n": "GPT-3",
   "en": "GPT-3",
   "by": "Brown 等（OpenAI）",
   "y": 2020,
   "src": "NeurIPS 2020",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "175B 参数，展示少样本上下文学习。"
  },
  {
   "id": "m11",
   "t": "model",
   "n": "Chinchilla",
   "en": "Chinchilla 70B",
   "by": "DeepMind",
   "y": 2022,
   "src": "NeurIPS 2022",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "同等算力下以更多数据训练更小模型，改写行业配比。"
  },
  {
   "id": "m12",
   "t": "model",
   "n": "Stable Diffusion / LDM",
   "en": "Latent Diffusion",
   "by": "Rombach 等",
   "y": 2022,
   "src": "CVPR 2022",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "canonical",
   "note": "",
   "desc": "潜空间扩散，把高质量图像生成带到消费级 GPU。"
  },
  {
   "id": "m13",
   "t": "model",
   "n": "Llama 3.1 405B",
   "en": "Llama 3.1",
   "by": "Meta AI",
   "y": 2024,
   "yNote": "2024-07-23 发布",
   "src": "官方 llama-models 仓库",
   "url": "https://github.com/meta-llama/llama-models",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮已打开官方仓库核对发布日期与规格",
   "desc": "8B / 70B / 405B，128K 上下文，开放权重旗舰。"
  },
  {
   "id": "m14",
   "t": "model",
   "n": "Llama 4 Scout / Maverick",
   "en": "Llama 4",
   "by": "Meta AI",
   "y": 2025,
   "yNote": "2025-04-05 发布",
   "src": "官方 llama-models 仓库 / llama.meta.com",
   "url": "https://llama.meta.com/",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮已核对官方仓库发布表与官网模型概览",
   "desc": "原生多模态 MoE 架构，10M / 1M 上下文。"
  },
  {
   "id": "m15",
   "t": "model",
   "n": "Stable Diffusion 3 / MMDiT",
   "en": "SD3",
   "by": "Stability AI",
   "y": 2024,
   "src": "ICML 2024",
   "url": "https://stability.ai/news/stable-diffusion-3-research-paper",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮已打开 Stability AI 官方研究页",
   "desc": "整流流训练目标 + 双流 MMDiT，验证损失可预测生成质量。"
  },
  {
   "id": "m16",
   "t": "model",
   "n": "DeepSeek-V3",
   "en": "DeepSeek-V3",
   "by": "DeepSeek-AI",
   "y": 2024,
   "src": "arXiv:2412.19437",
   "url": "https://github.com/deepseek-ai/DeepSeek-V3",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮核验 arXiv 编号与官方仓库",
   "desc": "671B MoE / 37B 激活，14.8T token，MLA 与 FP8 训练。"
  },
  {
   "id": "m17",
   "t": "model",
   "n": "DeepSeek-R1 / R1-Zero",
   "en": "DeepSeek-R1",
   "by": "DeepSeek-AI",
   "y": 2025,
   "src": "arXiv:2501.12948 / Nature 645",
   "url": "https://arxiv.org/abs/2501.12948",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮核验 arXiv 编号与 Nature 卷页信息",
   "desc": "首个开放权重的前沿推理模型，纯 RL 涌现自我检查行为。"
  },
  {
   "id": "m18",
   "t": "model",
   "n": "Qwen3 系列",
   "en": "Qwen3",
   "by": "Qwen Team（阿里巴巴）",
   "y": 2025,
   "yNote": "2025-04 发布，2025-05 技术报告",
   "src": "Qwen 官方 / arXiv:2505.09388",
   "url": "https://qwen.ai",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮核验官网、官方引用与技术报告编号；Qwen3.5/3.6 等后续版本未纳入",
   "desc": "0.6B–235B 稠密与 MoE 全系，思考/非思考统一，Apache 2.0。"
  },
  {
   "id": "m19",
   "t": "model",
   "n": "GPT-4o / o1 系列",
   "en": "OpenAI 多模态与推理模型",
   "by": "OpenAI",
   "y": 2024,
   "yNote": "具体发布日期待核验",
   "src": "OpenAI 官方公告",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "pending",
   "note": "本轮未打开官方公告核对发布日期与版本序列，仅作为里程碑概念收录",
   "desc": "原生多模态与显式推理链，把测试时计算推向主流。"
  },
  {
   "id": "m20",
   "t": "model",
   "n": "Gemini 1.5 / 后续版本",
   "en": "Google Gemini",
   "by": "Google DeepMind",
   "y": 2024,
   "yNote": "后续版本号与年份待核验",
   "src": "Google 官方公告",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "pending",
   "note": "本轮未核验具体版本序列与发布日期",
   "desc": "长上下文与原生多模态路线的代表。"
  },
  {
   "id": "c01",
   "t": "course",
   "n": "Stanford CS229 机器学习",
   "en": "CS229 Machine Learning",
   "by": "Stanford University",
   "y": 2025,
   "yNote": "课程每年更新，具体开课年份以官网为准",
   "src": "官方课程页",
   "url": "https://cs229.stanford.edu/",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 3,
   "v": "canonical",
   "note": "本轮未逐一打开最新学年页面，标注为官方固定入口",
   "desc": "机器学习数学基础的标准课程，讲义与作业公开。"
  },
  {
   "id": "c02",
   "t": "course",
   "n": "Stanford CS231n 视觉识别中的 CNN",
   "en": "CS231n",
   "by": "Stanford University",
   "y": 2025,
   "yNote": "开课年份以官网为准",
   "src": "官方课程页",
   "url": "https://cs231n.stanford.edu/",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "从反向传播到 CNN 与视觉 Transformer，作业质量高。"
  },
  {
   "id": "c03",
   "t": "course",
   "n": "Stanford CS224n 深度学习与 NLP",
   "en": "CS224n",
   "by": "Stanford University",
   "y": 2026,
   "yNote": "官网显示 Winter 2026 开课",
   "src": "官方课程页",
   "url": "https://web.stanford.edu/class/cs224n/",
   "auth": "official",
   "st": [
    "s5",
    "s6"
   ],
   "d": 3,
   "v": "verified",
   "note": "本轮已打开官网，页面明确写 Winter 2026，并说明公开课视频与讲义免费",
   "desc": "从词向量到大语言模型，使用 PyTorch；讲义与作业公开。"
  },
  {
   "id": "c04",
   "t": "course",
   "n": "Stanford CS336 从零构建语言模型",
   "en": "CS336 Language Modeling from Scratch",
   "by": "Stanford University",
   "y": 2025,
   "src": "官方课程页",
   "url": "https://stanford-cs336.github.io/spring2025/",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 5,
   "v": "verified",
   "note": "本轮通过课程索引检索到 2025 春季开课与作业结构，官网链接待二次确认",
   "desc": "实现 BPE、Transformer、FlashAttention、缩放定律与对齐的全流程。"
  },
  {
   "id": "c05",
   "t": "course",
   "n": "MIT 6.S191 深度学习导论",
   "en": "MIT Introduction to Deep Learning",
   "by": "MIT",
   "y": 2025,
   "yNote": "每年更新",
   "src": "官方课程页",
   "url": "https://introtodeeplearning.com/",
   "auth": "official",
   "st": [
    "s4"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "短周期密集型公开课，讲义与实验齐全。"
  },
  {
   "id": "c06",
   "t": "course",
   "n": "MIT 18.06 线性代数",
   "en": "MIT 18.06 Linear Algebra",
   "by": "MIT OCW / Gilbert Strang",
   "y": 2005,
   "yNote": "录制年份，课程持续开放",
   "src": "MIT OpenCourseWare",
   "url": "https://ocw.mit.edu/",
   "auth": "official",
   "st": [
    "s3",
    "s4"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "理解矩阵、投影与特征值的经典公开课。"
  },
  {
   "id": "c07",
   "t": "course",
   "n": "Harvard Stat 110 概率论",
   "en": "Statistics 110",
   "by": "Harvard / Joe Blitzstein",
   "y": 2013,
   "yNote": "录制年份待核验",
   "src": "官方课程页",
   "url": "https://projects.iq.harvard.edu/stat110",
   "auth": "official",
   "st": [
    "s1"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "概率论直觉训练的经典课程，与阶段一高度互补。"
  },
  {
   "id": "c08",
   "t": "course",
   "n": "Andrew Ng 机器学习专项",
   "en": "Machine Learning Specialization",
   "by": "DeepLearning.AI / Stanford Online",
   "y": 2022,
   "yNote": "改版年份待核验",
   "src": "Coursera",
   "url": "https://www.deeplearning.ai/",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "零基础友好的 ML 入门主线，含编程作业。"
  },
  {
   "id": "c09",
   "t": "course",
   "n": "DeepLearning.AI 深度学习专项",
   "en": "Deep Learning Specialization",
   "by": "Andrew Ng 等",
   "y": 2017,
   "yNote": "初版年份",
   "src": "Coursera",
   "url": "https://www.deeplearning.ai/",
   "auth": "official",
   "st": [
    "s4"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "从神经网络基础到序列模型与调参实践。"
  },
  {
   "id": "c10",
   "t": "course",
   "n": "fast.ai Practical Deep Learning for Coders",
   "en": "fast.ai",
   "by": "Jeremy Howard / fast.ai",
   "y": 2025,
   "yNote": "课程持续更新",
   "src": "官方课程页",
   "url": "https://course.fast.ai/",
   "auth": "official",
   "st": [
    "s4",
    "s6"
   ],
   "d": 2,
   "v": "verified",
   "note": "本轮检索确认官网与 Part 2 从零实现 Stable Diffusion 的内容",
   "desc": "代码优先的实战课程，Part 2 深入扩散模型实现。"
  },
  {
   "id": "c11",
   "t": "course",
   "n": "Hugging Face LLM Course",
   "en": "HF LLM Course",
   "by": "Hugging Face",
   "y": 2025,
   "yNote": "持续更新",
   "src": "官方 Learn 平台",
   "url": "https://huggingface.co/learn/llm-course",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "verified",
   "note": "本轮检索确认 Learn 平台 2025 年活跃课程目录",
   "desc": "Transformers / Datasets / Tokenizers / PEFT 的动手入门。"
  },
  {
   "id": "c12",
   "t": "course",
   "n": "3Blue1Brown 神经网络与线性代数系列",
   "en": "Neural Networks / Essence of Linear Algebra",
   "by": "Grant Sanderson",
   "y": 2017,
   "yNote": "系列起始年份待核验",
   "src": "官方站点",
   "url": "https://www.3blue1brown.com/topics/neural-networks",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "用动画建立反向传播与线代直觉的最佳补充材料。"
  },
  {
   "id": "c13",
   "t": "course",
   "n": "李宏毅机器学习课程",
   "en": "Hung-yi Lee ML",
   "by": "台湾大学 李宏毅",
   "y": 2021,
   "yNote": "年份以具体学期为准",
   "src": "官方课程页",
   "url": "",
   "auth": "official",
   "st": [
    "s3",
    "s4",
    "s6"
   ],
   "d": 2,
   "v": "pending",
   "note": "本轮未打开官方课程页核对最新学年 URL",
   "desc": "中文讲解深入且覆盖面广，含 Transformer 与生成模型专题。"
  },
  {
   "id": "c14",
   "t": "course",
   "n": "Kaggle Learn 微课程",
   "en": "Kaggle Learn",
   "by": "Kaggle",
   "y": 2018,
   "yNote": "起始年份待核验",
   "src": "官方平台",
   "url": "https://www.kaggle.com/learn",
   "auth": "official",
   "st": [
    "s1",
    "s2",
    "s3"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "Python / pandas / 可视化 / ML 的短实践单元。"
  },
  {
   "id": "d01",
   "t": "dataset",
   "n": "UCI Machine Learning Repository",
   "en": "UCI ML Repo",
   "by": "UC Irvine",
   "y": 1987,
   "src": "官方站点",
   "url": "https://archive.ics.uci.edu/",
   "auth": "official",
   "st": [
    "s1",
    "s3"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "经典小型表格数据集集合，适合练习推断与建模。"
  },
  {
   "id": "d02",
   "t": "dataset",
   "n": "MNIST",
   "en": "MNIST",
   "by": "LeCun / Cortes / Burges",
   "y": 1998,
   "src": "官方页面",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "手写数字识别基准，深度学习入门默认数据。"
  },
  {
   "id": "d03",
   "t": "dataset",
   "n": "CIFAR-10 / CIFAR-100",
   "en": "CIFAR",
   "by": "Krizhevsky 等",
   "y": 2009,
   "src": "官方页面",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "小图像分类基准，适合做消融与训练诊断。"
  },
  {
   "id": "d04",
   "t": "dataset",
   "n": "ImageNet / ILSVRC",
   "en": "ImageNet",
   "by": "Fei-Fei Li 等",
   "y": 2009,
   "yNote": "ILSVRC 竞赛 2012 起",
   "src": "官方站点",
   "url": "https://www.image-net.org/",
   "auth": "official",
   "st": [
    "s4",
    "s5"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "大规模视觉基准，2012 年 AlexNet 的舞台。"
  },
  {
   "id": "d05",
   "t": "dataset",
   "n": "MS COCO",
   "en": "COCO",
   "by": "Microsoft 等",
   "y": 2014,
   "src": "官方站点",
   "url": "",
   "auth": "official",
   "st": [
    "s5"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "检测/分割/图像描述多任务数据集。"
  },
  {
   "id": "d06",
   "t": "dataset",
   "n": "Titanic（Kaggle）",
   "en": "Titanic",
   "by": "Kaggle",
   "y": 2012,
   "yNote": "竞赛上线年份待核验",
   "src": "Kaggle",
   "url": "https://www.kaggle.com/",
   "auth": "community",
   "st": [
    "s1",
    "s3"
   ],
   "d": 1,
   "v": "pending",
   "note": "竞赛上线年份未核验",
   "desc": "入门分类练习数据，也适合演示数据泄漏与缺失值处理。"
  },
  {
   "id": "d07",
   "t": "dataset",
   "n": "GLUE / SuperGLUE",
   "en": "GLUE",
   "by": "Wang 等 / NYU 等",
   "y": 2018,
   "yNote": "SuperGLUE 2019",
   "src": "官方基准",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "自然语言理解多任务基准，现多已饱和。"
  },
  {
   "id": "d08",
   "t": "dataset",
   "n": "SQuAD",
   "en": "SQuAD",
   "by": "Rajpurkar 等（斯坦福）",
   "y": 2016,
   "src": "官方基准",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "抽取式问答基准，评测体系的早期标准。"
  },
  {
   "id": "d09",
   "t": "dataset",
   "n": "MMLU",
   "en": "MMLU",
   "by": "Hendrycks 等",
   "y": 2020,
   "yNote": "arXiv 2020，发表于 2021",
   "src": "arXiv",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "verified",
   "note": "本轮检索到 2020-09 与 2021 两种标注；此处按 arXiv 首发 2020",
   "desc": "57 学科多选知识基准，现已接近饱和。"
  },
  {
   "id": "d10",
   "t": "dataset",
   "n": "MMLU-Pro",
   "en": "MMLU-Pro",
   "by": "TIGER Lab 等",
   "y": 2024,
   "yNote": "2024-06",
   "src": "arXiv / 官方仓库",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 3,
   "v": "verified",
   "note": "本轮检索到多个基准目录标注 2024-06-03 发布",
   "desc": "10 选项、更重推理的 MMLU 继任者，拉开前沿模型区分度。"
  },
  {
   "id": "d11",
   "t": "dataset",
   "n": "GPQA Diamond",
   "en": "GPQA",
   "by": "Rein 等",
   "y": 2023,
   "yNote": "2023-11",
   "src": "arXiv",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮检索到 2023-11-20 的发布标注与 198 题规模",
   "desc": "博士级「抗搜索」科学问答，198 题的 Diamond 子集最常用。"
  },
  {
   "id": "d12",
   "t": "dataset",
   "n": "SWE-bench / SWE-bench Verified",
   "en": "SWE-bench",
   "by": "Jimenez 等（Princeton / 芝加哥大学）",
   "y": 2023,
   "yNote": "Verified 子集 2024",
   "src": "arXiv / 官方基准",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮检索标注 SWE-bench 2023、Verified 2024；另有目录标 2025-02，存在口径差异",
   "desc": "用真实 GitHub issue 与仓库单元测试评分代码智能体。"
  },
  {
   "id": "d13",
   "t": "dataset",
   "n": "Humanity's Last Exam",
   "en": "HLE",
   "by": "Center for AI Safety / Scale AI",
   "y": 2025,
   "yNote": "2025-01-24",
   "src": "官方基准 / arXiv",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮检索到 2025-01 发布与约 2500 题规模",
   "desc": "面向前沿极限的专家级闭卷考试，设计上保留较大提升空间。"
  },
  {
   "id": "d14",
   "t": "dataset",
   "n": "HumanEval / GSM8K / MATH",
   "en": "经典推理与代码基准",
   "by": "OpenAI / Hendrycks 等",
   "y": 2021,
   "src": "arXiv",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "2021 年一代基准，现已基本饱和，适合做历史对照。"
  },
  {
   "id": "d15",
   "t": "dataset",
   "n": "Common Crawl",
   "en": "Common Crawl",
   "by": "Common Crawl Foundation",
   "y": 2007,
   "yNote": "起始年份待核验",
   "src": "官方站点",
   "url": "https://commoncrawl.org/",
   "auth": "official",
   "st": [
    "s2",
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "开放网页抓取语料，绝大多数大模型预训练数据的上游。"
  },
  {
   "id": "d16",
   "t": "dataset",
   "n": "The Pile / C4 / FineWeb",
   "en": "Open pretraining corpora",
   "by": "EleutherAI / Google / Hugging Face",
   "y": 2020,
   "yNote": "各语料年份不同",
   "src": "各项目官方仓库",
   "url": "",
   "auth": "official",
   "st": [
    "s2",
    "s6"
   ],
   "d": 3,
   "v": "pending",
   "note": "本轮未逐一核验各语料发布年份，合并为一条待核验条目",
   "desc": "公开预训练语料族，用于研究数据配比、去重与过滤。"
  },
  {
   "id": "d17",
   "t": "dataset",
   "n": "ARC-AGI-2",
   "en": "ARC-AGI-2",
   "by": "ARC Prize Foundation",
   "y": 2025,
   "yNote": "2025-03",
   "src": "官方基准",
   "url": "https://arcprize.org/",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 4,
   "v": "verified",
   "note": "本轮检索到 2025 年 3 月发布且发布时前沿模型得分为 0 的记录",
   "desc": "抽象推理网格谜题，刻意规避记忆与检索捷径。"
  },
  {
   "id": "d18",
   "t": "dataset",
   "n": "Boston Housing（已弃用提醒）",
   "en": "Boston Housing",
   "by": "UCI / scikit-learn",
   "y": 1978,
   "src": "UCI",
   "url": "",
   "auth": "community",
   "st": [
    "s1",
    "s3"
   ],
   "d": 1,
   "v": "pending",
   "note": "因变量涉及种族变量引发伦理争议，scikit-learn 已移除；年份待核验",
   "desc": "曾广泛用于回归教学，现应改用替代数据集，并作为数据伦理案例讲解。"
  },
  {
   "id": "o01",
   "t": "tool",
   "n": "Python",
   "en": "Python",
   "by": "Python Software Foundation",
   "y": 1991,
   "src": "官方站点",
   "url": "https://www.python.org/",
   "auth": "official",
   "st": [
    "s1",
    "s2",
    "s3",
    "s4",
    "s5",
    "s6"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "全阶段通用语言与生态底座。"
  },
  {
   "id": "o02",
   "t": "tool",
   "n": "NumPy / SciPy",
   "en": "NumPy / SciPy",
   "by": "社区开源",
   "y": 2006,
   "yNote": "NumPy 2006；SciPy 2001",
   "src": "官方站点",
   "url": "https://numpy.org/",
   "auth": "official",
   "st": [
    "s1",
    "s3",
    "s4"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "数值数组与科学计算基础，手写算法的起点。"
  },
  {
   "id": "o03",
   "t": "tool",
   "n": "pandas",
   "en": "pandas",
   "by": "社区开源",
   "y": 2008,
   "yNote": "起始年份待核验",
   "src": "官方站点",
   "url": "https://pandas.pydata.org/",
   "auth": "official",
   "st": [
    "s1",
    "s2"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "表格数据处理与描述分析主力。"
  },
  {
   "id": "o04",
   "t": "tool",
   "n": "R 语言",
   "en": "R",
   "by": "R Foundation",
   "y": 1993,
   "yNote": "起始年份按通行引用",
   "src": "官方站点",
   "url": "https://www.r-project.org/",
   "auth": "official",
   "st": [
    "s1"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "统计建模与可视化的传统主力，ISLR 官方实验语言。"
  },
  {
   "id": "o05",
   "t": "tool",
   "n": "scikit-learn",
   "en": "scikit-learn",
   "by": "社区开源",
   "y": 2007,
   "yNote": "首个公开版本年份待核验",
   "src": "官方站点",
   "url": "https://scikit-learn.org/",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "经典机器学习算法与评估协议的统一接口。"
  },
  {
   "id": "o06",
   "t": "tool",
   "n": "Jupyter",
   "en": "Project Jupyter",
   "by": "社区开源",
   "y": 2014,
   "yNote": "起始年份待核验",
   "src": "官方站点",
   "url": "https://jupyter.org/",
   "auth": "official",
   "st": [
    "s1",
    "s3",
    "s4"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "可复现的交互式实验记录载体。"
  },
  {
   "id": "o07",
   "t": "tool",
   "n": "Apache Hadoop / MapReduce",
   "en": "Hadoop",
   "by": "Apache 基金会",
   "y": 2006,
   "src": "官方站点",
   "url": "https://hadoop.apache.org/",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "分布式存储与批处理的第一代工业标准。"
  },
  {
   "id": "o08",
   "t": "tool",
   "n": "Apache Spark",
   "en": "Spark",
   "by": "Apache 基金会 / UC Berkeley",
   "y": 2014,
   "yNote": "2014 成为 Apache 顶级项目",
   "src": "官方站点",
   "url": "https://spark.apache.org/",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "内存计算与 DataFrame API，大规模分析主力。"
  },
  {
   "id": "o09",
   "t": "tool",
   "n": "Apache Flink / Kafka",
   "en": "Flink / Kafka",
   "by": "Apache 基金会",
   "y": 2014,
   "yNote": "Flink 2014 顶级项目；Kafka 2011 开源",
   "src": "官方站点",
   "url": "https://flink.apache.org/",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "流处理与消息队列，支撑事件时间与水位线语义。"
  },
  {
   "id": "o10",
   "t": "tool",
   "n": "DuckDB / Polars / Apache Arrow",
   "en": "Modern single-node analytics",
   "by": "各开源项目",
   "y": 2019,
   "yNote": "DuckDB 起始年份；其余不同",
   "src": "官方站点",
   "url": "https://duckdb.org/",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "列式向量化引擎，让单机也能处理十亿行级分析。"
  },
  {
   "id": "o11",
   "t": "tool",
   "n": "Apache Parquet",
   "en": "Parquet",
   "by": "Apache 基金会",
   "y": 2013,
   "yNote": "起始年份待核验",
   "src": "官方站点",
   "url": "https://parquet.apache.org/",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "列式存储格式，谓词下推与压缩的基础。"
  },
  {
   "id": "o12",
   "t": "tool",
   "n": "PyTorch",
   "en": "PyTorch",
   "by": "Meta AI / PyTorch Foundation",
   "y": 2016,
   "src": "官方站点",
   "url": "https://pytorch.org/",
   "auth": "official",
   "st": [
    "s4",
    "s5",
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "动态图深度学习框架，研究与教学事实标准。"
  },
  {
   "id": "o13",
   "t": "tool",
   "n": "TensorFlow / Keras",
   "en": "TensorFlow / Keras",
   "by": "Google / 社区",
   "y": 2015,
   "src": "官方站点",
   "url": "https://www.tensorflow.org/",
   "auth": "official",
   "st": [
    "s4"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "工业部署生态成熟的深度学习框架。"
  },
  {
   "id": "o14",
   "t": "tool",
   "n": "JAX",
   "en": "JAX",
   "by": "Google",
   "y": 2018,
   "yNote": "起始年份待核验",
   "src": "官方站点",
   "url": "",
   "auth": "official",
   "st": [
    "s4",
    "s6"
   ],
   "d": 3,
   "v": "canonical",
   "note": "",
   "desc": "可组合变换 + XLA 编译，适合研究与大规模训练。"
  },
  {
   "id": "o15",
   "t": "tool",
   "n": "XGBoost / LightGBM",
   "en": "GBDT frameworks",
   "by": "社区开源 / Microsoft",
   "y": 2014,
   "yNote": "XGBoost 2014；LightGBM 2017",
   "src": "官方仓库",
   "url": "",
   "auth": "official",
   "st": [
    "s3"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "梯度提升树的高效实现，表格数据强基线。"
  },
  {
   "id": "o16",
   "t": "tool",
   "n": "Hugging Face Transformers / Datasets / PEFT / TRL",
   "en": "Hugging Face ecosystem",
   "by": "Hugging Face",
   "y": 2019,
   "yNote": "Transformers 首发年份，其余不同",
   "src": "官方站点",
   "url": "https://huggingface.co/",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "canonical",
   "note": "",
   "desc": "模型、数据、微调与对齐的一站式开源生态。"
  },
  {
   "id": "o17",
   "t": "tool",
   "n": "vLLM / llama.cpp / Ollama",
   "en": "Local inference runtimes",
   "by": "各开源项目",
   "y": 2023,
   "yNote": "三者均在 2023 年前后出现，具体年份待核验",
   "src": "官方仓库",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 2,
   "v": "pending",
   "note": "本轮未核验三者各自的首次发布年份",
   "desc": "高吞吐服务端推理与本地 CPU/GPU 推理的常用运行时。"
  },
  {
   "id": "o18",
   "t": "tool",
   "n": "Stan / PyMC / Pyro",
   "en": "Probabilistic programming",
   "by": "各开源项目",
   "y": 2012,
   "yNote": "年份为代表性项目近似值",
   "src": "官方站点",
   "url": "",
   "auth": "official",
   "st": [
    "s1",
    "s6"
   ],
   "d": 3,
   "v": "pending",
   "note": "本轮未逐一核验各项目起始年份",
   "desc": "贝叶斯建模与 MCMC/变分推断的可编程实现。"
  },
  {
   "id": "o19",
   "t": "tool",
   "n": "PostgreSQL / SQLite",
   "en": "Relational databases",
   "by": "各开源项目",
   "y": 1996,
   "yNote": "PostgreSQL 1996；SQLite 2000",
   "src": "官方站点",
   "url": "",
   "auth": "official",
   "st": [
    "s2"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "SQL 与事务语义的实践载体。"
  },
  {
   "id": "o20",
   "t": "tool",
   "n": "MLflow / Weights & Biases",
   "en": "Experiment tracking",
   "by": "各开源/商业项目",
   "y": 2018,
   "yNote": "年份待核验",
   "src": "官方站点",
   "url": "",
   "auth": "official",
   "st": [
    "s3",
    "s4"
   ],
   "d": 2,
   "v": "pending",
   "note": "本轮未核验起始年份",
   "desc": "实验参数、指标与产物版本管理，保障可复现性。"
  },
  {
   "id": "s01",
   "t": "oss",
   "n": "arXiv",
   "en": "arXiv",
   "by": "Cornell / 社区",
   "y": 1991,
   "src": "官方站点",
   "url": "https://arxiv.org/",
   "auth": "official",
   "st": [
    "s3",
    "s4",
    "s5",
    "s6"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "预印本平台，跟进前沿论文的第一入口。"
  },
  {
   "id": "s02",
   "t": "oss",
   "n": "Papers with Code",
   "en": "Papers with Code",
   "by": "Meta AI / 社区",
   "y": 2018,
   "src": "聚合站点",
   "url": "",
   "auth": "community",
   "st": [
    "s3",
    "s4",
    "s5",
    "s6"
   ],
   "d": 1,
   "v": "pending",
   "note": "本轮检索到该站点近年服务状态发生变化的说法，当前可用性与归档方式待核验",
   "desc": "论文与代码/榜单的对照索引；使用前请确认当前可访问状态。"
  },
  {
   "id": "s03",
   "t": "oss",
   "n": "Kaggle",
   "en": "Kaggle",
   "by": "Google / Kaggle",
   "y": 2010,
   "src": "官方站点",
   "url": "https://www.kaggle.com/",
   "auth": "official",
   "st": [
    "s1",
    "s3"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "数据集、竞赛、Notebook 与免费微课程。"
  },
  {
   "id": "s04",
   "t": "oss",
   "n": "Google Colab",
   "en": "Colaboratory",
   "by": "Google",
   "y": 2017,
   "yNote": "起始年份待核验",
   "src": "官方站点",
   "url": "",
   "auth": "official",
   "st": [
    "s3",
    "s4"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "免配置的托管 Notebook 与有限 GPU 算力。"
  },
  {
   "id": "s05",
   "t": "oss",
   "n": "Hugging Face Hub",
   "en": "HF Hub",
   "by": "Hugging Face",
   "y": 2019,
   "yNote": "起始年份待核验",
   "src": "官方站点",
   "url": "https://huggingface.co/",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "开放权重、数据集与 Demo 的协作平台。"
  },
  {
   "id": "s06",
   "t": "oss",
   "n": "nanoGPT / minGPT",
   "en": "nanoGPT",
   "by": "Andrej Karpathy",
   "y": 2022,
   "yNote": "年份待核验",
   "src": "GitHub",
   "url": "https://github.com/karpathy/nanoGPT",
   "auth": "community",
   "st": [
    "s5",
    "s6"
   ],
   "d": 3,
   "v": "pending",
   "note": "本轮未打开仓库核对首次提交年份",
   "desc": "最小可读的 GPT 训练实现，适合从零复现语言模型。"
  },
  {
   "id": "s07",
   "t": "oss",
   "n": "Alignment Handbook / TRL",
   "en": "Open alignment recipes",
   "by": "Hugging Face",
   "y": 2023,
   "yNote": "年份待核验",
   "src": "GitHub",
   "url": "",
   "auth": "official",
   "st": [
    "s6"
   ],
   "d": 3,
   "v": "pending",
   "note": "本轮未核验首发年份",
   "desc": "可复现的 SFT / DPO 训练配方，适合小规模对齐实验。"
  },
  {
   "id": "s08",
   "t": "oss",
   "n": "scikit-learn / PyTorch 官方仓库与文档",
   "en": "Official docs & repos",
   "by": "各开源项目",
   "y": 2010,
   "yNote": "年份为示意，按各自项目为准",
   "src": "GitHub / 官方文档",
   "url": "https://scikit-learn.org/stable/documentation.html",
   "auth": "official",
   "st": [
    "s3",
    "s4"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "优先查阅官方文档而非二手教程，是避免 API 过时的主要方法。"
  },
  {
   "id": "s09",
   "t": "oss",
   "n": "Epoch AI 数据与算力追踪",
   "en": "Epoch AI",
   "by": "Epoch AI",
   "y": 2022,
   "yNote": "起始年份待核验",
   "src": "研究机构站点",
   "url": "https://epoch.ai/",
   "auth": "academic",
   "st": [
    "s4",
    "s6"
   ],
   "d": 3,
   "v": "pending",
   "note": "本轮未核验机构成立年份",
   "desc": "训练算力趋势、数据枯竭预测与缩放定律复现研究。"
  },
  {
   "id": "s10",
   "t": "oss",
   "n": "Wikipedia / 斯坦福哲学百科（概念核对）",
   "en": "Reference encyclopedias",
   "by": "社区 / 学术机构",
   "y": 2001,
   "yNote": "Wikipedia 起始年份",
   "src": "官方站点",
   "url": "",
   "auth": "community",
   "st": [
    "s1",
    "s2",
    "s3",
    "s4",
    "s5",
    "s6"
   ],
   "d": 1,
   "v": "canonical",
   "note": "",
   "desc": "用于快速核对术语与历史脉络，正式引用仍需回到一手来源。"
  }
 ],
 "timeline": [
  {
   "id": "y1763",
   "year": 1763,
   "date": "1763",
   "n": "贝叶斯定理发表",
   "en": "Bayes' Theorem",
   "by": "Thomas Bayes / Laplace",
   "stage": "s1",
   "src": "An Essay towards solving a Problem in the Doctrine of Chances",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "后验 ∝ 似然 × 先验。此后的贝叶斯统计、变分推断与不确定性量化都从这里出发。"
  },
  {
   "id": "y1805",
   "year": 1805,
   "date": "1805 / 1809",
   "n": "最小二乘法",
   "en": "Least Squares",
   "by": "Legendre / Gauss",
   "stage": "s1",
   "src": "学术史通行引用",
   "url": "",
   "v": "canonical",
   "note": "优先权归属有史料争议",
   "desc": "最小化残差平方和；在高斯误差下等价于最大似然，成为回归的起点。"
  },
  {
   "id": "y1900",
   "year": 1900,
   "date": "1900",
   "n": "卡方检验",
   "en": "Pearson's chi-square",
   "by": "Karl Pearson",
   "stage": "s1",
   "src": "Philosophical Magazine",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "拟合优度与独立性检验的原型，也是列联表分析的根基。"
  },
  {
   "id": "y1922",
   "year": 1922,
   "date": "1922",
   "n": "最大似然估计系统化",
   "en": "Maximum Likelihood",
   "by": "R.A. Fisher",
   "stage": "s1",
   "src": "Phil. Trans. Roy. Soc. A",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "把「参数估计」变成优化问题，直通今日所有神经网络的训练目标。"
  },
  {
   "id": "y1933",
   "year": 1933,
   "date": "1933",
   "n": "Neyman–Pearson 引理",
   "en": "Neyman–Pearson Lemma",
   "by": "Neyman, Pearson",
   "stage": "s1",
   "src": "Phil. Trans. Roy. Soc. A",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "在控制第一类错误下最大化功效，确立假设检验的形式框架。"
  },
  {
   "id": "y1948",
   "year": 1948,
   "date": "1948",
   "n": "信息论诞生",
   "en": "A Mathematical Theory of Communication",
   "by": "Claude Shannon",
   "stage": "s1",
   "src": "Bell System Technical Journal",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "熵、互信息与信道容量；交叉熵损失与 KL 散度的源头。"
  },
  {
   "id": "y1952",
   "year": 1952,
   "date": "1952",
   "n": "Bradley–Terry 偏好模型",
   "en": "Bradley–Terry Model",
   "by": "Bradley, Terry",
   "stage": "s6",
   "src": "Biometrika",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "70 年后成为 RLHF 奖励模型与 DPO 的统计根基。"
  },
  {
   "id": "y1958",
   "year": 1958,
   "date": "1958",
   "n": "感知机",
   "en": "Perceptron",
   "by": "Frank Rosenblatt",
   "stage": "s5",
   "src": "Psychological Review",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "第一个可学习的神经网络模型。"
  },
  {
   "id": "y1974",
   "year": 1974,
   "date": "1974",
   "n": "潜在结果因果框架",
   "en": "Potential Outcomes",
   "by": "Donald Rubin",
   "stage": "s1",
   "src": "Journal of Educational Psychology",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "形式化「同一对象无法同时观测两种结果」的根本难题。"
  },
  {
   "id": "y1979",
   "year": 1979,
   "date": "1979",
   "n": "Bootstrap",
   "en": "Bootstrap",
   "by": "Bradley Efron",
   "stage": "s1",
   "src": "Annals of Statistics",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "用重采样估计统计量分布；今日 LLM 评测置信区间仍常用。"
  },
  {
   "id": "y1986",
   "year": 1986,
   "date": "1986",
   "n": "反向传播普及",
   "en": "Backpropagation",
   "by": "Rumelhart, Hinton, Williams",
   "stage": "s4",
   "src": "Nature",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "多层网络终于可训练，深度学习方法论成形。"
  },
  {
   "id": "y1997",
   "year": 1997,
   "date": "1997",
   "n": "LSTM",
   "en": "LSTM",
   "by": "Hochreiter, Schmidhuber",
   "stage": "s5",
   "src": "Neural Computation",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "门控机制缓解梯度消失，主导序列建模近二十年。"
  },
  {
   "id": "y1998",
   "year": 1998,
   "date": "1998",
   "n": "LeNet-5 与 MNIST",
   "en": "LeNet-5 / MNIST",
   "by": "Yann LeCun 等",
   "stage": "s5",
   "src": "Proceedings of the IEEE",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "卷积网络首个工业级应用，也留下了最经典的入门数据集。"
  },
  {
   "id": "y2001",
   "year": 2001,
   "date": "2001",
   "n": "随机森林",
   "en": "Random Forests",
   "by": "Leo Breiman",
   "stage": "s3",
   "src": "Machine Learning",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "Bagging 降方差的代表，表格数据长期强基线。"
  },
  {
   "id": "y2004",
   "year": 2004,
   "date": "2004",
   "n": "MapReduce",
   "en": "MapReduce",
   "by": "Dean, Ghemawat（Google）",
   "stage": "s2",
   "src": "OSDI 2004",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "把分布式计算抽象为 map/shuffle/reduce，大数据分析阶段正式开启。"
  },
  {
   "id": "y2005",
   "year": 2005,
   "date": "2005",
   "n": "共形预测理论",
   "en": "Conformal Prediction",
   "by": "Vovk, Gammerman, Shafer",
   "stage": "s6",
   "src": "Algorithmic Learning in a Random World",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "分布无关的有限样本覆盖保证，20 年后成为 LLM 不确定性量化热点。"
  },
  {
   "id": "y2012",
   "year": 2012,
   "date": "2012",
   "n": "AlexNet 与 Spark RDD",
   "en": "AlexNet / Spark RDD",
   "by": "Krizhevsky 等 / Zaharia 等",
   "stage": "s4",
   "src": "NeurIPS 2012 / NSDI 2012",
   "url": "",
   "v": "canonical",
   "note": "",
   "desc": "同一年里，深度学习因 GPU 复兴，大数据因内存计算转向交互式分析。"
  },
  {
   "id": "y2013",
   "year": 2013,
   "date": "2013",
   "n": "VAE 与 ISLR 第 1 版",
   "en": "VAE / ISLR",
   "by": "Kingma & Welling / James 等",
   "stage": "s6",
   "src": "arXiv:1312.6114 / Springer",
   "url": "https://www.statlearning.com/",
   "v": "verified",
   "note": "ISLR 官网明确写明第 1 版 2013 年",
   "desc": "变分推断进入深度生成模型；统计学习教材开始普及。"
  },
  {
   "id": "y2014",
   "year": 2014,
   "date": "2014",
   "n": "GAN 与注意力机制",
   "en": "GAN / Bahdanau Attention",
   "by": "Goodfellow 等 / Bahdanau 等",
   "stage": "s6",
   "src": "arXiv:1406.2661 / arXiv:1409.0473",
   "url": "https://arxiv.org/abs/1409.0473",
   "v": "canonical",
   "note": "",
   "desc": "两条生成/序列建模路线同时出现；注意力为 Transformer 埋下伏笔。"
  },
  {
   "id": "y2015",
   "year": 2015,
   "date": "2015",
   "n": "ResNet 与 TensorFlow",
   "en": "ResNet / TensorFlow",
   "by": "He 等 / Google",
   "stage": "s4",
   "src": "arXiv:1512.03385 / 官方发布",
   "url": "https://arxiv.org/abs/1512.03385",
   "v": "canonical",
   "note": "",
   "desc": "残差连接让深度不再受限，框架让训练工程化。"
  },
  {
   "id": "y2017",
   "year": 2017,
   "date": "2017",
   "n": "Attention Is All You Need",
   "en": "Transformer",
   "by": "Vaswani 等（Google）",
   "stage": "s5",
   "src": "arXiv:1706.03762 / NeurIPS 2017",
   "url": "https://arxiv.org/abs/1706.03762",
   "v": "canonical",
   "note": "",
   "desc": "纯注意力架构取代循环结构，成为此后所有大模型的骨架。"
  },
  {
   "id": "y2018",
   "year": 2018,
   "date": "2018",
   "n": "BERT 与 MMLU 酝酿",
   "en": "BERT / pretraining era",
   "by": "Devlin 等",
   "stage": "s6",
   "src": "arXiv:1810.04805",
   "url": "https://arxiv.org/abs/1810.04805",
   "v": "canonical",
   "note": "",
   "desc": "预训练 + 微调成为 NLP 主流范式。"
  },
  {
   "id": "y2020",
   "year": 2020,
   "date": "2020",
   "n": "GPT-3、缩放定律与 DDPM",
   "en": "GPT-3 / Scaling Laws / DDPM",
   "by": "OpenAI / Ho 等",
   "stage": "s6",
   "src": "arXiv:2005.14165 / 2001.08361 / 2006.11239",
   "url": "https://arxiv.org/abs/2001.08361",
   "v": "canonical",
   "note": "",
   "desc": "规模成为能力、损失呈幂律、扩散模型把生成化为逐步去噪，生成式 AI 三条主线同时成形。"
  },
  {
   "id": "y2021",
   "year": 2021,
   "date": "2021",
   "n": "共形预测综述与 ISLR 第 2 版",
   "en": "Conformal intro / ISLR 2e",
   "by": "Angelopoulos & Bates / James 等",
   "stage": "s6",
   "src": "arXiv:2107.07511 / Springer",
   "url": "https://arxiv.org/abs/2107.07511",
   "v": "verified",
   "note": "本轮核验 arXiv 编号与 ISLR 官网版次说明",
   "desc": "分布无关不确定性量化开始被系统性引入现代机器学习。"
  },
  {
   "id": "y2022",
   "year": 2022,
   "date": "2022",
   "n": "Chinchilla、InstructGPT 与 LDM",
   "en": "Chinchilla / RLHF / Latent Diffusion",
   "by": "DeepMind / OpenAI / Rombach 等",
   "stage": "s6",
   "src": "arXiv:2203.15556 / 2203.02155 / 2112.10752",
   "url": "https://arxiv.org/abs/2203.15556",
   "v": "verified",
   "note": "本轮核验 Chinchilla=2203.15556、InstructGPT=2203.02155，两者易混淆",
   "desc": "训练配比被修正、偏好对齐被标准化、图像生成进入潜空间。"
  },
  {
   "id": "y2023",
   "year": 2023,
   "date": "2023",
   "n": "DPO 与 GPQA",
   "en": "DPO / GPQA",
   "by": "Rafailov 等 / Rein 等",
   "stage": "s6",
   "src": "arXiv:2305.18290 / GPQA 论文",
   "url": "https://arxiv.org/abs/2305.18290",
   "v": "verified",
   "note": "本轮已核验 DPO arXiv 编号；GPQA 发布年月经基准目录核对",
   "desc": "RLHF 被化简为分类损失；博士级抗搜索基准出现，反映评测难度升级。"
  },
  {
   "id": "y2024a",
   "year": 2024,
   "date": "2024-03",
   "n": "Stable Diffusion 3 / 整流流与 MMDiT",
   "en": "SD3 / Rectified Flow",
   "by": "Esser 等（Stability AI）",
   "stage": "s6",
   "src": "arXiv:2403.03206 / ICML 2024",
   "url": "https://arxiv.org/abs/2403.03206",
   "v": "verified",
   "note": "本轮核验 arXiv 编号与官方研究页",
   "desc": "主流图像生成从 U-Net 扩散转向流匹配 + Transformer 主干。"
  },
  {
   "id": "y2024b",
   "year": 2024,
   "date": "2024-02",
   "n": "GRPO / DeepSeekMath",
   "en": "GRPO",
   "by": "Shao 等（DeepSeek）",
   "stage": "s6",
   "src": "arXiv:2402.03300",
   "url": "https://arxiv.org/abs/2402.03300",
   "v": "verified",
   "note": "本轮核验 arXiv 编号",
   "desc": "去掉 critic 的组相对策略优化，一年后成为 R1 训练的关键。"
  },
  {
   "id": "y2024c",
   "year": 2024,
   "date": "2024-07",
   "n": "Llama 3.1 405B",
   "en": "Llama 3.1",
   "by": "Meta AI",
   "stage": "s6",
   "src": "官方 llama-models 仓库",
   "url": "https://github.com/meta-llama/llama-models",
   "v": "verified",
   "note": "本轮已打开官方仓库核对 2024-07-23 发布日期",
   "desc": "开放权重模型首次达到 400B 级稠密规模，128K 上下文。"
  },
  {
   "id": "y2024d",
   "year": 2024,
   "date": "2024-06",
   "n": "MMLU-Pro 与新一代基准",
   "en": "MMLU-Pro",
   "by": "TIGER Lab 等",
   "stage": "s6",
   "src": "arXiv / 官方仓库",
   "url": "",
   "v": "verified",
   "note": "本轮多个基准目录标注 2024-06 发布",
   "desc": "MMLU 饱和后，更难、更重推理的基准成为评测主流，凸显评测统计学的重要性。"
  },
  {
   "id": "y2024e",
   "year": 2024,
   "date": "2024",
   "n": "推理时计算成为新扩展轴",
   "en": "Test-time compute",
   "by": "OpenAI o1 / Snell 等",
   "stage": "s6",
   "src": "2024 年系列工作",
   "url": "",
   "v": "pending",
   "note": "本轮未核验具体官方论文与发布日期，仅记录方向；DeepSeek-R1 与 s1 为已核验锚点",
   "desc": "算力从训练向推理转移，长思维链与可验证奖励改写缩放定律。"
  },
  {
   "id": "y2024f",
   "year": 2024,
   "date": "2024-12",
   "n": "DeepSeek-V3",
   "en": "DeepSeek-V3",
   "by": "DeepSeek-AI",
   "stage": "s6",
   "src": "arXiv:2412.19437",
   "url": "https://arxiv.org/abs/2412.19437",
   "v": "verified",
   "note": "本轮核验 arXiv 编号与提交日期",
   "desc": "671B MoE / 37B 激活，MLA 与无辅助损失负载均衡，展示高效规模化路径。"
  },
  {
   "id": "y2025a",
   "year": 2025,
   "date": "2025-01",
   "n": "DeepSeek-R1",
   "en": "DeepSeek-R1",
   "by": "DeepSeek-AI",
   "stage": "s6",
   "src": "arXiv:2501.12948 / Nature 645",
   "url": "https://arxiv.org/abs/2501.12948",
   "v": "verified",
   "note": "本轮核验 arXiv 编号与 Nature 卷页",
   "desc": "纯强化学习涌现推理与自我检查；开放权重推理模型成为分水岭。"
  },
  {
   "id": "y2025b",
   "year": 2025,
   "date": "2025-01",
   "n": "s1: 简易测试时缩放",
   "en": "s1 / budget forcing",
   "by": "Muennighoff 等（斯坦福等）",
   "stage": "s6",
   "src": "arXiv:2501.19393",
   "url": "https://arxiv.org/abs/2501.19393",
   "v": "verified",
   "note": "本轮已打开 arXiv 摘要页与项目主页",
   "desc": "1000 条精选样本即可激活推理能力，说明数据质量与推理预算比规模更关键。"
  },
  {
   "id": "y2025c",
   "year": 2025,
   "date": "2025-01",
   "n": "Humanity's Last Exam",
   "en": "HLE",
   "by": "Center for AI Safety / Scale AI",
   "stage": "s6",
   "src": "官方基准 / arXiv",
   "url": "",
   "v": "verified",
   "note": "本轮检索到 2025-01-24 发布与约 2500 题规模",
   "desc": "专家级前沿考试，回应基准饱和与污染问题。"
  },
  {
   "id": "y2025d",
   "year": 2025,
   "date": "2025-04",
   "n": "Llama 4 与 Qwen3",
   "en": "Llama 4 / Qwen3",
   "by": "Meta AI / 阿里巴巴",
   "stage": "s6",
   "src": "官方仓库 / arXiv:2505.09388",
   "url": "https://qwen.ai",
   "v": "verified",
   "note": "本轮核验 Llama 4 官方发布表（2025-04-05）与 Qwen3 技术报告编号",
   "desc": "原生多模态 MoE 与思考/非思考统一模式，开源模型进入架构多样化阶段。"
  },
  {
   "id": "y2025e",
   "year": 2025,
   "date": "2025-03",
   "n": "ARC-AGI-2",
   "en": "ARC-AGI-2",
   "by": "ARC Prize Foundation",
   "stage": "s6",
   "src": "官方基准",
   "url": "https://arcprize.org/",
   "v": "verified",
   "note": "本轮检索到 2025-03 发布、发布时前沿模型得分为 0 的记录",
   "desc": "抽象推理基准凸显「记忆式能力」与「泛化能力」的差距。"
  },
  {
   "id": "y2025f",
   "year": 2025,
   "date": "2025",
   "n": "偏好优化变体与 RLHF 目标统一性研究",
   "en": "DPO variants / RLHF objectives",
   "by": "Meng 等 / 多篇 2024–2025 工作",
   "stage": "s6",
   "src": "arXiv / NeurIPS 等",
   "url": "https://arxiv.org/html/2509.11298v2",
   "v": "verified",
   "note": "通过 2025 年综述核验方法族与年份归属",
   "desc": "DPO/SimPO/IPO/KTO/ORPO/GRPO 的关系被系统化，指出 GRPO 因组内归一化而本质不同。"
  },
  {
   "id": "y2026a",
   "year": 2026,
   "date": "2026（待核验）",
   "n": "2026 年及后续进展（待官方核验）",
   "en": "Post-2025 developments (unverified)",
   "by": "—",
   "stage": "s6",
   "src": "暂无可核验的一手来源",
   "url": "",
   "v": "pending",
   "note": "边界节点，不是具体成果断言：本轮未获得可核验的官方技术报告或公告，故不列具体模型名称；仅提示后续维护者补齐",
   "desc": "边界提示：本时间线以 2025 年已核验条目为可靠边界；2026 年及以后的条目须回到官方技术报告 / 会议论文集 / 出版社页面核验后再收录，避免把二手传闻写成事实。"
  }
 ],
 "labels": {
  "types": {
   "book": "标志性书籍",
   "theory": "标志性理论",
   "paper": "关键论文",
   "model": "里程碑模型",
   "course": "经典课程",
   "dataset": "数据集",
   "tool": "工具/框架",
   "oss": "开源资源"
  },
  "icons": {
   "book": "📘",
   "theory": "🧭",
   "paper": "📄",
   "model": "🏛",
   "course": "🎓",
   "dataset": "🗂",
   "tool": "🧰",
   "oss": "🔓"
  },
  "auth": {
   "official": "一级 · 官方一手",
   "academic": "二级 · 学术机构",
   "community": "三级 · 社区维护"
  },
  "verify": {
   "verified": "已核验",
   "canonical": "权威共识",
   "pending": "待核验"
  },
  "stages": {
   "s1": "统计学",
   "s2": "大数据",
   "s3": "机器学习",
   "s4": "深度学习",
   "s5": "神经网络",
   "s6": "生成式AI"
  }
 }
};
