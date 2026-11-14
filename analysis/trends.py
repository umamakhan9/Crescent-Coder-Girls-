import numpy as np
import pandas as pd
from scipy.stats import theilslopes, kendalltau

df = pd.read_csv("clean_yearly.csv")
results = []

# har location (variable + lat + lon) ke liye alag test
for (var, lat, lon), g in df.groupby(["variable", "lat", "lon"]):
    g = g.sort_values("year")
    slope, intercept, ci_lo, ci_hi = theilslopes(g["value"], g["year"])
    tau, p = kendalltau(g["year"], g["value"])
    results.append([var, lat, lon, slope, ci_lo, ci_hi, p])

out = pd.DataFrame(results, columns=[
                   "variable", "lat", "lon", "slope", "ci_lo", "ci_hi", "p"])

out["total_change"] = out["slope"] * 34   # 1990 se 2024 tak kitna badla
out["significant"] = out["p"] < 0.05      # raw p-value


# FDR correction (galat positives kam karne ke liye)
def fdr(p):
    p = np.asarray(p)
    n = len(p)
    order = np.argsort(p)
    q = p[order] * n / np.arange(1, n + 1)
    q = np.minimum.accumulate(q[::-1])[::-1]
    result = np.empty(n)
    result[order] = np.minimum(q, 1)
    return result


out["p_fdr"] = out.groupby("variable")["p"].transform(fdr)
out["significant_fdr"] = out["p_fdr"] < 0.05

# map aur direction FDR se banen (FDR ke BAAD)
out["trend_map"] = 0
out.loc[out.significant_fdr & (out.slope > 0), "trend_map"] = 1    # red
out.loc[out.significant_fdr & (out.slope < 0), "trend_map"] = -1   # blue

out["direction"] = "No significant change"
out.loc[out.trend_map == 1, "direction"] = "Increase"
out.loc[out.trend_map == -1, "direction"] = "Decrease"

out.to_csv("trend_results.csv", index=False)
print(out)
print(out.groupby("variable")["trend_map"].apply(lambda s: (s != 0).sum()))
