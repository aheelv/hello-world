# -*- coding: utf-8 -*-
"""m04 新增例题数值。"""
import math
from _stats_util import *

print("="*70); print("m04 例4.2 卡方分布"); print("="*70)
print("chi2_sf(9.488,4) =", round(chi2_sf(9.488,4),4))
print("chi2_cdf(9.488,4) =", round(chi2_cdf(9.488,4),4))
print("chi2_cdf(0.297,4) =", round(chi2_cdf(0.297,4),4))
print("chi2_sf(0.297,4) =", round(chi2_sf(0.297,4),4))
print("chi2_ppf(0.95,4) =", round(chi2_ppf(0.95,4),4))
print("chi2_ppf(0.95,10) =", round(chi2_ppf(0.95,10),4))
print("chi2_ppf(0.05,1) =", round(chi2_ppf(0.05,1),4), " 1.96^2 =", 1.96**2)
print("chi2_sf(3.841,1) =", round(chi2_sf(3.841,1),4))

print()
print("="*70); print("m04 例6.1 样本方差与卡方"); print("="*70)
n, s2, sig2 = 20, 36.0, 25.0
print("P(s^2>45) = P(chi2_19>", (n-1)*45/sig2, ") =", round(chi2_sf((n-1)*45/sig2, n-1),4))
print("P(s^2>40) =", round(chi2_sf((n-1)*40/sig2, n-1),4))
q975=chi2_ppf(0.975,n-1); q025=chi2_ppf(0.025,n-1)
print("chi2_0.975,19 =",round(q975,3)," chi2_0.025,19 =",round(q025,3))
lo=(n-1)*s2/q975; hi=(n-1)*s2/q025
print("CI sigma^2 = (",round(lo,3),",",round(hi,3),") sqrt = (",round(math.sqrt(lo),3),",",round(math.sqrt(hi),3),")")
print("Var(s^2) = 2*625/19 =", round(2*625/19,3))

print()
print("="*70); print("m04 例3.2 负二项"); print("="*70)
p=0.8
for k in [3,4,5,6]:
    print(f"P(X={k}) = C({k-1},2)*0.8^3*0.2^{k-3} =", round(math.comb(k-1,2)*p**3*(1-p)**(k-3),5))
print("E=r/p =", 3/0.8, " Var = r(1-p)/p^2 =", round(3*0.2/0.64,4))
# P(X<=5) 对照 P(几何>=...) 
print("P(X<=5) =", round(sum(math.comb(k-1,2)*p**3*(1-p)**(k-3) for k in [3,4,5]),5))

print()
print("="*70); print("m04 例7.6 混合分布"); print("="*70)
# 混合：0.6*N(10,4) + 0.4*N(30,9)
w1,w2 = 0.6,0.4
mu = w1*10+w2*30
var = w1*(4+100)+w2*(9+900)-mu**2
print("E =", mu, " Var =", round(var,4), " sd =", round(math.sqrt(var),4))
print("E(X^2) =", round(w1*(4+100)+w2*(9+900),4))

print()
print("="*70); print("m04 例5.1 CLT 失效：重尾"); print("="*70)
# Cauchy 例子：均值不存在
print("Cauchy: E 不存在 -> CLT 不适用。示例：P(|X|>1) =", round(2*(1-2/math.pi),4))
print("CLT 失效：学生 t 分布 nu=1 (Cauchy)")
# 用对数正态的极端例子
print("lognormal mu=0,sigma=1: E(X)=", round(math.exp(0.5),4), " Var=", round((math.exp(1)-1)*math.exp(1),4))
# 中位数/均值对比
print("重尾分布 P(X>10) 计算：卡方分布 chi2_1 的右尾")
print("P(chi2_1 > 6.635) =", round(chi2_sf(6.635,1),4), " (Z^2 > 6.635 <=> |Z|>2.576)")

print()
print("="*70); print("m04 例2.1 矩母函数求矩"); print("="*70)
# 泊松 MGF
lam = 3.0
print("Poisson MGF: M(t)=exp(lambda(e^t - 1))")
print("E(X)=lambda=", lam, " E(X^2)=lambda+lambda^2 =", lam+lam**2, " Var=lambda=", lam)
# 指数分布 MGF 求矩
lam2 = 0.5
print("Exp(0.5): M(t)=lambda/(lambda-t), E=1/lambda=2, E(X^2)=2/lambda^2=8, Var=4")
