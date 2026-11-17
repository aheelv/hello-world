# -*- coding: utf-8 -*-
"""几何分布：定义 X = 首次成功所在试验序号。校验 MOM/MLE 的偏差与无偏修正。"""
import math, random
random.seed(2024)
p = 0.4; M = 500000
for n in [5, 50]:
    s1 = s2 = s3 = 0.0
    for _ in range(M):
        tot = 0.0
        for _ in range(n):
            k = 0
            while True:
                k += 1
                if random.random() <= p: break
            tot += k
        s1 += 1/(tot/n)     # 1/xbar
        s2 += (n-1)/tot
        if tot > n: s3 += (n-1)/(tot-n)
    print(f"n={n}: E[1/xbar]={s1/M:.4f}  E[(n-1)/S]={s2/M:.4f}  E[(n-1)/(S-n)]={s3/M:.4f}  (p=0.4)")

# 理论：几何 E(X)=1/p
# E[1/xbar] 的精确值对几何比较复杂，用 Jensen 说明偏差方向即可
print()
print("样本 x = 2,3,5,4,6 -> S=20, xbar=4")
print("MOM: 1/xbar =", 1/4)
print("MLE: n/S =", 5/20)
print("无偏修正 (n-1)/S =", 4/20)
print("无偏修正 (n-1)/(S-n) =", 4/15)

# 指数
print()
print("指数：x = 2.1,3.4,1.8,4.5,2.7 -> S=14.5, xbar=2.9")
print("MOM: 1/xbar =", round(1/2.9,4))
print("MLE: n/S =", round(5/14.5,4))
print("无偏 (n-1)/S =", round(4/14.5,4))
print("对应平均寿命: MLE 2.9, 无偏", round(14.5/4,4))
