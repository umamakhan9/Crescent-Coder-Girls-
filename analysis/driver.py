import numpy as np
import pandas as pd
from scipy.stats import pearsonr

y = pd.read_csv("clean_yearly.csv")

# global mean temperature (lat ke hisaab se weighted)
t = y[y.variable == "Temperature"].copy()
t["w"] = np.cos(np.radians(t.lat))
t["wv"] = t.value * t.w
gm = t.groupby("year").wv.sum() / t.groupby("year").w.sum()

def series(v, lat, lon):
    return y[(y.variable == v) & (y.lat == lat) & (y.lon == lon)].set_index("year").value

def detrend(x):
    yr = np.arange(len(x))
    return x.values - np.polyval(np.polyfit(yr, x.values, 1), yr)

rows = []
for v, la, lo in [("Temperature", -60, 30), ("Temperature", 0, 90),
                  ("Rainfall", 0, 30), ("Rainfall", -30, -90)]:
    x = series(v, la, lo)
    r, p = pearsonr(x, gm)
    rd, pdt = pearsonr(detrend(x), detrend(gm))
    rows.append([v, la, lo, round(r, 2), round(p, 4), round(rd, 2), round(pdt, 4)])

out = pd.DataFrame(rows, columns=["variable", "lat", "lon", "r_raw", "p_raw", "r_detrended", "p_detrended"])
print(out)
out.to_csv("driver_correlation.csv", index=False)