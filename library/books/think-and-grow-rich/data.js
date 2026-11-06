/* ============================================================
   《思考致富》数据
   只改本文件即可调整该书全部内容，页面骨架见 ../../assets/book.js
   引文核对：quotations.pro 对照 1937 年版正文；页码取自 Wikiquote 标注
   ============================================================ */
window.BOOK = {
  slug: 'think-and-grow-rich',
  title: '思考致富',
  titleEn: 'Think and Grow Rich',
  shortEn: 'THINK & GROW RICH',
  heroAccent: '十三条步骤，与它的时代局限',
  author: '拿破仑·希尔（Napoleon Hill）',
  intro: '一本 1937 年写成的书，把致富拆成十三个可执行的步骤。它给的方法至今仍能用，它给的世界观需要被重新检查。',
  meta: '拿破仑·希尔 著 · 1937 年初版 · 十三章致富步骤 · 本页为结构化精华整理',
  color: '#B5651D',
  mapHint: '结构依据 1937 年初版目录：十三章「致富步骤」，加一章「如何战胜六大恐惧」。本页按「思想—欲望—知识—行动—心智」重组为五层，与原书章节一一对应。',
  footNote: '<b>说明：</b>本页为学习用途的结构化整理，不是原著全文，也不替代购买与阅读正版图书。英文引文对照 1937 年初版正文，中文为编译译述。本书初版于 1937 年，其中部分论述缺少现代科学证据，请配合页末「阅读提示」一起读。',

  themes: [
    {
      id: 'law', no: '01', title: '思想的法则', chapter: '序幕 · 思想决定一切',
      color: '#B5651D', side: 'right',
      lead: '希尔的起点不是方法，而是一个断言：思想会变成实物。后面十三条步骤，都建立在这个前提上。',
      map: ['思想即物质', '一切成就始于一个想法', '明确的目的', '重复把观念刻进心里', '高目标不更费力'],
      points: [
        { h: '思想即物质，不是比喻', s: '序幕 · 思想决定一切',
          p: '希尔的开篇断言：观念一旦与明确目的、坚持和燃烧的欲望结合，就会转化为对应的实物。他把这句话当作全书地基，十三条步骤都在这块地基上施工。' },
        { h: '一切财富都始于一个想法', s: '序幕 · 思想决定一切',
          p: '不是始于资本、人脉或时机，而是始于一个能被说清楚的想法。他反复举卡内基、福特、爱迪生，指向同一件事：先有构想，再有人和钱。' },
        { h: '明确的目的，是所有步骤的入口', s: '欲望 · 通往财富的第一级台阶',
          p: '「我想要更多钱」不是目的。目的是可被写下来的数字、期限与交换条件。含混的愿望既无法驱动行动，也无法被潜意识接收。' },
        { h: '观念靠重复进入潜意识', s: '自我暗示 · 通往财富的第三级台阶',
          p: '任何想法、计划或目的，都可以通过反复思考被放进心里。重复不是自我欺骗，而是把目标从「偶尔想起」变成「默认背景」。' },
        { h: '高目标与低目标，花的力气一样多', s: '欲望 · 通往财富的第一级台阶',
          p: '希尔的提醒很朴素：要求富足与接受贫乏，所需的努力并没有区别。既然如此，把目标定高一点并不会更费力。' }
      ]
    },
    {
      id: 'desire', no: '02', title: '欲望与信念', chapter: '第一至三章 · 欲望 / 信念 / 自我暗示',
      color: '#E67E22', side: 'right',
      lead: '这一层解决「你为什么非做不可」。欲望、信念、自我暗示串成一条链：先要得发烫，再相信自己能得到，最后每天说给自己听。',
      map: ['欲望不是愿望', '写下金额与期限', '六步法', '信念可以被制造', '每天朗读两次'],
      points: [
        { h: '欲望不是愿望，是执念', s: '欲望 · 通往财富的第一级台阶',
          p: '愿望是「希望有」，欲望是「非有不可」。希尔要求欲望强到占据全部注意力：弱欲望只带来弱结果，像小火只能产生一点热。' },
        { h: '把欲望写成数字、期限和代价', s: '欲望 · 通往财富的第一级台阶',
          p: '明确你要多少钱、什么时候得到、愿意用什么去换。模糊的目标无法执行，也无法检验，只会停留在情绪层面。' },
        { h: '六步法：把欲望炼成指令', s: '欲望 · 通往财富的第一级台阶',
          p: '确定具体金额 → 确定愿意付出的代价 → 设定明确日期 → 制定计划并立即开始 → 写下完整陈述 → 每天早晚大声朗读并感受已经达成的状态。前四步做一次，后两步每天做。' },
        { h: '信念是一种可以被制造的心理状态', s: '信念 · 通往财富的第二级台阶',
          p: '希尔把信念称作「心智的首席化学师」：它把普通念头转化成对应的行动。信念不是等来的，而是通过自我暗示反复强化出来的。' },
        { h: '先相信，再看见结果', s: '信念 · 通往财富的第二级台阶',
          p: '他的顺序与常识相反：不是看到成果才相信，而是先建立信念，行为才随之改变。今天的心理学能用期望效应部分解释这一点，但希尔把它推得更远。' },
        { h: '自我暗示：把目标说给自己听', s: '自我暗示 · 通往财富的第三级台阶',
          p: '潜意识只对带情绪的想法起反应，所以朗读不能机械，要带画面和感受。他建议早晚各一次，让目标成为入睡前与醒来后的第一个念头。' }
      ]
    },
    {
      id: 'knowledge', no: '03', title: '知识与想象', chapter: '第四至六章 · 专业知识 / 想象力 / 有序的计划',
      color: '#2E5C8A', side: 'left',
      lead: '想清楚之后要有料。这一层把「知道什么」变成「能做出什么」：专业知识、两种想象力，以及把欲望排成时间表的计划。',
      map: ['知识只是潜在力量', '知道去哪找', '综合想象与创造想象', '观念是财富的起点', '计划失败就换计划', '智囊团'],
      points: [
        { h: '知识本身不是力量', s: '专业知识 · 通往财富的第四级台阶',
          p: '知识只有在被组织成明确的行动计划、并指向明确目标时，才成为力量。囤积知识带来的安全感，正是很多人停滞的原因。' },
        { h: '不必全知，只要知道去哪找', s: '专业知识 · 通往财富的第四级台阶',
          p: '你不需要掌握所有细节，只需要掌握与目标直接相关的那一小块，以及找到其余部分的渠道。希尔认为「专才」比「通才」更容易被高价购买。' },
        { h: '两种想象力：一种重组，一种原创', s: '想象力 · 通往财富的第五级台阶',
          p: '综合想象把已有观念与经验重新组合，可以训练；创造想象接收到全新的构想，需要长期积累素材才会出现。' },
        { h: '观念是财富的起点', s: '想象力 · 通往财富的第五级台阶',
          p: '所有赚到大钱的生意，起点都是一个想法。想法本身不值钱，值钱的是把它做成产品、服务或流程的能力。' },
        { h: '没有计划，欲望只是情绪', s: '有序的计划 · 通往财富的第六级台阶',
          p: '计划是把欲望结晶成行动的过程。希尔要求计划具体到谁、做什么、何时完成、换回什么，并且准备好第二套、第三套备选方案。' },
        { h: '计划失败就换计划，不要换目标', s: '有序的计划 · 通往财富的第六级台阶',
          p: '遇到挫败时，正确的解读是「计划不周」，而不是「目标不可能」。重建计划，再出发——这是他原话里的意思。' }
      ]
    },
    {
      id: 'action', no: '04', title: '决断与坚持', chapter: '第七至九章 · 决断 / 坚持 / 智囊的力量',
      color: '#27AE60', side: 'left',
      lead: '这一层最不性感，却最分胜负。希尔研究了数百位富人后给出一个朴素结论：他们做决定快，改决定慢。',
      map: ['迅速决断，缓慢修改', '拖延是失败的习惯', '意见最廉价', '坚持如碳之于钢', '放弃者从不赢', '智囊团'],
      points: [
        { h: '成功者迅速决断，缓慢修改', s: '决断 · 通往财富的第七级台阶',
          p: '他观察到的共性：能积累财富的人做决定干脆，除非出现新事实，否则不轻易改；而失败者做决定慢，改决定快。' },
        { h: '拖延是决断的反面', s: '决断 · 通往财富的第七级台阶',
          p: '拖延不需要理由，它只需要「再想想」。希尔认为多数机会不是被抢走的，是在犹豫中过期作废的。' },
        { h: '意见是地球上最廉价的商品', s: '决断 · 通往财富的第七级台阶',
          p: '身边总有人乐于提供免费意见。收集信息可以，但决策必须自己做，否则你会替别人的恐惧买单。' },
        { h: '坚持之于人，如碳之于钢', s: '坚持 · 通往财富的第八级台阶',
          p: '正是碳让铁变成钢，正是坚持让普通的能力变成结果。坚持不是重复动作，而是在看不到反馈时仍然继续。' },
        { h: '放弃者从不赢，赢家从不放弃', s: '有序的计划 · 通往财富的第六级台阶',
          p: '这句话在书中出现在「计划」一章，希尔让读者用一寸高的字抄下来贴在显眼处。它的位置本身就在说明：坚持是计划的一部分。' },
        { h: '智囊团：两个人的心智协作', s: '智囊的力量 · 通往财富的第九级台阶',
          p: '智囊团不是人脉清单，而是「两个或更多的人，以和谐的精神，为同一个明确目的协调知识与努力」。和谐是前提，没有它只是互相消耗。' }
      ]
    },
    {
      id: 'mind', no: '05', title: '潜意识与第六感', chapter: '第十至十四章 · 性欲转化 / 潜意识 / 大脑 / 第六感 / 六大恐惧',
      color: '#7F77DD', side: 'right',
      lead: '最后一层是希尔最受争议的部分。它能提供一种自我训练的视角，但必须与他的时代保持距离来读。',
      map: ['潜意识日夜工作', '头脑是收发站', '把能量导向创造', '第六感', '六种基本恐惧', '恐惧的解药是行动'],
      points: [
        { h: '潜意识日夜工作', s: '潜意识 · 通往财富的第十一级台阶',
          p: '潜意识不休息，也不区分输入的好坏。它只对带情绪的想法起反应，所以被反复强调、被强烈感受的目标，更容易变成自动行为。' },
        { h: '头脑是一台收发站', s: '大脑 · 通往财富的第十二级台阶',
          p: '希尔把大脑描述为思想的广播与接收装置，认为强烈的意念会影响他人。这属于 1930 年代的想象，今天没有可靠证据支持；但「注意力决定你遇见什么」这一层仍然可操作。' },
        { h: '把性能量导向创造', s: '性欲转化的奥秘 · 通往财富的第十级台阶',
          p: '他主张把性冲动转化为创作、商业与领导力的能量，并认为这是天才与平庸者的差别之一。作为行为建议（把冲动转为产出）可行，作为生理学结论则缺乏依据。' },
        { h: '第六感：前十二步的结果', s: '第六感 · 通往财富的第十三级台阶',
          p: '希尔把第六感描述为直觉、预感与灵感突然降临，并认为它是长期实践前十二条原则后的产物。更稳妥的理解是：专家直觉来自大量被压缩的经验。' },
        { h: '六种基本恐惧', s: '如何战胜六大恐惧',
          p: '贫穷、批评、疾病、失去爱、年老、死亡。他认为它们是所有犹豫与拖延的底层原因，而且都是习得的，不是天生的。' },
        { h: '恐惧的解药不是勇气，是具体', s: '如何战胜六大恐惧',
          p: '他没有让人「别怕」，而是让人把恐惧写清楚：最坏结果是什么、发生概率多大、真的发生了怎么办。恐惧一旦具体，就不再无限大。' }
      ]
    }
  ],

  quotes: [
    { t: 'law', zh: '思想确实是实物——当它与明确的目的、坚持和燃烧的欲望混合时，更是强有力的实物。', en: 'Truly, “thoughts are things,” and powerful things at that, when they are mixed with definiteness of purpose, persistence, and a burning desire.', src: '序幕 · 思想决定一切' },
    { t: 'law', zh: '一切成就、一切挣来的财富，都始于一个想法。', en: 'All achievement, all earned riches, have their beginning in an idea!', src: '序幕（1937 年版 p.18）' },
    { t: 'law', zh: '财富以思想的形式开始。', en: 'Riches begin in the form of thought!', src: '序幕 · 思想决定一切' },
    { t: 'law', zh: '记住：在生活中瞄准高处、要求富足，并不比接受苦难与贫穷更费力。', en: 'Remember, no more effort is required to aim high in life, to demand abundance and prosperity, than is required to accept misery and poverty.', src: '信念（1937 年版 p.38）' },
    { t: 'law', zh: '任何想法、计划或目的，都可以通过反复思考被放进心里。', en: 'Any idea, plan, or purpose may be placed in the mind through repetition of thought.', src: '自我暗示（1937 年版 p.54）' },
    { t: 'law', zh: '世界习惯为那些言行都表明自己知道要去哪里的人让路。', en: 'The world has the habit of making room for the man whose words and actions show that he knows where he is going.', src: '欲望 · 通往财富的第一级台阶' },

    { t: 'desire', zh: '一切成就的起点是欲望。', en: 'The starting point of all achievement is desire.', src: '欲望 · 通往财富的第一级台阶' },
    { t: 'desire', zh: '微弱的欲望带来微弱的结果，就像小火只能产生一点热。', en: 'Weak desire brings weak results, just as a small fire makes a small amount of heat.', src: '欲望 · 通往财富的第一级台阶' },
    { t: 'desire', zh: '信念是心智的首席化学师。', en: 'Faith is the head chemist of the mind.', src: '信念 · 通往财富的第二级台阶' },
    { t: 'desire', zh: '你的潜意识只识别并作用于那些与情绪充分混合的想法。', en: 'Your subconscious mind recognizes and acts only upon thoughts which have been well-mixed with emotion or feeling.', src: '自我暗示 · 通往财富的第三级台阶' },
    { t: 'desire', zh: '把心定在一个明确的目标上，然后看世界多快为你让路。', en: 'Set your mind on a definite goal and observe how quickly the world stands aside to let you pass.', src: '欲望 · 通往财富的第一级台阶' },

    { t: 'knowledge', zh: '知识只是潜在的力量。只有当它被组织成明确的行动计划、并指向明确目标时，才成为力量。', en: 'Knowledge is only potential power. It becomes power only when, and if, it is organized into definite plans of action, and directed to a definite end.', src: '专业知识 · 通往财富的第四级台阶' },
    { t: 'knowledge', zh: '观念是一切财富的起点。观念是想象力的产物。', en: 'Ideas are the beginning points of all fortunes. Ideas are products of the imagination.', src: '想象力 · 通往财富的第五级台阶' },
    { t: 'knowledge', zh: '意见是地球上最廉价的商品。', en: 'Opinions are the cheapest commodities on earth.', src: '决断 · 通往财富的第七级台阶' },
    { t: 'knowledge', zh: '当挫败到来，把它当作计划不周的信号：重建计划，再次启航，驶向你渴望的目标。', en: 'When defeat comes, accept it as a signal that your plans are not sound, rebuild those plans, and set sail once more toward your coveted goal.', src: '有序的计划 · 通往财富的第六级台阶' },
    { t: 'knowledge', zh: '智囊团可以定义为：两个或更多的人，以和谐的精神，为达成一个明确目的而协调知识与努力。', en: 'The Master Mind may be defined as coordination of knowledge and effort, in a spirit of harmony, between two or more people, for the attainment of a definite purpose.', src: '智囊的力量 · 通往财富的第九级台阶' },

    { t: 'action', zh: '放弃者从不赢，赢家从不放弃。', en: 'A quitter never wins—and—a winner never quits.', src: '有序的计划 · 通往财富的第六级台阶' },
    { t: 'action', zh: '最常见的失败原因之一，是在被暂时的挫败压倒时就放弃。', en: 'One of the most common causes of failure is the habit of quitting when one is overtaken by temporary defeat.', src: '有序的计划 · 通往财富的第六级台阶' },
    { t: 'action', zh: '坚持之于人的品格，正如碳之于钢。', en: 'Persistence is to the character of man as carbon is to steel.', src: '坚持 · 通往财富的第八级台阶' },
    { t: 'action', zh: '力量与成长，只来自持续的努力与挣扎。', en: 'Strength and growth come only through continuous effort and struggle.', src: '坚持 · 通往财富的第八级台阶' },
    { t: 'action', zh: '机会常常伪装成不幸或暂时的失败出现。', en: 'Opportunity often comes disguised in the form of misfortune, or temporary defeat.', src: '序幕（1937 年版 p.13）' },
    { t: 'action', zh: '你最大的机会，可能就在你现在所处的位置。', en: 'Your big opportunity may be right where you are now.', src: '序幕 · 思想决定一切' },

    { t: 'mind', zh: '每一次逆境，都带着同等大小的优势的种子。', en: 'Every adversity brings with it the seed of an equivalent advantage.', src: '坚持 · 通往财富的第八级台阶' },
    { t: 'mind', zh: '别等，时机永远不会「刚刚好」。从你站的地方开始，用手边现有的工具去做，更好的工具会在路上出现。', en: 'Do not wait; the time will never be “just right.” Start where you stand, and work with whatever tools you may have at your command, and better tools will be found as you go along.', src: '决断（1937 年版 p.127）' },
    { t: 'mind', zh: '世上没有不付出代价就能得到的东西。', en: 'There is no such thing as something for nothing.', src: '欲望 · 通往财富的第一级台阶' },
    { t: 'mind', zh: '珍视你的愿景与梦想，它们是灵魂的孩子，是你最终成就的蓝图。', en: 'Cherish your visions and your dreams as they are the children of your soul, the blueprints of your ultimate achievements.', src: '作者公开文字（非原书章节）' }
  ],

  checklist: [
    '把「我想要更多钱」改写成具体数字、具体日期、具体交换条件，写在一张卡片上',
    '每天早晚朗读这张卡片两次，读到有画面、有情绪为止',
    '列出你愿意为这个目标付出的真实代价：时间、金钱、要放弃的事',
    '写下与目标直接相关的三项专业知识，标出你缺的那一项',
    '为补齐缺口找一个人或一门课，本周内发出联系',
    '把目标拆成本季度可验证的三步计划，每步写明谁做什么、何时完成',
    '为这三步各准备一套备选方案，写下「如果失败，我改什么」',
    '针对最困扰你的一种恐惧，写下最坏结果、发生概率与应对方案',
    '找出本周三次「因为犹豫而错过」的时刻，记录你延迟了多久才决定',
    '给一个重大决定设定截止时间，到点必须选，不再收集意见',
    '组一个三人智囊团，明确共同目的、各自贡献与开会频率',
    '每季度重读一次自己的卡片，只改数字和计划，不改方向'
  ],

  sources: [
    { t: '中文版目录（广东人民出版社 2023，国家出版发行信息公共服务平台）', u: 'https://book.cppinfo.cn/Encyclopedias/home/Index/4531540' },
    { t: '中文精读本目录（中国科学技术出版社 2023）', u: 'https://book.cppinfo.cn/Encyclopedias/home/index?id=4612850' },
    { t: '1937 年初版目录（University of Wisconsin–Madison 馆藏记录）', u: 'https://search.library.wisc.edu/catalog/9914027683502121' },
    { t: 'Napoleon Hill Foundation 官方站', u: 'http://www.napoleonhill.com/' },
    { t: '引文核对：对照 1937 年版正文，并标注后世误传来源', u: 'https://quotations.pro/books/think-and-grow-rich' },
    { t: 'Wikiquote: Napoleon Hill（含原书页码）', u: 'https://en.wikiquote.org/wiki/Napoleon_Hill' }
  ],

  reading: {
    title: '三条阅读线索',
    note: '按目的跳读，不必从头到尾',
    items: [
      { h: '只想把目标落地', p: '读「欲望与信念」+「知识与想象」。先按六步法把欲望写成一张卡片，再把计划拆到本季度，其余章节可以后补。' },
      { h: '总是三分钟热度', p: '直接读「决断与坚持」。两个工具就够用：给决定设截止时间，给计划准备备选方案。' },
      { h: '想理解成功学本身', p: '连「潜意识与第六感」一起读，同时对照页末阅读提示，分清哪些是可操作的方法，哪些是 1937 年的时代想象。' },
      { h: '如果你不认同「思想即物质」', p: '可以只取它的行为层：明确目标、写下期限、立即行动、坚持到有反馈。这一层不需要接受任何形而上学前提，同样有效。' }
    ]
  },

  caution: [
    '本书初版于 1937 年。其中关于「思想振动」「头脑作为收发站」「性欲转化」的论述属于当时的时代想象，缺少现代科学证据，宜作为动机与行为框架阅读，而不是因果定律。',
    '广为流传的「Whatever the mind of man can conceive and believe, it can achieve」并非 1937 年原书文字，最早于 1958 年才被归于希尔；本页因此没有把它列为原书引文。',
    '书中「卡内基秘密」的会面故事，后世研究者（如卡内基传记作者 David Nasaw）未找到会面证据；相关案例宜当作寓言，而非史料。',
    '中文引文为编译译述，正式引用请核对英文原版或纸质书。'
  ]
};
