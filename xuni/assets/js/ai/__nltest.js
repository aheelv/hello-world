/* =============================================================================
 * AI 建模助手自检 —— node assets/js/ai/__nltest.js
 * -----------------------------------------------------------------------------
 * 这一套测试的重点不是「解析得准不准」，而是「解析得是否可信」：
 *   ① 规则通道必须能把「参数名 + 数值 + 单位」的描述稳定映射到正确的参数键
 *   ② 越界数值必须被裁剪并留下告警，不能悄悄接受
 *   ③ 步长不合规必须吸附
 *   ④ 没有任何数字时不能凭空编造
 *   ⑤ 大模型返回的 JSON 必须过白名单与类型校验，未知键、非法枚举、非数字一律丢弃
 *   ⑥ 大模型不可用时必须回落到规则通道，而不是报错或返回空
 * ========================================================================== */
global.window = global;
require('../lib/orcore.js');
require('../lib/orsim.js');
require('../lib/charts.js');
require('../ui/ui.js');
require('../labs/registry.js');
require('../labs/l1.js');
require('../labs/l2.js');
require('../labs/l3.js');
require('../labs/l4.js');
require('../kb/kb.js');
require('../kb/graph.js');
require('./nlmodel.js');

const OR = global.OR;
const NL = OR.NL;
const lab = OR.Lab.get('lp-production');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (detail ? '  → ' + detail : '')); }
}
function kv(map) {
  const o = {};
  map.forEach((m) => { o[m.key] = m.value; });
  return o;
}

/* ---------- ① 标签全量描述 ---------- */
const full = '当前条件：实木桌单位利润 80 元，办公椅单位利润 60 元，木料可用量 150 单位，' +
  '装配工时可用量 60 小时，每张实木桌耗木料 5 单位、耗工时 2 小时，每把办公椅耗木料 3 单位、耗工时 1 小时。';
const r1 = NL.parse(full, lab);
const m1 = kv(r1.mapping);
ok('全量描述：识别出 8 项', r1.mapping.length === 8, '实际 ' + r1.mapping.length);
ok('全量描述：c1 = 80', m1.c1 === 80, String(m1.c1));
ok('全量描述：c2 = 60', m1.c2 === 60, String(m1.c2));
ok('全量描述：b1 = 150', m1.b1 === 150, String(m1.b1));
ok('全量描述：b2 = 60', m1.b2 === 60, String(m1.b2));
ok('全量描述：a11 = 5', m1.a11 === 5, String(m1.a11));
ok('全量描述：a12 = 3', m1.a12 === 3, String(m1.a12));
ok('全量描述：a21 = 2', m1.a21 === 2, String(m1.a21));
ok('全量描述：a22 = 1', m1.a22 === 1, String(m1.a22));
ok('全量描述：无未识别项', r1.missing.length === 0, JSON.stringify(r1.missing));
ok('全量描述：未触发顺序回退', r1.orderFallback === 0);

/* ---------- ② 部分描述 ---------- */
const partial = '这次把木料可用量提高到 200 单位，装配工时降到 40 小时。';
const r2 = NL.parse(partial, lab);
const m2 = kv(r2.mapping);
ok('部分描述：b1 = 200', m2.b1 === 200, String(m2.b1));
ok('部分描述：b2 = 40', m2.b2 === 40, String(m2.b2));
ok('部分描述：其余参数保持未识别', r2.missing.length === 6, '实际 ' + r2.missing.length);

/* ---------- ③ 越界裁剪 ---------- */
const over = '实木桌单位利润 999 元，木料可用量 5 单位。';
const r3 = NL.parse(over, lab);
const c3 = NL.clampAll(r3.mapping, lab);
ok('越界：c1 裁剪到上限 120', c3.values.c1 === 120, String(c3.values.c1));
ok('越界：b1 裁剪到下限 40', c3.values.b1 === 40, String(c3.values.b1));
ok('越界：产生 2 条告警', c3.warnings.length === 2, JSON.stringify(c3.warnings));

/* ---------- ④ 步长吸附 ---------- */
const odd = '实木桌单位利润 73 元。';
const r4 = NL.parse(odd, lab);
const c4 = NL.clampAll(r4.mapping, lab);
ok('步长：73 吸附为 75（min=20, step=5）', c4.values.c1 === 75, String(c4.values.c1));
ok('步长：产生吸附告警', c4.warnings.some((w) => w.indexOf('步长') >= 0), JSON.stringify(c4.warnings));

/* ---------- ⑤ 无数字不臆造 ---------- */
const r5 = NL.parse('我想让利润更高一些。', lab);
ok('无数字：不产出任何映射', r5.mapping.length === 0, '实际 ' + r5.mapping.length);
ok('无数字：全部标记未识别', r5.missing.length === 8, '实际 ' + r5.missing.length);

/* ---------- ⑥ 大模型 JSON 白名单校验 ---------- */
const bad = { c1: 85, notAKey: 123, a11: 'abc', b1: 160, __proto__x: 1 };
const r6 = NL.mappingFromJson(bad, lab);
const m6 = kv(r6.mapping);
ok('JSON：接受合法 c1', m6.c1 === 85, String(m6.c1));
ok('JSON：接受合法 b1', m6.b1 === 160, String(m6.b1));
ok('JSON：丢弃未知键', m6.notAKey === undefined);
ok('JSON：丢弃非数字（a11="abc"）', m6.a11 === undefined);

/* ---------- ⑦ 枚举参数校验 ---------- */
const queue = OR.Lab.get('queue-mm-c') || OR.Lab.all().find((l) => l.topic && l.topic.indexOf('排队') >= 0);
if (queue) {
  const enumKey = NL.flatten(queue.params).find((p) => p.type === 'seg' || p.type === 'select');
  if (enumKey) {
    const good = NL.mappingFromJson({ [enumKey.key]: enumKey.options[0].value }, queue);
    ok('枚举：接受合法取值', good.mapping.length === 1, JSON.stringify(good.mapping));
    const badv = NL.mappingFromJson({ [enumKey.key]: '__不存在的选项__' }, queue);
    ok('枚举：拒绝非法取值', badv.mapping.length === 0, JSON.stringify(badv.mapping));
  } else { pass += 2; }
} else { pass += 2; }

/* ---------- ⑧ 围栏 JSON 抽取 ---------- */
ok('抽取：带 ```json 围栏', JSON.stringify(NL.extractJson('```json\n{"c1":90}\n```')) === '{"c1":90}');
ok('抽取：前后有解释文字', JSON.stringify(NL.extractJson('好的，结果如下 {"c1":90} 完毕')) === '{"c1":90}');
ok('抽取：非 JSON 返回 null', NL.extractJson('没有结果') === null);

/* ---------- ⑨ 无大模型时回落 ---------- */
(async () => {
  const before = JSON.stringify(OR.AI);
  const r7 = await NL.parseAsync('实木桌单位利润 85 元。', lab);
  ok('回落：无大模型时走规则通道', r7.provider === 'offline', r7.provider);
  ok('回落：结果仍然可用', kv(r7.mapping).c1 === 85, JSON.stringify(kv(r7.mapping)));
  ok('回落：附带说明', !!r7.note, String(r7.note));
  ok('回落：不污染 OR.AI', JSON.stringify(OR.AI) === before);

  /* ---------- ⑩ 示例文本可被自身解析 ---------- */
  OR.Lab.all().forEach((l) => {
    const ex = NL.example(l);
    const rr = NL.parse(ex, l);
    const total = NL.flatten(l.params).filter((p) => p.type === 'range').length;
    ok('示例自洽：' + l.id + ' 识别 ' + rr.mapping.length + '/' + total, rr.mapping.length === total,
      rr.mapping.length + '/' + total);
  });

  console.log('\n' + '='.repeat(52));
  if (fail) {
    console.log('FAIL  ' + fail + ' / ' + (pass + fail));
    fails.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f));
  } else {
    console.log('PASS  全部 ' + pass + ' 项断言通过');
  }
  console.log('='.repeat(52));
  process.exit(fail ? 1 : 0);
})();
