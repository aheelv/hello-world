# -*- coding: utf-8 -*-
"""为 m07 / m08 新增例题核算所有数值（纯标准库实现）。"""
import math
from math import comb, lgamma, log, exp, erf, sqrt

def norm_cdf(x):
    return 0.5 * (1.0 + erf(x / sqrt(2.0)))

def norm_sf(x):
    return 1.0 - norm_cdf(x)

def norm_ppf(p):
    lo, hi = -10.0, 10.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if norm_cdf(mid) < p:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

def betacf(a, b, x):
    MAXIT, EPS, FPMIN = 400, 3.0e-16, 1.0e-300
    qab, qap, qam = a + b, a + 1.0, a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < FPMIN:
        d = FPMIN
    d = 1.0 / d
    h = d
    for m in range(1, MAXIT + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN:
            d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN:
            c = FPMIN
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN:
            d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN:
            c = FPMIN
        d = 1.0 / d
        de = d * c
        h *= de
        if abs(de - 1.0) < EPS:
            break
    return h

def betai(a, b, x):
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    lbeta = lgamma(a + b) - lgamma(a) - lgamma(b)
    bt = exp(lbeta + a * log(x) + b * log(1.0 - x))
    if x < (a + 1.0) / (a + b + 2.0):
        return bt * betacf(a, b, x) / a
    return 1.0 - bt * betacf(b, a, 1.0 - x) / b

def beta_ppf(q, a, b):
    lo, hi = 0.0, 1.0
    for _ in range(300):
        mid = (lo + hi) / 2
        if betai(a, b, mid) < q:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

def f_sf(f, d1, d2):
    if f <= 0:
        return 1.0
    x = d2 / (d2 + d1 * f)
    return betai(d2 / 2.0, d1 / 2.0, x)

def hyper_sf(k, N, K, n):
    return sum(comb(K, i) * comb(N - K, n - i) / comb(N, n) for i in range(k, min(K, n) + 1))

def binom_sf(k, n, p):
    return sum(comb(n, i) * p ** i * (1 - p) ** (n - i) for i in range(k, n + 1))

def beta_binom_pmf(k, n, a, b):
    return comb(n, k) * exp(lgamma(a + k) + lgamma(b + n - k) - lgamma(a + b)
                            - lgamma(a) - lgamma(b)) * (lgamma(a + b + n) - lgamma(a + b))

print("=" * 72)
print("【m07 例 3.2】正态-正态共轭")
sig2, n, xbar, mu0, s02 = 4.0, 5, 10.4, 9.0, 16.0
A, B = 1.0 / s02, n / sig2
prec = A + B
sn2, sn = 1.0 / prec, sqrt(1.0 / prec)
mun = (A * mu0 + B * xbar) / prec
print(f"  A=1/s0^2={A}, B=n/sig^2={B}, prec={prec}, sn^2={sn2:.6f}, sn={sn:.6f}")
print(f"  mu_n={mun:.6f}  先验权重={A/prec:.6f} 数据权重={B/prec:.6f}")
print(f"  配方常数 AB/(A+B)(mu0-xbar)^2 = {A*B/prec*(mu0-xbar)**2:.6f}")
print(f"  CrI = ({mun-1.96*sn:.4f}, {mun+1.96*sn:.4f})")
se = sqrt(sig2 / n)
print(f"  频率派 MLE={xbar} SE={se:.6f} CI=({xbar-1.96*se:.4f}, {xbar+1.96*se:.4f})")
print(f"  平坦先验: sn^2=sigma^2/n={sig2/n}, sn={sqrt(sig2/n):.6f}, mu_n=xbar={xbar}")

print()
print("【m07 例 3.3】Gamma-泊松共轭 + 后验预测")
xs = [2, 3, 1, 4, 2]
nn, S = len(xs), sum(xs)
a0, b0 = 1.0, 1.0
a1, b1 = a0 + S, b0 + nn
print(f"  先验 Gamma({a0:.0f},{b0:.0f}) E={a0/b0:.4f}; MLE={S/nn:.4f}")
print(f"  后验 Gamma({a1:.0f},{b1:.0f}) E={a1/b1:.6f} Var={a1/b1**2:.6f} sd={sqrt(a1/b1**2):.6f}")
pn = b1 / (b1 + 1)
p0 = pn ** a1
p1 = comb(int(a1), 1) * p0 * (1 - pn)
p2 = comb(int(a1) + 1, 2) * p0 * (1 - pn) ** 2
print(f"  NB: r={a1:.0f} p={pn:.6f} E={a1*(1-pn)/pn:.6f} Var={a1*(1-pn)/pn**2:.6f}")
print(f"  P(X=0)={p0:.6f} P(X=1)={p1:.6f} P(X=2)={p2:.6f} P(X>=3)={1-p0-p1-p2:.6f}")
print(f"  经验贝叶斯先验 Gamma(3,2): 后验 Gamma(15,7) E={15/7:.6f} (弱先验 E={a1/b1:.6f})")
print(f"  先验权重: 弱 1/6={1/6:.6f} vs 强 2/7={2/7:.6f}")

print()
print("【m07 例 4.2】MAP/均值/中位数 + 后验预测 + 后验检验")
a, b = 9.0, 5.0
mean, mode = a / (a + b), (a - 1) / (a + b - 2)
med = beta_ppf(0.5, a, b)
print(f"  Beta({a:.0f},{b:.0f}) mean={mean:.6f} median={med:.6f} mode={mode:.6f}")
print(f"  偏度 {2*(b-a)*sqrt(a+b+1)/((a+b+2)*sqrt(a*b)):.4f} -> mean<median<mode: {mean<med<mode}")
print(f"  CrI ({beta_ppf(0.025,a,b):.4f}, {beta_ppf(0.975,a,b):.4f})")
print(f"  P(p>0.5|x) = {1-betai(a,b,0.5):.6f}   (I_0.5(9,5)={betai(a,b,0.5):.6f})")
print(f"  频率派单侧 p = {binom_sf(7,10,0.5):.6f}")
aj, bj = 7.5, 3.5
print(f"  Jeffreys Beta(0.5,0.5) -> Beta({aj},{bj}) mean={aj/(aj+bj):.6f} mode={(aj-1)/(aj+bj-2):.6f} P(p>0.5)={1-betai(aj,bj,0.5):.6f}")
for k in range(4):
    print(f"  BetaBinom K={k}/3: {beta_binom_pmf(k,3,9,5):.8f}   (plugin MLE 0.7: {comb(3,k)*0.7**k*0.3**(3-k):.8f}, 均值插件 0.642857: {comb(3,k)*0.642857**k*0.357143**(3-k):.8f})")

print()
print("【m07 例 6.2】MH 多轮 + Gibbs")
dens = {2.0: 0.20, 2.4: 0.12, 2.1: 0.15, 1.6: 0.06}
cur = 2.0
chain = [cur]
for prop, u in [(2.4, 0.5), (2.1, 0.7), (1.6, 0.5)]:
    alpha = min(1.0, dens[prop] / dens[cur])
    acc = u < alpha
    chain.append(prop if acc else cur)
    print(f"  提议 {prop}: alpha=min(1,{dens[prop]}/{dens[cur]})={alpha:.4f} u={u} -> {'接受' if acc else '拒绝'}")
print(f"  链 {chain}  接受率 2/3={2/3:.4f}  样本均值={(2.4+2.1+2.1)/3:.6f}")
print("  Gibbs rho=0.5, 条件方差 1-rho^2=0.75")
t1 = [0.30, 0.45, -0.10, 0.25]
t2 = [0.10, -0.20, 0.35, 0.15]
print(f"  theta1 抽到 {t1} 均值={sum(t1)/4:.4f}; theta2 抽到 {t2} 均值={sum(t2)/4:.4f} (真值均为 0)")
print(f"  条件均值检查: theta1|theta2=0.10 -> 0.5*0.10=0.05; theta2|theta1=0.45 -> 0.225; "
      f"theta1|theta2=0.35 -> 0.175; theta2|theta1=0.25 -> 0.125")

print()
print("【m07 例 8.1】边缘似然/贝叶斯因子/ELBO")
n_, s_ = 10, 7
pM1 = comb(n_, s_) * 0.5 ** n_
pM2 = beta_binom_pmf(s_, n_, 1.0, 1.0)
bf = pM2 / pM1
print(f"  p(x|M1)={pM1:.8f}  p(x|M2)={pM2:.8f} (=1/11={1/11:.8f})")
print(f"  BF_21={bf:.8f}  后验模型概率 P(M2|x)={bf/(1+bf):.8f}  P(M1|x)={1/(1+bf):.8f}")
pM2b = beta_binom_pmf(s_, n_, 2.0, 2.0)
bf2 = pM2b / pM1
print(f"  Beta(2,2) 先验: p(x|M2)={pM2b:.8f} BF={bf2:.8f} P(M2|x)={bf2/(1+bf2):.8f}")
lbp = lgamma(9) + lgamma(5) - lgamma(14)
print(f"  B(9,5)={exp(lbp):.10f} ln B(9,5)={lbp:.6f}")
logp2 = log(pM2)
kl = -( -12 - lbp)
print(f"  KL(Beta(1,1)||Beta(9,5)) = -int ln p = {kl:.6f}   (int ln p = {-12-lbp:.6f})")
print(f"  log p(x|M2)={logp2:.6f}  ELBO(q=Beta(1,1))={logp2-kl:.6f}   ELBO(q=后验)={logp2:.6f}")
print(f"  0.5*ln(1/0.09)+0.5*ln(1/0.81) 校验 = {0.5*log(1/0.09)+0.5*log(1/0.81):.6f}")

print()
print("=" * 72)
print("【m08 例 2.2】两比例样本量")
p1_, p2_ = 0.12, 0.08
pb = (p1_ + p2_) / 2
za, zb = 1.96, 0.84
num = (za * sqrt(2 * pb * (1 - pb)) + zb * sqrt(p1_ * (1 - p1_) + p2_ * (1 - p2_))) ** 2
n_exact = num / (p1_ - p2_) ** 2
n_simp = 2 * (za + zb) ** 2 * pb * (1 - pb) / (p1_ - p2_) ** 2
print(f"  pbar={pb} 精确 n={n_exact:.4f} -> {math.ceil(n_exact)}  简化 n={n_simp:.4f} -> {math.ceil(n_simp)}")
n_half = math.ceil(n_exact) // 2
se_h = sqrt(2 * pb * (1 - pb) / n_half)
z_nc = (p1_ - p2_) / se_h
print(f"  半样本 n={n_half}: SE={se_h:.6f} z_nc={z_nc:.6f} 功效≈{norm_cdf(z_nc-za):.6f}")
print(f"  该 n 下的 MDE=(za+zb)*SE={(za+zb)*se_h:.6f} ({(za+zb)*se_h*100:.3f}pp)")
pb2 = 0.08
num2 = (za * sqrt(2 * pb2 * (1 - pb2)) + zb * sqrt(0.10 * 0.90 + 0.06 * 0.94)) ** 2
print(f"  改成 6%->10%: n={num2/0.04**2:.4f} -> {math.ceil(num2/0.04**2)}  (平方律 {math.ceil(num2/0.04**2)/math.ceil(n_exact):.4f} 倍)")

print()
print("【m08 例 3.2】随机区组 ANOVA")
blocks = {"A": [8, 12, 10], "B": [9, 13, 9], "C": [11, 12, 12], "D": [10, 15, 11]}
tr = [sum(v[i] for v in blocks.values()) for i in range(3)]
btr = {k: sum(v) for k, v in blocks.items()}
allv = [x for v in blocks.values() for x in v]
N = len(allv); G = sum(allv); gm = G / N
tr_mean = [t / 4 for t in tr]; b_mean = {k: v / 3 for k, v in btr.items()}
SST = sum((x - gm) ** 2 for x in allv)
SSA = sum(4 * (m - gm) ** 2 for m in tr_mean)
SSB = sum(3 * (m - gm) ** 2 for m in b_mean.values())
SSE = SST - SSA - SSB
MSA, MSB, MSE = SSA / 2, SSB / 3, SSE / 6
Ft, Fb = MSA / MSE, MSB / MSE
print(f"  处理均值 {tr_mean}  区组均值 { {k: round(v,4) for k,v in b_mean.items()} }  总均值 {gm}")
print(f"  SST={SST} SSA={SSA} SSB={SSB:.4f} SSE={SSE:.4f}  合计={SSA+SSB+SSE:.4f}")
print(f"  MSA={MSA:.4f} MSB={MSB:.4f} MSE={MSE:.4f}")
print(f"  F_treat={Ft:.4f} p={f_sf(Ft,2,6):.6f}   F_block={Fb:.4f} p={f_sf(Fb,3,6):.6f}")
print(f"  临界值校验 F.05(2,6)={1/f_sf(5.14,2,6):.4f}(表5.14) F.05(3,6)={1/f_sf(4.76,3,6):.4f}(表4.76) F.05(2,9)={1/f_sf(4.26,2,9):.4f}(表4.26)")
SSE2 = SST - SSA; MSE2 = SSE2 / 9
print(f"  忽略区组: SSE'={SSE2} df=9 MSE'={MSE2:.4f} F'={MSA/MSE2:.4f} p={f_sf(MSA/MSE2,2,9):.6f}")
print(f"  灵敏度比 F_block/F_cram = {Ft/(MSA/MSE2):.4f}")

print()
print("【m08 例 4.2】Holm/Bonferroni + peeking + Fisher")
ps = [0.008, 0.012, 0.03, 0.04, 0.2]
alpha, m_ = 0.05, len(ps)
print(f"  Bonferroni 阈值 {alpha/m_:.6f} -> 显著数 {sum(1 for p in ps if p <= alpha/m_)}")
k = 0
for i, p in enumerate(sorted(ps)):
    thr = alpha / (m_ - i)
    ok = p <= thr
    print(f"  Holm 第{i+1}步 p={p:.4f} vs {thr:.6f} -> {'通过' if ok else '停止'}")
    if not ok:
        break
    k += 1
print(f"  Holm 显著数 {k}")
print(f"  peeking 1-0.95^10={1-0.95**10:.4f}  1-0.95^20={1-0.95**20:.4f}  Bonferroni 0.05/10={0.05/10:.4f}")
N_, K_, n_ = 40, 6, 20
print(f"  Fisher: N={N_} K={K_} n={n_} 观察 X=5  P(X>=5)={hyper_sf(5,N_,K_,n_):.6f}")
for kk in range(0, 8):
    print(f"    P(X={kk}) = {comb(K_,kk)*comb(N_-K_,n_-kk)/comb(N_,n_):.8f}")
phat = K_ / N_
se_ = sqrt(phat * (1 - phat) * (1 / 20 + 1 / 20))
z_ = (0.25 - 0.05) / se_
print(f"  期望频数: 处理组转化期望 = 20*{K_}/{N_} = {20*K_/N_:.1f} (<5 -> 近似不可靠)")
print(f"  z 检验: phat={phat} SE={se_:.6f} z={z_:.4f} 单侧 p={norm_sf(z_):.6f} 双侧 p={2*norm_sf(z_):.6f}")
print(f"  OR = (5*15)/(15*1) = {5*15/(15*1):.4f}")

print()
print("【m08 例 6.2】DID 平行趋势 + 安慰剂 + IPW")
A_pre, A_post = [50, 52, 54], [61, 63]
B_pre, B_post = [48, 49, 51], [54, 55]
dA = sum(A_post) / 2 - sum(A_pre) / 3
dB = sum(B_post) / 2 - sum(B_pre) / 3
print(f"  A: pre 均值 {sum(A_pre)/3:.4f} post 均值 {sum(A_post)/2:.4f} 变化 {dA:.4f}")
print(f"  B: pre 均值 {sum(B_pre)/3:.4f} post 均值 {sum(B_post)/2:.4f} 变化 {dB:.4f}")
print(f"  DID = {dA-dB:.4f}")
print(f"  安慰剂时点1: (52-50)-(49-48) = {(52-50)-(49-48)}")
print(f"  安慰剂时点2: (54-52)-(51-49) = {(54-52)-(51-49)}")
null = []
for bb in range(3):
    pa = (sum(A_pre) - A_pre[bb]) / 2 - A_pre[bb]
    pbv = (sum(B_pre) - B_pre[bb]) / 2 - B_pre[bb]
    null.append(pa - pbv)
mn = sum(null) / 3
sd = sqrt(sum((x - mn) ** 2 for x in null) / 2)
print(f"  置换零分布 {null} 均值 {mn} sd {sd:.6f} z={(dA-dB)/sd:.4f}")
print(f"  政策前趋势 A: +{A_pre[1]-A_pre[0]},+{A_pre[2]-A_pre[1]}  B: +{B_pre[1]-B_pre[0]},+{B_pre[2]-B_pre[1]}")
rows = [("i1", 1, "老", 80, 0.5), ("i2", 1, "老", 80, 0.5), ("i3", 0, "老", 70, 0.5),
        ("i4", 0, "老", 70, 0.5), ("i5", 1, "新", 60, 0.25), ("i6", 0, "新", 50, 0.25),
        ("i7", 0, "新", 50, 0.25), ("i8", 0, "新", 50, 0.25)]
t_y = [(r[3], r[4]) for r in rows if r[1] == 1]
c_y = [(r[3], r[4]) for r in rows if r[1] == 0]
nt = sum(y / e for y, e in t_y); dt = sum(1 / e for _, e in t_y)
nc = sum(y / (1 - e) for y, e in c_y); dc = sum(1 / (1 - e) for _, e in c_y)
print(f"  处理: sum TY/e={nt:.2f} sum 1/e={dt:.4f} -> {nt/dt:.4f}")
print(f"  对照: sum (1-T)Y/(1-e)={nc:.4f} sum 1/(1-e)={dc:.4f} -> {nc/dc:.4f}")
print(f"  IPW ATE = {nt/dt - nc/dc:.6f};  HT 形式 = {(nt-nc)/8:.6f}")
print(f"  朴素差 = {sum(y for y,_ in t_y)/3 - sum(y for y,_ in c_y)/5:.6f}")
print(f"  加权后 老用户占比: 处理 {(1/0.5+1/0.5)/dt:.4f} 对照 {(1/0.5+1/0.5)/dc:.4f}; 未加权 {2/3:.4f} vs {2/5:.4f}")
print(f"  权重: 处理老 {1/0.5}, 处理新 {1/0.25}, 对照老 {1/0.5}, 对照新 {1/0.75:.4f}")

print()
print("【m08 例 6.3】RDD 带宽")
left = [(14.2, 9.52), (14.5, 9.70), (14.8, 9.88)]
right = [(15.2, 6.02), (15.5, 6.05), (15.8, 6.08)]
def naive(h):
    l = [y for x, y in left if 15 - x <= h]; r = [y for x, y in right if x - 15 <= h]
    return sum(l) / len(l), sum(r) / len(r), len(l), len(r)
for h in (0.3, 0.6, 0.9):
    lm, rm, nl, nr = naive(h)
    print(f"  h={h}: 左 {lm:.4f}(n={nl}) 右 {rm:.4f}(n={nr}) 朴素差 {rm-lm:.4f}")
def local_linear(pts, c):
    nn_ = len(pts)
    xb = sum(x for x, _ in pts) / nn_; yb = sum(y for _, y in pts) / nn_
    b1 = sum((x - xb) * (y - yb) for x, y in pts) / sum((x - xb) ** 2 for x, _ in pts)
    return yb - b1 * xb + b1 * c, b1
for h in (0.6, 0.9):
    lp = [(x, y) for x, y in left if 15 - x <= h]; rp = [(x, y) for x, y in right if x - 15 <= h]
    lv, lb = local_linear(lp, 15.0); rv, rb = local_linear(rp, 15.0)
    print(f"  h={h} 局部线性: 左极限 {lv:.4f} (斜率{lb:.4f}) 右极限 {rv:.4f} (斜率{rb:.4f}) 跳跃 {rv-lv:.4f}")
