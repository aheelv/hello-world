/* ============================================================
   数据字典 (Schemas) — 系统内所有导入导出对象的权威字段规范
   每个对象含:用途 / 超星对应入口 / 支持格式 / 字段(含义·必填·类型·格式·示例·超星列) / 规则 / 示例数据
   导入解析、模板生成、界面说明三处共用同一份定义,保证"模板 ↔ 解析 ↔ 文档"三者一致。
   ============================================================ */
const SCHEMA_CATS = [
  {id:'plan',   icon:'🏛️', label:'专业与课程计划', desc:'专业、课程体系与修读学期的批量建模'},
  {id:'course', icon:'📚', label:'课程与知识资产', desc:'课程基本信息、章节结构、知识点目录、知识图谱、题库、卷库'},
  {id:'doc',    icon:'📄', label:'教学文档',       desc:'大纲 / 教案 / 教学日历 / 讲义 / 试卷分析的批量导入导出'},
  {id:'class',  icon:'👥', label:'教学班级与成绩', desc:'班级、名册、成绩项、成绩表、作业成绩 — 与超星教师端直接对接'},
  {id:'system', icon:'🔁', label:'平台对接与系统', desc:'课程包 / 专业包 / 模板库 / AI 工作流 / 全库备份'}
];

/* 字段简写构造 */
function F(key, label, opt){
  return Object.assign({
    key, label, aliases:[], required:false, type:'文本', format:'', example:'', desc:'', cx:''
  }, opt||{});
}
const T = '文本', N = '数值', D = '日期', J = 'JSON', M = '多行文本';

const SCHEMAS = [
  /* ================= 专业与课程计划 ================= */
  {
    id:'courseInfo', icon:'📘', cat:'plan', name:'课程基本信息', direction:'both', rowShape:'table',
    purpose:'批量建立或更新课程库中的课程条目(名称/学分/学时/负责人等),再配合"章节结构"模板补齐内容。',
    chaoxing:{ entry:'超星教师端 → 课程管理 → 新建课程(可批量复制粘贴列信息)', format:'CSV / Excel(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    keyField:'code',
    fields:[
      F('code','课程代码',{required:true,aliases:['课程编号','课程编码','课程号'],format:'字母+数字,如 BX211001',example:'BX211001',desc:'课程唯一标识;导入时按代码匹配,已存在则更新,不存在则新建',cx:'课程编号'}),
      F('name','课程名称',{required:true,aliases:['课程名','课程'],example:'Python程序设计',desc:'课程全称,将显示在课程库与所有导出文档标题中',cx:'课程名称'}),
      F('credit','学分',{type:N,format:'0.5 ~ 10 的数字,可含 0.5',example:'3',desc:'用于大纲与培养方案统计',cx:'学分'}),
      F('hours','学时',{type:N,format:'整数(通常 8 ~ 128)',example:'48',desc:'总学时;教学日历按此自动分配周次',cx:'学时'}),
      F('semester','开课学期',{type:N,format:'1 ~ 8 的整数',example:'2',desc:'默认开课学期(专业内可另行设置各自学期)',cx:'开课学期'}),
      F('leader','课程负责人',{required:false,aliases:['负责人','任课教师','课程负责人姓名'],example:'王伟',desc:'用于"课程负责人"角色的数据范围校验与模板占位符',cx:'教师'}),
      F('category','课程类别',{format:'专业核心课 / 专业基础课 / 通识必修 / 选修',example:'专业核心课',desc:'用于课程库分类与统计'}),
      F('desc','课程简介',{type:M,format:'200 字以内为宜',example:'以数据应用为导向的 Python 程序设计课程…',desc:'将填入课程大纲的"课程简介"段落'}),
      F('objectives','教学目标',{type:M,format:'多条用分号 ";" 或换行分隔',example:'掌握基础语法;能处理业务数据;具备模块化编程能力',desc:'导入时按分号/换行拆分为列表,对应大纲"课程目标"'})
    ],
    rules:[
      '第 1 行为表头;导入按列名匹配,列顺序可任意调整。',
      '课程代码为必填且唯一匹配键:已存在 → 更新(仅覆盖填写了的列);不存在 → 新建。',
      '学分/学时可留空,留空则使用系统默认值(3 学分 / 48 学时)。',
      '文件编码须为 UTF-8;Excel 请另存为"CSV UTF-8(逗号分隔)"。'
    ],
    sample:[
      ['BX211001','Python程序设计','3','48','2','王伟','专业核心课','以数据应用为导向的 Python 程序设计课程','掌握基础语法;能处理业务数据;具备模块化编程能力'],
      ['BX212099','数据可视化','2','32','4','刘洋','专业选修课','面向商业场景的数据可视化方法与实践','掌握主流可视化工具;能独立完成数据故事讲述']
    ]
  },
  {
    id:'majorPlan', icon:'🏛️', cat:'plan', name:'专业与修读计划', direction:'both', rowShape:'table',
    purpose:'一行 = 一个"专业 × 课程"的挂接关系,用于批量建立专业、并把课程按修读学期挂接到专业下(体现"低年级→高年级"进程)。',
    chaoxing:{ entry:'超星 → 教务数据导入(培养方案);本系统内对应"专业管理 → 挂接课程"', format:'CSV / Excel(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    keyField:'majorCode+majorName+courseCode',
    fields:[
      F('majorCode','专业代码',{required:true,aliases:['专业编号','专业编码'],format:'如 120108T(教育部专业代码)',example:'120108T',desc:'专业唯一标识;不存在则新建专业'}),
      F('majorName','专业名称',{required:true,aliases:['专业名','专业'],example:'大数据管理与应用',desc:'专业全称'}),
      F('majorLeader','专业负责人',{aliases:['负责人','专业负责人姓名'],example:'刘院长',desc:'用于"专业负责人"角色数据范围'}),
      F('courseCode','课程代码',{required:true,aliases:['课程编号','课程编码'],example:'BX211001',desc:'须能在课程库中匹配到课程;匹配不到时该行记入错误清单'}),
      F('semester','修读学期',{required:true,type:N,format:'1 ~ 8 的整数',example:'2',desc:'该课程在本专业中的开课学期,决定修读进程时间线',cx:'开课学期'})
    ],
    rules:[
      '同一专业的多门课程写多行(专业代码/名称重复填写即可)。',
      '课程代码必须已存在于课程库;若课程尚未建立,请先用"课程基本信息"模板建课。',
      '修读学期必须为 1~8 的整数;同一专业下同一课程重复出现时以最后一行为准。',
      '共享课程在不同专业中可设置不同学期(如《数据库原理与应用》在大数据专业第 3 学期、电子商务专业第 4 学期)。'
    ],
    sample:[
      ['120108T','大数据管理与应用','刘院长','BX211001','2'],
      ['120108T','大数据管理与应用','刘院长','BX211003','3'],
      ['120801','电子商务','周主任','BX211003','4']
    ]
  },

  /* ================= 课程与知识资产 ================= */
  {
    id:'chapters', icon:'🗂️', cat:'course', name:'章节结构(大纲骨架)', direction:'import', rowShape:'table',
    purpose:'按课程批量建立/调整章节与学时,形成课程大纲骨架;知识点内容另用"知识点目录"模板补充。',
    chaoxing:{ entry:'超星 → 课程 → 目录 → 批量导入章节', format:'CSV / Excel(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    fields:[
      F('courseCode','课程代码',{required:true,aliases:['课程编号','课程编码'],example:'BX211001',desc:'匹配课程库中的课程'}),
      F('chapterNo','章序号',{type:N,format:'1、2、3…(决定章节顺序)',example:'1',desc:'写入后按此升序排列;留空则按文件行序追加'}),
      F('title','章标题',{required:true,aliases:['章节标题','章名','标题'],example:'第1章 Python概述',desc:'章节名称;同名章节视为已存在,不重复创建'}),
      F('hours','学时',{type:N,format:'整数,默认 4',example:'4',desc:'决定教学日历中该章的周次分配'})
    ],
    rules:[
      '一行 = 一个章节;同名章节已存在时仅更新学时,不会删除已有知识点。',
      '本模板只建"章";如需同步建立"节/知识点"及其内容,请用"知识点目录"模板(章不存在时会自动创建)。'
    ],
    sample:[
      ['BX211001','1','第1章 Python概述','4'],
      ['BX211001','2','第2章 数据类型与运算','6']
    ]
  },
  {
    id:'kpCatalog', icon:'📑', cat:'course', name:'知识点目录(章节+知识点)', direction:'both', rowShape:'table',
    purpose:'课程内容的主体模板 — 一行 = 一个知识点;章不存在时自动创建,同步写入 Markdown + LaTeX 公式内容。与超星"课程目录"直接对应。',
    chaoxing:{ entry:'超星 → 课程 → 目录 / 资料 → 导入(或按本表手工批量建立)', format:'CSV / Excel(UTF-8,含表头);内容支持 LaTeX 原样保留' },
    formats:['csv','tsv','xlsx','json'],
    fields:[
      F('chapter','章',{aliases:['章节','章标题','所属章'],example:'第1章 Python概述',desc:'留空则归入"未分章";章不存在时自动创建(默认 4 学时)',cx:'章'}),
      F('title','节/知识点',{required:true,aliases:['知识点','标题','节','知识点名称'],example:'Python 简介与发展',desc:'知识点名称,课程内应唯一(重复则跳过)',cx:'节/知识点'}),
      F('content','内容',{type:M,format:'Markdown;公式用 $…$ 或 $$…$$',example:'Python 是**解释型、通用型**高级语言。$E=mc^2$',desc:'知识点正文,支持 Markdown 语法与 KaTeX 公式;CSV 中换行请用 \\n 或直接换行为多行单元格',cx:'内容'})
    ],
    rules:[
      '一行 = 一个知识点;"章"列相同的行会被归到同一章下。',
      '章不存在时自动创建(学时默认 4),已有章节不会被删除或覆盖。',
      '知识点按"标题"去重:已存在的同名知识点会被跳过(不会覆盖已编辑内容)。',
      '公式以 LaTeX 原样写入,导出到超星后仍可保留为文本;复杂公式建议先用 JSON 模板或"AI 结果导入"。'
    ],
    sample:[
      ['第1章 Python概述','Python 简介与发展','Python 是**解释型、通用型**高级语言,广泛用于数据分析与人工智能。'],
      ['第1章 Python概述','开发环境与第一个程序','使用 Anaconda / VS Code 配置环境,`print("Hello")` 即为最小程序。'],
      ['第2章 数据类型与运算','列表与元组','列表可变、元组不可变。均值公式:$\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i$']
    ]
  },
  {
    id:'graph', icon:'🕸️', cat:'course', name:'知识图谱(节点与关联边)', direction:'both', rowShape:'json',
    purpose:'导出课程/专业/课程群的知识图谱;导入时按节点 id 或"标题+课程名"匹配,把外部图谱(超星图谱工具 / Gephi / Neo4j)的关联关系合并回知识点。',
    chaoxing:{ entry:'超星 → 知识图谱 / 课程图谱 → 导入;亦可交给 Gephi / Neo4j 做二次分析', format:'JSON(UTF-8);两列表 CSV 为简化版' },
    formats:['json','csv','xlsx'],
    /* 表格格式(CSV/Excel)使用的简化两列结构 */
    altFields:[
      F('source','起点(前置知识点)',{required:true,aliases:['起点','前置','源','from','source'],format:'知识点 id 或知识点名称',example:'kp_py11',desc:'箭头的起点,即"前置知识点";可写系统内知识点 id 或名称',cx:'节点编号'}),
      F('target','终点(后续知识点)',{required:true,aliases:['终点','后续','目标','to','target'],format:'知识点 id 或知识点名称',example:'kp_py12',desc:'箭头的终点;导入后在起点知识点上新增一条"关联"',cx:'节点编号'})
    ],
    fields:[
      F('platform','来源平台',{format:'chaoxing / yuketang / manual',example:'chaoxing',desc:'标识图谱来源,导入时仅作记录'}),
      F('type','对象类型',{format:'knowledge-graph',example:'knowledge-graph',desc:'固定值'}),
      F('nodes[].id','节点 ID',{required:true,example:'kp_py11',desc:'优先按此匹配系统内知识点 id',cx:'节点编号'}),
      F('nodes[].label','节点名称',{example:'Python 简介与发展',desc:'id 匹配失败时,回退按"名称 + 课程名"匹配',cx:'知识点名称'}),
      F('nodes[].course','所属课程',{example:'Python程序设计',desc:'辅助匹配,可留空'}),
      F('nodes[].chapter','所属章节',{example:'第1章 Python概述',desc:'用于展示分组'}),
      F('edges[].source','起点节点',{required:true,example:'kp_py11',desc:'前置知识点(箭头起点)'}),
      F('edges[].target','终点节点',{required:true,example:'kp_py12',desc:'后续知识点;导入后在起点知识点上新增"关联"边'})
    ],
    rules:[
      '导入只"新增"关联边,不会删除系统内已有关系。',
      '节点匹配顺序:① 节点 id → ② 节点名称 + 所属课程 → ③ 节点名称(全库)。都失败则计入"未匹配"。',
      'CSV 简化版为两列(起点,终点),列名可写"起点/终点"或"source/target"。'
    ],
    sampleJSON:{
      platform:'chaoxing', type:'knowledge-graph',
      nodes:[{id:'kp_py11',label:'Python 简介与发展',course:'Python程序设计',chapter:'第1章 Python概述'},
             {id:'kp_py12',label:'开发环境与第一个程序',course:'Python程序设计',chapter:'第1章 Python概述'}],
      edges:[{source:'kp_py11',target:'kp_py12'}]
    },
    sample:[['kp_py11','kp_py12']]
  },
  {
    id:'bank', icon:'🧮', cat:'course', name:'题库(题目导入导出)', direction:'both', rowShape:'table',
    purpose:'题库的批量导入导出 — 支持 6 种题型、难度、知识点挂接与解析;JSON 格式保留公式,CSV/Excel 便于大批量编辑。',
    chaoxing:{ entry:'超星 → 题库 / 作业库 / 考试库 → 批量导入(按题型逐类导入)', format:'CSV / Excel / JSON;超星题库导入通常按题型分文件' },
    formats:['csv','tsv','xlsx','json'],
    fields:[
      F('type','题型',{required:true,type:'枚举',format:'单选题 / 多选题 / 判断题 / 填空题 / 简答题 / 操作题',example:'单选题',desc:'决定该题的作答与判分方式;超星侧"实践题"映射为"操作题"',cx:'题型'}),
      F('difficulty','难度',{required:true,type:'枚举',format:'易 / 中 / 难',example:'中',desc:'用于组卷难度控制与统计',cx:'难度'}),
      F('chapter','章节',{aliases:['章','所属章节'],example:'第1章 Python概述',desc:'用于题库按章节筛选'}),
      F('kp','知识点',{aliases:['关联知识点','知识点名称'],example:'Python 简介与发展',desc:'按"知识点名称"挂接到本章知识点(可留空)'}),
      F('stem','题干',{required:true,type:M,format:'Markdown;公式用 $…$',example:'Python 中用于定义函数的关键字是?',desc:'题目正文,支持 Markdown 与 LaTeX',cx:'题干'}),
      F('options','选项',{type:M,format:'多个选项用 " | " 分隔;判断题可留空',example:'A. def | B. function | C. define | D. lambda',desc:'单选/多选题必填;选项内不要出现 " | " 字符',cx:'选项'}),
      F('answer','答案',{required:true,type:M,example:'A',desc:'单选填字母(如 A/B);多选填字母连写(如 ABD);判断填"对/错"或"正确/错误";填空/简答/操作题填参考答案文本',cx:'答案'}),
      F('analysis','解析',{type:M,example:'def 是 Python 定义函数的关键字。',desc:'答案解析,导出试卷时一并输出'})
    ],
    rules:[
      '第 1 行为表头,按列名匹配(兼容"题型/难度/章节/题干/选项/答案/解析"旧版列序)。',
      '题型、难度支持简写:单选、多选、判断、填空、简答、操作;易/中/难。',
      '选项列用 " | " 分隔,系统会自动切分;判断题可留空。',
      '导入按"题干 + 题型"去重,重复题会被跳过。',
      'JSON 格式为 {schema:"dlufe-kb/bank/v1", questions:[…]} ,完整保留公式与字段。'
    ],
    sample:[
      ['单选题','易','第1章 Python概述','Python 简介与发展','Python 中用于定义函数的关键字是?','A. def | B. function | C. define | D. lambda','A','def 是定义函数的关键字。'],
      ['多选题','中','第2章 数据类型与运算','列表与元组','下列属于 Python 可变序列的有?','A. list | B. tuple | C. dict | D. set','ACD','列表、字典、集合可变,元组不可变。'],
      ['判断题','易','第1章 Python概述','Python 简介与发展','Python 是编译型语言。','','错','Python 是解释型语言。']
    ]
  },
  {
    id:'paper', icon:'🗒️', cat:'course', name:'试卷结构(卷库)', direction:'import', rowShape:'table',
    purpose:'按"大题 → 小题"的结构批量组卷:小题用"题干"到题库中匹配,匹配成功即挂接,未匹配可选择自动入库。',
    chaoxing:{ entry:'超星 → 考试 → 组卷 / 试卷导入(按题型分节)', format:'CSV / Excel(UTF-8);JSON 可完整表达节结构与分值' },
    formats:['csv','tsv','xlsx','json'],
    fields:[
      F('courseCode','课程代码',{required:true,aliases:['课程编号'],example:'BX211001',desc:'试卷归属课程'}),
      F('paperName','试卷名称',{required:true,aliases:['试卷名','卷名'],example:'Python程序设计 期末考试卷(A)',desc:'同名试卷追加到已有试卷的同一大题下'}),
      F('sectionTitle','大题标题',{required:true,aliases:['大题','题型分组','部分'],example:'一、单项选择题',desc:'如"一、单项选择题";同试卷内同名大题合并'}),
      F('sectionScore','每题分值',{type:N,format:'每空/每题分值,如 2',example:'2',desc:'该大题中每小题的分值'}),
      F('stem','题干(小题)',{required:true,aliases:['题目','小题'],example:'Python 中用于定义函数的关键字是?',desc:'用于在题库中匹配已有题目'}),
      F('type','题型',{type:'枚举',format:'单选题 / 多选题 / 判断题 / 填空题 / 简答题 / 操作题',example:'单选题',desc:'匹配失败需要自动入库时使用'})
    ],
    rules:[
      '一行 = 试卷中的一道小题;同一"试卷名称 + 大题标题"的多行合并为该大题。',
      '小题按"题干"在题库中精确匹配;匹配不到时若填写了题型与答案则自动入库(答案列可选),否则记入错误清单。',
      '每题分值会累加为参考总分;试卷可在"卷库管理"中继续手工调整。'
    ],
    sample:[
      ['BX211001','Python程序设计 期末考试卷(A)','一、单项选择题','2','Python 中用于定义函数的关键字是?','单选题'],
      ['BX211001','Python程序设计 期末考试卷(A)','一、单项选择题','2','下列哪个不是 Python 的内置数据类型?','单选题'],
      ['BX211001','Python程序设计 期末考试卷(A)','二、简答题','10','简述列表与元组的区别。','简答题']
    ]
  },

  /* ================= 教学文档 ================= */
  {
    id:'documents', icon:'📄', cat:'doc', name:'教学文档(大纲/教案/日历/讲义)', direction:'both', rowShape:'json',
    purpose:'批量导入或导出教学文档正文(Markdown),可在"教学文档"模块中继续在线编辑、版本管理与打印。',
    chaoxing:{ entry:'超星 → 课程 → 文档 / 资料(可粘贴正文)或"教案"模块', format:'JSON(结构化,推荐)/ Markdown(单文件正文)' },
    formats:['json'],
    fields:[
      F('courseCode','课程代码',{required:true,example:'BX211001',desc:'文档归属课程;匹配不到时按首门课程处理并给出提示'}),
      F('type','文档类型',{required:true,type:'枚举',format:'课程大纲 / 教学日历 / 教案 / 讲义 / 试卷分析 / 其他文档',example:'课程大纲',desc:'决定在文档中心的分组与图标'}),
      F('title','文档标题',{required:true,example:'《Python程序设计》课程大纲',desc:'文档名称'}),
      F('chapterTitle','所属章节',{example:'第1章 Python概述',desc:'教案/讲义等章节级文档填写;留空表示课程级文档'}),
      F('content','正文(Markdown)',{required:true,type:M,format:'Markdown + KaTeX 公式',example:'# 课程大纲\n\n## 一、课程基本信息…',desc:'支持标题、表格、代码块、图片与 $公式$'}),
      F('sourceTpl','来源模板',{example:'tpl-syllabus',desc:'由模板生成时记录模板 id,便于追溯'})
    ],
    rules:[
      'JSON 格式为 {schema:"dlufe-kb/docs/v1", documents:[…]} ,可一次导入多篇。',
      'also 支持 Markdown 单文件导入:请使用「教学文档」模块右上角的「导入 Markdown」按钮,导入后可在弹窗中选择课程与文档类型。',
      '文档类型可用中文名或内部值(syllabus/calendar/lesson/handout/exam/other)。',
      '导入的文档视为"新建",不会覆盖已有文档,避免误改已定稿内容。'
    ],
    sampleJSON:{ schema:'dlufe-kb/docs/v1', documents:[
      {courseCode:'BX211001', type:'课程大纲', title:'《Python程序设计》课程大纲', chapterTitle:'',
       content:'# Python程序设计 课程大纲\n\n## 一、课程基本信息\n\n| 课程代码 | BX211001 |\n| --- | --- |\n| 学分 | 3 |\n\n## 二、课程目标\n\n1. 掌握 Python 基础语法…'},
      {courseCode:'BX211001', type:'教案', title:'第1章 Python概述 教案', chapterTitle:'第1章 Python概述',
       content:'# 第1章 Python概述 教案\n\n## 教学目标\n\n- 了解 Python 语言特点\n\n## 重点难点\n\n重点:解释型语言概念'}
    ]}
  },

  /* ================= 教学班级与成绩 ================= */
  {
    id:'classes', icon:'👥', cat:'class', name:'教学班级', direction:'import', rowShape:'table',
    purpose:'批量建立教学班级(班级 → 课程 → 学期 → 任课教师),并自动初始化"平时/期中/期末"三项成绩与权重。',
    chaoxing:{ entry:'超星 → 我的班级 → 新建班级 / 从教务系统导入选课名单', format:'CSV / Excel(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    fields:[
      F('name','班级名称',{required:true,aliases:['班级','教学班'],example:'大数据2401班',desc:'班级名称,同名班级会被跳过'}),
      F('courseCode','课程代码',{required:true,aliases:['课程编号','课程'],example:'BX211001',desc:'须匹配课程库;匹配不到的行记入错误清单',cx:'课程'}),
      F('term','开课学期/学年',{aliases:['学期','学年学期','开课学年'],format:'如 2025-2026-1',example:'2025-2026-1',desc:'留空则使用系统当前学期设置',cx:'学年学期'}),
      F('teacher','任课教师',{aliases:['授课教师','教师'],example:'王伟',desc:'决定"课程负责人"角色的数据可见范围',cx:'教师'}),
      F('usualW','平时成绩权重',{type:N,format:'百分比数值,三项之和建议为 100',example:'30',desc:'留空默认 30'}),
      F('midW','期中成绩权重',{type:N,example:'20',desc:'留空默认 20'}),
      F('finalW','期末成绩权重',{type:N,example:'50',desc:'留空默认 50'})
    ],
    rules:[
      '课程代码必须能在课程库匹配到;若课程不存在请先用"课程基本信息"模板建课。',
      '权重为百分制数值,系统按"总评 = Σ(得分 ÷ 满分 × 权重)"计算,权重之和不必恰好 100(会自动归一)。',
      '班级建立后,用"学生名单"模板导入名册、"成绩表"模板回填成绩。'
    ],
    sample:[
      ['大数据2401班','BX211001','2025-2026-1','王伟','30','20','50'],
      ['大数据2303班','BX211003','2025-2026-1','陈静','40','0','60']
    ]
  },
  {
    id:'students', icon:'🧑‍🎓', cat:'class', name:'学生名单', direction:'both', rowShape:'table',
    purpose:'班级名册的导入导出 — 与超星"班级管理 → 学生名单"导入模板直接对应,按学号去重合并。',
    chaoxing:{ entry:'超星教师端 → 我的班级 → 班级管理 → 学生名单 → 导入/导出', format:'CSV(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    keyField:'sno',
    fields:[
      F('sno','学号',{required:true,aliases:['学生学号','学号/账号','账号','工号'],format:'4~20 位数字或字母',example:'2024010101',desc:'学生唯一标识;导入时优先按学号匹配已有学生',cx:'学号'}),
      F('name','姓名',{required:true,aliases:['名字','学生姓名'],example:'张明',desc:'学生姓名;学号缺失时按姓名匹配',cx:'姓名'}),
      F('gender','性别',{type:'枚举',format:'男 / 女',example:'男',desc:'超星导出含此列;留空则不覆盖原有值',cx:'性别'}),
      F('note','备注',{format:'自由文本',example:'转专业学生',desc:'仅存于本系统,不参与超星同步'})
    ],
    rules:[
      '第 1 行为表头;列名按同义词自动识别(学号/学生学号/账号/工号,姓名/名字),列顺序可任意。',
      '学号与姓名至少填写一项;两项皆空的行会被忽略。',
      '已存在的学生:按学号匹配并更新(仅覆盖文件中填写了的列);不存在的:新增。',
      '文件编码须为 UTF-8,否则中文姓名会乱码(Excel 请另存为"CSV UTF-8")。'
    ],
    sample:[
      ['2024010101','张明','男',''],
      ['2024010102','李雪','女',''],
      ['2024010103','王强','男','少数民族']
    ]
  },
  {
    id:'grades', icon:'📊', cat:'class', name:'成绩表(分项 + 总评)', direction:'both', rowShape:'table',
    purpose:'成绩导入导出 — 与超星"成绩管理 → 导出/导入"直接对应。成绩项列可任意增减,列名与本班成绩项同名则写入,否则自动新增成绩项。',
    chaoxing:{ entry:'超星教师端 → 我的班级 → 成绩管理 → 导出成绩 / 导入成绩', format:'CSV / Excel(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    dynamic:{ after:'姓名', label:'成绩项列(可任意多列)', exclude:['序号','总评','总分','加权总分','班级','学号','姓名','备注'],
      desc:'除表头关键词与学号/姓名外,其余每一列都视为一个成绩项;列名与班级已有成绩项同名则写入该项,不同名则自动新增成绩项(权重默认 0,可在成绩管理中调整)。' },
    /* 模板示例表头(展示"成绩项列"的位置) */
    sampleHeader:['学号','姓名','平时成绩','期中成绩','期末成绩','总评'],
    fields:[
      F('sno','学号',{required:true,aliases:['学生学号','账号','学号/账号'],example:'2024010101',desc:'用于匹配学生',cx:'学号'}),
      F('name','姓名',{aliases:['学生姓名','名字'],example:'张明',desc:'辅助匹配(学号匹配失败时使用)',cx:'姓名'}),
      F('total','总评',{type:N,format:'数值(导入时忽略,仅供查看)',example:'86.4',desc:'系统按权重自动计算,导出时附带该列;导入时不会读取此列',cx:'总评'})
    ],
    rules:[
      '第 1 行必须为表头且包含"学号"列(否则无法匹配学生)。',
      '导入前请先用"学生名单"模板把名册导入完整,否则匹配不到的学生成绩会被跳过。',
      '总评列由系统按 总评 = Σ(得分 ÷ 满分 × 权重) 自动计算,导入时忽略文件中该列的值。',
      '分项列名建议与超星导出列名保持一致,可实现"超星导出 → 直接导入本系统"零改动。'
    ],
    sample:[
      ['2024010101','张明','88','76','90','86.4'],
      ['2024010102','李雪','95','88','93','92.3'],
      ['2024010103','王强','72','65','58','63.0']
    ]
  },
  {
    id:'assignments', icon:'📝', cat:'class', name:'作业成绩', direction:'both', rowShape:'table',
    purpose:'作业批量记分 — 与超星"作业 → 导出成绩"对应;一行 = 一名学生的一次作业成绩(长表格式)。',
    chaoxing:{ entry:'超星教师端 → 我的班级 → 作业 → 导出成绩 / 导入成绩', format:'CSV / Excel(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    fields:[
      F('title','作业标题',{required:true,aliases:['作业','作业名称','标题'],example:'实验一:数据类型与列表统计',desc:'同名作业视为同一次作业;不存在时自动新建',cx:'作业标题'}),
      F('sno','学号',{required:true,aliases:['学生学号','账号'],example:'2024010101',desc:'匹配学生',cx:'学号'}),
      F('name','姓名',{aliases:['学生姓名'],example:'张明',desc:'辅助匹配',cx:'姓名'}),
      F('score','得分',{type:N,format:'数值,0 ~ 满分',example:'92',desc:'留空表示未提交/未批改',cx:'得分'}),
      F('full','满分',{type:N,format:'数值,默认 100',example:'100',desc:'同一次作业的多行应填相同满分;已存在作业时不覆盖',cx:'满分'}),
      F('due','截止时间',{type:D,format:'YYYY-MM-DD',example:'2025-10-20',desc:'用于超星作业截止设置对照',cx:'截止时间'})
    ],
    rules:[
      '一行 = 一名学生的一次作业;同一次作业的多名学生写多行。',
      '作业按标题匹配:不存在时自动创建(满分取"满分"列,默认 100);已存在时仅回填得分。',
      '未交/免修的学生请留空"得分",不要填 0 或"—"。'
    ],
    sample:[
      ['实验一:数据类型与列表统计','2024010101','张明','92','100','2025-10-20'],
      ['实验一:数据类型与列表统计','2024010102','李雪','98','100','2025-10-20'],
      ['实验二:函数与递归实现','2024010101','张明','85','100','2025-11-10']
    ]
  },
  {
    id:'gradeItems', icon:'⚖️', cat:'class', name:'成绩项与权重设置', direction:'import', rowShape:'table',
    purpose:'调整班级成绩构成(成绩项名称、权重、满分),例如把"考勤"并入平时成绩、或增加"课程设计"项。',
    chaoxing:{ entry:'超星 → 成绩管理 → 成绩权重设置 / 统计规则', format:'CSV / Excel(UTF-8,含表头)' },
    formats:['csv','tsv','xlsx','json'],
    fields:[
      F('courseCode','课程代码',{required:true,example:'BX211001',desc:'与下学期/教师一起定位唯一班级'}),
      F('term','开课学期',{example:'2025-2026-1',desc:'留空则使用系统当前学期'}),
      F('name','成绩项名称',{required:true,aliases:['成绩项','项目名称'],example:'平时成绩',desc:'同名成绩项更新权重,不同名则新增',cx:'成绩项'}),
      F('weight','权重(%)',{required:true,type:N,format:'数值,建议各项之和为 100',example:'30',desc:'总评 = Σ(得分 ÷ 满分 × 权重)',cx:'权重'}),
      F('full','满分',{type:N,format:'数值,默认 100',example:'100',desc:'该项得分上限'})
    ],
    rules:[
      '本模板仅调整"权重与满分",不会清空已录入的平时分。',
      '删除成绩项请在"教学班级 → 成绩管理"中手工操作(会同时清除该项得分)。'
    ],
    sample:[
      ['BX211001','2025-2026-1','平时成绩','30','100'],
      ['BX211001','2025-2026-1','期中成绩','20','100'],
      ['BX211001','2025-2026-1','期末成绩','50','100']
    ]
  },

  /* ================= 平台对接与系统 ================= */
  {
    id:'coursePackage', icon:'📦', cat:'system', name:'课程包(课程+图谱+题库+卷库)', direction:'both', rowShape:'json',
    purpose:'课程的完整迁移单元 — 一次带走课程基本信息、章节、知识点、知识图谱、题库与卷库,导入时自动重建 id 映射。',
    chaoxing:{ entry:'超星 → 课程 → 复制课程 / 导出课程资源包;亦可用于校际共享', format:'JSON(UTF-8)' },
    formats:['json'],
    fields:[
      F('schema','格式标识',{required:true,example:'dlufe-kb/course/v1',desc:'固定值,导入时校验'}),
      F('course','课程对象',{required:true,type:J,example:'{code,name,credit,hours,chapters:[…]}',desc:'完整课程对象,含章节与知识点'}),
      F('graph','知识图谱',{type:J,example:'{nodes:[…],edges:[…]}',desc:'节点与关联边'}),
      F('bank','题库',{type:J,example:'[ {type,stem,answer,…} ]',desc:'题目数组'}),
      F('papers','卷库',{type:J,example:'[ {name,sections:[…]} ]',desc:'试卷数组'})
    ],
    rules:[
      '导入时会重新生成课程/章节/知识点的 id,并同步重写知识点之间的关联边 id。',
      '导入为"新增课程",不会覆盖已有同代码课程(如需覆盖请先删除或使用"课程基本信息"模板更新)。',
      '导出的课程包可原样再次导入(往返无损),也可作为模板手工编辑后再导入。'
    ],
    sampleJSON:{ schema:'dlufe-kb/course/v1', exportedAt:'2026-10-08T10:00:00.000Z',
      course:{ code:'BX211001', name:'Python程序设计', credit:3, hours:48, semester:2, leader:'王伟',
        desc:'以数据应用为导向的 Python 程序设计课程', objectives:['掌握基础语法'],
        chapters:[{ id:'ch_py1', title:'第1章 Python概述', hours:4,
          kps:[{ id:'kp_py11', title:'Python 简介与发展', content:'Python 是**解释型**语言。', links:['kp_py12'] }] }] },
      graph:{ nodes:[{id:'kp_py11',label:'Python 简介与发展'}], edges:[{source:'kp_py11',target:'kp_py12'}] },
      bank:[{ id:'q1', type:'single', difficulty:'易', chapter:'第1章 Python概述', stem:'定义函数的关键字是?', options:['A. def','B. function'], answer:'A', analysis:'def 关键字。' }],
      papers:[{ id:'p1', name:'期末卷A', sections:[{ title:'一、单项选择题', score:2, questionIds:['q1'] }] }] }
  },
  {
    id:'majorPackage', icon:'🏛️', cat:'system', name:'专业包(专业+课程+课程群)', direction:'both', rowShape:'json',
    purpose:'以专业为单位整体导出/导入 — 含专业信息、修读计划(课程+学期)与课程群;导入时按课程代码自动复用已有课程,避免重复建课。',
    chaoxing:{ entry:'超星 → 教务/专业建设数据;用于专业间复制课程体系', format:'JSON(UTF-8)' },
    formats:['json'],
    fields:[
      F('schema','格式标识',{required:true,example:'dlufe-kb/major/v1 或 dlufe-kb/majors/v1',desc:'单专业用 major/v1,多专业用 majors/v1'}),
      F('major','专业信息',{required:true,type:J,example:'{name,code,leader,desc}',desc:'专业名称/代码/负责人/简介'}),
      F('courses[].semester','修读学期',{required:true,type:N,example:'2',desc:'该课程在本专业中的开课学期'}),
      F('courses[].course','课程对象',{required:true,type:J,desc:'完整课程对象(含章节知识点)'}),
      F('groups[]','课程群',{type:J,example:'[{name,leader,desc,courseCodes:[…]}]',desc:'按课程代码引用群内课程'})
    ],
    rules:[
      '导入时以"课程代码"为准复用已有课程(计入复用统计,不重复建课),缺失的课程才新建。',
      '专业包会新建一个专业条目;如专业代码相同会新增为同名专业(请先删除旧专业以免重复)。',
      '"全部专业包"导出格式为 dlufe-kb/majors/v1,可一次性迁移整个学校的专业体系。'
    ],
    sampleJSON:{ schema:'dlufe-kb/major/v1', exportedAt:'2026-10-08T10:00:00.000Z',
      major:{ name:'大数据管理与应用', code:'120108T', leader:'刘院长', desc:'面向数字经济的复合型人才培养专业' },
      courses:[{ semester:2, course:{ code:'BX211001', name:'Python程序设计', credit:3, hours:48, chapters:[] } }],
      groups:[{ name:'数据科学与技术', leader:'赵强', desc:'数据采集-存储-分析核心链路', courseCodes:['BX211001','BX211003'] }] }
  },
  {
    id:'templates', icon:'🧩', cat:'system', name:'文档模板库', direction:'both', rowShape:'json',
    purpose:'大纲/教案/教学日历等文档模板的批量导入导出 — 便于团队统一模板、跨校共享。',
    chaoxing:{ entry:'超星 → 课程 → 文档模板(本模板库为其上游标准)', format:'JSON(UTF-8)' },
    formats:['json'],
    fields:[
      F('schema','格式标识',{required:true,example:'dlufe-kb/templates/v1',desc:'固定值'}),
      F('templates[].name','模板名称',{required:true,example:'课程教学大纲',desc:'模板显示名'}),
      F('templates[].type','模板类型',{required:true,type:'枚举',format:'course(课程级) / chapter(章节级)',example:'course',desc:'决定生成文档时的输入参数'}),
      F('templates[].content','模板内容',{required:true,type:M,format:'Markdown + {{占位符}}',example:'# {{course.name}} 课程大纲\\n\\n学分:{{course.credit}}',desc:'可用占位符见模板中心"占位符速查"面板'})
    ],
    rules:[
      '导入不会覆盖同名模板,而是新增(可在模板中心复制/删除整理)。',
      '可用占位符:course.name/code/credit/hours/semester/leader/desc/majors/objectives、chapters.table、calendar.rows、bank.rows、chapter.title/kpTitles/kpContents。'
    ],
    sampleJSON:{ schema:'dlufe-kb/templates/v1', templates:[{ name:'课程教学大纲', type:'course',
      content:'# 《{{course.name}}》课程教学大纲\n\n| 课程代码 | {{course.code}} |\n| 学分 | {{course.credit}} |\n| 学时 | {{course.hours}} |\n| 负责人 | {{course.leader}} |\n\n## 一、课程简介\n\n{{course.desc}}\n\n## 二、课程内容\n\n| 章节 | 知识点 | 学时 |\n| --- | --- | --- |\n{{chapters.table}}' }] }
  },
  {
    id:'aiChecklist', icon:'🤖', cat:'system', name:'AI 加工清单(dlufe-kb-ai/v1)', direction:'export', rowShape:'json',
    purpose:'把课程的知识点清单导出给大模型,让 AI 按固定 Schema 批量补充讲义内容与题目,再用"AI 结果"模板回收。',
    chaoxing:{ entry:'(中间产物)作为提示词素材,结果可再导出到超星题库/文档', format:'JSON(UTF-8)' },
    formats:['json'],
    fields:[
      F('schema','格式标识',{required:true,example:'dlufe-kb-ai/v1',desc:'固定值,导入时校验'}),
      F('courseCode','课程代码',{required:true,example:'BX211001',desc:'用于把结果回填到对应课程'}),
      F('kps[]','知识点清单',{required:true,type:J,example:'[{chapterTitle,title,content}]',desc:'待 AI 加工的知识点'}),
      F('_prompt','提示词',{type:M,desc:'随文件一起导出的加工说明,可直接复制给大模型'})
    ],
    rules:['此模板方向为"仅导出";AI 加工后的结果请用"AI 生成结果"模板导入。',
      '建议在提示词中明确要求 AI 保持 schema 字段名不变、公式使用 LaTeX 语法。'],
    sampleJSON:{ schema:'dlufe-kb-ai/v1', courseCode:'BX211001',
      kps:[{ chapterTitle:'第1章 Python概述', title:'Python 简介与发展', content:'Python 是解释型高级语言。' }],
      questions:[], _prompt:'请按 dlufe-kb-ai/v1 schema 为每个知识点生成 2 道单选题与 1 道简答题…' }
  },
  {
    id:'aiResult', icon:'✨', cat:'system', name:'AI 生成结果(回填导入)', direction:'import', rowShape:'json',
    purpose:'把大模型产出的知识点与题目一键回填到课程 — 知识点按章节标题自动归位,题目按题型/难度/知识点挂接。',
    chaoxing:{ entry:'结果可再经"题库"模板导出,导入超星题库', format:'JSON(UTF-8);须符合 dlufe-kb-ai/v1' },
    formats:['json'],
    fields:[
      F('schema','格式标识',{required:true,example:'dlufe-kb-ai/v1',desc:'须以 dlufe-kb-ai 开头,否则拒绝导入'}),
      F('courseCode','课程代码',{required:true,example:'BX211001',desc:'匹配课程;匹配不到时回退到第一门课程'}),
      F('kps[].chapterTitle','章标题',{required:true,example:'第1章 Python概述',desc:'不存在时自动创建章节'}),
      F('kps[].title','知识点名称',{required:true,example:'Python 简介与发展',desc:'同名知识点会被跳过'}),
      F('kps[].content','知识点内容',{type:M,example:'Python 是**解释型**语言。',desc:'Markdown + LaTeX'}),
      F('questions[].type','题型',{required:true,type:'枚举',format:'中文题型名',example:'单选题',desc:'单选题/多选题/判断题/填空题/简答题/操作题'}),
      F('questions[].stem','题干',{required:true,type:M,example:'定义函数的关键字是?',desc:'Markdown + LaTeX'}),
      F('questions[].options','选项',{type:J,format:'数组,如 ["A. def","B. function"]',example:'["A. def","B. function"]',desc:'选择题必填'}),
      F('questions[].answer','答案',{required:true,example:'A',desc:'参考答案'}),
      F('questions[].analysis','解析',{type:M,desc:'答案解析'}),
      F('questions[].chapterTitle','所属章节',{example:'第1章 Python概述',desc:'用于题库按章节筛选'}),
      F('questions[].kp','关联知识点',{example:'Python 简介与发展',desc:'按知识点名称挂接'}),
      F('questions[].difficulty','难度',{type:'枚举',format:'易 / 中 / 难',example:'中',desc:'默认"中"'}),
      F('questions[].courseCode','课程代码',{example:'BX211001',desc:'可留空,默认使用顶层 courseCode'})
    ],
    rules:[
      'schema 必须以 dlufe-kb-ai 开头,否则拒绝导入并提示。',
      '知识点按"章标题 + 知识点名称"去重;题目按题干去重后追加到题库。',
      '导入完成后可在"课程库 → 章节与知识点"中继续在线编辑与补图。',
      '同一文件可同时含 kps 与 questions;两者都可为空。'
    ],
    sampleJSON:{ schema:'dlufe-kb-ai/v1', courseCode:'BX211001',
      kps:[{ chapterTitle:'第1章 Python概述', title:'Python 的适用场景', content:'数据分析、人工智能、Web 开发、自动化脚本。' }],
      questions:[{ type:'单选题', difficulty:'易', chapterTitle:'第1章 Python概述', kp:'Python 的适用场景',
        stem:'下列哪一项**不是** Python 的典型应用场景?', options:['A. 数据分析','B. 人工智能','C. 操作系统内核开发','D. 自动化脚本'],
        answer:'C', analysis:'Python 不用于内核开发,内核通常使用 C/Rust。' }] }
  },
  {
    id:'backup', icon:'💾', cat:'system', name:'全库备份(灾备与迁移)', direction:'both', rowShape:'json',
    purpose:'一次性导出系统全部数据(专业/课程群/课程/知识点/题库/卷库/文档/模板/班级/成绩/日志),用于整体备份、换设备或灾备恢复。',
    chaoxing:{ entry:'(系统级备份,不对应超星入口;用于本系统自身的数据安全)', format:'JSON(UTF-8)' },
    formats:['json'],
    fields:[
      F('settings','系统设置',{required:true,type:J,example:'{role,userName,term}',desc:'当前角色、用户与学期设置'}),
      F('majors','专业',{required:true,type:J,desc:'专业数组(含修读计划)'}),
      F('groups','课程群',{required:true,type:J,desc:'课程群数组'}),
      F('courses','课程',{required:true,type:J,desc:'课程数组(含章节与知识点)'}),
      F('bank','题库',{required:true,type:J,desc:'题目数组'}),
      F('papers','卷库',{required:true,type:J,desc:'试卷数组'}),
      F('templates','文档模板',{required:true,type:J,desc:'模板数组'}),
      F('documents','教学文档',{required:true,type:J,desc:'文档数组(含版本快照)'}),
      F('classes','教学班级',{required:true,type:J,desc:'班级数组(含学生、成绩、作业)'}),
      F('logs','同步日志',{type:J,desc:'导入导出操作日志'})
    ],
    rules:[
      '恢复操作会**整体覆盖**当前浏览器中的所有数据,请先导出一次现有备份以防意外。',
      '仅管理员可执行"恢复备份"与"重置示例数据"。',
      '备份文件可跨设备、跨浏览器使用;建议每周导出一次。'
    ],
    sampleJSON:{ schema:'(无)', settings:{ role:'admin', userName:'系统管理员', term:'2025-2026-1' },
      majors:[], groups:[], courses:[], bank:[], papers:[], templates:[], documents:[], classes:[], logs:[] }
  }
];

/* ---------- 查询助手 ---------- */
const SchemaKit = {
  all(){ return SCHEMAS; },
  get(id){ return SCHEMAS.find(s=>s.id===id); },
  byCat(cat){ return SCHEMAS.filter(s=>!cat || s.cat===cat); },
  cats(){ return SCHEMA_CATS; },
  /* 能导入的对象 */
  importable(){ return SCHEMAS.filter(s=>s.direction!=='export'); },
  /* 参与表格(CSV/Excel)映射的字段:优先用 altFields 简化版 */
  tableFields(sc){ return sc.altFields || sc.fields; },
  /* 表头(第一行):优先用 sampleHeader(含动态列示例列) */
  headers(sc){
    if(sc.sampleHeader) return sc.sampleHeader.slice();
    return SchemaKit.tableFields(sc).filter(f=>!/[<>\[\]]/.test(f.label)&&!/\[/.test(f.key||'')).map(f=>f.label);
  },
  /* 示例数据二维数组(表头行 + 数据行);sc.sample 只写数据行 */
  sampleRows(sc){
    const data=(sc.sample||[]).filter(r=>Array.isArray(r));
    return [SchemaKit.headers(sc)].concat(data);
  },
  /* 字段说明表(用于 Excel 第二工作表 / Markdown 说明书) */
  fieldTable(sc, fields){
    const rows=[['列名/字段','含义','必填','类型','格式要求','示例','超星对应列']];
    (fields||SchemaKit.tableFields(sc)).forEach(f=>rows.push([
      f.label, f.desc||'', f.required?'✔ 必填':'选填', f.type||'文本',
      f.format||'—', f.example===undefined?'':(typeof f.example==='object'?JSON.stringify(f.example):String(f.example)), f.cx||'—'
    ]));
    if(sc.dynamic) rows.push([sc.dynamic.label, sc.dynamic.desc, '条件必填', '数值', '见说明', '', '各分项列']);
    return rows;
  },
  /* 字段说明 Markdown(随模板包一起下载) */
  specMd(sc){
    const L=[];
    L.push(`# ${sc.icon||''} ${sc.name} — 导入导出模板说明`);
    L.push('');
    L.push(`**用途**:${sc.purpose}`);
    L.push('');
    L.push(`**方向**:${sc.direction==='both'?'导入 + 导出':sc.direction==='import'?'仅导入':'仅导出'} 　**支持格式**:${sc.formats.map(f=>DF.formats[f]?DF.formats[f].label:f).join(' / ')}`);
    L.push('');
    L.push(`**超星(学习通)对应入口**:${sc.chaoxing.entry}`);
    L.push('');
    L.push(`**超星推荐格式**:${sc.chaoxing.format}`);
    L.push('');
    L.push('## 一、字段说明');
    L.push('');
    L.push(DF.mdTable(SchemaKit.fieldTable(sc)));
    if(sc.dynamic){ L.push(''); L.push(`> **动态列说明**:${sc.dynamic.desc}`); }
    if(sc.altFields){
      L.push('');
      L.push('### JSON 结构字段(完整版)');
      L.push('');
      L.push('> 表格格式(CSV/Excel)使用上表的简化结构;JSON 格式使用以下完整结构。');
      L.push('');
      L.push(DF.mdTable(SchemaKit.fieldTable(sc, sc.fields)));
    }
    L.push('');
    L.push('## 二、填写规则');
    L.push('');
    sc.rules.forEach(r=>L.push(`- ${r}`));
    L.push('');
    L.push('## 三、示例数据');
    L.push('');
    if(sc.rowShape==='json'){
      L.push('**JSON 格式示例**');
      L.push('');
      L.push('```json');
      L.push(DF.json(sc.sampleJSON||{}));
      L.push('```');
      if(sc.altFields){
        L.push('');
        L.push('**表格格式示例(CSV / Excel)**');
        L.push('');
        L.push(DF.mdTable(SchemaKit.sampleRows(sc)));
      }
    }else{
      L.push(DF.mdTable(SchemaKit.sampleRows(sc)));
    }
    L.push('');
    L.push('## 四、格式与编码要求');
    L.push('');
    L.push('- 文本格式(CSV/TSV)**必须使用 UTF-8 编码**,否则中文会乱码;用 Excel 编辑请选"另存为 → CSV UTF-8(逗号分隔)"。');
    L.push('- CSV 中以英文逗号分隔列;单元格内容含逗号或换行时,请用英文双引号把整个单元格括起来。');
    L.push('- 从 Excel 复制粘贴得到的数据为制表符分隔,可直接另存为 .tsv 上传,系统会自动识别。');
    L.push('- Excel(.xlsx)模板含两个工作表:第 1 页"数据"(填这一页)、第 2 页"字段说明"。');
    L.push('- JSON 格式最完整,支持公式与多层级结构;请勿修改字段名。');
    L.push('');
    L.push('---');
    L.push('');
    L.push('*本说明由系统"数据字典"自动生成,与导入解析规则同源,保证模板与解析一致。*');
    return L.join('\n');
  }
};
