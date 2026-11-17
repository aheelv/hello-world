# -*- coding: utf-8 -*-
"""最终数值汇总（用于教材例题）。"""
import math, random
from _stats_util import *

print("="*74); print("m04 例2.1 矩母函数 + 混合分布"); print("="*74)
lam = 3.0
print("Poisson(3): M(t)=exp(3(e^t-1)); M'(0)=3; M''(0)=3+9=12; Var=12-9=3")
print("混合分布: 0.6*N(10,4)+0.4*N(30,9)")
mu = 0.6*10+0.4*30
ex2 = 0.6*(100+4)+0.4*(900+9)
var = ex2-mu*mu
print("  E(X)=",mu,"  E(X^2)=",ex2,"  Var=",var,"  sd=",round(math.sqrt(var),4))
print("  混合分布 MGF = 0.6*exp(10t+2t^2)+0.4*exp(30t+4.5t^2)")

print()
print("="*74); print("m04 例3.2 负二项 + 泊松近似条件验证"); print("="*74)
p = 0.1; r = 3
for k in [3,4,5]:
    print(f"  P(X={k}) = C({k-1},2)*0.1^3*0.9^{k-3} =", round(math.comb(k-1,2)*p**r*(1-p)**(k-r),6))
print("  E(X)=r/p=30  Var=r(1-p)/p^2=", 3*0.9/0.01)
print("泊松近似条件验证：")
print("  B(10,0.5) P(X=0) exact =", 0.5**10, " Poisson(5) =", round(math.exp(-5),6))
print("  B(100,0.02) P(X=0) exact =", round(0.98**100,6), " Poisson(2) =", round(math.exp(-2),6))
print("  B(1000,0.001) P(X=0) exact =", round(0.999**1000,6), " Poisson(1) =", round(math.exp(-1),6))

print()
print("="*74); print("m04 例4.2 卡方右尾 + 临界值 + t/F 辨析"); print("="*74)
print("chi2_4: P(X>9.488)=", round(chi2_sf(9.488,4),4), " P(X<0.297)=", round(chi2_cdf(0.297,4),4))
print("chi2_ppf(0.95,4)=", round(chi2_ppf(0.95,4),4), " chi2_ppf(0.99,4)=", round(chi2_ppf(0.99,4),4))
print("chi2_1 = Z^2: P(chi2_1>3.841)=", round(chi2_sf(3.841,1),4), " = P(|Z|>1.96)=", round(2*norm_sf(1.96),4))
print("chi2_10: 0.95 分位 =", round(chi2_ppf(0.95,10),4), " 0.99 分位 =", round(chi2_ppf(0.99,10),4))
print("t_0.025,9 =", round(t_ppf(0.975,9),3), " F_0.05,9,9 =", "查表 3.179")

print()
print("="*74); print("m04 例5.1 CLT 失效反例"); print("="*74)
print("P(X=2^k)=(2/3)(1/3)^k, k=0,1,2,...")
print("  E(X)= (2/3)*sum(2/3)^k =", (2/3)/(1-2/3))
print("  E(X^2)= (2/3)*sum(4/3)^k = inf")
print("  P(X>2^m) = 3^-(m+1): m=10 ->", round(3**-11,10), " m=20 ->", round(3**-21,10))
print("  n=1000 时出现一个 >2^20 的观测的概率 ≈", round(1000*3**-21,10))
print("  该观测对 Xbar 的贡献 = 2^20/1000 =", 2**20//1000)

print()
print("="*74); print("m04 例6.1 样本方差与卡方"); print("="*74)
n, s2, sig2 = 20, 36.0, 25.0
q975 = chi2_ppf(0.975, n-1); q025 = chi2_ppf(0.025, n-1)
print("chi2_0.975,19 =", round(q975,3), " chi2_0.025,19 =", round(q025,3))
print("95% CI for sigma^2 = (", round((n-1)*s2/q975,3), ",", round((n-1)*s2/q025,3), ")")
print("sigma CI = (", round(math.sqrt((n-1)*s2/q975),3), ",", round(math.sqrt((n-1)*s2/q025),3), ")")
print("P(s^2>45) = P(chi2_19>34.2) =", round(chi2_sf(34.2,19),4))
print("P(s^2>40) =", round(chi2_sf((n-1)*40/sig2,19),4))
print("E(s^2)=25, Var(s^2)=2*625/19=", round(2*625/19,3))

print()
print("="*74); print("m05 例1.1 几何分布估计量偏差（正确模拟）"); print("="*74)
random.seed(2024)
p = 0.4; M = 400000
for nn in [5, 50]:
    s1 = s2 = 0.0; s3 = 0.0; cnt3 = 0
    for _ in range(M):
        tot = 0.0
        for _ in range(nn):
            k = 0
            while True:
                k += 1
                if random.random() <= p: break
            tot += k
        s1 += nn/tot
        s2 += (nn-1)/tot
        if tot > nn:
            s3 += (nn-1)/(tot-nn); cnt3 += 1
    print(f"n={nn}: E[1/xbar]={s1/M:.4f}  E[(n-1)/S]={s2/M:.4f}  E[(n-1)/(S-n)]={s3/cnt3:.4f} (p=0.4)")

print()
print("="*74); print("m05 例3.2 Wilson"); print("="*74)
def wilson(x, n, z=1.96):
    ph = x/n; den = 1+z*z/n
    cen = (ph+z*z/(2*n))/den
    half = (z/den)*math.sqrt(ph*(1-ph)/n+z*z/(4*n*n))
    return cen-half, cen+half
x, nn = 8, 100
ph = x/nn
print("x=8,n=100: p_hat=0.08")
print("  Wald:", round(ph-1.96*math.sqrt(ph*(1-ph)/nn),4), round(ph+1.96*math.sqrt(ph*(1-ph)/nn),4))
w = wilson(x,nn); print("  Wilson:", round(w[0],4), round(w[1],4))
print("  中间量: z^2/n =", round(1.96**2/nn,6), " z^2/(2n) =", round(1.96**2/(2*nn),6),
      " p(1-p)/n =", round(ph*(1-ph)/nn,6), " z^2/(4n^2) =", round(1.96**2/(4*nn*nn),6))
x, nn = 3, 20
ph = x/nn
print("x=3,n=20: Wald:", round(ph-1.96*math.sqrt(ph*(1-ph)/nn),4), round(ph+1.96*math.sqrt(ph*(1-ph)/nn),4),
      " Wilson:", [round(v,4) for v in wilson(x,nn)])

print()
print("="*74); print("m05 例4.2 p值/功效/样本量"); print("="*74)
n1 = n2 = 2000; x1, x2 = 300, 255
p1, p2 = x1/n1, x2/n2
pool = (x1+x2)/(n1+n2)
se = math.sqrt(pool*(1-pool)*(1/n1+1/n2))
z = (p1-p2)/se
print(f"p1={p1} p2={p2} pooled={pool:.5f} SE={se:.6f} z={z:.4f} p={2*norm_sf(abs(z)):.4f}")
print("95%CI diff = (", round(p1-p2-1.96*se,5), ",", round(p1-p2+1.96*se,5), ")")
print("Cohen d =", round((p1-p2)/math.sqrt(pool*(1-pool)),4))
za, zb = norm_ppf(0.975), norm_ppf(0.80)
pbar = (0.15+0.1275)/2; dlt = 0.0225
print("反算样本量(80%功效):", math.ceil((za+zb)**2*pbar*(1-pbar)/dlt**2))
print("当前 n=2000/组 功效 ≈", round(norm_cdf(dlt/se-1.96),4))
# 拟合优度 Poisson(3)
lam = 3.0; obs = [14,32,46,44,32,18,9,5]; N = sum(obs)
pk = [math.exp(-lam)*lam**k/math.factorial(k) for k in range(7)]; pk.append(1-sum(pk))
E = [N*q for q in pk]
c2 = sum((o-e)**2/e for o,e in zip(obs,E))
print("Poisson(3) GOF: E=", [round(v,2) for v in E], " chi2=", round(c2,4), " df=6 p=", round(chi2_sf(c2,6),4))
# 3x2
obs2 = [[45,25],[30,30],[25,35]]
rows=[sum(r) for r in obs2]; cols=[sum(obs2[i][j] for i in range(3)) for j in range(2)]; N2=sum(rows)
E2=[[rows[i]*cols[j]/N2 for j in range(2)] for i in range(3)]
c3 = sum((obs2[i][j]-E2[i][j])**2/E2[i][j] for i in range(3) for j in range(2))
print("3x2 E=", [[round(v,3) for v in r] for r in E2], " chi2=", round(c3,4), " df=2 p=", round(chi2_sf(c3,2),4),
      " V=", round(math.sqrt(c3/(N2*1)),4))
