# -*- coding: utf-8 -*-
"""最终核算：m07 六题 + m08 七题。"""
import math
from math import comb, lgamma, log, exp, erf, sqrt

def norm_cdf(x): return 0.5 * (1.0 + erf(x / sqrt(2.0)))
def norm_sf(x): return 1.0 - norm_cdf(x)

def betacf(a, b, x):
    MAXIT, EPS, FPMIN = 500, 3.0e-16, 1.0e-300
    qab, qap, qam = a + b, a + 1.0, a - 1.0
    c = 1.0; d = 1.0 - qab * x / qap
    if abs(d) < FPMIN: d = FPMIN
    d = 1.0 / d; h = d
    for m in range(1, MAXIT + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN: d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN: c = FPMIN
        d = 1.0 / d; h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN: d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN: c = FPMIN
        d = 1.0 / d; de = d * c; h *= de
        if abs(de - 1.0) < EPS: break
    return h

def betai(a, b, x):
    if x <= 0.0: return 0.0
    if x >= 1.0: return 1.0
    bt = exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * log(x) + b * log(1.0 - x))
    if x < (a + 1.0) / (a + b + 2.0):
        return bt * betacf(a, b, x) / a
    return 1.0 - bt * betacf(b, a, 1.0 - x) / b

def beta_ppf(q, a, b):
    lo, hi = 0.0, 1.0
    for _ in range(300):
        mid = (lo + hi) / 2
        if betai(a, b, mid) < q: lo = mid
        else: hi = mid
    return (lo + hi) / 2

def f_sf(f, d1, d2):
    if f <= 0: return 1.0
    return betai(d2 / 2.0, d1 / 2.0, d2 / (d2 + d1 * f))

def f_crit(alpha, d1, d2):
    lo, hi = 0.1, 200.0
    for _ in range(300):
        mid = (lo + hi) / 2
        if f_sf(mid, d1, d2) > alpha: lo = mid
        else: hi = mid
    return (lo + hi) / 2

def binom_sf(k, n, p):
    return sum(comb(n, i) * p ** i * (1 - p) ** (n - i) for i in range(k, n + 1))

def bb_pmf(k, n, a, b):
    """Beta-Binomial P(K=k | n, a, b)"""
    return comb(n, k) * exp(lgamma(a + k) + lgamma(b + n - k) - lgamma(a + b + n)
                            - lgamma(a) - lgamma(b) + lgamma(a + b))

def hyper_pmf(k, N, K, n):
    return comb(K, k) * comb(N - K, n - k) / comb(N, n)

def hyper_sf(k, N, K, n):
    return sum(hyper_pmf(i, N, K, n) for i in range(k, min(K, n) + 1))

print("### F 临界值核对")
for (d1, d2, tab) in [(2, 6, 5.14), (3, 6, 4.76), (2, 9, 4.26), (1, 8, 5.32)]:
    print(f"  F_.05({d1},{d2}) 自算={f_crit(0.05,d1,d2):.4f}  教材表={tab}")

print("\n### m07 例3.2 正态-正态")
A, B = 1/16, 5/4
prec = A + B
print(f"  精度 {prec}, sigma_n^2={1/prec:.6f}, sigma_n={sqrt(1/prec):.6f}")
print(f"  mu_n={(A*9+B*10.4)/prec:.6f}  权重 {A/prec:.6f}/{B/prec:.6f}")
print(f"  常数项 {A*B/prec*(9-10.4)**2:.6f}")
mn = (A*9+B*10.4)/prec; sn = sqrt(1/prec)
print(f"  CrI ({mn-1.96*sn:.4f},{mn+1.96*sn:.4f})")
se = sqrt(4/5)
print(f"  频率 CI ({10.4-1.96*se:.4f},{10.4+1.96*se:.4f}) SE={se:.6f}")

print("\n### m07 例3.3 Gamma-泊松")
print(f"  后验 Gamma(13,6) E={13/6:.6f} Var={13/36:.6f} sd={sqrt(13/36):.6f}; MLE=2.4")
p = 6/7
pr = [bb_pmf(k, 3, 13, 6) for k in range(4)]
print(f"  若未来3期计数 ~ NB(13, 6/7): P(k) = {[round(x,6) for x in pr]} sum={sum(pr):.6f}")
print(f"  NB 均值 {13*(1-p)/p:.6f} 方差 {13*(1-p)/p**2:.6f}")
print(f"  泊松后验预测: P(X=0)=(6/7)^13={p**13:.6f} P(X=1)={13*p**13*(1-p):.6f} P(X=2)={91*p**13*(1-p)**2:.6f} P(X>=3)={1-p**13-13*p**13*(1-p)-91*p**13*(1-p)**2:.6f}")
print(f"  强先验 Gamma(3,2) -> Gamma(15,7) E={15/7:.6f} vs 弱先验 E={13/6:.6f}")

print("\n### m07 例4.2 Beta(9,5)")
print(f"  mean={9/14:.6f} median={beta_ppf(0.5,9,5):.6f} mode={8/12:.6f}")
print(f"  P(p>0.5)={1-betai(9,5,0.5):.6f}; 频率单侧 p={binom_sf(7,10,0.5):.6f}")
print(f"  Jeffreys -> Beta(7.5,3.5) mean={7.5/11:.6f} mode={6.5/9:.6f} P(p>0.5)={1-betai(7.5,3.5,0.5):.6f}")
bb = [bb_pmf(k, 3, 9, 5) for k in range(4)]
plug = [comb(3,k)*0.7**k*0.3**(3-k) for k in range(4)]
plug2 = [comb(3,k)*(9/14)**k*(5/14)**(3-k) for k in range(4)]
print(f"  BetaBinom(3;9,5) = {[round(x,6) for x in bb]} sum={sum(bb):.6f}")
print(f"  plug p=0.7      = {[round(x,6) for x in plug]}")
print(f"  plug p=9/14     = {[round(x,6) for x in plug2]}")

print("\n### m07 例6.2 MH 多轮")
d = {2.0:0.20, 2.4:0.12, 2.1:0.09, 1.6:0.06}
cur = 2.0; chain=[2.0]; acc_n=0
for prop,u in [(2.4,0.50),(2.1,0.70),(1.6,0.80)]:
    al = min(1.0, d[prop]/d[cur]); ok = u < al; acc_n += ok
    chain.append(prop if ok else cur)
    print(f"  提议{prop} 当前{cur}: alpha=min(1,{d[prop]}/{d[cur]})={al:.4f} u={u} -> {'接受' if ok else '拒绝'}")
print(f"  链 {chain} 接受率 {acc_n}/3={acc_n/3:.4f} 保留样本均值 {(chain[1]+chain[2]+chain[3])/3:.6f}")
al2 = min(1.0, d[1.6]/d[2.1]); print(f"  变体：第3步 u=0.5 -> alpha={al2:.4f} -> 接受, 链 {chain[:3]+[1.6]}, 接受率 3/3, 均值 {(2.4+2.1+1.6)/3:.6f}")

print("\n### m07 例6.3 Gibbs")
print("  rho=0.5 -> 条件方差 0.75, sd=%.6f; 条件均值 0.5*对方" % sqrt(0.75))
t1=[0.30,0.45,-0.10,0.25]; t2=[0.10,-0.20,0.35,0.15]
print(f"  theta1 均值 {sum(t1)/4:.4f}, theta2 均值 {sum(t2)/4:.4f}")
print(f"  条件均值: 0, 0.15, 0.05, 0.225, -0.10, -0.05, 0.175, 0.125")

print("\n### m07 例7.2 ELBO")
p0,p1,q0,q1 = 0.3,0.7,0.5,0.5
kl = q0*log(q0/p0)+q1*log(q1/p1)
kl_rev = p0*log(p0/q0)+p1*log(p1/q1)
print(f"  KL(q||p)={kl:.6f}  KL(p||q)={kl_rev:.6f}")
logpx = -1.35
print(f"  ELBO = {logpx-kl:.6f}")
eq = 0.5*log(0.3*exp(logpx))+0.5*log(0.7*exp(logpx))
print(f"  E_q[log p(x,theta)] = {eq:.6f}; E_q[log q] = {0.5*log(0.5)*2:.6f}; ELBO = {eq-0.5*log(0.5)*2:.6f}")
ph=0.9
klh = 0.1*log(0.1/0.3)+0.9*log(0.9/0.7)
print(f"  q(1)=0.9: KL={klh:.6f} ELBO={logpx-klh:.6f} (更差)")
print(f"  最优 q=p: KL=0 ELBO=log p(x)={logpx:.6f}")

print("\n### m07 例8.1 贝叶斯因子")
pM1 = comb(10,7)*0.5**10
pM2 = bb_pmf(7,10,1,1)
pM2b = bb_pmf(7,10,2,2)
print(f"  p(x|M1)={pM1:.8f} p(x|M2,Beta(1,1))={pM2:.8f} (=1/11) BF={pM2/pM1:.8f}")
print(f"  后验模型概率 P(M2|x)={pM2/pM1/(1+pM2/pM1):.8f}")
print(f"  Beta(2,2): p={pM2b:.8f} BF={pM2b/pM1:.8f} P(M2|x)={(pM2b/pM1)/(1+pM2b/pM1):.8f}")

print("\n### m08 例2.2 比例样本量")
za, zb = 1.96, 0.84
def n_prop(p1,p2):
    pb=(p1+p2)/2
    ex=(za*sqrt(2*pb*(1-pb))+zb*sqrt(p1*(1-p1)+p2*(1-p2)))**2/(p1-p2)**2
    sp=2*(za+zb)**2*pb*(1-pb)/(p1-p2)**2
    return pb, ex, sp
pb,ex,sp = n_prop(0.12,0.08)
print(f"  8%->12%: pbar={pb} 精确 {ex:.4f}->{math.ceil(ex)} 简化 {sp:.4f}->{math.ceil(sp)}")
pb2,ex2,sp2 = n_prop(0.10,0.08)
print(f"  8%->10%: 精确 {ex2:.4f}->{math.ceil(ex2)} 简化 {sp2:.4f}->{math.ceil(sp2)}  比值 {ex2/ex:.4f} (平方律 {4})")
n_half=440; se=sqrt(2*0.10*0.90/n_half); z=(0.04)/se
print(f"  n=440: SE={se:.6f} z={z:.6f} 功效={norm_cdf(z-za):.6f} MDE={(za+zb)*se*100:.3f}pp")
n_need=math.ceil(ex)
print(f"  对照: 需求 {n_need}，实得 {n_half} -> 样本量缺口 {n_need-n_half}")

print("\n### m08 例3.2 区组 ANOVA")
blocks={"A":[8,12,10],"B":[9,13,9],"C":[11,12,12],"D":[10,15,11]}
allv=[x for v in blocks.values() for x in v]; N=len(allv); gm=sum(allv)/N
tr=[sum(v[i] for v in blocks.values()) for i in range(3)]
btr={k:sum(v) for k,v in blocks.items()}
SST=sum((x-gm)**2 for x in allv)
SSA=sum(4*((t/4)-gm)**2 for t in tr)
SSB=sum(3*((btr[k]/3)-gm)**2 for k in blocks)
SSE=SST-SSA-SSB
print(f"  gm={gm} SST={SST} SSA={SSA} SSB={SSB:.4f} SSE={SSE:.4f} 合计 {SSA+SSB+SSE:.4f}")
MSA,MSB,MSE=SSA/2,SSB/3,SSE/6
print(f"  MSA={MSA:.4f} MSB={MSB:.4f} MSE={MSE:.4f}")
print(f"  F_treat={MSA/MSE:.4f} p={f_sf(MSA/MSE,2,6):.6f}  临界 {f_crit(0.05,2,6):.4f}")
print(f"  F_block={MSB/MSE:.4f} p={f_sf(MSB/MSE,3,6):.6f}  临界 {f_crit(0.05,3,6):.4f}")
MSE2=(SST-SSA)/9
print(f"  忽略区组: SSE'={SST-SSA} df=9 MSE'={MSE2:.4f} F'={MSA/MSE2:.4f} p={f_sf(MSA/MSE2,2,9):.6f} 临界 {f_crit(0.05,2,9):.4f}")
print(f"  F 比 {MSA/MSE:.4f} vs {MSA/MSE2:.4f} -> 提升 {(MSA/MSE)/(MSA/MSE2):.4f} 倍")
print(f"  区组均值 {[round(btr[k]/3,4) for k in 'ABCD']} 处理均值 {[round(t/4,4) for t in tr]}")

print("\n### m08 例4.2 Holm/peeking")
ps=[0.008,0.012,0.03,0.04,0.2]; m=len(ps); al=0.05
print(f"  Bonferroni 阈值 {al/m:.4f} -> 显著 {sum(1 for p in ps if p<=al/m)}")
sp=sorted(ps); k=0
for i,p in enumerate(sp):
    thr=al/(m-i); ok=p<=thr
    print(f"   Holm{i+1}: p={p} vs {thr:.6f} {'通过' if ok else '停止'}")
    if not ok: break
    k+=1
print(f"  Holm 显著 {k}")
print(f"  peeking 10 次上界 1-0.95^10={1-0.95**10:.4f}; 20 次 {1-0.95**20:.4f}; Bonferroni 阈值 {al/10:.4f}")

print("\n### m08 例4.3 Fisher")
N,K,n=40,6,20
tab=[(5,15),(1,19)]
for k in range(0,7):
    print(f"   P(X={k})={hyper_pmf(k,N,K,n):.8f}")
p1s=hyper_sf(5,N,K,n); p2s=2*p1s
print(f"  单侧 P(X>=5)={p1s:.6f} 双侧(对称加倍)={p2s:.6f}")
print(f"  期望频数 处理组转化 = {n*K/N:.1f}; z 检验: phat={K/N}, SE={sqrt((K/N)*(1-K/N)*(2/20)):.6f}, z={(0.25-0.05)/sqrt((K/N)*(1-K/N)*(2/20)):.4f}, p单侧={norm_sf((0.25-0.05)/sqrt((K/N)*(1-K/N)*(2/20))):.6f}")
print(f"  OR=(5*19)/(15*1)={5*19/(15*1):.4f}")

print("\n### m08 例6.2 DID + 安慰剂 + 置换")
A_pre=[50,52,54]; A_post=[61,63]; B_pre=[48,49,51]; B_post=[54,55]
dA=sum(A_post)/2-sum(A_pre)/3; dB=sum(B_post)/2-sum(B_pre)/3
print(f"  dA={dA:.4f} dB={dB:.4f} DID={dA-dB:.4f}")
print(f"  安慰剂时点2: {(52-50)-(49-48)}  时点3: {(54-52)-(51-49)}")
perms=[]
for b in range(3):
    for sw in (0,1):
        A=[A_pre,B_pre][sw]; B=[B_pre,A_pre][1-sw]
        perms.append((A,B))
vals=[]
for b in range(3):
    pa=(sum(A_pre)-A_pre[b])/2-A_pre[b]; pb=(sum(B_pre)-B_pre[b])/2-B_pre[b]
    vals += [pa-pb, -(pa-pb)]
print(f"  6 种置换伪效应 {vals}")
mn=sum(vals)/len(vals); sd=sqrt(sum((v-mn)**2 for v in vals)/(len(vals)-1))
print(f"  零分布 均值 {mn:.4f} sd {sd:.4f} z={(dA-dB)/sd:.4f}; 最小可取 p={1/len(vals):.4f}")

print("\n### m08 例6.3 IPW")
rows=[("i1",1,"老",80,0.5),("i2",1,"老",80,0.5),("i3",0,"老",70,0.5),("i4",0,"老",70,0.5),
      ("i5",1,"新",60,0.25),("i6",0,"新",50,0.25),("i7",0,"新",50,0.25),("i8",0,"新",50,0.25)]
T=[(r[3],r[4]) for r in rows if r[1]==1]; C=[(r[3],r[4]) for r in rows if r[1]==0]
for r in rows:
    w = 1/r[4] if r[1]==1 else 1/(1-r[4])
    print(f"   {r[0]} T={r[1]} {r[2]} Y={r[3]} e={r[4]} 权重={w:.4f} 贡献={r[3]*w:.4f}")
nt=sum(y/e for y,e in T); dt=sum(1/e for _,e in T); nc=sum(y/(1-e) for y,e in C); dc=sum(1/(1-e) for _,e in C)
print(f"  处理组: sum TY/e={nt:.4f}, sum 1/e={dt:.4f}, 加权均值={nt/dt:.4f}")
print(f"  对照组: sum (1-T)Y/(1-e)={nc:.4f}, sum 1/(1-e)={dc:.4f}, 加权均值={nc/dc:.4f}")
print(f"  IPW ATE={nt/dt-nc/dc:.4f}; HT 形式={(nt-nc)/8:.4f}")
print(f"  朴素差={sum(y for y,_ in T)/3-sum(y for y,_ in C)/5:.4f}")
print(f"  加权后老用户占比 处理 {(1/0.5+1/0.5)/dt:.4f} 对照 {(1/0.5+1/0.5)/dc:.4f}; 未加权 {2/3:.4f} vs {2/5:.4f}")

print("\n### m08 例6.4 RDD")
left=[(14.2,9.52),(14.5,9.70),(14.8,9.88)]; right=[(15.2,6.02),(15.5,6.05),(15.8,6.08)]
def naive(h):
    l=[y for x,y in left if 15-x<=h]; r=[y for x,y in right if x-15<=h]
    return sum(l)/len(l), sum(r)/len(r), len(l), len(r)
for h in (0.3,0.6,0.9):
    lm,rm,nl,nr=naive(h); print(f"  h={h} 朴素 左{lm:.4f}(n={nl}) 右{rm:.4f}(n={nr}) 差{rm-lm:.4f}")
def ll(pts,c):
    n_=len(pts); xb=sum(x for x,_ in pts)/n_; yb=sum(y for _,y in pts)/n_
    b1=sum((x-xb)*(y-yb) for x,y in pts)/sum((x-xb)**2 for x,_ in pts)
    return yb-b1*xb+b1*c, b1
for h in (0.6,0.9):
    lp=[p for p in left if 15-p[0]<=h]; rp=[p for p in right if p[0]-15<=h]
    lv,lb=ll(lp,15.0); rv,rb=ll(rp,15.0)
    print(f"  h={h} 局部线性 左极限 {lv:.4f}(斜率{lb:.4f}) 右极限 {rv:.4f}(斜率{rb:.4f}) 跳跃 {rv-lv:.4f}")
