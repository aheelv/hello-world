# -*- coding: utf-8 -*-
"""m06: 找手算友好的多元回归数据集（交叉积矩阵小整数解、非完美拟合）。"""
import math, random
from _stats_util import *

def build(rows):
    X = [[1]+list(r[:-1]) for r in rows]
    y = [r[-1] for r in rows]
    return ols(X, y)

random.seed(11)
vals = [-2,-1,0,1,2]
N = 6
res = []
for _ in range(2000000):
    x1 = [random.choice(vals) for _ in range(N)]
    x2 = [random.choice(vals) for _ in range(N)]
    x3 = [random.choice(vals) for _ in range(N)]
    if sum(x1) or sum(x2) or sum(x3): continue
    if min(len(set(v)) for v in (x1,x2,x3)) < 3: continue
    # 交叉积
    def cp(a,b): return sum(a[i]*b[i] for i in range(N))
    S = [[cp(x1,x1), cp(x1,x2), cp(x1,x3)],
         [cp(x2,x1), cp(x2,x2), cp(x2,x3)],
         [cp(x3,x1), cp(x3,x2), cp(x3,x3)]]
    if max(abs(S[i][j]) for i in range(3) for j in range(3)) > 30: continue
    # 找一个 y：使 beta 接近整数但不完美
    base = [x1[i] + 2*x2[i] - x3[i] for i in range(N)]
    for noise in ([0,0,0,0,1,-1], [0,1,0,-1,0,0], [0,0,1,0,-1,0], [1,0,-1,0,0,-1],
                  [0,0,1,-1,0,0], [1,-1,0,0,0,0]):
        y = [base[i]+noise[i] for i in range(N)]
        try:
            m = build([(x1[i],x2[i],x3[i],y[i]) for i in range(N)])
        except ZeroDivisionError:
            continue
        b = m["beta"]
        if not (0.6 < m["r2"] < 0.97): continue
        if max(abs(v) for v in b) > 6: continue
        # 变量对之间相关系数不能太大
        def cor(a,b):
            ma,mb = sum(a)/N, sum(b)/N
            num = sum((a[i]-ma)*(b[i]-mb) for i in range(N))
            da = math.sqrt(sum((v-ma)**2 for v in a)); db = math.sqrt(sum((v-mb)**2 for v in b))
            return num/(da*db)
        cors = [abs(cor(x1,x2)), abs(cor(x1,x3)), abs(cor(x2,x3))]
        if max(cors) > 0.9: continue
        # 交叉积小 & 解好
        score = (max(abs(S[i][j]) for i in range(3) for j in range(3)), max(cors))
        res.append((score, x1[:], x2[:], x3[:], y[:], [round(v,4) for v in b],
                    round(m["r2"],4), round(m["sse"],4), [round(c,4) for c in cors], S))
res.sort(key=lambda t: t[0])
for r in res[:6]:
    print("x1=",r[1],"x2=",r[2],"x3=",r[3],"y=",r[4])
    print("   beta=",r[5]," R2=",r[6]," SSE=",r[7]," cor=",r[8]," S=",r[9])
print("n found", len(res))
