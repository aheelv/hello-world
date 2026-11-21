/* 超星 ↔ 统一课程图谱数据转换接口（浏览器端，无后端、无网络）
 * ------------------------------------------------------------------
 * 公开 API（详见 docs/03_数据转换接口说明.md）：
 *   KGConverter.detectFormat(rows)                  识别 16 列 / 15 列
 *   KGConverter.readWorkbook(arrayBuffer)          解析 xlsx/csv → {format, headerRow, rows}
 *   KGConverter.parseRows(rows, format)             表格行 → {nodes, edges, warnings}
 *   KGConverter.toUnified(parsed, meta)              → 统一数据对象
 *   KGConverter.toChaoxing16(unified)               → {sheet, note, header, rows, lostFields}
 *   KGConverter.toChaoxing15(unified)               → {sheet, note, header, rows, lostFields}
 *   KGConverter.exportWorkbook(unified, format)     导出可直接导入超星的 .xlsx
 *   KGConverter.validate(unified)                   → {checks, warnings, passed}
 *   KGConverter.loadUnified(jsonText)               JSON 文本 → 统一数据对象
 *
 * 兼容边界：文件级导入导出，不调用超星在线接口；有损字段一律记入 warnings / lostFields。
 */
(function (global) {
  'use strict';

  var T = global.CHAOXING_TEMPLATES || {};
  var H16 = (T.chaoxing16 && T.chaoxing16.header) || ['一级知识节点','二级知识节点','三级知识节点','四级知识节点','五级知识节点','六级知识节点','七级知识节点','前置知识节点','后置知识节点','关联知识节点','节点类型','节点描述','难易程度','重难点','专业素养','应用能力'];
  var H15 = (T.chaoxing15 && T.chaoxing15.header) || ['节点类型*','一级节点名称*','二级节点名称*','三级节点名称*','四级节点名称*','五级节点名称*','六级节点名称*','七级节点名称*','前置节点','后置节点','关联节点','标签（尽量填写，没有适合的标签可以不填写）','知识点分类','节点说明'];
  var NOTE16 = (T.chaoxing16 && T.chaoxing16.note) || '使用说明（请不要删除此行，也不要删除模板中的任何列）：';
  var NOTE15 = (T.chaoxing15 && T.chaoxing15.note) || '1. 后面带“*”的为必填项';
  var DIFFS = ['容易', '偏易', '适中', '偏难', '难'];
  var C = {};

  function cell(v) { return v == null ? '' : String(v).trim(); }
  function splitRel(v) {
    // 只按英文/中文分号切分；节点名本身可含顿号
    return cell(v).replace(/；/g, ';').split(';').map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function splitTags(v) {
    return cell(v).replace(/；/g, ';').replace(/、/g, ';').split(';').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* ---------- 格式识别与表头定位 ----------
   * 注意：模板第 1 行「使用说明」里也含「节点类型」「知识节点」等字样，
   * 因此必须用「层级列 + 关系列」的组合标记来定位真正的表头行，不能只匹配单个词。 */
  C.findHeaderRow = function (rows) {
    for (var i = 0; i < Math.min(8, (rows || []).length); i++) {
      var line = rows[i].map(cell).join('|');
      if (line.indexOf('一级知识节点') >= 0 && line.indexOf('前置知识节点') >= 0) return { index: i, format: 'chaoxing16' };
      if (line.indexOf('一级节点名称') >= 0 && line.indexOf('前置节点') >= 0) return { index: i, format: 'chaoxing15' };
    }
    return { index: -1, format: 'unknown' };
  };

  C.detectFormat = function (rows) {
    var found = C.findHeaderRow(rows);
    if (found.format !== 'unknown') return found.format;
    var head = (rows || []).slice(0, 5).map(function (r) { return r.map(cell).join('|'); }).join('\n');
    if (head.indexOf('专业素养') >= 0 || head.indexOf('难易程度') >= 0) return 'chaoxing16';
    if (head.indexOf('标签（尽量填写') >= 0 || head.indexOf('知识点分类') >= 0) return 'chaoxing15';
    return 'unknown';
  };

  C.readWorkbook = function (arrayBuffer) {
    if (!global.XLSX) throw new Error('未加载 SheetJS（assets/vendor/xlsx.full.min.js）');
    var wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: false });
    var name = wb.SheetNames.indexOf('Sheet3') >= 0 ? 'Sheet3' : wb.SheetNames[0];
    var rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false });
    var found = C.findHeaderRow(rows);
    var format = found.format !== 'unknown' ? found.format : C.detectFormat(rows);
    var hi = found.index >= 0 ? found.index : (rows.length > 1 ? 1 : 0);
    var body = rows.slice(hi + 1).filter(function (r) { return r.some(function (v) { return cell(v); }); });
    return { format: format, headerRow: hi, sheet: name, header: rows[hi].map(cell), rows: body, sheetNames: wb.SheetNames };
  };

  /* ---------- 表格 → 内部节点/边 ---------- */
  C.parseRows = function (rows, format) {
    if (format !== 'chaoxing16' && format !== 'chaoxing15') throw new Error('未知格式：' + format);
    var is16 = format === 'chaoxing16';
    var off = is16 ? 0 : 1;                    // 层级列起始下标
    var nodes = [], warnings = [], stack = {}, byName = {}, nameSeen = {};

    rows.forEach(function (r, ri) {
      var level = 0, name = '';
      for (var k = 0; k < 7; k++) {
        var v = cell(r[off + k]);
        if (v) { if (!level) { level = k + 1; name = v; } else { warnings.push('第 ' + (ri + 3) + ' 行填写了多个层级列，仅取第一个'); break; } }
      }
      if (!level) { warnings.push('第 ' + (ri + 3) + ' 行无节点名，已跳过'); return; }
      if (name.length > 256) warnings.push('第 ' + (ri + 3) + ' 行节点名超过 256 字符：' + name.slice(0, 20) + '…');
      if (nameSeen[name]) warnings.push('重名节点「' + name + '」（第 ' + nameSeen[name] + ' 行与第 ' + (ri + 3) + ' 行）');
      nameSeen[name] = ri + 3;

      var type, sourceType, desc, difficulty, keypoint, literacy, application, tags, category;
      var pre, post, related, rawPre, rawPost, rawRelated;
      if (is16) {
        type = cell(r[10]); sourceType = type === '知识单元' ? '分类' : '知识点';
        if (type === '分类') { warnings.push('第 ' + (ri + 3) + ' 行节点类型「分类」为旧版取值，已转换为「知识单元」'); type = '知识单元'; }
        else if (['知识单元', '知识点'].indexOf(type) < 0) { warnings.push('第 ' + (ri + 3) + ' 行节点类型「' + type + '」非法，按知识点处理'); type = '知识点'; }
        desc = cell(r[11]); difficulty = cell(r[12]); keypoint = cell(r[13]);
        literacy = cell(r[14]); application = cell(r[15]); tags = []; category = '';
        rawPre = cell(r[7]); rawPost = cell(r[8]); rawRelated = cell(r[9]);
        if (difficulty && DIFFS.indexOf(difficulty) < 0) warnings.push('第 ' + (ri + 3) + ' 行难易程度「' + difficulty + '」不在 5 个枚举值内');
        if (type === '知识单元' && [difficulty, keypoint, literacy, application].some(Boolean)) warnings.push('第 ' + (ri + 3) + ' 行知识单元填写了 M–P 属性，按模板应留空');
      } else {
        sourceType = cell(r[0]); type = sourceType === '分类' ? '知识单元' : '知识点';
        if (['分类', '知识点'].indexOf(sourceType) < 0) warnings.push('第 ' + (ri + 3) + ' 行节点类型「' + sourceType + '」非法，按知识点处理');
        desc = cell(r[13]); difficulty = ''; keypoint = ''; literacy = ''; application = '';
        tags = splitTags(r[11]); category = cell(r[12]);
        rawPre = cell(r[8]); rawPost = cell(r[9]); rawRelated = cell(r[10]);
        if (tags.indexOf('重点') >= 0 || tags.indexOf('难点') >= 0) keypoint = tags.filter(function (t) { return t === '重点' || t === '难点'; }).join(';');
      }
      pre = splitRel(rawPre); post = splitRel(rawPost); related = splitRel(rawRelated);
      var nid = 'X' + String(ri + 1).padStart(3, '0');
      var n = {
        id: nid, name: name, level: level, type: type, sourceType: sourceType,
        parentId: stack[level - 1] || null, path: [], chapter: '',
        description: desc, difficulty: difficulty, keypoint: keypoint,
        literacy: literacy, application: application, tags: tags, category: category,
        sourceDescription: desc, pre: pre, post: post, related: related,
        rawPre: rawPre, rawPost: rawPost, rawRelated: rawRelated,
        sourceRow: ri + 3, degree: 0
      };
      nodes.push(n); byName[name] = n;
      stack[level] = nid;
      Object.keys(stack).forEach(function (k) { if (+k > level) delete stack[k]; });
    });

    // 路径、章节、知识点子级检查
    nodes.forEach(function (n) {
      var chain = [], cur = n;
      var guard = 0;
      while (cur && guard++ < 10) {
        chain.push(cur.name);
        cur = nodes.find(function (x) { return x.id === cur.parentId; });
      }
      n.path = chain.reverse(); n.chapter = n.path[0];
    });
    nodes.forEach(function (n) {
      if (n.type === '知识点' && nodes.some(function (x) { return x.parentId === n.id; }))
        warnings.push('知识点「' + n.name + '」下存在子级，违反模板第 8 条');
    });

    // 关系：任意两节点只保留一种关系（模板规则：新导入覆盖旧关系）
    var pairState = {}, edges = [], unresolved = [];
    nodes.forEach(function (n) {
      [['前置', 'pre'], ['后置', 'post'], ['关联', 'related']].forEach(function (pair) {
        var rel = pair[0];
        n[pair[1]].forEach(function (other) {
          if (!byName[other]) { unresolved.push({ node: n.name, relation: rel, target: other }); return; }
          var t = byName[other];
          if (t.id === n.id) { warnings.push('节点「' + n.name + '」的' + rel + '指向自身，已忽略'); return; }
          var key = [n.id, t.id].sort().join('|');
          var e = {
            id: 'XE' + String(edges.length + 1).padStart(4, '0'),
            source: rel === '前置' ? t.id : n.id,
            target: rel === '前置' ? n.id : t.id,
            relation: rel, undirected: rel === '关联', owner: n.id, declaredAs: rel
          };
          if (pairState[key] !== undefined) {
            edges[pairState[key]] = e;             // 新关系覆盖旧关系
            warnings.push('节点对「' + n.name + ' ↔ ' + other + '」关系重复，按模板规则保留最后一条（' + rel + '）');
          } else { pairState[key] = edges.length; edges.push(e); }
        });
      });
    });
    edges.forEach(function (e) {
      nodes.find(function (x) { return x.id === e.source; }).degree++;
      nodes.find(function (x) { return x.id === e.target; }).degree++;
    });
    if (nodes.length > 5000) warnings.push('节点数超过模板上限 5000');
    if (edges.length > 2000) warnings.push('关系数超过模板上限 2000');
    var tagCount = {}; nodes.forEach(function (n) { n.tags.forEach(function (t) { tagCount[t] = 1; }); });
    if (Object.keys(tagCount).length > 1000) warnings.push('标签数超过模板上限 1000');

    return {
      format: format, nodes: nodes, edges: edges, unresolvedReferences: unresolved, warnings: warnings,
      stats: { nodes: nodes.length, edges: edges.length, units: nodes.filter(function (n) { return n.type === '知识单元'; }).length,
               points: nodes.filter(function (n) { return n.type === '知识点'; }).length }
    };
  };

  /* ---------- 内部 → 统一数据对象 ---------- */
  C.toUnified = function (parsed, meta) {
    meta = meta || {};
    var chapters = parsed.nodes.filter(function (n) { return n.level === 1; }).map(function (n) {
      return { id: n.id, name: n.name, nodeId: n.id };
    });
    chapters.forEach(function (c) {
      var ids = parsed.nodes.filter(function (n) { return n.chapter === c.name; });
      c.nodeCount = ids.length;
      c.knowledgePointCount = ids.filter(function (n) { return n.type === '知识点'; }).length;
      c.unitCount = ids.filter(function (n) { return n.type === '知识单元'; }).length;
    });
    var rel = {}, diff = {}, typ = {}, lv = {};
    parsed.edges.forEach(function (e) { rel[e.relation] = (rel[e.relation] || 0) + 1; });
    parsed.nodes.forEach(function (n) {
      typ[n.type] = (typ[n.type] || 0) + 1; lv['L' + n.level] = (lv['L' + n.level] || 0) + 1;
      if (n.type === '知识点') diff[n.difficulty || '未标注'] = (diff[n.difficulty || '未标注'] || 0) + 1;
    });
    var now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return {
      meta: {
        course: meta.course || '运筹学', title: meta.title || '由超星文件导入的课程知识图谱',
        version: '1.0.0', generatedAt: now, nodeCount: parsed.nodes.length, edgeCount: parsed.edges.length,
        chapterCount: chapters.length,
        primarySource: meta.primarySource || ('导入文件（' + parsed.format + '）'),
        chaoxingBaseline: '文件级导入导出；16 列无损、15 列有损',
        licenseNote: '课程教学内容数据；源文件版权归原提供方',
        singleSourceOfTruth: '当前导入结果（可下载为 course-kg.json 覆盖 data/ 下同名文件）'
      },
      schema: { node: ['id','name','level','type','parentId','path','chapter','description','difficulty','keypoint','literacy','application','tags','category','pre','post','related','degree','sourceRow'],
                edge: ['id','source','target','relation','undirected'], chapter: ['id','name','nodeCount','knowledgePointCount','unitCount'] },
      statistics: { byType: typ, byLevel: lv, byDifficulty: diff, byRelation: rel, unresolvedReferences: parsed.unresolvedReferences.length },
      headers: { chaoxing15: H15, chaoxing16: H16 },
      chapters: chapters, nodes: parsed.nodes, edges: parsed.edges,
      unresolvedReferences: parsed.unresolvedReferences, importWarnings: parsed.warnings
    };
  };

  /* ---------- 统一数据 → 超星表格 ---------- */
  function relationArrays(unified) {
    var map = {};
    unified.nodes.forEach(function (n) { map[n.id] = { pre: [], post: [], related: [] }; });
    (unified.edges || []).forEach(function (e) {
      var owner = e.owner || e.source;
      var declared = e.declaredAs || e.relation;
      var otherId = e.source === owner ? e.target : e.source;
      var other = unified.nodes.find(function (n) { return n.id === otherId; });
      var own = unified.nodes.find(function (n) { return n.id === owner; });
      if (!other || !own || !map[owner]) return;
      var key = declared === '前置' ? 'pre' : (declared === '后置' ? 'post' : 'related');
      if (map[owner][key].indexOf(other.name) < 0) map[owner][key].push(other.name);
    });
    return map;
  }

  C.toChaoxing16 = function (unified) {
    var rels = relationArrays(unified);
    var rows = unified.nodes.map(function (n) {
      var lv = ['', '', '', '', '', '', '']; lv[n.level - 1] = n.name;
      var r = rels[n.id] || { pre: [], post: [], related: [] };
      return lv.concat([r.pre.join(';'), r.post.join(';'), r.related.join(';'),
        n.type, n.description || '', n.difficulty || '', n.keypoint || '', n.literacy || '', n.application || '']);
    });
    return { sheet: 'Sheet3', note: NOTE16, header: H16, rows: rows,
      lostFields: ['tags（标签体系）', 'category（知识点分类）', 'sourceType（旧版类型）', 'sourceRow（溯源行号）'] };
  };

  C.toChaoxing15 = function (unified) {
    var rels = relationArrays(unified);
    var rows = unified.nodes.map(function (n) {
      var lv = ['', '', '', '', '', '', '']; lv[n.level - 1] = n.name;
      var r = rels[n.id] || { pre: [], post: [], related: [] };
      return [n.type === '知识单元' ? '分类' : '知识点'].concat(lv,
        [r.pre.join(';'), r.post.join(';'), r.related.join(';'),
         (n.tags && n.tags.length ? n.tags.join(';') : (n.keypoint || '')),
         n.category || '', n.description || '']);
    });
    return { sheet: 'Sheet3', note: NOTE15, header: H15, rows: rows,
      lostFields: ['difficulty（难易程度）', 'literacy（专业素养）', 'application（应用能力）',
                   'keypoint 中非重点/难点的取值', '部分标签（新版无标签列，仅保留已有 tags）'] };
  };

  C.exportWorkbook = function (unified, format, filename) {
    if (!global.XLSX) throw new Error('未加载 SheetJS');
    var out = format === 'chaoxing15' ? C.toChaoxing15(unified) : C.toChaoxing16(unified);
    var aoa = [[out.note]].concat([out.header], out.rows);
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
    ws['!cols'] = out.header.map(function (h, i) { return { wch: i < 7 ? 26 : (i === 11 ? 42 : 18) }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, out.sheet);
    XLSX.writeFile(wb, filename || ('超星导入_' + (format === 'chaoxing15' ? '15列' : '16列') + '.xlsx'));
    return out;
  };

  /* ---------- 校验 ---------- */
  C.validate = function (d) {
    var checks = [], warnings = [];
    function add(name, ok, detail) { checks.push({ name: name, passed: !!ok, detail: detail || '' }); }
    add('节点数量 ≤ 5000', d.nodes.length <= 5000, d.nodes.length + ' 个');
    add('关系数量 ≤ 2000', d.edges.length <= 2000, d.edges.length + ' 条');
    add('节点名唯一', new Set(d.nodes.map(function (n) { return n.name; })).size === d.nodes.length);
    add('节点名 ≤ 256 字符', d.nodes.every(function (n) { return n.name.length <= 256; }));
    add('层级 1—7 级', d.nodes.every(function (n) { return n.level >= 1 && n.level <= 7; }));
    var byId = {}; d.nodes.forEach(function (n) { byId[n.id] = n; });
    add('父节点均可追溯', d.nodes.every(function (n) { return !n.parentId || byId[n.parentId]; }));
    add('知识点无子级', d.nodes.filter(function (n) { return n.type === '知识点'; })
      .every(function (n) { return !d.nodes.some(function (x) { return x.parentId === n.id; }); }));
    add('关系两端节点存在', d.edges.every(function (e) { return byId[e.source] && byId[e.target]; }));
    var pairs = {}; var dup = 0;
    d.edges.forEach(function (e) { var k = [e.source, e.target].sort().join('|'); if (pairs[k]) dup++; pairs[k] = 1; });
    add('任意两节点仅一种关系', dup === 0, dup + ' 处重复');
    add('难易程度取值合法', d.nodes.filter(function (n) { return n.type === '知识点' && n.difficulty; })
      .every(function (n) { return DIFFS.indexOf(n.difficulty) >= 0; }));
    add('知识单元 M–P 属性留空', d.nodes.filter(function (n) { return n.type === '知识单元'; })
      .every(function (n) { return !n.difficulty && !n.literacy && !n.application; }));
    (d.unresolvedReferences || []).forEach(function (u) { warnings.push('未解析引用：' + u.node + ' → ' + u.target); });
    return { checks: checks, warnings: warnings, passed: checks.every(function (c) { return c.passed; }) };
  };

  C.loadUnified = function (text) {
    var d = JSON.parse(text);
    if (!d || !d.nodes || !d.edges || !d.meta) throw new Error('不是合法的统一课程图谱 JSON（缺少 nodes / edges / meta）');
    return d;
  };

  C.constants = { H15: H15, H16: H16, NOTE15: NOTE15, NOTE16: NOTE16, DIFFS: DIFFS };
  global.KGConverter = C;
})(window);
