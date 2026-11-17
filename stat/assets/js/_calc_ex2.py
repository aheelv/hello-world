# -*- coding: utf-8 -*-
"""模块 04/05/06 新增例题的数值核算（第 2 版：修正牛顿法符号、调整 VIF 数据）。"""
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _stats_util import (chi2_sf, chi2_cdf, chi2_ppf, norm_cdf, norm_sf, norm_ppf,
                         t_cdf, t_sf, t_ppf, betai, ols)

def hdr(t): print("\n" + "="*8 + " " + t + " " + "="*8)

def f_cdf(x, d1, d2):
    if x <= 0: return 0.0
    return betai(d1/2.0, d2/2.0, d1*x/(d1*x+d2))

def f_ppf(p, d1, d2):
    lo, hi = 0.0, 1e4
    for _ in range(300):
        mid = (lo+hi)/2
        if f_cdf(mid, d1, d2) < p: lo = mid
        else: hi = mid
    return (lo+hi)/2

def binom_cdf(k, n, p):
    return sum(math.comb(n, i)*p**i*(1-p)**(n-i) for i in range(0, k+1))

def binom_pmf(k, n, p):
    return math.comb(n, k)*p**k*(1-p)**(n-k)

def pois_pmf(k, lam): return lam**k*math.exp(-lam)/math.factorial(k)
def pois_cdf(k, lam): return sum(pois_pmf(i, lam) for i in range(0, k+1))

def corr(a, b):
    ma, mb = sum(a)/len(a), sum(b)/len(b)
    sxy = sum((u-ma)*(v-mb) for u, v in zip(a, b))
    saa = sum((u-ma)**2 for u in a); sbb = sum((v-mb)**2 for v in b)
    return sxy/math.sqrt(saa*sbb)

# ================================================================ 模块 04
hdr("M04-1  MGF：指数分布  lam=0.25")
lam = 0.25
print("E(X)=1/lam =", 1/lam, " E(X^2)=2/lam^2 =", 2/lam**2, " Var = 1/lam^2 =", 1/lam**2)
print("两 Exp(0.25) 之和: mean =", 2/lam, " var =", 2/lam**2)

hdr("M04-2  卡方：样本方差右尾  N(20,5^2), n=16")
n, sig2 = 16, 25.0
for s2 in (30.0, 41.66):
    stat = (n-1)*s2/sig2
    print(f"s2={s2}: chi2 stat = {stat:.4f}  P(chi2_15 > stat) = {chi2_sf(stat, n-1):.4f}")
print("chi2_crit(0.05,15) =", chi2_ppf(0.95, 15), "-> s2 临界 =", 25*chi2_ppf(0.95,15)/15)
print("E(chi2_15)=15, Var=30 ; stat=15 时 P =", chi2_sf(15,15))

hdr("M04-3  t 与 F")
n = 12; xb = 50.0; s = 6.0
tc = t_ppf(0.975, n-1); se = s/math.sqrt(n)
print(f"t0.025,{n-1} = {tc:.3f}  SE = {se:.4f}  E = {tc*se:.4f}  CI = ({xb-tc*se:.4f}, {xb+tc*se:.4f})")
F = 16.0/4.0
print("F =", F, " F_crit(0.025,9,9) =", f_ppf(0.975,9,9), " p =", 2*(1-f_cdf(F,9,9)))
print("F_crit(0.05,9,9) =", f_ppf(0.95,9,9))

hdr("M04-4  CLT 边界：重尾")
data = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 200]
m = sum(data)/len(data); srt = sorted(data); med = (srt[4]+srt[5])/2
sd = math.sqrt(sum((v-m)**2 for v in data)/9)
print("mean =", m, " median =", med, " s =", round(sd,4))
trim = sorted(data)[:9]; m2 = sum(trim)/9
print("去极端值 mean =", m2, " s =", round(math.sqrt(sum((v-m2)**2 for v in trim)/8),4))
print("柯西 P(|X|<=1) =", 0.5, " P(|X|<=10) =", 2/math.pi*math.atan(10), " P(|X|<=1e6) =", 2/math.pi*math.atan(1e6))

hdr("M04-5  泊松近似二项 + 过离散 + 负二项")
n, p = 150, 0.02
print("lambda =", n*p, " P(X<=1) binom =", binom_cdf(1,n,p), " pois =", pois_cdf(1,n*p))
print("P(X=2) binom =", binom_pmf(2,n,p), " pois =", pois_pmf(2,n*p))
print("P(X=0) binom =", binom_pmf(0,n,p), " pois =", pois_pmf(0,n*p))
obs = [4, 7, 9, 11, 8, 6]
lam_hat = sum(obs)/len(obs)
chi2 = sum((o-lam_hat)**2/lam_hat for o in obs)
print("GOF obs", obs, "lam_hat", lam_hat, "chi2", round(chi2,4), "df", len(obs)-2, "p", round(chi2_sf(chi2,len(obs)-2),4))
print("过离散比 9.1/4.2 =", 9.1/4.2)
def nb_pmf(k, r, p): return math.comb(k-1, r-1)*p**r*(1-p)**(k-r)
print("NB r=2 p=0.35: P(X=2)=", nb_pmf(2,2,0.35), " mean=", 2/0.35, " var=", 2*0.65/0.35**2)
print("Geom p=0.2: P(X=3)=", 0.8**2*0.2, " E=5, Var=20")

# ================================================================ 模块 05
hdr("M05-1  几何分布矩估计  xs=3,5,2,4,7")
xs = [3, 5, 2, 4, 7]
xb = sum(xs)/len(xs); x2 = sum(v*v for v in xs)/len(xs)
p1 = 1/xb
a, b, c = x2, 1.0, -2.0
p2 = (-b + math.sqrt(b*b - 4*a*c))/(2*a)
print("xbar", xb, " 二阶矩", x2, " p_MOM1", round(p1,4), " p_MOM2", round(p2,4), " MLE", round(p1,4))
print("E[X^2] at p1:", (2-p1)/p1**2, " 样本二阶矩:", x2)

hdr("M05-2  指数分布 MLE  xs=2.1,3.4,1.8,4.2,5.5,3.1")
xs = [2.1, 3.4, 1.8, 4.2, 5.5, 3.1]
S = sum(xs); n = len(xs); xb = S/n
print("S =", S, " xbar =", xb)
print("lam_MLE = n/S =", n/S, " lam_unb = (n-1)/S =", (n-1)/S, " lam_MOM = 1/xbar =", 1/xb)
print("mu_hat = 1/lam_MLE = xbar =", xb, " ; 1/lam_unb = S/(n-1) =", S/(n-1))
print("偏差方向 E[1/Xbar] > 1/E[Xbar] =", 1/xb)

hdr("M05-3  Wilson vs Wald")
def wilson(k, n, z=1.96):
    ph = k/n; den = 1 + z*z/n
    cen = (ph + z*z/(2*n))/den
    hw = z/den*math.sqrt(ph*(1-ph)/n + z*z/(4*n*n))
    return cen-hw, cen+hw, cen, hw
def wald(k, n, z=1.96):
    ph = k/n; hw = z*math.sqrt(ph*(1-ph)/n); return ph-hw, ph+hw
for (k, n) in [(26,100),(1,10),(9,10),(3,10)]:
    w = wald(k,n); wi = wilson(k,n)
    print(f"k={k},n={n}: Wald=({w[0]:.4f},{w[1]:.4f})  Wilson=({wi[0]:.4f},{wi[1]:.4f})  center={wi[2]:.4f} half={wi[3]:.4f}")

hdr("M05-4  p 值误读（贝叶斯反例）")
for prior0 in (0.999, 0.99, 0.95):
    lik0, lik1 = 0.001, 0.5
    post0 = prior0*lik0/(prior0*lik0 + (1-prior0)*lik1)
    print(f"先验 P(H0)={prior0}: p值=0.001 -> P(H0|D) = {post0:.4f}, P(H1|D) = {1-post0:.4f}")
print("Cohen d=0.1, n=10000 -> z =", 0.1*math.sqrt(10000), " p <", norm_sf(10)*2)

hdr("M05-5a  GOF：故障次数是否服从泊松")
obs = [1,1,2,2,2,3,3,3,4,4,4,5,5,6,7,9,2,3,4,5,6,2,3,4,5,6,7,3,4,12]
n = len(obs); lam_hat = sum(obs)/n
mean_obs = lam_hat; var_obs = sum((o-mean_obs)**2 for o in obs)/(n-1)
chi2 = sum((o-lam_hat)**2/lam_hat for o in obs)
print("n =", n, " mean =", mean_obs, " var =", round(var_obs,4), " 比值 =", round(var_obs/mean_obs,4))
print("chi2 =", round(chi2,4), " df =", n-1-1, " p =", round(chi2_sf(chi2, n-2),6), " crit(0.05) =", chi2_ppf(0.95,n-2))
print("Bonferroni m=5 -> alpha'=0.01, crit =", chi2_ppf(0.99, n-2))

hdr("M05-5b  功效与样本量（两比例）")
p1, p2 = 0.30, 0.45
pbar = (p1+p2)/2; qbar = 1-pbar
za = norm_ppf(0.975); zb = norm_ppf(0.8)
def n_for(za_):
    return (za_*math.sqrt(2*pbar*qbar) + zb*math.sqrt(p1*(1-p1)+p2*(1-p2)))**2/(p1-p2)**2
n1 = n_for(za); n2 = n_for(norm_ppf(0.995))
print("z_a=1.96 z_b=0.8416 -> n/group =", round(n1,2), "->", math.ceil(n1))
print("Bonferroni z_a=2.576 -> n/group =", round(n2,2), "->", math.ceil(n2))
for nn in (100, 163, 200, 242):
    z = abs(p1-p2)/math.sqrt(pbar*qbar*(2/nn)) - za
    print(f"  n={nn}/组: 功效 = {norm_cdf(z):.4f}")
# 单样本均值检验的样本量
sd, diff, eps = 20.0, 5.0, 1.0
nmean = ((za*sd + zb*sd)**2)/diff**2
print("均值检验：sigma=20, 差=5, n =", round(nmean,2), "->", math.ceil(nmean))

# ================================================================ 模块 06
hdr("M06-1  R^2 与调整 R^2")
n = 20; SST = 500.0
for name, p, sse in [("A(p=1)", 1, 50.0), ("B(p=3)", 3, 47.5)]:
    r2 = 1 - sse/SST; adj = 1 - (1-r2)*(n-1)/(n-p-1)
    print(f"{name}: SSE={sse} R2={r2:.4f} adjR2={adj:.6f}")

hdr("M06-2  VIF 与共线性")
x1 = [10, 12, 14, 16, 18]
x2 = [12, 13, 16, 17, 20]
y  = [22, 25, 29, 32, 36]
r = corr(x1, x2)
print("x1", x1); print("x2", x2); print("y ", y)
print("r =", round(r,4), " r2 =", round(r*r,4), " VIF =", round(1/(1-r*r),3))
rs = ols([[1.0,u] for u in x1], y)
print("simple y~x1: beta", [round(v,4) for v in rs['beta']], "R2", round(rs['r2'],4))
rm = ols([[1.0,u,v] for u,v in zip(x1,x2)], y)
print("multi  y~x1+x2: beta", [round(v,4) for v in rm['beta']], "se", [round(v,4) for v in rm['se']],
      "t", [round(v,3) for v in rm['t']], "R2", round(rm['r2'],4), "adjR2", round(rm['adj'],4))
x3 = [5, 9, 2, 11, 4]
r3 = ols([[1.0,u,v,w] for u,v,w in zip(x1,x2,x3)], y)
print("multi+无用变量: beta", [round(v,4) for v in r3['beta']], "R2", round(r3['r2'],4), "adjR2", round(r3['adj'],4),
      "se x1", round(r3['se'][1],4))

hdr("M06-3  逻辑回归牛顿迭代（有重叠数据）")
xs = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]
ys = [0, 0, 1, 0, 1, 1, 1, 1]
def sigmoid(z): return 1/(1+math.exp(-z))
def loglik(b0,b1,xs,ys):
    s=0.0
    for xi,yi in zip(xs,ys):
        p=sigmoid(b0+b1*xi); s += yi*math.log(p)+(1-yi)*math.log(1-p)
    return s
def newton(xs,ys,b0,b1,iters=4):
    for it in range(iters):
        g0=g1=0.0; h00=h01=h11=0.0
        for xi,yi in zip(xs,ys):
            z=b0+b1*xi; p=sigmoid(z); w=p*(1-p); r=yi-p
            g0+=r; g1+=r*xi
            h00+=w; h01+=w*xi; h11+=w*xi*xi
        det=h00*h11-h01*h01
        d0=(h11*g0-h01*g1)/det; d1=(h00*g1-h01*g0)/det
        b0+=d0; b1+=d1
        print(f"  iter{it+1}: b0={b0:.6f} b1={b1:.6f} loglik={loglik(b0,b1,xs,ys):.6f}")
    return b0,b1
b0,b1 = newton(xs,ys,0.0,0.0,4)
print("OR = e^b1 =", math.exp(b1), " b0,b1 =", b0, b1)
for xi in (1,4,8):
    print("  x=",xi,"p=",round(sigmoid(b0+b1*xi),4))
# 小样本 2x2 版本
xs2 = [0.0,0.0,1.0,1.0,2.0,2.0,3.0,3.0]
ys2 = [0,1,0,1,1,0,1,1]
b0b,b1b = newton(xs2,ys2,0.0,0.0,4)
print("2x2 数据 OR =", math.exp(b1b))

hdr("M06-4  岭 vs Lasso")
xb, yb = 3.0, 6.2
Sxy, Sxx = 15.0, 10.0
x_ = [1,2,3,4,5]; y_ = [3,5,6,8,9]
for lam in (0.5, 1.0, 2.0, 5.0):
    br = Sxy/(Sxx+lam); b0r = yb-br*xb
    bl = max(Sxy/Sxx-lam, 0.0); b0l = yb-bl*xb
    sse_r = sum((y_[i]-(b0r+br*x_[i]))**2 for i in range(5))
    sse_l = sum((y_[i]-(b0l+bl*x_[i]))**2 for i in range(5))
    print(f"lam={lam}: ridge b1={br:.4f} b0={b0r:.4f} SSE={sse_r:.4f} | lasso b1={bl:.4f} b0={b0l:.4f} SSE={sse_l:.4f}")

hdr("M06-5  伪回归（随机游走）")
random.seed(20241021)
def rw(n, start=100.0):
    v=start; out=[]
    for _ in range(n):
        v += random.gauss(0,1); out.append(v)
    return out
xa = rw(20); ya = rw(20)
r1 = ols([[1.0,v] for v in xa], ya)
print("x:", [round(v,2) for v in xa])
print("y:", [round(v,2) for v in ya])
print("level: beta", [round(v,4) for v in r1['beta']], "R2", round(r1['r2'],4), "corr", round(corr(xa,ya),4))
dx = [xa[i+1]-xa[i] for i in range(19)]
dy = [ya[i+1]-ya[i] for i in range(19)]
r2d = ols([[1.0,v] for v in dx], dy)
print("diff: beta", [round(v,4) for v in r2d['beta']], "R2", round(r2d['r2'],4))
print("外推 x=120 -> y =", round(r1['beta'][0]+r1['beta'][1]*120,2), " (x 范围 %.2f ~ %.2f)" % (min(xa), max(xa)))
