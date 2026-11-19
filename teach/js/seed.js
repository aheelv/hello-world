/* 示例种子数据 v2:课程群独立实体 + 负责人 + 学期 + 角色 */
function uid(p){return (p||'id')+'_'+Math.random().toString(36).slice(2,9)}

const SEED = {
  settings: { role:'admin', userName:'系统管理员', term:'2025-2026-1' },
  majors: [
    {
      id:'mj_bigdata', code:'120108T', name:'大数据管理与应用', leader:'刘院长',
      desc:'面向数字经济,培养掌握大数据技术与管理分析方法、能够进行商务数据分析与智能决策的复合型人才。专业直接关联课程并制定修读学期,部分课程组成课程群。',
      courses:[
        {courseId:'c_calc',   semester:1},
        {courseId:'c_mgmt',   semester:1},
        {courseId:'c_python', semester:2},
        {courseId:'c_stat',   semester:3},
        {courseId:'c_db',     semester:3},
        {courseId:'c_bigdata',semester:5},
        {courseId:'c_ml',     semester:6}
      ]
    },
    {
      id:'mj_ecom', code:'120801', name:'电子商务', leader:'周主任',
      desc:'示例:展示课程跨专业共享能力。共享《数据库原理与应用》(本专业安排在第4学期)。',
      courses:[ {courseId:'c_db', semester:4} ]
    }
  ],
  groups: [
    {id:'g_math', majorId:'mj_bigdata', name:'数学与统计基础', leader:'李芳', desc:'夯实数理与统计根基,支撑后续数据分析类课程', courseIds:['c_calc','c_stat']},
    {id:'g_data', majorId:'mj_bigdata', name:'数据科学与技术', leader:'赵强', desc:'数据采集、存储、分析核心链路,覆盖第2~5学期', courseIds:['c_python','c_db','c_bigdata']},
    {id:'g_mgmt', majorId:'mj_bigdata', name:'管理与商业智能', leader:'吴敏', desc:'管理理论 + 智能决策,从管理学走向机器学习应用', courseIds:['c_mgmt','c_ml']},
    {id:'g_ecom_tech', majorId:'mj_ecom', name:'电商技术类', leader:'陈静', desc:'支撑电商系统与数据分析的技术课程', courseIds:['c_db']}
  ],
  courses: [
    {
      id:'c_python', code:'BX211001', name:'Python程序设计', credit:3, hours:48, semester:2, leader:'王伟',
      category:'专业核心课',
      desc:'以数据应用为导向的 Python 程序设计课程,涵盖语法基础、数据结构与数据处理实战。',
      objectives:['掌握 Python 基础语法与程序结构','能运用列表/字典等数据结构处理业务数据','具备函数化与模块化编程能力'],
      chapters:[
        {id:'ch_py1', title:'第1章 Python概述', hours:4, kps:[
          {id:'kp_py11', title:'Python 简介与发展', content:'Python 是**解释型、通用型**高级语言,广泛用于数据分析、人工智能与 Web 开发。\n\n特点:语法简洁、生态丰富(Pandas/NumPy/Scikit-learn)、跨平台。'},
          {id:'kp_py12', title:'环境搭建与第一个程序', content:'安装 Python 与 VS Code;`print("Hello, DLUFE")`\n\n推荐使用 Anaconda 管理虚拟环境:`conda create -n kb python=3.11`'}
        ]},
        {id:'ch_py2', title:'第2章 数据类型与控制结构', hours:12, kps:[
          {id:'kp_py21', title:'列表与字典', content:'- 列表 `list`:有序可变,`lst = [1,2,3]`\n- 字典 `dict`:键值映射,`d = {"name":"张三","score":92}`\n\n统计成绩均值:\n$$\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i$$'},
          {id:'kp_py22', title:'条件与循环', content:'`if/elif/else` 分支结构;`for` 遍历序列、`while` 条件循环。\n\n复杂度:双重循环为 $O(n^2)$。', links:['kp_py21']}
        ]},
        {id:'ch_py3', title:'第3章 函数与模块', hours:10, kps:[
          {id:'kp_py31', title:'函数定义与参数', content:'```python\ndef grade(avg):\n    if avg >= 90: return "优秀"\n    elif avg >= 60: return "及格"\n    return "不及格"\n```\n参数传递:位置参数、关键字参数、默认参数、`*args/**kwargs`。', links:['kp_py22']},
          {id:'kp_py32', title:'递归函数', content:'递归 = 函数调用自身。经典例子斐波那契:\n$$f(n)=f(n-1)+f(n-2),\\quad f(0)=0,\\ f(1)=1$$\n\n注意设置终止条件,避免栈溢出。', links:['kp_py31']}
        ]}
      ]
    },
    {
      id:'c_stat', code:'BX211002', name:'统计学', credit:3, hours:48, semester:3, leader:'李芳',
      category:'学科基础课',
      desc:'描述统计与推断统计基础,为数据分析提供方法论支撑。',
      objectives:['理解描述统计基本概念','掌握常用概率分布','能进行假设检验与回归分析'],
      chapters:[
        {id:'ch_st1', title:'第1章 描述统计', hours:8, kps:[
          {id:'kp_st11', title:'集中趋势与离散程度', content:'均值 $\\mu$、中位数、众数;方差与标准差:\n$$\\sigma^{2}=\\frac{1}{N}\\sum_{i=1}^{N}(x_i-\\mu)^{2}$$\n样本方差采用 $n-1$ 修正(贝塞尔校正):$s^{2}=\\frac{1}{n-1}\\sum(x_i-\\bar{x})^2$'},
          {id:'kp_st12', title:'数据可视化', content:'直方图、箱线图、散点图;四分位距 $IQR=Q_3-Q_1$,异常值判定:$x<Q_1-1.5IQR$ 或 $x>Q_3+1.5IQR$。'}
        ]},
        {id:'ch_st2', title:'第2章 概率与分布', hours:10, kps:[
          {id:'kp_st21', title:'正态分布', content:'$X\\sim N(\\mu,\\sigma^{2})$,密度函数:\n$$f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^{2}}{2\\sigma^{2}}}$$\n$3\\sigma$ 原则:$(\\mu-3\\sigma,\\mu+3\\sigma)$ 覆盖约 99.7%。'}
        ]}
      ]
    },
    {
      id:'c_db', code:'BX211003', name:'数据库原理与应用', credit:3, hours:48, semester:3, leader:'陈静',
      category:'专业核心课',
      desc:'关系数据库理论、SQL 与数据库设计。被【大数据管理与应用】(第3学期)与【电子商务】(第4学期)共享(跨专业共享示例)。',
      objectives:['掌握关系模型与范式理论','熟练使用 SQL 进行查询与更新','能完成 E-R 建模与数据库设计'],
      chapters:[
        {id:'ch_db1', title:'第1章 数据库系统概论', hours:6, kps:[
          {id:'kp_db11', title:'三级模式与两级映射', content:'外模式/模式/内模式;外模式-模式映射保证**逻辑独立性**,模式-内模式映射保证**物理独立性**。'},
          {id:'kp_db12', title:'E-R 模型', content:'实体、属性、联系(1:1 / 1:n / m:n)。设计步骤:需求分析 → 概念设计(E-R) → 逻辑设计(关系模式) → 物理设计。', links:['kp_db13']}
        ]},
        {id:'ch_db2', title:'第2章 关系代数与SQL', hours:14, kps:[
          {id:'kp_db13', title:'关系代数', content:'选择 $\\sigma$、投影 $\\pi$、连接 $\\bowtie$、除 $\\div$。\n\n例:$\\pi_{name}(\\sigma_{score\\geq 90}(Student \\bowtie SC))$'},
          {id:'kp_db14', title:'SQL 查询', content:'```sql\nSELECT s.name, AVG(sc.score) AS avg_score\nFROM Student s JOIN SC ON s.id = sc.sid\nGROUP BY s.name\nHAVING AVG(sc.score) >= 90;\n```', links:['kp_db13']}
        ]}
      ]
    },
    {
      id:'c_bigdata', code:'BX311004', name:'大数据分析技术', credit:3, hours:48, semester:5, leader:'张强',
      category:'专业核心课',
      desc:'Hadoop/Spark 生态与数据分析项目实战。',
      objectives:['理解分布式存储与计算原理','掌握 Spark 数据处理','完成大数据分析项目'],
      chapters:[
        {id:'ch_bd1', title:'第1章 大数据生态', hours:8, kps:[
          {id:'kp_bd11', title:'HDFS 与 MapReduce', content:'HDFS:NameNode/DataNode,三副本机制;MapReduce 分而治之:Map(映射)→ Shuffle → Reduce(归并)。', links:['kp_py22','kp_db14']}
        ]}
      ]
    },
    {
      id:'c_ml', code:'BX311005', name:'机器学习与商务智能', credit:3, hours:48, semester:6, leader:'吴敏',
      category:'专业方向课',
      desc:'监督/无监督学习算法与商业场景落地。',
      objectives:['掌握经典机器学习算法','能进行模型评估与调优','能完成商务数据挖掘案例'],
      chapters:[
        {id:'ch_ml1', title:'第1章 机器学习概论', hours:6, kps:[
          {id:'kp_ml11', title:'监督学习与模型评估', content:'训练/验证/测试划分;准确率 $Accuracy=\\frac{TP+TN}{TP+TN+FP+FN}$;精确率 $P=\\frac{TP}{TP+FP}$,召回率 $R=\\frac{TP}{TP+FN}$,$F1=\\frac{2PR}{P+R}$。', links:['kp_st11','kp_st21','kp_py22']}
        ]}
      ]
    },
    {
      id:'c_mgmt', code:'BX211006', name:'管理学原理', credit:3, hours:48, semester:1, leader:'郑海',
      category:'学科基础课',
      desc:'管理职能与经典管理理论。',
      objectives:['掌握计划/组织/领导/控制四大职能','理解经典管理理论演进'],
      chapters:[
        {id:'ch_mg1', title:'第1章 管理与管理者', hours:6, kps:[
          {id:'kp_mg11', title:'管理的四大职能', content:'计划 → 组织 → 领导 → 控制(POLC),闭环迭代。'}
        ]}
      ]
    },
    {
      id:'c_calc', code:'BX211007', name:'高等数学(经管类)', credit:4, hours:64, semester:1, leader:'孙立',
      category:'学科基础课',
      desc:'微积分、级数与常微分方程基础。',
      objectives:['掌握极限与导数','会应用定积分','了解微分方程'],
      chapters:[
        {id:'ch_ca1', title:'第1章 极限与连续', hours:10, kps:[
          {id:'kp_ca11', title:'两个重要极限', content:'$$\\lim_{x\\to 0}\\frac{\\sin x}{x}=1,\\qquad \\lim_{x\\to\\infty}\\left(1+\\frac{1}{x}\\right)^{x}=e$$'}
        ]}
      ]
    }
  ],
  bank: [
    {id:'q1', courseId:'c_python', type:'single', difficulty:'易', chapter:'第2章 数据类型与控制结构', kpId:'kp_py21',
     stem:'下列关于 Python 字典的说法,正确的是(  )',
     options:['A. 字典是有序且不可变的','B. 字典通过键访问值,键不可重复','C. 字典的键可以是列表','D. 字典不支持嵌套'],
     answer:'B', analysis:'字典为键值结构,键必须不可变且唯一,值为任意对象,支持嵌套。'},
    {id:'q2', courseId:'c_python', type:'blank', difficulty:'中', chapter:'第3章 函数与模块', kpId:'kp_py32',
     stem:'斐波那契数列递归定义:$f(n)=f(n-1)+f(n-2)$,则 $f(6)=$ ____。',
     options:[], answer:'8', analysis:'0,1,1,2,3,5,8 → f(6)=8。'},
    {id:'q3', courseId:'c_python', type:'op', difficulty:'难', chapter:'第2章 数据类型与控制结构', kpId:'kp_py21',
     stem:'【操作题】给定成绩列表 scores = [88, 92, 75, 61, 95],编写函数 `stat(scores)` 返回(均值, 最高分, 及格率),保留两位小数。',
     options:[], answer:'def stat(scores):\n    n = len(scores)\n    return (round(sum(scores)/n,2), max(scores), round(sum(1 for s in scores if s>=60)/n,2))',
     analysis:'考察列表遍历、内建函数与格式化输出。'},
    {id:'q4', courseId:'c_stat', type:'single', difficulty:'中', chapter:'第1章 描述统计', kpId:'kp_st11',
     stem:'一组数据 $2,4,6,8,10$ 的方差为(  )',
     options:['A. 6','B. 8','C. 10','D. 12'], answer:'B',
     analysis:'$\\mu=6$,$\\sigma^{2}=\\frac{(16+4+0+4+16)}{5}=8$。'},
    {id:'q5', courseId:'c_db', type:'judge', difficulty:'易', chapter:'第1章 数据库系统概论', kpId:'kp_db11',
     stem:'外模式-模式映射保证了数据库的物理独立性。', options:[], answer:'错误',
     analysis:'外模式-模式映射保证逻辑独立性;模式-内模式映射才保证物理独立性。'},
    {id:'q6', courseId:'c_db', type:'short', difficulty:'中', chapter:'第2章 关系代数与SQL', kpId:'kp_db13',
     stem:'用关系代数表达:查询选修了课程号为 "C01" 的学生姓名。',
     options:[], answer:'$\\pi_{name}(\\sigma_{cno=\\text{"C01"}}(Student \\bowtie SC))$',
     analysis:'先连接再选择,最后投影姓名列。'}
  ],
  papers: [
    {id:'p1', name:'Python程序设计 期中模拟卷', courseId:'c_python',
     sections:[
       {title:'一、单项选择题(每题20分)', questionIds:['q1'], score:20},
       {title:'二、填空题(每题20分)', questionIds:['q2'], score:20},
       {title:'三、操作题(60分)', questionIds:['q3'], score:60}
     ]}
  ],
  templates: [
    {id:'tpl-syllabus', name:'课程教学大纲', type:'course', content:
`# 《{{course.name}}》课程教学大纲

- **课程代码**:{{course.code}} | **学分**:{{course.credit}} | **学时**:{{course.hours}}
- **开课学期**:第 {{course.semester}} 学期 | **课程负责人**:{{course.leader}}
- **开课专业**:{{course.majors}}
- **课程简介**:{{course.desc}}

## 一、教学目标
{{course.objectives}}

## 二、教学内容与学时分配
| 章节 | 主要知识点 | 建议学时 |
|---|---|---|
{{chapters.table}}

## 三、考核方式
平时成绩 40%(含作业与实验)+ 期末考试 60%。`},
    {id:'tpl-calendar', name:'教学日历', type:'course', content:
`# 《{{course.name}}》教学日历

| 周次 | 教学内容 | 学时 | 作业/测验 |
|---|---|---|---|
{{calendar.rows}}

> 总学时:{{course.hours}} 学时。可导出后按校历微调。`},
    {id:'tpl-lesson', name:'章节教案', type:'chapter', content:
`# 《{{course.name}}》教案 — {{chapter.title}}

## 教学目标
{{chapter.kpTitles}}

## 教学重点与难点
重点:{{chapter.firstKp}};难点:依学情确定。

## 教学过程
1. 导入(5 分钟):由实际案例引入
2. 新授(30 分钟):{{chapter.kpTitles}}
3. 课堂练习(8 分钟):结合题库习题
4. 小结与作业(2 分钟)

## 板书 / 课件设计
可挂接本系统知识图谱与知识点讲义。`},
    {id:'tpl-exercise', name:'练习题集', type:'course', content:
`# 《{{course.name}}》练习题集

{{bank.rows}}`},
    {id:'tpl-handout', name:'章节知识点讲义', type:'chapter', content:
`# {{chapter.title}} 知识点讲义 — 《{{course.name}}》

{{chapter.kpContents}}`}
  ],
  /* ---- 教学文档(在线编写的产物,与模板同源) ---- */
  documents: [
    {id:'doc_py_syllabus', courseId:'c_python', chapterId:'', type:'syllabus', sourceTpl:'tpl-syllabus',
     title:'《Python程序设计》课程教学大纲', createdAt:'2025-09-01 10:00:00', updatedAt:'2025-09-03 15:20:00', versions:[],
     content:
`# 《Python程序设计》课程教学大纲

- **课程代码**:BX211001 | **学分**:3 | **学时**:48
- **开课学期**:第 2 学期 | **课程负责人**:王伟
- **开课专业**:大数据管理与应用
- **课程简介**:以数据应用为导向的 Python 程序设计课程,涵盖语法基础、数据结构与数据处理实战。

## 一、教学目标
1. 掌握 Python 基础语法与程序结构
2. 能运用列表/字典等数据结构处理业务数据
3. 具备函数化与模块化编程能力

## 二、教学内容与学时分配
| 章节 | 主要知识点 | 建议学时 |
|---|---|---|
| 第1章 Python概述 | Python 简介与发展、环境搭建与第一个程序 | 4 |
| 第2章 数据类型与控制结构 | 列表与字典、条件与循环 | 12 |
| 第3章 函数与模块 | 函数定义与参数、递归函数 | 10 |

## 三、考核方式
平时成绩 40%(含作业与实验)+ 期末考试 60%。

> 本大纲由模板一键生成后在线修订,可导出 Markdown/HTML 或直接打印为 PDF 上传超星。`},

    {id:'doc_py_calendar', courseId:'c_python', chapterId:'', type:'calendar', sourceTpl:'tpl-calendar',
     title:'《Python程序设计》教学日历', createdAt:'2025-09-01 10:05:00', updatedAt:'2025-09-01 10:05:00', versions:[],
     content:
`# 《Python程序设计》教学日历

| 周次 | 教学内容 | 学时 | 作业/测验 |
|---|---|---|---|
| 第1-1周 | 第1章 Python概述(Python 简介与发展;环境搭建与第一个程序) | 4 | 课后习题 |
| 第2-4周 | 第2章 数据类型与控制结构(列表与字典;条件与循环) | 12 | 实验一 |
| 第5-7周 | 第3章 函数与模块(函数定义与参数;递归函数) | 10 | 实验二 |

> 总学时:48 学时。可导出后按校历微调。`},

    {id:'doc_py_lesson2', courseId:'c_python', chapterId:'ch_py2', type:'lesson', sourceTpl:'tpl-lesson',
     title:'教案 · 第2章 数据类型与控制结构', createdAt:'2025-09-05 09:00:00', updatedAt:'2025-09-08 11:30:00', versions:[],
     content:
`# 《Python程序设计》教案 — 第2章 数据类型与控制结构

## 教学目标
列表与字典、条件与循环

## 教学重点与难点
重点:列表与字典;难点:依学情确定(字典与列表的嵌套使用)。

## 教学过程
1. 导入(5 分钟):由学生成绩统计的实际案例引入
2. 新授(30 分钟):列表与字典、条件与循环
3. 课堂练习(8 分钟):结合题库习题
4. 小结与作业(2 分钟)

## 板书 / 课件设计
可挂接本系统知识图谱与知识点讲义。`}
  ],
  /* ---- 教学班级(班级 → 课程,承载学生与成绩) ---- */
  classes: [
    {
      id:'cls_py2401', name:'大数据2401班', courseId:'c_python', term:'2025-2026-1', teacher:'王伟',
      items:[
        {id:'gi_py_usual', name:'平时成绩', weight:30, full:100},
        {id:'gi_py_mid',   name:'期中成绩', weight:20, full:100},
        {id:'gi_py_final', name:'期末成绩', weight:50, full:100}
      ],
      students:[
        {id:'stu1', sno:'2024010101', name:'张明', gender:'男', scores:{gi_py_usual:88, gi_py_mid:76, gi_py_final:90}},
        {id:'stu2', sno:'2024010102', name:'李雪', gender:'女', scores:{gi_py_usual:95, gi_py_mid:88, gi_py_final:93}},
        {id:'stu3', sno:'2024010103', name:'王强', gender:'男', scores:{gi_py_usual:72, gi_py_mid:65, gi_py_final:58}},
        {id:'stu4', sno:'2024010104', name:'陈小雨', gender:'女', scores:{gi_py_usual:90, gi_py_mid:82, gi_py_final:86}},
        {id:'stu5', sno:'2024010105', name:'刘洋', gender:'男', scores:{gi_py_usual:60, gi_py_mid:55, gi_py_final:62}},
        {id:'stu6', sno:'2024010106', name:'赵倩', gender:'女', scores:{gi_py_usual:98, gi_py_mid:91, gi_py_final:96}}
      ],
      assignments:[
        {id:'as_py1', title:'实验一:数据类型与列表统计', due:'2025-10-20', full:100, scores:{stu1:92,stu2:98,stu3:70,stu4:88,stu5:65,stu6:96}},
        {id:'as_py2', title:'实验二:函数与递归实现', due:'2025-11-10', full:100, scores:{stu1:85,stu2:95,stu3:62,stu4:90,stu6:99}}
      ]
    },
    {
      id:'cls_db2301', name:'大数据2303班', courseId:'c_db', term:'2025-2026-1', teacher:'陈静',
      items:[
        {id:'gi_db_usual', name:'平时成绩', weight:40, full:100},
        {id:'gi_db_final', name:'期末成绩', weight:60, full:100}
      ],
      students:[
        {id:'stu7', sno:'2023010301', name:'孙悟空', gender:'男', scores:{gi_db_usual:85, gi_db_final:78}},
        {id:'stu8', sno:'2023010302', name:'朱丽', gender:'女', scores:{gi_db_usual:92, gi_db_final:88}},
        {id:'stu9', sno:'2023010303', name:'周涛', gender:'男', scores:{gi_db_usual:70, gi_db_final:66}}
      ],
      assignments:[
        {id:'as_db1', title:'实验:SQL 多表查询', due:'2025-11-01', full:100, scores:{stu7:80,stu8:95,stu9:72}}
      ]
    }
  ],
  /* ---- 超星同步日志 ---- */
  logs: [
    {id:'lg_seed1', time:'2025-09-01 09:12:30', direction:'export', type:'学生名单', desc:'导出 大数据2401班 名册(超星格式)', count:6, user:'王伟'}
  ]
};
