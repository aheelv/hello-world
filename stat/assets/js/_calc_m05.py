# -*- coding: utf-8 -*-
"""m05 / m06 新增例题的完整数值计算。"""
import math, random, itertools
from _stats_util import *

def show(x): return round(x, 6)

print("="*72); print("m05 例1.1 几何分布：矩估计 + 无偏性"); print("="*72)
xs = [2, 3, 5, 4, 6]; n = len(xs); S = sum(xs); xbar = S/n
print("x =", xs, " sum =", S, " xbar =", xbar)
print("MOM: p_hat = 1/xbar =", show(1/xbar))
print("MLE: p_hat = 1/xbar =", show(1/xbar))
print("无偏修正: (n-1)/S =", show((n-1)/S))
random.seed(20240611)
M = 400000
s1 = s2 = 0.0
for _ in range(M):
    tot = 0.0
    for _ in range(n):
        k = 0
        while True:
            k += 1
            if random.random() <= 0.4:
                break
        tot += k
    s1 += n/tot
    s2 += (n-1)/tot
print("模拟 E[1/Xbar] =", show(s1/M), " (真 p=0.4) -> 上偏")
print("模拟 E[(n-1)/S] =", show(s2/M), " (真 p=0.4) -> 无偏")
# 一致性：n 增大
for nn in [5, 50, 500]:
    random.seed(1)
    tot = 0.0; K = 40000
    for _ in range(K):
        s = 0.0
        for _ in range(nn):
            k = 0
            while True:
                k += 1
                if random.random() <= 0.4: break
            s += k
        tot += nn/s
    print(f"  n={nn}: E[1/Xbar]≈{tot/K:.4f}")

print()
print("="*72); print("m05 例2.1 指数分布 MLE + 偏差"); print("="*72)
xe = [2.1, 3.4, 1.8, 4.5, 2.7]; ne = len(xe); Se = sum(xe)
print("x =", xe, " sum =", Se, " xbar =", Se/ne)
print("MLE: lam = n/S =", show(ne/Se), "  MOM 相同: 1/xbar =", show(1/(Se/ne)))
print("无偏: (n-1)/S =", show((ne-1)/Se), " -> 1/lam =", show(Se/(ne-1)))
random.seed(7); M = 300000
t1 = t2 = 0.0
for _ in range(M):
    s = 0.0
    for _ in range(ne):
        s += -math.log(random.random())
    t1 += ne/s
    t2 += (ne-1)/s
print("模拟 E[1/Xbar] =", show(t1/M), " (真 lam=0.5) -> 上偏")
print("模拟 E[(n-1)/S] =", show(t2/M), " (真 lam=0.5)")
print("伯努利复核：10 次抛硬币 7 次正 -> p_hat = 7/10 = 0.7, 似然 p^7(1-p)^3")

print()
print("="*72); print("m05 例3.2 Wilson 区间"); print("="*72)
def wilson(x, n, z=1.96):
    ph = x/n; den = 1+z*z/n
    cen = (ph+z*z/(2*n))/den
    half = (z/den)*math.sqrt(ph*(1-ph)/n+z*z/(4*n*n))
    return cen-half, cen+half
for (x, nn) in [(8,100), (1,10), (42,100), (15,60)]:
    ph = x/nn
    w = (ph-1.96*math.sqrt(ph*(1-ph)/nn), ph+1.96*math.sqrt(ph*(1-ph)/nn))
    ww = wilson(x,nn)
    print(f"x={x},n={nn}: p_hat={ph}  Wald=({round(w[0],4)},{round(w[1],4)})  Wilson=({round(ww[0],4)},{round(ww[1],4)})")
print("Wilson 中间量 x=8,n=100: z^2/n =", round(1.96**2/100,6), " z^2/(2n) =", round(1.96**2/200,6))
print("Wald SE for x=1,n=10:", round(math.sqrt(0.1*0.9/10),4))
print("Wilson for x=1,n=10 detail:", [round(v,6) for v in wilson(1,10)])
print("z^2/(4n^2) =", round(1.96**2/400,6), " p(1-p)/n =", round(0.1*0.9/10,6))

print()
print("="*72); print("m05 例4.2 p 值 + 功效/样本量"); print("="*72)
n1 = n2 = 2000; x1, x2 = 300, 255
p1, p2 = x1/n1, x2/n2
pool = (x1+x2)/(n1+n2)
se = math.sqrt(pool*(1-pool)*(1/n1+1/n2))
z = (p1-p2)/se
print(f"p1={p1}, p2={p2}, diff={p1-p2}, pooled={pool:.5f}, SE={se:.6f}, z={z:.4f}, p={2*norm_sf(abs(z)):.4f}")
print("95% CI diff = (", round(p1-p2-1.96*se,5), ",", round(p1-p2+1.96*se,5), ")")
sd = math.sqrt(pool*(1-pool))
print("Cohen d =", round((p1-p2)/sd,4))
# 功效反算
za, zb = norm_ppf(0.975), norm_ppf(0.80)
pbar = (0.15+0.1275)/2
dlt = 0.0225
nneed = math.ceil((za+zb)**2 * pbar*(1-pbar)/dlt**2)
print(f"需要样本量(每组, 80%功效): ({za:.4f}+{zb:.4f})^2*{pbar:.5f}*{1-pbar:.5f}/{dlt}^2 = {nneed}")
# 现有 n=2000 的功效
se0 = math.sqrt(pool*(1-pool)*(2/2000))
ncp = dlt/se0
print("n=2000/组 时 z 的期望值 =", round(ncp,4), " 对应功效 ≈", round(norm_cdf(ncp-1.96),4))
# 拟合优度：Poisson(3) 检查
lam = 3.0; obs = [14, 32, 46, 44, 32, 18, 9, 5]
nobs = sum(obs)
pk = [math.exp(-lam)*lam**k/math.factorial(k) for k in range(7)]
pk.append(1-sum(pk))
E = [nobs*p for p in pk]
chi2g = sum((o-e)**2/e for o,e in zip(obs,E))
print("Poisson(3) 拟合优度: E =", [round(v,2) for v in E])
print("chi2 =", round(chi2g,4), " df = 8-1-1 = 6, p =", round(chi2_sf(chi2g,6),4))
# 3x2 列联表
obs2 = [[45,25],[30,30],[25,35]]
rows = [sum(r) for r in obs2]; cols = [sum(obs2[i][j] for i in range(3)) for j in range(2)]
N = sum(rows)
E2 = [[rows[i]*cols[j]/N for j in range(2)] for i in range(3)]
c2 = sum((obs2[i][j]-E2[i][j])**2/E2[i][j] for i in range(3) for j in range(2))
print("3x2 E =", [[round(v,3) for v in r] for r in E2], " chi2 =", round(c2,4), " df=2 p =", round(chi2_sf(c2,2),4))
print("Cramér V =", round(math.sqrt(c2/(N*1)),4))
# Bonferroni / BH on 10 p-values
pv = [0.003, 0.012, 0.021, 0.034, 0.041, 0.048, 0.055, 0.061, 0.072, 0.089]
m = len(pv)
adj = [min(1.0, m/(i+1)*v) for i,v in enumerate(pv)]
for i in range(len(pv)-1,0,-1): adj[i-1] = min(adj[i-1], adj[i])
print("Bonferroni alpha' =", 0.05/m, " -> 显著个数:", sum(1 for v in pv if v < 0.05/m))
print("BH 调整后 p:", [round(v,4) for v in adj])
print("BH 在 0.05 下显著个数:", sum(1 for v in adj if v < 0.05), " (原始 0.05 下:", sum(1 for v in pv if v<0.05), ")")
print("BH 步骤表:")
for i,v in enumerate(pv):
    print(f"   i={i+1}, p={v}, i/m*p={round((i+1)/m*v,4)}, 阈值 q*i/m (q=0.05)={round(0.05*(i+1)/m,4)}")
