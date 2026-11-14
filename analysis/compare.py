import pandas as pd
from scipy.stats import theilslopes, kendalltau

df = pd.read_csv("clean_yearly.csv")


def check(var, lat, lon):
    g = df[(df.variable == var) & (df.lat == lat)
           & (df.lon == lon)].sort_values("year")
    slope, _, lo, hi = theilslopes(g["value"], g["year"])
    tau, p = kendalltau(g["year"], g["value"])
    return [var, lat, lon, round(slope, 4), round(lo, 4), round(hi, 4), round(p, 5)]


rows = [
    check("Temperature", -60, 30),   # cooling
    check("Temperature", 0, 90),     # warming
    check("Rainfall", 0, 30),        # barh rahi hai
    check("Rainfall", -30, -90),     # ghat rahi hai
]

table = pd.DataFrame(
    rows, columns=["variable", "lat", "lon", "slope", "ci_lo", "ci_hi", "p"])
print(table)
table.to_csv("opposite_trends.csv", index=False)
