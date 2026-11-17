# -*- coding: utf-8 -*-
"""
case-data.py — 跨模块贯穿案例「知学云 · 在线课程完课率」确定性数据集
=====================================================================
只用 Python 标准库（无 numpy / pandas），保证任何机器、任何时间运行结果一致。
固定随机种子 20261107，是本站所有章节「代码实验」的共同数据真源。

输出：
  data/case.json          —— 数据结构、字段字典、规范统计量与分组结果
  assets/js/case-outputs.txt —— 可直接贴进 <pre class="run-output"> 的真实运行输出

用法：cd assets/js && python case-data.py
"""
import json
import math
import random
import statistics as st
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SEED = 20261107
N = 12000
rng = random.Random(SEED)


# --------------------------------------------------------------------------
# 1) 生成数据
# --------------------------------------------------------------------------
def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def poisson_sample(lam, rnd):
    """Knuth 算法（λ 较小时数值稳定）；random.Random 无内置 poisson。"""
    L = math.exp(-lam)
    k, p = 0, 1.0
    while True:
        k += 1
        p *= rnd.random()
        if p <= L:
            return k - 1


rows = []
for i in range(N):
    age = max(16, min(60, int(rng.gauss(29, 7.5))))
    device = rng.choices(["mobile", "desktop", "tablet"], weights=[0.66, 0.28, 0.06])[0]
    channel = rng.choices(["search", "social", "referral", "ads"], weights=[0.34, 0.31, 0.20, 0.15])[0]
    region = rng.choices(["east", "central", "west"], weights=[0.47, 0.33, 0.20])[0]
    signup_month = rng.randint(1, 12)

    # 学习小组干预：按 1:1 完全随机分流（对应 m08 的 RCT）
    treatment = 1 if i % 2 == 0 else 0

    # 学习时长（分钟/周），干预有轻微正效应
    study = max(0.0, rng.gauss(96 + 9 * treatment, 46))
    if device == "mobile":
        study *= 0.92
    # 观看完成率
    watch = max(0.0, min(1.0, rng.gauss(0.58 + 0.0016 * study, 0.20)))
    # 测验平均分
    quiz = max(0.0, min(100.0, rng.gauss(58 + 0.17 * study + 9 * watch, 14)))
    posts = poisson_sample(0.7 + 0.006 * study, rng)
    days_first_quiz = max(0, int(rng.gauss(4.5 - 0.012 * study, 2.6)))
    peer = 1 if (treatment == 1 and rng.random() < 0.72) else (1 if rng.random() < 0.11 else 0)

    # 完课概率：logit 线性组合（含干预的真实效应 +0.30）
    z = (-4.55 + 0.0135 * study + 0.021 * quiz + 2.0 * watch
         + 0.055 * posts - 0.045 * days_first_quiz + 0.30 * treatment
         + 0.18 * peer + 0.002 * (age - 29))
    completed = 1 if rng.random() < sigmoid(z) else 0

    rows.append({
        "user_id": f"U{i+1:05d}", "age": age, "device": device,
        "enroll_channel": channel, "region": region, "signup_month": signup_month,
        "treatment": treatment, "peer_group": peer,
        "study_minutes_week": round(study, 1), "video_watch_ratio": round(watch, 4),
        "quiz_avg": round(quiz, 1), "forum_posts": posts,
        "days_to_first_quiz": days_first_quiz, "completed": completed,
    })


# --------------------------------------------------------------------------
# 2) 统计工具（纯标准库）
# --------------------------------------------------------------------------
def quantile(sorted_xs, p):
    """线性插值分位数（与 numpy 默认 'linear' 一致）。"""
    k = (len(sorted_xs) - 1) * p
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_xs[int(k)]
    return sorted_xs[f] * (c - k) + sorted_xs[c] * (k - f)


def summarize(xs):
    s = sorted(xs)
    m = st.fmean(xs)
    return {
        "n": len(xs), "mean": round(m, 4), "sd": round(st.stdev(xs), 4),
        "min": round(s[0], 4), "q1": round(quantile(s, .25), 4),
        "median": round(quantile(s, .50), 4), "q3": round(quantile(s, .75), 4),
        "max": round(s[-1], 4),
    }


def pearson(xs, ys):
    mx, my = st.fmean(xs), st.fmean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return num / (dx * dy)


def two_proportion_z(s1, n1, s2, n2):
    p1, p2 = s1 / n1, s2 / n2
    p = (s1 + s2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
    return (p1 - p2) / se, p1 - p2, se


def wilson(k, n, z=1.959963985):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - h, c + h


def ols_simple(xs, ys):
    mx, my = st.fmean(xs), st.fmean(ys)
    sxx = sum((x - mx) ** 2 for x in xs)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    b1 = sxy / sxx
    b0 = my - b1 * mx
    pred = [b0 + b1 * x for x in xs]
    ssr = sum((y - p) ** 2 for y, p in zip(ys, pred))
    sst = sum((y - my) ** 2 for y in ys)
    se1 = math.sqrt((ssr / (len(xs) - 2)) / sxx)
    return b0, b1, 1 - ssr / sst, se1


def logistic_2x2(table):
    """2×2 四格表：返回 OR 与 log(OR) 的标准误。"""
    a, b, c, d = table
    or_ = (a * d) / (b * c)
    se = math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
    return or_, se


# --------------------------------------------------------------------------
# 3) 规范统计量
# --------------------------------------------------------------------------
completed = [r["completed"] for r in rows]
study = [r["study_minutes_week"] for r in rows]
quiz = [r["quiz_avg"] for r in rows]
watch = [r["video_watch_ratio"] for r in rows]
posts = [r["forum_posts"] for r in rows]

treat = [r for r in rows if r["treatment"] == 1]
ctrl = [r for r in rows if r["treatment"] == 0]
k1 = sum(r["completed"] for r in treat)
k0 = sum(r["completed"] for r in ctrl)
z_stat, diff, se_diff = two_proportion_z(k1, len(treat), k0, len(ctrl))

# Beta-Binomial 后验（m07）：Beta(2,2) 先验 + 全样本完课数
a_post = 2 + sum(completed)
b_post = 2 + (N - sum(completed))

# 简单线性回归（m06）：学习时长 → 测验均分
b0, b1, r2, se1 = ols_simple(study, quiz)

# 2×2：高学习时长（≥ 中位数）与完课（m03 条件概率 / m08 因果对照）
med_study = summarize(study)["median"]
hi = [r for r in rows if r["study_minutes_week"] >= med_study]
lo = [r for r in rows if r["study_minutes_week"] < med_study]
a = sum(r["completed"] for r in hi)
b = len(hi) - a
c = sum(r["completed"] for r in lo)
d = len(lo) - c
or_, se_logor = logistic_2x2((a, b, c, d))

# 朴素贝叶斯式分组均值（m12 用于构造一个可手算的基线特征）
pos_study = [r["study_minutes_week"] for r in rows if r["completed"] == 1]
neg_study = [r["study_minutes_week"] for r in rows if r["completed"] == 0]

case = {
    "_schema": "跨模块贯穿案例的确定性数据真源；由 assets/js/case-data.py 生成，勿手改",
    "name": "知学云 · 在线课程完课率提升项目",
    "seed": SEED, "n": N,
    "goal": "预测学员完课概率、识别可干预因素、评估「学习小组」的因果效应，最终落地为 RAG 学习助手。",
    "fields": [
        {"name": "user_id", "type": "名义", "desc": "学员唯一标识 U00001–U12000"},
        {"name": "age", "type": "比率", "desc": "年龄（岁）"},
        {"name": "device", "type": "名义", "desc": "mobile / desktop / tablet"},
        {"name": "enroll_channel", "type": "名义", "desc": "search / social / referral / ads"},
        {"name": "region", "type": "名义", "desc": "east / central / west"},
        {"name": "signup_month", "type": "有序/周期", "desc": "报名月份 1–12"},
        {"name": "treatment", "type": "名义(二值)", "desc": "1=被随机分到学习小组干预组（1:1 完全随机）"},
        {"name": "peer_group", "type": "名义(二值)", "desc": "是否实际加入小组（存在不依从）"},
        {"name": "study_minutes_week", "type": "比率", "desc": "每周学习分钟数"},
        {"name": "video_watch_ratio", "type": "比率", "desc": "视频观看完成率 0–1"},
        {"name": "quiz_avg", "type": "比率", "desc": "测验平均分 0–100"},
        {"name": "forum_posts", "type": "计数", "desc": "论坛发帖数（泊松型）"},
        {"name": "days_to_first_quiz", "type": "计数", "desc": "距首次测验天数"},
        {"name": "completed", "type": "名义(二值)", "desc": "是否完课（响应变量 0/1）"},
    ],
    "stats": {
        "completed_rate": round(sum(completed) / N, 6),
        "completed_count": sum(completed),
        "study": summarize(study), "quiz": summarize(quiz),
        "watch": summarize(watch), "posts": summarize(posts),
        "corr_study_quiz": round(pearson(study, quiz), 4),
        "corr_watch_completed": round(pearson(watch, completed), 4),
        "treatment": {"n": len(treat), "completed": k1, "rate": round(k1 / len(treat), 6),
                      "wilson95": [round(x, 6) for x in wilson(k1, len(treat))]},
        "control": {"n": len(ctrl), "completed": k0, "rate": round(k0 / len(ctrl), 6),
                    "wilson95": [round(x, 6) for x in wilson(k0, len(ctrl))]},
        "ate": round(diff, 6), "z_stat": round(z_stat, 4), "se_diff": round(se_diff, 6),
        "ols_quiz_on_study": {"intercept": round(b0, 4), "slope": round(b1, 6),
                              "r2": round(r2, 4), "se_slope": round(se1, 6)},
        "beta_posterior": {"alpha": a_post, "beta": b_post,
                           "mean": round(a_post / (a_post + b_post), 6)},
        "high_study_2x2": {"table": [a, b, c, d], "odds_ratio": round(or_, 4),
                           "se_log_or": round(se_logor, 6)},
        "group_study_mean": {"completed": round(st.fmean(pos_study), 4),
                             "not_completed": round(st.fmean(neg_study), 4)},
    },
    "relay": [
        {"m": "m01", "stage": "s1", "focus": "数据理解与偏差识别",
         "task": "判断每个字段的测量尺度；识别自愿报名样本带来的选择偏差与混杂。"},
        {"m": "m02", "stage": "s1", "focus": "描述统计与可视化",
         "task": "给出学习时长、测验分的五数概括与箱线图；处理极端值与缺失。"},
        {"m": "m03", "stage": "s1", "focus": "概率与条件概率",
         "task": "计算 P(完课|高学习时长)，用贝叶斯公式解释「高分学员更可能完课」的逆概率。"},
        {"m": "m04", "stage": "s1", "focus": "随机变量与分布",
         "task": "用二项分布刻画完课数、泊松分布刻画发帖数、正态分布近似测验分。"},
        {"m": "m05", "stage": "s1", "focus": "估计与检验",
         "task": "为总体完课率构造 Wilson 区间；对干预组/对照组做两比例 z 检验。"},
        {"m": "m06", "stage": "s1", "focus": "回归建模",
         "task": "用学习时长回归测验分；讨论线性概率模型的越界问题与逻辑回归的引入。"},
        {"m": "m07", "stage": "s1", "focus": "贝叶斯更新",
         "task": "以 Beta(2,2) 为先验，用共轭更新得到完课率后验并给出可信区间。"},
        {"m": "m08", "stage": "s1", "focus": "实验与因果",
         "task": "把学习小组视为随机干预，估计 ATE；讨论不依从、ITT 与 CACE。"},
        {"m": "m09", "stage": "s3", "focus": "泛化与模型选择",
         "task": "用交叉验证比较复杂度，观察偏差—方差权衡与评估指标的统计波动。"},
        {"m": "m10", "stage": "s6", "focus": "AI 前沿统计",
         "task": "用共形预测输出带覆盖率保证的预测集；检查概率校准与评测不确定性。"},
        {"m": "m11", "stage": "s2", "focus": "规模化统计",
         "task": "把 1.2 万行扩展为 1.2 亿条日志，用可合并充分统计量与近似算法重算指标。"},
        {"m": "m12", "stage": "s3", "focus": "经典算法",
         "task": "用逻辑回归、决策树、集成模型预测完课，并按六维口径横向对比。"},
        {"m": "m13", "stage": "s4", "focus": "深度训练",
         "task": "把特征送入小批量训练循环，比较优化器、学习率调度与缩放行为。"},
        {"m": "m14", "stage": "s5", "focus": "网络架构",
         "task": "用 MLP 处理表格特征、用注意力编码学习行为序列，讨论归纳偏置与资源账。"},
        {"m": "m15", "stage": "s6", "focus": "生成式系统",
         "task": "构建 RAG 学习助手：检索课程资料 → 生成答疑 → 忠实度与拒答评测。"},
    ],
}

# --------------------------------------------------------------------------
# 4) 输出
# --------------------------------------------------------------------------
(ROOT / "data" / "case.json").write_text(
    json.dumps(case, ensure_ascii=False, indent=1), encoding="utf-8")

s = case["stats"]
lines = [
    "=" * 58,
    f"  {case['name']}",
    f"  seed={SEED}  N={N:,}  (pure stdlib, deterministic)",
    "=" * 58,
    f"overall completed : {s['completed_count']:,} / {N:,} = {s['completed_rate']:.4f}",
    f"study_minutes/week: mean={s['study']['mean']:.2f}  sd={s['study']['sd']:.2f}  "
    f"median={s['study']['median']:.2f}  q1={s['study']['q1']:.2f}  q3={s['study']['q3']:.2f}",
    f"quiz_avg          : mean={s['quiz']['mean']:.2f}  sd={s['quiz']['sd']:.2f}  "
    f"median={s['quiz']['median']:.2f}",
    f"corr(study, quiz) : {s['corr_study_quiz']:.4f}",
    "-" * 58,
    f"treatment : n={s['treatment']['n']:,}  completed={s['treatment']['completed']:,}  "
    f"rate={s['treatment']['rate']:.4f}  Wilson95=[{s['treatment']['wilson95'][0]:.4f}, "
    f"{s['treatment']['wilson95'][1]:.4f}]",
    f"control   : n={s['control']['n']:,}  completed={s['control']['completed']:,}  "
    f"rate={s['control']['rate']:.4f}  Wilson95=[{s['control']['wilson95'][0]:.4f}, "
    f"{s['control']['wilson95'][1]:.4f}]",
    f"ATE       : {s['ate']:+.4f}   z={s['z_stat']:.4f}   se={s['se_diff']:.6f}",
    "-" * 58,
    f"OLS quiz ~ study : intercept={s['ols_quiz_on_study']['intercept']:.4f}  "
    f"slope={s['ols_quiz_on_study']['slope']:.6f}  R2={s['ols_quiz_on_study']['r2']:.4f}",
    f"Beta posterior   : Beta({s['beta_posterior']['alpha']}, {s['beta_posterior']['beta']})  "
    f"mean={s['beta_posterior']['mean']:.6f}",
    f"2x2 high/low study: {s['high_study_2x2']['table']}  OR={s['high_study_2x2']['odds_ratio']:.4f}",
    "=" * 58,
]
out = "\n".join(lines)
(ROOT / "assets" / "js" / "case-outputs.txt").write_text(out + "\n", encoding="utf-8")
print(out)
print("\n✅ 写出 data/case.json 与 assets/js/case-outputs.txt")
