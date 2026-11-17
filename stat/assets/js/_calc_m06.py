# -*- coding: utf-8 -*-
"""最终数据集：m06 全部新例题数值。"""
import math, random
from _stats_util import *

def ols_multi(rows):
    X = [[1]+list(r[:-1]) for r in rows]
    y = [r[-1] for r in rows]
    return ols(X, y)

print("="*76); print("m06 例4.2: R2 vs 调整R2（加无用变量）"); print("="*76)
xd = list(range(1,11))
yd = [12,15,14,19,21,20,25,27,26,31]
random.seed(3)
best = None
for _ in range(20000):
    z = [random.randint(1,10) for _ in range(10)]
    if z == sorted(z) or z == sorted(z, reverse=True): pass
    m1 = ols([[1,v] for v in xd], yd)
    m2 = ols([[1,xd[i],z[i]] for i in range(10)], yd)
    if m2["r2"] > m1["r2"] and m2["adj"] < m1["adj"]:
        print("z =", z, " m1 R2", round(m1["r2"],4), "adj", round(m1["adj"],4),
              " SSE", m1["sse"], "| m2 R2", round(m2["r2"],4), "adj", round(m2["adj"],4),
              " SSE", round(m2["sse"],3), " beta", [round(v,3) for v in m2["beta"]],
              " se", [round(v,4) for v in m2["se"]], " t", [round(v,3) for v in m2["t"]])
        if best is None: best = z
        if sum(1 for _ in [1]) and len([1])>0: break
print()
print("chosen z =", best)
if best:
    m1 = ols([[1,v] for v in xd], yd); m2 = ols([[1,xd[i],best[i]] for i in range(10)], yd)
    print("m1: beta",[round(v,4) for v in m1["beta"]],"R2",round(m1["r2"],4),"adj",round(m1["adj"],4),"SSE",m1["sse"])
    print("m2: beta",[round(v,4) for v in m2["beta"]],"R2",round(m2["r2"],4),"adj",round(m2["adj"],4),"SSE",round(m2["sse"],4))
    print("m2 se", [round(v,4) for v in m2["se"]], "t", [round(v,3) for v in m2["t"]])

print()
print("="*76); print("m06 例4.2b: 预测带 vs 置信带"); print("="*76)
n = 10; xbar = sum(xd)/n; Sxx = sum((v-xbar)**2 for v in xd)
m1 = ols([[1,v] for v in xd], yd)
s = math.sqrt(m1["sse"]/(n-2)); tc = t_ppf(0.975, n-2)
for x0 in [5.5, 12.0]:
    yh = m1["beta"][0]+m1["beta"][1]*x0
    sem = s*math.sqrt(1/n+(x0-xbar)**2/Sxx)
    sep = s*math.sqrt(1+1/n+(x0-xbar)**2/Sxx)
    print(f"x0={x0}: yhat={round(yh,3)} CI=({round(yh-tc*sem,3)},{round(yh+tc*sem,3)}) "
          f"PI=({round(yh-tc*sep,3)},{round(yh+tc*sep,3)})  半宽 CI={round(tc*sem,3)} PI={round(tc*sep,3)}")
print("xbar",xbar,"Sxx",Sxx,"s",round(s,4),"t_crit",round(tc,3))

print()
print("="*76); print("m06 例4.3: 残差诊断三例"); print("="*76)
# (a) 异方差
xa=[1,2,3,4,5,6,7,8]; ya=[2.1,3.9,6.3,7.6,11.4,12.6,18.3,19.2]
ma=ols([[1,v] for v in xa],ya)
print("(a) beta",[round(v,4) for v in ma["beta"]],"fitted",[round(v,3) for v in ma["yhat"]])
print("    resid",[round(v,3) for v in ma["resid"]],"R2",round(ma["r2"],4))
# (b) 非线性
xb=[1,2,3,4,5,6]; yb=[2,3,5,9,14,21]
mb=ols([[1,v] for v in xb],yb)
print("(b) beta",[round(v,4) for v in mb["beta"]],"fitted",[round(v,3) for v in mb["yhat"]])
print("    resid",[round(v,3) for v in mb["resid"]],"R2",round(mb["r2"],4))
# (c) 异常点
xc=[1,2,3,4,5,6]; yc=[2.0,4.1,5.9,8.2,10.0,16.5]
mc=ols([[1,v] for v in xc],yc)
mcd=ols([[1,v] for v in xc],[2.0,4.1,5.9,8.2,10.0,8.4])
print("(c) 全样本 beta",[round(v,4) for v in mc["beta"]],"R2",round(mc["r2"],4),"SSE",round(mc["sse"],4))
print("    resid",[round(v,3) for v in mc["resid"]])
print("    剔除后 beta",[round(v,4) for v in mcd["beta"]],"R2",round(mcd["r2"],4),"SSE",round(mcd["sse"],4))

print()
print("="*76); print("m06 例5.1: 多元回归手算数据集"); print("="*76)
# 找：中心化后 S 与 Sxy 都是小整数、beta 解较干净
random.seed(2024)
vals=[-2,-1,0,1,2]; N=6; cands=[]
for _ in range(500000):
    x1=[random.choice(vals) for _ in range(N)]; x2=[random.choice(vals) for _ in range(N)]; x3=[random.choice(vals) for _ in range(N)]
    if sum(x1) or sum(x2) or sum(x3): continue
    if min(len(set(v)) for v in (x1,x2,x3))<3: continue
    def cp(a,b): return sum(a[i]*b[i] for i in range(N))
    S=[[cp(x1,x1),cp(x1,x2),cp(x1,x3)],[cp(x2,x1),cp(x2,x2),cp(x2,x3)],[cp(x3,x1),cp(x3,x2),cp(x3,x3)]]
    if max(abs(v) for v in S[0]+S[1]+S[2])>10: continue
    det=(S[0][0]*(S[1][1]*S[2][2]-S[1][2]*S[2][1])-S[0][1]*(S[1][0]*S[2][2]-S[1][2]*S[2][0])+S[0][2]*(S[1][0]*S[2][1]-S[1][1]*S[2][0]))
    if det==0: continue
    for noise in ([0,0,1,-1,0,0],[1,-1,0,0,0,0],[0,0,0,1,-1,0],[0,1,-1,0,0,0]):
        y=[x1[i]+2*x2[i]-x3[i]+noise[i] for i in range(N)]
        try: m=ols_multi([(x1[i],x2[i],x3[i],y[i]) for i in range(N)])
        except ZeroDivisionError: continue
        b=m["beta"]
        if not (0.85<m["r2"]<0.97): continue
        if max(abs(v) for v in b)>4: continue
        def r2_of(v,others):
            X=[[1]+[o[i] for o in others] for i in range(N)]; return ols(X,v)["r2"]
        vifs=[round(1/(1-r2_of(v,o)),3) for v,o in [(x1,[x2,x3]),(x2,[x1,x3]),(x3,[x1,x2])]]
        if max(vifs)>6: continue
        cands.append((tuple(x1),tuple(x2),tuple(x3),tuple(y),tuple(round(v,4) for v in b),
                      round(m["r2"],4),round(m["sse"],4),S,vifs,round(m["adj"],4)))
        if len(cands)>400: break
    if len(cands)>400: break
# 优先 Sxy 小整数
def score(c):
    x1,x2,x3,y=c[0],c[1],c[2],c[3]
    Sxy=[sum(x1[i]*y[i] for i in range(N)),sum(x2[i]*y[i] for i in range(N)),sum(x3[i]*y[i] for i in range(N))]
    return (max(abs(v) for v in Sxy), max(c[8]))
cands.sort(key=score)
for c in cands[:4]:
    x1,x2,x3,y=c[0],c[1],c[2],c[3]
    Sxy=[sum(x1[i]*y[i] for i in range(N)),sum(x2[i]*y[i] for i in range(N)),sum(x3[i]*y[i] for i in range(N))]
    print("x1=",x1,"x2=",x2,"x3=",x3,"y=",y)
    print("   S=",c[7]," Sxy=",Sxy," beta=",c[4],"R2=",c[5],"SSE=",c[6],"VIF=",c[8],"adjR2=",c[9]); print()
