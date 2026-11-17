# -*- coding: utf-8 -*-
"""数值计算助手 2：t/F/卡方分位数、回归、逻辑回归牛顿迭代、岭/Lasso。"""
import math, random
from _calc_examples import (chi2_sf, chi2_cdf, norm_cdf, norm_sf, norm_ppf,
                            matmul, transpose, inverse, solve, ols)

# ---------- 不完全 Beta（数值 Recipes）----------
def betacf(a, b, x):
    MAXIT, EPS, FPMIN = 200, 3e-16, 1e-300
    qab, qap, qam = a + b, a + 1.0, a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < FPMIN: d = FPMIN
    d = 1.0 / d
    h = d
    for m in range(1, MAXIT + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN: d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN: c = FPMIN
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN: d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN: c = FPMIN
        d = 1.0 / d
        de = d * c
        h *= de
        if abs(de - 1.0) < EPS: break
    return h

def betai(a, b, x):
    if x <= 0.0: return 0.0
    if x >= 1.0: return 1.0
    bt = math.exp(math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) +
                   a * math.log(x) + b * math.log(1.0 - x))
    if x < (a + 1.0) / (a + b + 2.0):
        return bt * betacf(a, b, x) / a
    return 1.0 - bt * betacf(b, a, 1.0 - x) / b

def t_cdf(t, df):
    x = df / (df + t * t)
    p = 0.5 * betai(df / 2.0, 0.5, x)
    return 1.0 - p if t > 0 else p

def t_sf(t, df):
    return 1.0 - t_cdf(t, df)

def t_ppf(p, df):
    lo, hi = -50.0, 50.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if t_cdf(mid, df) < p: lo = mid
        else: hi = mid
    return (lo + hi) / 2

print("t_{0.025,9} =", round(t_ppf(0.975, 9), 3))
print("t_{0.025,7} =", round(t_ppf(0.975, 7), 3))
print("t_{0.025,10} =", round(t_ppf(0.975, 10), 3))
print("t_{0.05,9} =", round(t_ppf(0.95, 9), 3))
print("t_{0.025,15} =", round(t_ppf(0.975, 15), 3))

print()
print("=" * 70)
print("m06: 残差诊断数据")
print("=" * 70)
# (a) 异方差
xa = [1, 2, 3, 4, 5, 6, 7, 8]
ya = [2.1, 3.9, 6.3, 7.6, 11.4, 12.6, 18.3, 19.2]
m = ols([[1, v] for v in xa], ya)
print("(a) 异方差 beta:", [round(v, 4) for v in m["beta"]])
print("    fitted:", [round(v, 3) for v in m["yhat"]])
print("    resid:", [round(v, 3) for v in m["resid"]])
print("    R2 =", round(m["r2"], 4), " SSE =", round(m["sse"], 4))

# (b) 非线性 U 形
xb = [1, 2, 3, 4, 5, 6]
yb = [2, 3, 5, 9, 14, 21]
mb = ols([[1, v] for v in xb], yb)
print("(b) 非线性 beta:", [round(v, 4) for v in mb["beta"]])
print("    fitted:", [round(v, 3) for v in mb["yhat"]])
print("    resid:", [round(v, 3) for v in mb["resid"]])
print("    R2 =", round(mb["r2"], 4))

# (c) 异常点
xc = [1, 2, 3, 4, 5, 6]
yc = [2.0, 4.1, 5.9, 8.2, 10.0, 16.5]
mc = ols([[1, v] for v in xc], yc)
print("(c) 异常点 beta:", [round(v, 4) for v in mc["beta"]])
print("    fitted:", [round(v, 3) for v in mc["yhat"]])
print("    resid:", [round(v, 3) for v in mc["resid"]])
print("    R2 =", round(mc["r2"], 4))
m0 = ols([[1, v] for v in xc], [2.0, 4.1, 5.9, 8.2, 10.0, 8.4])
print("    去掉异常点后 beta:", [round(v, 4) for v in m0["beta"]], "R2 =", round(m0["r2"], 4))

print()
print("=" * 70)
print("m06: R2 vs 调整 R2 + 预测区间")
print("=" * 70)
xd = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
yd = [12, 15, 14, 19, 21, 20, 25, 27, 26, 31]
zd = [5, 9, 2, 7, 3, 8, 4, 6, 1, 10]   # 无关变量
m1 = ols([[1, v] for v in xd], yd)
m2 = ols([[1, xd[i], zd[i]] for i in range(10)], yd)
print("model1 beta", [round(v, 4) for v in m1["beta"]], "R2", round(m1["r2"], 4),
      "adjR2", round(m1["adj"], 4), "SSE", round(m1["sse"], 4))
print("model2 beta", [round(v, 4) for v in m2["beta"]], "R2", round(m2["r2"], 4),
      "adjR2", round(m2["adj"], 4), "SSE", round(m2["sse"], 4))
# 预测区间
n = 10
xbar = sum(xd) / n
Sxx = sum((v - xbar) ** 2 for v in xd)
s = math.sqrt(m1["sse"] / (n - 2))
x0 = 12.0
se_mean = s * math.sqrt(1 / n + (x0 - xbar) ** 2 / Sxx)
se_pred = s * math.sqrt(1 + 1 / n + (x0 - xbar) ** 2 / Sxx)
tcrit = t_ppf(0.975, n - 2)
yhat0 = m1["beta"][0] + m1["beta"][1] * x0
print(f"xbar={xbar}, Sxx={Sxx}, s={round(s,4)}, x0={x0}, yhat0={round(yhat0,4)}")
print(f"tcrit={round(tcrit,3)} CI mean = ({round(yhat0-tcrit*se_mean,3)}, {round(yhat0+tcrit*se_mean,3)})")
print(f"PI = ({round(yhat0-tcrit*se_pred,3)}, {round(yhat0+tcrit*se_pred,3)})")

print()
print("=" * 70)
print("m06: 多元回归 3 自变量（寻找整数数据集）")
print("=" * 70)
best = None
import itertools
for x1 in itertools.product([-2, -1, 0, 1, 2], repeat=6):
    if sum(x1) != 0: continue
    for x2 in itertools.product([-2, -1, 0, 1, 2], repeat=6):
        if sum(x2) != 0 or x2 == x1: continue
        for x3 in itertools.product([-2, -1, 0, 1, 2], repeat=6):
            if sum(x3) != 0: continue
            if x3 == x1 or x3 == x2: continue
            S = [[sum(x1[i]*x1[j] for j in range(6)), sum(x1[i]*x2[j] for j in range(6)), sum(x1[i]*x3[j] for j in range(6))],
                 [sum(x2[i]*x1[j] for j in range(6)), sum(x2[i]*x2[j] for j in range(6)), sum(x2[i]*x3[j] for j in range(6))],
                 [sum(x3[i]*x1[j] for j in range(6)), sum(x3[i]*x2[j] for j in range(6)), sum(x3[i]*x3[j] for j in range(6))]]
            det = (S[0][0]*(S[1][1]*S[2][2]-S[1][2]*S[2][1])
                   - S[0][1]*(S[1][0]*S[2][2]-S[1][2]*S[2][0])
                   + S[0][2]*(S[1][0]*S[2][1]-S[1][1]*S[2][0]))
            if det == 0: continue
            # 目标：解出整数 b
            tgt = [1, 2, -1]
            rhs = [sum(S[i][k]*tgt[k] for k in range(3)) for i in range(3)]
            b = solve(S, rhs)
            if all(abs(v - round(v)) < 1e-9 for v in b):
                key = (max(abs(v) for v in b), sum(abs(v) for v in S[i][j] for i in range(3) for j in range(3)))
                if best is None or key < best[0]:
                    best = (key, x1, x2, x3, S, b)
print("找到:", best[1], best[2], best[3], "S =", best[4], "b =", best[5])
