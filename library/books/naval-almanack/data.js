/* ============================================================
   《纳瓦尔宝典》数据
   只改本文件即可调整该书全部内容，页面骨架见 ../../assets/book.js
   ============================================================ */
window.BOOK = {
  slug: 'naval-almanack',
  title: '纳瓦尔宝典',
  titleEn: 'The Almanack of Naval Ravikant',
  shortEn: 'ALMANACK',
  heroAccent: '财富、判断力与幸福',
  author: '埃里克·乔根森 编 / 纳瓦尔·拉维坎特 述',
  intro: '一本不讲成功学、只讲底层规律的书：财富是可以被创造的资产，判断力是可以被训练的技能，幸福是可以被减出来的状态。',
  meta: '埃里克·乔根森 编 · 纳瓦尔·拉维坎特 述 · 原书两部分五章 · 本页为结构化精华整理',
  color: '#2E5C8A',
  mapHint: '结构依据中文版目录：第一部分「财富」含积累财富、增强判断力两章；第二部分「幸福」含学习幸福、自我救赎、哲学三章。',
  footNote: '<b>说明：</b>本页为学习用途的结构化整理，不是原著全文，也不替代购买与阅读正版图书。英文引文来自原书及作者公开文稿；中文为编译译述，措辞与官方译本可能存在差异，引用时请以英文原版与正式出版物为准。书中关于财富的观点属于作者个人经验，不构成任何投资建议。',

  themes: [
{
  id:'wealth', no:'01', title:'财富创造', chapter:'第一部分 · 第一章 积累财富',
  color:'#2E5C8A', side:'right',
  lead:'财富不是零和的抢椅子游戏，而是可以被创造、被放大、被复利的东西。这一章回答一个问题：怎样在不出租时间的前提下，获得一份能自己长大的资产。',
  map:['财富 ≠ 金钱 ≠ 地位','专长：无法被培训','责任：用自己的名字下注','股权：拥有而非出租','杠杆：劳动·资本·代码媒体','耐心与长期游戏'],
  points:[
    {h:'财富、金钱、地位是三件事', s:'认识财富创造的原理',
     p:'财富是睡觉时仍在为你赚钱的资产，金钱是转移时间和财富的媒介，地位是你在社会层级里的位置。追求财富，而不是金钱或地位——前者靠占有资产，后两者靠出售时间或踩低别人。'},
    {h:'社会只为它想要、却还不会得到的东西付钱', s:'认识财富创造的原理',
     p:'致富不是去抢已有的蛋糕，而是提供社会想要、但还不知道如何获得的东西，并且规模化地提供。你解决的问题越稀缺，回报越不成比例。'},
    {h:'专长无法被培训', s:'找到天赋所在，积累专长',
     p:'如果社会能培训你，它也能培训别人来替代你。专长长在好奇心、天赋与真正痴迷的交叉处：对你像玩，对别人像苦工。'},
    {h:'用真实身份逃离竞争', s:'找到天赋所在，积累专长',
     p:'竞争往往说明你在模仿别人。每个个体都不同，做自己就没有对手。逃离竞争靠的是真实性，而不是更努力。'},
    {h:'用自己的名字下注', s:'承担责任',
     p:'以个人名义承担风险，才配得上杠杆与回报。社会愿意为敢署名的人支付溢价，因为责任无法被外包。'},
    {h:'拥有股权，而不是出租时间', s:'创立企业或买入股权',
     p:'靠出租时间无法致富。要拥有企业的一部分——股权、期权、产品——让收入与产出挂钩，而不是与工时挂钩。'},
    {h:'三种杠杆，优先级很清楚', s:'找到杠杆',
     p:'劳动力是最古老也最难的杠杆，需要有人愿意跟随你；资本更现代，但需要别人把钱交给你；代码与媒体是无需许可的杠杆，复制成本为零，能在你睡觉时继续工作。'},
    {h:'判断力比努力更值钱', s:'用判断力赚钱',
     p:'在杠杆时代，方向的重要性远高于速度。一个有杠杆的人产出可以是无杠杆者的一千倍，此时判断力远比工时昂贵。'},
    {h:'找到像玩耍的工作', s:'找到如玩耍般的工作',
     p:'最适合你的事，是别人觉得苦、你却觉得像玩的那件。只有把它当玩，才撑得到复利发生的那一天。'},
    {h:'分清主次，只做少数几件事', s:'分清主次，聚焦重点',
     p:'给自己定一个高时薪，然后毫不留情地花钱买回低于这个价格的时间。忙碌不是美德，把时间花在少数高价值的事上才是。'},
    {h:'运气有四种，后两种可以修', s:'如何获得运气',
     p:'盲目的运气、因不断行动撞上的运气、因专精被人认出的运气、因独特人格与声誉主动找上门的运气。前两种靠概率，后两种靠积累。'},
    {h:'耐心是复利的分母', s:'保持耐心',
     p:'财富、关系、知识、声誉都遵循同一套复利逻辑。与长期的人玩长期的游戏，所有真正的回报都在时间这一侧。'}
  ]
},
{
  id:'judgment', no:'02', title:'增强判断力', chapter:'第一部分 · 第二章 增强判断力',
  color:'#4A90D9', side:'right',
  lead:'当产出不再与工时成正比，决定成败的就不是勤奋，而是判断。判断力不是天赋，它由清晰思考、去身份化、决策纪律和基础模型四件事共同构成。',
  map:['判断力 > 努力','基本原理出发','放下身份看现实','可逆快做·不可逆慢做','心智模型库','阅读是元技能'],
  points:[
    {h:'判断力是被验证过的决策能力', s:'判断力',
     p:'判断力不是聪明，而是在信息不全、时间有限时做出正确取舍，并且有结果替你作证。它来自经验，但只有被复盘过的经验才会变成判断力。'},
    {h:'从基本原理出发思考', s:'如何清晰地思考',
     p:'不要从「别人都这么做」出发，从不可再简化的事实出发。数学和逻辑是最不容易骗人的语言，先学会算，再学会说。'},
    {h:'放下身份，才能看见现实', s:'摆脱自我束缚，认清世界真相',
     p:'身份是过去的你写给现在的你的剧本。放下「我就是这种人」的执念，才可能按现实而不是按人设做决定。'},
    {h:'难决定，就是不做', s:'学习决策技巧',
     p:'如果两个选项让你反复权衡，通常说明它不够好。可逆的决定快做，不可逆的决定慢做；重大的决定，宁可用一年想清楚，再用一天执行。'},
    {h:'收集心智模型，而不是收集观点', s:'发现好的心智模型',
     p:'来自进化论、博弈论、微观经济学、心理学与数学的基础模型，比新闻耐用得多。少读商业杂志——世上并没有「商业」这门技能，只有底层规律。'},
    {h:'阅读是终极元技能', s:'学会热爱阅读',
     p:'会读书，就能学会任何东西。读你爱读的，直到你爱上阅读；读原著、慢慢读，读科学和哲学，而不是读别人的读后感。'}
  ]
},
{
  id:'happiness', no:'03', title:'学习幸福', chapter:'第二部分 · 第三章 学习幸福',
  color:'#E67E22', side:'left',
  lead:'如果说财富解决的是「不被强迫」的自由，幸福解决的是「不被驱动」的自由。纳瓦尔的答案近乎反直觉：幸福不是得到更多，而是欲望安静下来。',
  map:['幸福是技能','幸福是选择','欲望=选择的不开心','临在：只有此刻','平静即幸福','习惯与接受'],
  points:[
    {h:'幸福是一种技能', s:'幸福是一种技能',
     p:'幸福不是天生性格，也不是运气，而是像健身一样可以训练的能力。纳瓦尔自述把它从 2 分练到了 9 分，方法不是得到更多，而是去掉多余。'},
    {h:'幸福是一种选择', s:'幸福是一种选择',
     p:'幸福、爱与热情不是「找到」的，而是「选择」并持续维护的。容易的选择带来艰难的人生，艰难的选择带来容易的人生。'},
    {h:'幸福是「缺了什么」的感觉消失', s:'幸福是一种技能',
     p:'幸福不是加法，是减法。当心里那个「还差一点」的声音安静下来，剩下的就是幸福。内在的寂静，就是满足。'},
    {h:'幸福需要活在当下', s:'幸福需要活在当下',
     p:'大部分痛苦来自把过去和现在比较，或把当下抵押给未来。唯一真实存在的时刻是此刻，其余都是记忆与想象。'},
    {h:'幸福需要心境平和', s:'幸福需要心境平和',
     p:'纳瓦尔把幸福定义为平静，而不是兴奋。焦虑只是一连串奔涌的念头；看见它，然后选择平静，而不是选择那个念头。'},
    {h:'欲望是主动选择的不开心', s:'欲望是主动选择的不开心',
     p:'欲望是你与自己签的一纸合约：在得到它之前，不允许自己快乐。所以一次只保留一个最大的欲望，其余明确标记为暂缓。'},
    {h:'成功不兑换幸福', s:'成功不一定带来幸福',
     p:'幸福来自对已有的满足，成功来自对现状的不满，两者驱动力相反。真正的赢家是退出游戏的人，而不是玩得更好的人。'},
    {h:'嫉妒是幸福的敌人', s:'嫉妒是幸福的敌人',
     p:'你不能只取别人人生的一部分。若不愿意与对方完整交换人生，嫉妒就没有意义。生活是单人游戏，所有真实的计分板都在内部。'},
    {h:'幸福源于好习惯', s:'幸福源于好习惯',
     p:'把无意识的坏习惯换成好习惯：睡眠、运动、日照、少糖少酒、少刷屏。工作时与更强的人在一起，娱乐时与更快乐的人在一起。'},
    {h:'于接受中寻找幸福', s:'于接受中寻找幸福',
     p:'接受不是认命，而是停止与现实争辩。对无法控制的事保持「理性的漠然」，平静才有可能到来。'}
  ]
},
{
  id:'self', no:'04', title:'自我救赎', chapter:'第二部分 · 第四章 自我救赎',
  color:'#27AE60', side:'left',
  lead:'这一章是全书的「基础设施」：身体、冥想、阅读。它们不直接带来财富或快乐，但决定了你能承载多少财富、能维持多久的平静。',
  map:['选择做自己','身体是第一资产','冥想：观察念头','系统替代意志力','终身学习','三重解放'],
  points:[
    {h:'选择做自己', s:'选择做自己',
     p:'你是唯一无法被复制的资产。做自己不是任性，而是停止扮演别人期待的角色。'},
    {h:'把身体当作第一资产', s:'选择关爱自己',
     p:'健康问题会吞掉其他一切幸福。每天锻炼应当是不可协商的第一优先级，而不是有空才做的事。'},
    {h:'冥想是观察，不是清空', s:'冥想 + 精神力量',
     p:'冥想不是让大脑空白，而是学会看着念头来去而不被带走。无选择的觉知：坐着，什么都不做，让念头自己流过。'},
    {h:'用系统替代意志力', s:'选择自我塑造',
     p:'习惯塑造人。用短期的自律换长期的自由：先建一套能自动运行的系统，再谈目标。'},
    {h:'把学习变成终身习惯', s:'选择自我成长',
     p:'真正稀缺的不是知识，而是「学会任何东西」的能力。读基础学科，练写作，把理解讲给别人听。'},
    {h:'从三种束缚中解放', s:'选择解放自己',
     p:'他人的期待、过去的身份、对外的欲望，是三副最沉的枷锁。自由不是想做什么就做什么，而是不再被什么牵着走。'}
  ]
},
{
  id:'philosophy', no:'05', title:'哲学', chapter:'第二部分 · 第五章 哲学',
  color:'#7F77DD', side:'right',
  lead:'最后一章没有方法论，只有立场：意义由自己定义，价值观由自己校准，而所有修行最终都落在同一个地方——此刻。',
  map:['意义由自己定义','按价值观生活','理性佛教','此刻即全部'],
  points:[
    {h:'生命的意义是个人问题', s:'生命的意义',
     p:'宇宙没有给你标准答案。意义是你自己赋予的，也可以随时重写——这不是虚无，而是把定义权拿回来。'},
    {h:'按自己的价值观生活', s:'按照自己的价值观生活',
     p:'价值观不是口号，而是无人看见时你的取舍标准。先把它写下来，再用它校准每一个决定。'},
    {h:'理性佛教', s:'理性佛教',
     p:'保留可被经验验证的部分——觉察、无常、减少欲望；放下无法验证的教条。理性与修行并不冲突。'},
    {h:'我们唯一拥有的是当下', s:'我们唯一拥有的是当下',
     p:'过去只存在于记忆，未来只存在于想象。生命的全部内容，都发生在此刻这一秒。'}
  ]
}
],

  quotes: [
  {t:'wealth', zh:'追求财富，而不是金钱或地位。', en:'Seek wealth, not money or status.', src:'第一章 · 认识财富创造的原理'},
  {t:'wealth', zh:'财富是那些在你睡觉时仍在为你赚钱的资产。', en:'Wealth is assets that earn while you sleep.', src:'第一章 · 认识财富创造的原理'},
  {t:'wealth', zh:'靠出租时间，你永远无法致富。', en:"You're not going to get rich renting out your time.", src:'第一章 · 创立企业或买入股权'},
  {t:'wealth', zh:'专长是你无法被培训出来的知识。', en:'Specific knowledge is knowledge you cannot be trained for.', src:'第一章 · 找到天赋所在，积累专长'},
  {t:'wealth', zh:'财富需要杠杆。商业杠杆来自资本、人力，以及复制成本为零的产品。', en:'Fortunes require leverage. Business leverage comes from capital, people, and products with no marginal cost of replication.', src:'第一章 · 找到杠杆'},
  {t:'wealth', zh:'代码与媒体是无需许可的杠杆。', en:'Code and media are permissionless leverage.', src:'第一章 · 找到杠杆'},
  {t:'wealth', zh:'与长期的人，玩长期的游戏。', en:'Play long-term games with long-term people.', src:'第一章 · 投资交友，着眼长远'},
  {t:'wealth', zh:'用真实身份逃离竞争。', en:'Escape competition through authenticity.', src:'第一章 · 找到天赋所在，积累专长'},
  {t:'wealth', zh:'致富最重要的技能，是成为一个终身学习者。', en:'The most important skill for getting rich is becoming a perpetual learner.', src:'第一章 · 找到天赋所在，积累专长'},
  {t:'wealth', zh:'学会销售，学会构建。两者兼具，你将不可阻挡。', en:'Learn to sell, learn to build. If you can do both, you will be unstoppable.', src:'第一章 · 找到杠杆'},
  {t:'wealth', zh:'给自己的时间定一个时薪，然后毫不留情地花钱买回低于这个价格的时间。', en:'Value your time at an hourly rate, and ruthlessly spend to save time at that rate.', src:'第一章 · 分清主次，聚焦重点'},
  {t:'wealth', zh:'人生中所有真正的收益，都来自复利。', en:'All the benefits in life come from compound interest.', src:'第一章 · 投资交友，着眼长远'},
  {t:'wealth', zh:'没有快速致富的方案，那只是别人在靠你致富。', en:'There are no get-rich-quick schemes. Those are just someone else getting rich off you.', src:'第一章 · 保持耐心'},
  {t:'wealth', zh:'对行动没有耐心，对结果保持耐心。', en:'Impatience with actions, patience with results.', src:'第一章 · 保持耐心'},
  {t:'wealth', zh:'你会通过提供社会想要、却还不知道如何获得的东西而致富。', en:'You will get rich by giving society what it wants but does not yet know how to get.', src:'第一章 · 认识财富创造的原理'},
  {t:'wealth', zh:'退休，是你不再用今天去换一个想象中的明天。', en:'Retirement is when you stop sacrificing today for an imaginary tomorrow.', src:'第一章 · 找到如玩耍般的工作'},

  {t:'judgment', zh:'你前进的方向，比你的速度重要得多。', en:'The direction you’re heading in matters more than how fast you move.', src:'第二章 · 用判断力赚钱'},
  {t:'judgment', zh:'如果你无法决定，答案就是不。', en:"If you can't decide, the answer is no.", src:'第二章 · 学习决策技巧'},
  {t:'judgment', zh:'读你爱读的，直到你爱上阅读。', en:'Read what you love until you love to read.', src:'第二章 · 学会热爱阅读'},
  {t:'judgment', zh:'放下身份，才能看见现实。', en:'Shed your identity to see reality.', src:'第二章 · 摆脱自我束缚'},
  {t:'judgment', zh:'世上并没有「商业」这门技能。避开商业杂志与商业课程。', en:'There is no skill called “business.” Avoid business magazines and business classes.', src:'第二章 · 发现好的心智模型'},
  {t:'judgment', zh:'最强大的超能力，是改变自己想法的能力。', en:'The greatest superpower is the ability to change your mind.', src:'作者公开推文（非原书章节）'},

  {t:'happiness', zh:'幸福是你做出的选择，也是你培养的技能。', en:'Happiness is a choice you make and a skill you develop.', src:'第三章 · 幸福是一种选择'},
  {t:'happiness', zh:'幸福是当「缺了点什么」的感觉消失后，剩下的东西。', en:"Happiness is what's there when you remove the sense that something is missing in your life.", src:'第三章 · 幸福是一种技能'},
  {t:'happiness', zh:'欲望是你与自己签的合约：在得到之前，不允许自己开心。', en:'Desire is a contract you make with yourself to be unhappy until you get what you want.', src:'第三章 · 欲望是主动选择的不开心'},
  {t:'happiness', zh:'平静是静止的幸福，幸福是流动的平静。', en:'Peace is happiness at rest, and happiness is peace in motion.', src:'第三章 · 幸福需要心境平和'},
  {t:'happiness', zh:'平静的心、健康的身体、充满爱的家。这些东西买不到，只能挣得。', en:'A calm mind, a fit body, a house full of love. These things cannot be bought. They must be earned.', src:'第三章 · 幸福源于好习惯'},
  {t:'happiness', zh:'成功并不兑换幸福。', en:'Success does not earn happiness.', src:'第三章 · 成功不一定带来幸福'},
  {t:'happiness', zh:'嫉妒是幸福的敌人。', en:'Envy is the enemy of happiness.', src:'第三章 · 嫉妒是幸福的敌人'},
  {t:'happiness', zh:'容易的选择，艰难的人生；艰难的选择，容易的人生。', en:'Easy choices, hard life. Hard choices, easy life.', src:'第三章 · 幸福是一种选择'},
  {t:'happiness', zh:'人生是单人游戏。', en:'Life is a single-player game.', src:'第三章 · 嫉妒是幸福的敌人'},
  {t:'happiness', zh:'理性的人，可以对不可控之事保持漠然，从而获得平静。', en:'A rational person can find peace by cultivating indifference to things outside of their control.', src:'第三章 · 于接受中寻找幸福'},
  {t:'happiness', zh:'你几乎可以得到任何想要的东西，前提是只要一样，且你比什么都想要它。', en:"You can get almost anything you want out of life, as long as it's one thing and you want it far more than anything else.", src:'第三章 · 欲望是主动选择的不开心'},

  {t:'self', zh:'人生三件大事是财富、健康与幸福。我们按这个顺序追求，但重要性恰好相反。', en:'The three big ones in life are wealth, health, and happiness. We pursue them in that order, but their importance is reverse.', src:'第四章 · 选择关爱自己'},
  {t:'self', zh:'你终将死去，这一切都不再重要。所以，去享受生活，做点有意义的事，笑一笑。', en:"You're going to die one day, and none of this is going to matter. So enjoy yourself. Do something positive. Laugh a little bit.", src:'第四章 · 选择解放自己'},

  {t:'philosophy', zh:'我们唯一拥有的是当下。', en:'The present is all we have.', src:'第五章 · 我们唯一拥有的是当下'},
  {t:'philosophy', zh:'按自己的价值观生活，而不是按别人的期待。', en:'Live by your values, not by others’ expectations.', src:'第五章 · 按照自己的价值观生活'}
],

  checklist: [
  '写下你的「专长一句话」：别人很难培训出来、你却像玩一样在做的事',
  '给当前收入标注性质：出租时间 / 持有股权 / 睡后资产，看清三者比例',
  '为未来六个月选定一种无需许可的杠杆：写作、代码、视频、播客中的一种',
  '找出本周三件低于你时薪的事，删除或外包',
  '做一次十年测试：这件事十年后还愿意做吗？不愿意就不再为它花一天',
  '把最近一个重大决定写成判断清单：可逆性、下行风险、复利效应',
  '只保留一个最大的欲望，其余明确标记为暂缓',
  '每天三十分钟无输入独处或冥想，观察念头而不跟随',
  '先修身体：睡眠、运动、日照三项基础习惯连续执行两周',
  '每周记一条嫉妒触发点，问自己是否愿意交换对方的全部人生',
  '每季度复盘一次：现象 → 漏了哪条原则 → 回补动作',
  '读一本原著（科学、数学或哲学），慢读并写下你的反驳意见'
],

  sources: [
  {t:'The Almanack of Naval Ravikant 官方目录', u:'https://navalmanack.com/almanack-of-naval-ravikant/table-of-contents'},
  {t:'官方全文 PDF（Eric Jorgenson 编）', u:'http://navalmanack.s3.amazonaws.com/Eric-Jorgenson_The-Almanack-of-Naval-Ravikant_Final.pdf'},
  {t:'nav.al 原始播客文稿：Product and Media are New Leverage', u:'https://nav.al/product-media'},
  {t:'中文版目录（国家出版发行信息公共服务平台）', u:'https://book.cppinfo.cn/Encyclopedias/home/index?id=4382045'},
  {t:'中文版书目信息（海宁市图书馆）', u:'https://m.hnlib.com/Recommend/Detail/1828'}
],

  reading: {
    title: '三条阅读线索',
    note: '建议按线索跳读，而不是从头读到尾',
    items: [
      { h: '如果你缺钱、缺方向', p: '先读「财富创造」与「增强判断力」。核心只有一句：用专长、责任与杠杆，换取一份不需要你到场也能增长的资产。' },
      { h: '如果你累、焦虑、停不下来', p: '直接读「学习幸福」。纳瓦尔的处方是减法：减少欲望、降低身份感、把平静设为默认值，而不是再加一个目标。' },
      { h: '如果你想长期变强', p: '读「自我救赎」与「哲学」。身体、冥想、阅读是三项基础设施，它们决定你能走多远，而不是走多快。' },
      { h: '如果你要立刻做决定', p: '用第 16 条金句：「如果你无法决定，答案就是不。」可逆的事快做，不可逆的事慢做。' }
    ]
  },

  caution: [
    '书中关于财富与幸福的论断是作者的个人经验与观察，不构成投资建议；财富路径中存在运气与幸存者偏差，不宜把结果直接当作方法。',
    '中文引文为编译译述，与官方译本措辞可能不同；正式引用请核对英文原版或纸质书。'
  ]
};
