# -*- coding: utf-8 -*-
"""共用数值工具：分布函数、线性代数、回归。"""
import math

# ---------------- 分布函数 ----------------
def _gser(a, x):
    ap, s, d = a, 1.0/a, 1.0/a
    for _ in range(1000):
        ap += 1; d *= x/ap; s += d
        if abs(d) < abs(s)*1e-15: break
    return s*math.exp(-x + a*math.log(x) - math.lgamma(a))

def _gcf(a, x):
    tiny = 1e-300
    b, c, d = x+1.0-a, 1.0/tiny, 1.0/(x+1.0-a)
    h = d
    for i in range(1, 1000):
        an = -i*(i-a); b += 2.0
        d = an*d+b
        if abs(d) < tiny: d = tiny
        c = b + an/c
        if abs(c) < tiny: c = tiny
        d = 1.0/d
        de = d*c; h *= de
        if abs(de-1.0) < 1e-15: break
    return math.exp(-x + a*math.log(x) - math.lgamma(a))*h

def gammq(a, x):
    if x == 0: return 1.0
    if x < a+1.0: return 1.0 - _gser(a, x)
    return _gcf(a, x)

def chi2_sf(x, df): return gammq(df/2.0, x/2.0)
def chi2_cdf(x, df): return 1.0 - chi2_sf(x, df)

def chi2_ppf(p, df):
    lo, hi = 0.0, 300.0
    for _ in range(200):
        mid = (lo+hi)/2
        if chi2_cdf(mid, df) < p: lo = mid
        else: hi = mid
    return (lo+hi)/2

def norm_cdf(z): return 0.5*(1.0+math.erf(z/math.sqrt(2.0)))
def norm_sf(z): return 1.0 - norm_cdf(z)

def norm_ppf(p):
    a=[-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,
       1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00]
    b=[-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,
       6.680131188771972e+01,-1.328068155288572e+01]
    c=[-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,
       -2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00]
    d=[7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,
       3.754408661907416e+00]
    pl,ph = 0.02425, 1-0.02425
    if p<pl:
        q=math.sqrt(-2*math.log(p))
        x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    elif p<=ph:
        q=p-0.5; r=q*q
        x=(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
    else:
        q=math.sqrt(-2*math.log(1-p))
        x=-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    e=norm_cdf(x)-p; u=e*math.sqrt(2*math.pi)*math.exp(x*x/2)
    return x-u/(1+x*u/2)

def betacf(a,b,x):
    MAXIT,EPS,FPMIN = 300,3e-16,1e-300
    qab,qap,qam = a+b,a+1.0,a-1.0
    c=1.0; d=1.0-qab*x/qap
    if abs(d)<FPMIN: d=FPMIN
    d=1.0/d; h=d
    for m in range(1,MAXIT+1):
        m2=2*m
        aa=m*(b-m)*x/((qam+m2)*(a+m2))
        d=1.0+aa*d
        if abs(d)<FPMIN: d=FPMIN
        c=1.0+aa/c
        if abs(c)<FPMIN: c=FPMIN
        d=1.0/d; h*=d*c
        aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2))
        d=1.0+aa*d
        if abs(d)<FPMIN: d=FPMIN
        c=1.0+aa/c
        if abs(c)<FPMIN: c=FPMIN
        d=1.0/d; de=d*c; h*=de
        if abs(de-1.0)<EPS: break
    return h

def betai(a,b,x):
    if x<=0: return 0.0
    if x>=1: return 1.0
    bt=math.exp(math.lgamma(a+b)-math.lgamma(a)-math.lgamma(b)+a*math.log(x)+b*math.log(1-x))
    if x < (a+1.0)/(a+b+2.0): return bt*betacf(a,b,x)/a
    return 1.0 - bt*betacf(b,a,1.0-x)/b

def t_cdf(t, df):
    x = df/(df+t*t)
    p = 0.5*betai(df/2.0, 0.5, x)
    return 1.0-p if t>0 else p

def t_sf(t, df): return 1.0 - t_cdf(t, df)

def t_ppf(p, df):
    lo, hi = -60.0, 60.0
    for _ in range(200):
        mid=(lo+hi)/2
        if t_cdf(mid,df)<p: lo=mid
        else: hi=mid
    return (lo+hi)/2

# ---------------- 线性代数 ----------------
def matmul(A,B):
    n,k,m = len(A),len(B),len(B[0])
    return [[sum(A[i][t]*B[t][j] for t in range(k)) for j in range(m)] for i in range(n)]

def transpose(A): return [list(c) for c in zip(*A)]

def inverse(A):
    n=len(A)
    aug=[row[:]+[1.0 if i==j else 0.0 for j in range(n)] for i,row in enumerate(A)]
    for i in range(n):
        piv=max(range(i,n),key=lambda r:abs(aug[r][i]))
        aug[i],aug[piv]=aug[piv],aug[i]
        d=aug[i][i]; aug[i]=[v/d for v in aug[i]]
        for r in range(n):
            if r!=i:
                f=aug[r][i]
                if f: aug[r]=[aug[r][c]-f*aug[i][c] for c in range(2*n)]
    return [row[n:] for row in aug]

def solve(A,b):
    return [r[0] for r in matmul(inverse(A),[[v] for v in b])]

def ols(X, y):
    XtX = matmul(transpose(X), X)
    Xty = matmul(transpose(X), [[v] for v in y])
    beta = solve(XtX, [r[0] for r in Xty])
    yhat=[sum(X[i][j]*beta[j] for j in range(len(beta))) for i in range(len(y))]
    resid=[y[i]-yhat[i] for i in range(len(y))]
    sse=sum(r*r for r in resid)
    ybar=sum(y)/len(y)
    sst=sum((v-ybar)**2 for v in y)
    n,p = len(y), len(beta)
    r2 = 1-sse/sst
    adj = 1-(sse/(n-p))*((n-1)/sst)
    # 系数标准误
    sigma2 = sse/(n-p)
    invXtX = inverse(XtX)
    se = []
    for j in range(p):
        v = sigma2*invXtX[j][j]
        se.append(math.sqrt(v) if v > 0 else float('nan'))
    tstat = [beta[j]/se[j] if se[j] == se[j] and se[j] != 0 else float('nan') for j in range(p)]
    return dict(beta=beta, se=se, t=tstat, yhat=yhat, resid=resid, sse=sse, sst=sst,
                r2=r2, adj=adj, n=n, p=p, sigma2=sigma2, df=n-p, ybar=ybar)
