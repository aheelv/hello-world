# -*- coding: utf-8 -*-
"""数值计算助手 3：各章新增例题的具体数据。"""
import math, itertools
from _calc_examples import (chi2_sf, chi2_cdf, norm_cdf, norm_sf, norm_ppf,
                            matmul, transpose, inverse, solve, ols)
from _calc2 import t_ppf, t_cdf

def chi2_ppf(p, df):
    lo, hi = 0.0, 200.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if chi2_cdf(mid, df) < p: lo = mid
        else: hi = mid
    return (lo + hi) / 2

print("=" * 70)
print("m04 例4.2: 卡方分布")
print("=" * 70)
print("chi2_sf(9.488, 4) =", round(chi2_sf(9.488, 4), 4))
print("chi2_cdf(9.488, 4) =", round(chi2_cdf(9.488, 4), 4))
print("chi2_sf(0.297, 4) =", round(chi2_sf(0.297, 4), 4))
print("chi2_cdf(0.297, 4) =", round(chi2_cdf(0.297, 4), 4))
print("chi2_ppf(0.95, 4) =", round(chi2_ppf(0.95, 4), 4))
print("chi2_ppf(0.05, 1) =", round(chi2_ppf(0.05, 1), 4))
print("chi2_ppf(0.95, 10) =", round(chi2_ppf(0.95, 10), 4))
print("chi2_sf(3.841, 1) =", round(chi2_sf(3.841, 1), 4), " (= P(|Z|>1.96))")

print()
print("=" * 70)
print("m04 例6.1: 样本方差与卡方")
print("=" * 70)
n, s2, sig2 = 20, 36.0, 25.0
print("P(s2 > 45) = P(chi2_19 >", (n - 1) * 45 / sig2, ") =", round(chi2_sf((n-1)*45/sig2, n-1), 4))
q975 = chi2_ppf(0.975, n-1); q025 = chi2_ppf(0.025, n-1)
print("chi2_0.975,19 =", round(q975, 3), " chi2_0.025,19 =", round(q025, 3))
lo = (n-1)*s2/q975; hi = (n-1)*s2/q025
print("95% CI for sigma^2 = (", round(lo, 3), ",", round(hi, 3), ")")
print("sqrt: (", round(math.sqrt(lo), 3), ",", round(math.sqrt(hi), 3), ")")
print("E(s^2)=sigma^2=25, Var(s^2)=2*25^2/19 =", round(2*625/19, 3))
print("P(s^2 > 40) =", round(chi2_sf((n-1)*40/sig2, n-1), 4))

print()
print("=" * 70)
print("m05 例1.1: 几何分布矩估计")
print("=" * 70)
xs = [2, 3, 5, 4, 6]
n = len(xs); sx = sum(xs); xbar = sx / n
print("xbar =", xbar, " MOM p =", 1/xbar, " unbiased (n-1)/S =", (n-1)/sx)
# 验证 E[1/Xbar] > p : 用模拟
import random
random.seed(7)
tot = 0.0; M = 200000
for _ in range(M):
    s = 0.0
    for _ in range(n):
        k = 0
        while random.random() > 0.4:
            k += 1
        s += k + 1
    tot += n / s
print("E[1/Xbar] 模拟 =", round(tot / M, 4), " (真 p = 0.4)")
print("E[(n-1)/S] 模拟 =", round(sum((n-1)/ (lambda s: s)(sum(1 + next(k for k in itertools.count() if random.random() <= 0.4) for _ in range(n))) for _ in range(3)) / 3, 4))

print()
print("=" * 70)
print("m05 例2.1: 指数分布 MLE")
print("=" * 70)
xe = [2.1, 3.4, 1.8, 4.5, 2.7]
ne = len(xe); se = sum(xe)
print("sum =", se, " xbar =", se/ne, " lambda_hat = n/S =", ne/se, " MOM same")
print("unbiased (n-1)/S =", (ne-1)/se, " -> mean =", se/(ne-1))
print("mean by MLE:", se/ne)

print()
print("=" * 70)
print("m05 例3.2: Wilson")
print("=" * 70)
def wilson(x, n, z=1.96):
    ph = x / n
    den = 1 + z*z/n
    cen = (ph + z*z/(2*n))/den
    half = (z/den)*math.sqrt(ph*(1-ph)/n + z*z/(4*n*n))
    return cen-half, cen+half
for (x, nn) in [(8, 100), (1, 10), (3, 30), (42, 100)]:
    ph = x/nn
    wald = (ph - 1.96*math.sqrt(ph*(1-ph)/nn), ph + 1.96*math.sqrt(ph*(1-ph)/nn))
    print(f"x={x} n={nn}: Wald=({round(wald[0],4)},{round(wald[1],4)})  Wilson=({round(wilson(x,nn)[0],4)},{round(wilson(x,nn)[1],4)})")
print("z=1.96")

print()
print("=" * 70)
print("m05 例4.2: p 值案例")
print("=" * 70)
# 案例A: A/B 测试 p=0.049 边缘显著
n1 = n2 = 1200
x1, x2 = 180, 150
p1, p2 = x1/n1, x2/n2
p_pool = (x1+x2)/(n1+n2)
se = math.sqrt(p_pool*(1-p_pool)*(1/n1+1/n2))
z = (p1-p2)/se
print("A/B: p1=",p1, "p2=",p2, "z=", round(z,4), "two-sided p=", round(2*norm_sf(abs(z)), 4))
print("  95% CI diff = (", round(p1-p2-1.96*se,4), ",", round(p1-p2+1.96*se,4), ")")
d = (p1-p2)/math.sqrt(p_pool*(1-p_pool)*((1/n1+1/n2)/2))
print("  Cohen d ≈", round(d,4))
# 案例B: 样本量不足
n1b = n2b = 40
x1b, x2b = 9, 4
p1b, p2b = x1b/n1b, x2b/n2b
pb = (x1b+x2b)/(n1b+n2b)
seb = math.sqrt(pb*(1-pb)*(1/n1b+1/n2b))
zb = (p1b-p2b)/seb
print("小样本: p1=",p1b,"p2=",p2b,"z=",round(zb,4),"p=",round(2*norm_sf(abs(zb)),4))
print("  95% CI diff = (", round(p1b-p2b-1.96*seb,4), ",", round(p1b-p2b+1.96*seb,4), ")")
print("  功效不足：把 n 提到每组 400 时 z =", round((p1b-p2b)/math.sqrt(pb*(1-pb)*(1/400+1/400)),4))
# 反算样本量：p1=0.15 vs p2=0.20, alpha=0.05 双侧, power=0.80
def n_for(p_a, p_b, alpha=0.05, power=0.80):
    za = norm_ppf(1-alpha/2); zb = norm_ppf(power)
    pbar = (p_a+p_b)/2
    return math.ceil(((za+zb)**2 * pbar*(1-pbar))/(p_b-p_a)**2)
print("n per group (15% vs 20%, a=.05, power=.8):", n_for(0.15, 0.20))
print("n per group (5% vs 8%):", n_for(0.05, 0.08))

print()
print("=" * 70)
print("m05 例4.3: 列联表 3x2 + 多重比较")
print("=" * 70)
obs = [[45, 25], [30, 30], [25, 35]]
rows = [sum(r) for r in obs]
cols = [sum(obs[i][j] for i in range(3)) for j in range(2)]
N = sum(rows)
E = [[rows[i]*cols[j]/N for j in range(2)] for i in range(3)]
chi2 = sum((obs[i][j]-E[i][j])**2/E[i][j] for i in range(3) for j in range(2))
print("rows", rows, "cols", cols, "N", N)
print("E:", [[round(v,3) for v in r] for r in E])
print("chi2 =", round(chi2, 4), " df = 2,  p =", round(chi2_sf(chi2, 2), 4))
print("cramersV =", round(math.sqrt(chi2/(N*1)), 4))
# Bonferroni for 10 comparisons
pv = [0.003, 0.012, 0.021, 0.034, 0.041, 0.048, 0.055, 0.061, 0.072, 0.089]
m = len(pv)
print("Bonferroni alpha' =", 0.05/m)
print("under Bonferroni, rejected:", sum(1 for v in pv if v < 0.05/m))
adj = [min(1.0, m/(i+1)*v) for i, v in enumerate(pv)]
for i in range(len(pv)-1, 0, -1):
    adj[i-1] = min(adj[i-1], adj[i])
print("BH adjusted:", [round(v,4) for v in adj])
print("BH rejected at 0.05:", sum(1 for v in adj if v < 0.05))
print("raw rejected at 0.05:", sum(1 for v in pv if v < 0.05))
