# -*- coding: utf-8 -*-
"""校验指数分布 MLE 的偏差。"""
import math, random
random.seed(99)
lam = 0.5; M = 500000; ne = 5
t1 = t2 = t3 = 0.0
tot_sum = 0.0
for _ in range(M):
    s = 0.0
    for _ in range(ne):
        s += -math.log(random.random())/lam
    tot_sum += s
    t1 += ne/s
    t2 += (ne-1)/s
print("样本均值 E[xbar] =", round(tot_sum/M/ne,4), " (真 1/lam =", 1/lam, ")")
print("E[1/xbar]     =", round(t1/M,4), " 理论 n*lam/(n-1) =", round(ne*lam/(ne-1),4))
print("E[(n-1)/S]     =", round(t2/M,4), " 理论 lam =", lam)
