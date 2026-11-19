/* ============================================================
   使用说明中心 (help)
   面向五类角色的详细操作指南:角色定位 / 可见模块 / 推荐工作流 / 常见问题
   模块可见性表由 PERM 实时推导,保证说明与权限始终一致。
   ============================================================ */

const HELP = {
  admin: {
    icon:'🛡️', label:'管理员',
    tagline:'系统最高权限 — 负责全局数据体系、资源库与数据安全',
    intro:'您拥有全部模块的读写权限。日常重点是维护"专业—课程群—课程"三级体系与资源库，并在学期末用全库备份保障数据安全。',
    duty:[
      '维护专业、课程群、课程三级体系与修读计划',
      '管理题库、卷库、文档模板与数据模板中心',
      '管理教学班级维度下的教学过程数据',
      '执行全库备份与恢复，演示模式下核对各角色可见范围'
    ],
    flow:[
      {t:'① 建立专业与课程体系', d:'在「专业管理」新增专业并挂接课程、设置每门课的修读学期；课程群按研究/教学方向组建。', href:'#/majors', act:'去专业管理'},
      {t:'② 补全课程内容', d:'「课程库」维护课程信息、章节与知识点；「知识图谱」梳理知识点之间的前置/衔接关系。', href:'#/courses', act:'去课程库'},
      {t:'③ 准备教学资源', d:'「题库管理」录入或批量导入题目；「卷库管理」组卷；「文档模板」维护大纲/教案模板。', href:'#/bank', act:'去题库管理'},
      {t:'④ 落地教学过程', d:'「教学班级」建立班级、导入学生名册、录入成绩与作业（可先用数据模板批量开课）。', href:'#/classes', act:'去教学班级'},
      {t:'⑤ 对接超星与备份', d:'「超星互动」与学习通双向导入导出；「数据与接口」做全库备份或恢复。', href:'#/chaoxing', act:'去超星互动'}
    ],
    faq:[
      {q:'如何把整套数据迁到另一台电脑？', a:'进入「数据与接口 → 全库备份」导出备份文件，在新设备上用「恢复备份」导入即可；备份文件包含专业/课程/题库/文档/班级等全部数据。'},
      {q:'如何按学期查看班级？', a:'「教学班级」右上角可按学期筛选；首页也可直接切换"当前学期"，新建班级会默认采用该学期。'},
      {q:'学生角色能看到什么？', a:'学生为只读角色：可见课程、知识点、图谱、题库、教学文档、模板说明与项目文档，但不可见教学班级与超星互动，也不能导出。'}
    ]
  },
  major_leader: {
    icon:'🏛️', label:'专业负责人',
    tagline:'对某专业的课程体系与修读计划负责',
    intro:'您主要维护本专业的课程体系：把课程按"低年级 → 高年级"的修读进程挂接到专业下，并组建课程群。仅能维护本人负责的专业（按"专业负责人"姓名匹配）。',
    duty:[
      '维护本专业信息、课程体系与修读学期',
      '组建课程群并指定群负责人',
      '查看本专业课程的知识点、知识图谱与题库',
      '用数据模板批量导入课程与修读计划'
    ],
    flow:[
      {t:'① 专业信息与课程挂接', d:'「专业管理」编辑专业，勾选课程并设置每门课的修读学期，形成修读进程时间线。', href:'#/majors', act:'去专业管理'},
      {t:'② 组建课程群', d:'在「课程群工作台」新增课程群、指定负责人、拉入群内课程。', href:'#/group', act:'去课程群工作台'},
      {t:'③ 批量建模（可选）', d:'课程较多时，用「数据模板 → 专业与修读计划 / 课程基本信息」批量导入，再一键入站。', href:'#/datatpl', act:'去数据模板'},
      {t:'④ 审视课程内容', d:'「课程库 / 知识图谱 / 题库」查看本专业课程的内容建设情况。', href:'#/courses', act:'去课程库'}
    ],
    faq:[
      {q:'为什么我看不到其他专业的课程？', a:'系统按"专业负责人"姓名做数据范围校验。可点击左下角切换姓名，与专业负责人一致后即可维护。'},
      {q:'共享课程在不同专业学期不同怎么办？', a:'修读学期按"专业 × 课程"记录，同一门课在不同专业可分别设为不同学期，互不影响。'},
      {q:'课程群和专业的区别？', a:'专业是"哪个专业开哪些课"，课程群是"哪些课属于同一方向/由同一人统一负责"；一个专业可含多个课程群，课程群也可跨专业。'}
    ]
  },
  group_leader: {
    icon:'🗂️', label:'课程群负责人',
    tagline:'统筹课程群内多门课程的衔接与群视角图谱',
    intro:'您负责一组课程的"内在逻辑"：群内课程按学期排序、梳理跨课程的知识点衔接，并从群视角查看知识图谱。可维护本群课程的班级与教学文档。',
    duty:[
      '维护课程群信息与群内课程',
      '调整群内课程顺序、梳理跨课程衔接',
      '查看群视角知识图谱与衔接清单',
      '维护本群课程的教学班级与教学文档'
    ],
    flow:[
      {t:'① 群信息与课程', d:'「课程群工作台」编辑群名称/负责人/简介，勾选群内课程（可按学期排序）。', href:'#/group', act:'去课程群工作台'},
      {t:'② 梳理衔接', d:'在各课程的「知识点」中用"关联"把后继课程的前置知识点连起来，跨课程关联即形成衔接依赖。', href:'#/courses', act:'去课程库'},
      {t:'③ 群视角图谱', d:'「知识图谱」按课程着色，查看群内知识点整体分布与跨课程连边。', href:'#/graph', act:'去知识图谱'},
      {t:'④ 教学落地', d:'为本群课程建立教学班级、导入名册与成绩，并生成教学大纲/教案。', href:'#/classes', act:'去教学班级'}
    ],
    faq:[
      {q:'为什么有的课程我不能编辑？', a:'群负责人可维护"本群课程"的知识点、班级与文档；非本群课程仅可查看。可请管理员把课程加入您负责的课程群。'},
      {q:'跨课程衔接怎么体现？', a:'在知识点里关联其他课程的知识点，即形成跨课程连边；「课程群工作台 → 衔接清单」会汇总这些依赖。'},
      {q:'群视角图谱与课程图谱有何不同？', a:'课程图谱只看一门课；群视角图谱把群内所有课程的知识点放进一张图，便于发现断层与冗余。'}
    ]
  },
  course_leader: {
    icon:'👩‍🏫', label:'课程负责人（教师）',
    tagline:'一线教师 — 系统的主要使用者，也是超星（学习通）教师端的后台',
    intro:'您负责本人课程的教学全流程：从课程内容、题库、教学文档，到教学班级的学生名册与成绩，并能与超星（学习通）双向导入导出。首页"教学任务进度"会提示每门课还差哪些环节。',
    duty:[
      '维护本人课程的章节、知识点、题库与卷库',
      '从模板生成教学大纲 / 教案 / 教学日历并在线编辑',
      '建立教学班级、导入名册、录入成绩与作业',
      '与超星（学习通）双向导入导出教学数据'
    ],
    flow:[
      {t:'① 查看任务进度', d:'首页"教学任务进度"逐项显示每门课的完成度，点击未完成项可直达对应页面。', href:'#/dashboard', act:'回首页'},
      {t:'② 建课程内容', d:'「课程库」补全课程信息与课程目标，建立章节与知识点；可用「数据模板 → 知识点目录」批量导入。', href:'#/courses', act:'去课程库'},
      {t:'③ 录题库与试卷', d:'「题库管理」录入题目（支持 Markdown + LaTeX 公式），「卷库管理」按题型组卷并打印。', href:'#/bank', act:'去题库管理'},
      {t:'④ 建班与成绩', d:'「教学班级」新建班级 → 导入学生名单 → 录入平时/期中/期末成绩（总评按权重自动计算）。', href:'#/classes', act:'去教学班级'},
      {t:'⑤ 生成教学文档', d:'在课程任务卡点击"生成大纲/教学日历/教案"，生成后进入「教学文档」在线编辑、导出或打印 PDF。', href:'#/docs', act:'去教学文档'},
      {t:'⑥ 与超星对接', d:'「超星互动」把学生名单、成绩、知识点目录、题库等导出给学习通，或把学习通数据导入本系统。', href:'#/chaoxing', act:'去超星互动'}
    ],
    faq:[
      {q:'总评成绩怎么算？', a:'总评 = Σ(得分 ÷ 满分 × 权重)。权重在班级"成绩管理 → 成绩项"设置，三项之和不必恰好 100（系统会自动归一）。'},
      {q:'超星导出的成绩能直接导入吗？', a:'可以。分项列名与超星导出一致时即写入对应成绩项；"总评"列会被忽略并按本系统权重重算。CSV 请用 UTF-8 编码。'},
      {q:'为什么只能看到部分课程？', a:'系统按"课程负责人"姓名做数据范围校验。左下角可切换姓名，与课程负责人一致后即可维护该课程。'}
    ]
  },
  student: {
    icon:'🎓', label:'学生',
    tagline:'学习资源只读浏览',
    intro:'您可以浏览课程知识点、知识图谱、题库、教学文档与项目文档，并用全站检索快速定位内容。为保证教学数据安全，学生为只读角色。',
    duty:[
      '浏览课程章节、知识点与公式内容',
      '查看知识图谱的知识点关联',
      '查看题库题目与解析（只读）',
      '检索课程 / 知识点 / 题目 / 文档'
    ],
    flow:[
      {t:'① 浏览课程', d:'「课程库」进入课程，按章节查看知识点正文（支持 Markdown 与公式）。', href:'#/courses', act:'去课程库'},
      {t:'② 看图谱', d:'「知识图谱」直观查看知识点之间的前后置关系。', href:'#/graph', act:'去知识图谱'},
      {t:'③ 看题目与文档', d:'「题库管理」查看题目与解析；「教学文档」查看大纲/教案等。', href:'#/bank', act:'去题库'},
      {t:'④ 快速检索', d:'「全站检索」一个入口搜遍课程、知识点、题目与文档。', href:'#/search', act:'去检索'}
    ],
    faq:[
      {q:'为什么看不到教学班级和超星互动？', a:'这两个模块涉及成绩与教师端操作，仅对教师角色开放；学生角色不可见，也不能导出数据。'},
      {q:'能修改内容吗？', a:'不能。学生为只读角色，所有浏览内容均不可编辑，以保证教学资源的权威性。'},
      {q:'找不到想看的内容？', a:'试试「全站检索」，输入课程名、知识点关键词或题目片段即可定位。'}
    ]
  }
};

const HELP_ORDER = ['admin','major_leader','group_leader','course_leader','student'];
const PERM_LABEL = {w:'可读写', r:'只读', '-':'不可见'};

function viewHelp(roleId){
  const mine = auth.role();
  const role = HELP[roleId] ? roleId : mine;
  const h = HELP[role];
  const isMe = role===mine;
  return `
  <div class="page-head"><div>
    <h1>❓ 使用说明</h1>
    <div class="sub">面向五类角色的操作指南 — 当前角色:<b>${ROLES[mine].icon} ${ROLES[mine].label}</b>${isMe?'（正在查看本人指南）':''}</div></div>
    <div class="row"><a class="btn" href="#/dashboard">🏠 返回工作台</a></div></div>

  <div class="help-tabs">
    ${HELP_ORDER.map(r=>`<a class="help-tab ${r===role?'active':''}" href="#/help/${r}">
      <span class="ht-ic">${HELP[r].icon}</span><span class="ht-t">${esc(HELP[r].label)}</span>
      ${r===mine?'<span class="ht-me">我</span>':''}</a>`).join('')}
  </div>

  <div class="card help-intro">
    <div class="row" style="align-items:flex-start;gap:14px">
      <div class="help-avatar">${h.icon}</div>
      <div style="flex:1;min-width:220px">
        <h2 style="font-size:17px;margin:0 0 4px">${esc(h.label)}</h2>
        <div class="mini" style="font-size:12.5px;color:var(--primary)">${esc(h.tagline)}</div>
        <p style="margin:8px 0 0;font-size:13px;color:#334155">${esc(h.intro)}</p>
        ${isMe?'':`<div class="import-hint" style="margin-top:10px">⚠ 您当前是「${ROLES[mine].label}」，以上为<b>${h.label}</b>的操作指南。切换到该角色后即可按此操作。</div>`}
      </div>
    </div>
  </div>

  <div class="grid cols2">
    <div class="card"><h3>🎯 核心职责</h3>
      <ul class="help-duty">${h.duty.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>
    </div>
    <div class="card"><h3>🗺️ 模块可见性</h3>
      <div class="table-wrap"><table class="kv"><tbody>
        ${NAV.filter(n=>n.module!=='help').map(n=>{
          const v = (PERM[n.module]||{})[role] || '-';
          return `<tr><th style="width:auto">${n.icon} ${esc(n.label)}</th>
            <td style="text-align:right"><span class="tag ${v==='w'?'green':v==='r'?'blue':'gray'}">${PERM_LABEL[v]}</span></td></tr>`;
        }).join('')}
      </tbody></table></div>
    </div>
  </div>

  <div class="card"><h3>🧭 推荐工作流</h3>
    <div class="help-flow">
      ${h.flow.map((f,i)=>`<div class="hf-step">
        <div class="hf-body"><b>${esc(f.t)}</b><div class="mini" style="margin-top:3px">${esc(f.d)}</div></div>
        <a class="btn small" href="${f.href}">${esc(f.act)} →</a>
      </div>`).join('')}
    </div>
  </div>

  <div class="card"><h3>💡 常见问题</h3>
    <div class="help-faq">
      ${h.faq.map((x,i)=>`<details class="faq-item" ${i===0?'open':''}>
        <summary>${esc(x.q)}</summary><div class="faq-a">${esc(x.a)}</div></details>`).join('')}
      <details class="faq-item"><summary>数据保存在哪里？换设备会丢吗？</summary>
        <div class="faq-a">数据保存在本机浏览器的本地存储中（无需服务器）。换设备或清理浏览器数据前，请在「数据与接口 → 全库备份」导出备份文件，在新设备用「恢复备份」导入。</div></details>
      <details class="faq-item"><summary>当前学期怎么修改？</summary>
        <div class="faq-a">在首页顶部「当前学期」下拉中切换；点右侧「＋」可新增自定义学期（格式 2025-2026-1）。新建教学班级会默认采用当前学期，「教学班级」页也可按学期筛选。</div></details>
      <details class="faq-item"><summary>导出的文件能再导回系统吗？</summary>
        <div class="faq-a">可以。系统导出的列名就是模板表头，导出文件可直接再次导入（往返无损）。与超星的列名也已对齐，详见「数据模板」中各对象的字段说明。</div></details>
      <details class="faq-item"><summary>导入时中文乱码怎么办？</summary>
        <div class="faq-a">CSV 必须使用 UTF-8 编码。用 Excel 保存时请选择「CSV UTF-8（逗号分隔）」，或改用系统提供的 Excel(.xlsx) 模板填写。</div></details>
    </div>
  </div>

  <div class="row" style="justify-content:center;margin:18px 0 6px">
    <a class="btn primary" href="#/dashboard">🏠 返回教师工作台</a>
    <a class="btn" href="#/datatpl">📋 查看数据模板中心</a>
  </div>`;
}
