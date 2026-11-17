# -*- coding: utf-8 -*-
"""数值计算助手：卡方分布、回归、逻辑回归、Lasso 等。"""
import math

# ---------- 通用：正则化不完全 Gamma ----------
def _gser(a, x):
    ap, s, d = a, 1.0 / a, 1.0 / a
    for _ in range(1000):
        ap += 1
        d *= x / ap
        s += d
        if abs(d) < abs(s) * 1e-15:
            break
    return s * math.exp(-x + a * math.log(x) - math.lgamma(a))

def _gcf(a, x):
    tiny = 1e-300
    b, c, d = x + 1.0 - a, 1.0 / tiny, 1.0 / (x + 1.0 - a)
    h = d
    for i in range(1, 1000):
        an = -i * (i - a)
        b += 2.0
        d = an * d + b
        if abs(d) < tiny: d = tiny
        c = b + an / c
        if abs(c) < tiny: c = tiny
        d = 1.0 / d
        de = d * c
        h *= de
        if abs(de - 1.0) < 1e-15:
            break
    return math.exp(-x + a * math.log(x) - math.lgamma(a)) * h

def gammq(a, x):
    if x < 0 or a <= 0:
        raise ValueError
    if x == 0:
        return 1.0
    if x < a + 1.0:
        return 1.0 - _gser(a, x)
    return _gcf(a, x)

def chi2_sf(x, df):
    """P(chi2_df > x)"""
    return gammq(df / 2.0, x / 2.0)

def chi2_cdf(x, df):
    return 1.0 - chi2_sf(x, df)

def norm_cdf(z):
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))

def norm_sf(z):
    return 1.0 - norm_cdf(z)

def norm_ppf(p):
    """Acklam 逆正态近似"""
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680131188771972e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
         3.754408661907416e+00]
    pl, ph = 0.02425, 1 - 0.02425
    if p < pl:
        q = math.sqrt(-2 * math.log(p))
        x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    elif p <= ph:
        q = p - 0.5; r = q * q
        x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
    else:
        q = math.sqrt(-2 * math.log(1 - p))
        x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    # 一步 Newton 修正
    e = norm_cdf(x) - p
    u = e * math.sqrt(2 * math.pi) * math.exp(x * x / 2)
    return x - u / (1 + x * u / 2)

# ---------- 线性代数 ----------
def matmul(A, B):
    n, k, m = len(A), len(B), len(B[0])
    return [[sum(A[i][t] * B[t][j] for t in range(k)) for j in range(m)] for i in range(n)]

def transpose(A):
    return [list(col) for col in zip(*A)]

def inverse(A):
    n = len(A)
    aug = [row[:] + [1.0 if i == j else 0.0 for j in range(n)] for i, row in enumerate(A)]
    for i in range(n):
        piv = max(range(i, n), key=lambda r: abs(aug[r][i]))
        aug[i], aug[piv] = aug[piv], aug[i]
        d = aug[i][i]
        aug[i] = [v / d for v in aug[i]]
        for r in range(n):
            if r != i:
                f = aug[r][i]
                if f:
                    aug[r] = [aug[r][c] - f * aug[i][c] for c in range(2 * n)]
    return [row[n:] for row in aug]

def solve(A, b):
    return [row[0] for row in matmul(inverse(A), [[v] for v in b])]

def ols(X, y):
    """X 含截距列"""
    XtX = matmul(transpose(X), X)
    Xty = matmul(transpose(X), [[v] for v in y])
    beta = solve(XtX, [r[0] for r in Xty])
    yhat = [sum(X[i][j] * beta[j] for j in range(len(beta))) for i in range(len(y))]
    resid = [y[i] - yhat[i] for i in range(len(y))]
    sse = sum(r * r for r in resid)
    ybar = sum(y) / len(y)
    sst = sum((v - ybar) ** 2 for v in y)
    n, p = len(y), len(beta)
    r2 = 1 - sse / sst
    adj = 1 - (sse / (n - p)) * ((n - 1) / sst)
    return dict(beta=beta, yhat=yhat, resid=resid, sse=sse, sst=sst, r2=r2, adj=adj, n=n, p=p,
                sigma2=sse / (n - p), df=n - p)

print("=" * 70)
print("m04 相关数值")
print("=" * 70)
# 卡方 df=15 / 24 尾概率
print("chi2_sf(24, 15) =", round(chi2_sf(24, 15), 4))
print("chi2_sf(28.8, 24) =", round(chi2_sf(28.8, 24), 4))
print("chi2_sf(23.337, 15) =", round(chi2_sf(23.337, 15), 4))
print("chi2_sf(16.919, 15) =", round(chi2_sf(16.919, 15), 4))
print("chi2_cdf(3.841, 1) =", round(chi2_cdf(3.841, 1), 4))
print("chi2_sf(3.841, 1) =", round(chi2_sf(3.841, 1), 4))
print("chi2_sf(7.385, 2) =", round(chi2_sf(7.385, 2), 4))
print("chi2_sf(18.307, 10) =", round(chi2_sf(18.307, 10), 4))
print("chi2_sf(3.247, 10) =", round(chi2_sf(3.247, 10), 4))
print("chi2_sf(0.769, 4) =", round(chi2_sf(0.769, 4), 4))
print("chi2_sf(8.3333, 2) =", round(chi2_sf(8.3333, 2), 4))
print("chi2_sf(5.991, 2) =", round(chi2_sf(5.991, 2), 4))

# 负二项
p = 0.8
print("NB P(X=3) =", round(p ** 3, 5))
print("NB P(X=4) =", round(math.comb(3, 2) * p ** 3 * 0.2, 5))
print("NB P(X=5) =", round(math.comb(4, 2) * p ** 3 * 0.2 ** 2, 5))
print("NB E =", 3 / 0.8, " Var =", 3 * 0.2 / 0.64)

# zeta(3)
zeta3 = 5.9307443755142  # 近似值 via sum
s = 0.0
for k in range(1, 200000):
    s += 1.0 / k ** 3
print("zeta(3) =", round(s, 6), " c =", round(1 / s, 6))
c = 1 / s
print("E[X] = c*pi^2/6 =", round(c * math.pi ** 2 / 6, 4))
print("P(X<=1) =", round(c, 4), " P(X<=2) =", round(c * (1 + 1 / 8), 4))
print("P(X>100) approx =", round(c / 20000, 8))

print()
print("=" * 70)
print("m05 相关数值")
print("=" * 70)
def wilson(x, n, z=1.96):
    ph = x / n
    den = 1 + z * z / n
    cen = (ph + z * z / (2 * n)) / den
    half = (z / den) * math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n))
    return cen - half, cen + half

print("Wilson(8,100) =", [round(v, 4) for v in wilson(8, 100)])
print("Wald(8,100)   =", (round(0.08 - 1.96 * math.sqrt(0.08 * 0.92 / 100), 4),
                          round(0.08 + 1.96 * math.sqrt(0.08 * 0.92 / 100), 4)))
print("Wilson(42,100)=", [round(v, 4) for v in wilson(42, 100)])
print("n for +-3% p=0.5:", math.ceil(1.96 ** 2 * 0.25 / 0.03 ** 2))
print("n for +-2% p=0.5:", math.ceil(1.96 ** 2 * 0.25 / 0.02 ** 2))
print("n for +-3% p=0.4:", math.ceil(1.96 ** 2 * 0.4 * 0.6 / 0.03 ** 2))
# 功效: p1=0.10 -> p2=0.13
pb = 0.115
delta = 0.03
n = (1.96 + 0.8416) ** 2 * pb * (1 - pb) / delta ** 2
print("n for 80% power 10%->13%:", n, math.ceil(n))
# 列联表
print("chi2 indep 3x2 = 8.3333, p =", round(chi2_sf(8.3333, 2), 4))
print("Cramer V =", round(math.sqrt(8.3333 / 300), 4))
# Bonferroni / BH
pv = [0.001, 0.008, 0.02, 0.04, 0.06, 0.30, 0.50, 0.70, 0.80, 0.90]
m = len(pv)
print("Bonferroni alpha' =", 0.05 / m)
adj = [min(1.0, m / (i + 1) * v) for i, v in enumerate(pv)]
for i in range(len(pv) - 1, 0, -1):
    adj[i - 1] = min(adj[i - 1], adj[i])
print("BH adjusted:", [round(v, 4) for v in adj])
print("z for two-sided 0.0025:", round(norm_ppf(1 - 0.00125), 4))
print("1-0.95^20 =", round(1 - 0.95 ** 20, 4))
print("1-0.95^10 =", round(1 - 0.95 ** 10, 4))
