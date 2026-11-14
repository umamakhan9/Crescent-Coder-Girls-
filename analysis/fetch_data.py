import time
import requests
import pandas as pd
import numpy as np

# 1. Grid of points around the world
lats = range(-60, 61, 30)
lons = range(-150, 151, 60)
points = [(la, lo) for la in lats for lo in lons]

# 2. Variables
params = {"T2M": "Temperature", "PRECTOTCORR": "Rainfall"}

def fetch(lat, lon, param, start=1990, end=2024):
    url = "https://power.larc.nasa.gov/api/temporal/monthly/point"
    q = {
        "parameters": param, "community": "AG",
        "latitude": lat, "longitude": lon,
        "start": start, "end": end, "format": "JSON",
    }
    r = requests.get(url, params=q, timeout=60)
    r.raise_for_status()
    data = r.json()["properties"]["parameter"][param]
    rows = []
    for key, val in data.items():
        year, month = int(key[:4]), int(key[4:])
        if month == 13:
            continue
        rows.append({
            "variable": params[param], "lat": lat, "lon": lon,
            "date": pd.Timestamp(year, month, 1), "value": val,
        })
    return pd.DataFrame(rows)

# 3. Fetch everything
frames = []
for param in params:
    for lat, lon in points:
        try:
            print(f"Fetching {params[param]} at {lat}, {lon}")
            frames.append(fetch(lat, lon, param))
            time.sleep(1)
        except Exception as e:
            print("  failed:", e)

df = pd.concat(frames, ignore_index=True)
df.to_csv("raw_data.csv", index=False)

# 4. Clean missing values (-999 = missing)
df["value"] = df["value"].replace(-999, np.nan)
df = df.sort_values(["variable", "lat", "lon", "date"])
df["value"] = df.groupby(["variable", "lat", "lon"])["value"].transform(
    lambda s: s.interpolate(limit=3)
)

# 5. Anomaly = remove seasonal baseline
df["month"] = df["date"].dt.month
df["anomaly"] = df["value"] - df.groupby(
    ["variable", "lat", "lon", "month"]
)["value"].transform("mean")

# 6. Yearly file for the team
yearly = (
    df.assign(year=df["date"].dt.year)
      .groupby(["variable", "lat", "lon", "year"], as_index=False)["anomaly"].mean()
      .rename(columns={"anomaly": "value"})
)

df.to_csv("clean_monthly.csv", index=False)
yearly.to_csv("clean_yearly.csv", index=False)
print("Done!", len(yearly), "rows")
import pandas as pd
d=pd.read_csv('clean_yearly.csv')
print(d.isna().sum()); print(d.groupby('variable').size())
import pandas as pd

monthly = pd.read_csv("clean_monthly.csv")
yearly = pd.read_csv("clean_yearly.csv")

# Temperature
monthly[monthly["variable"] == "Temperature"].to_csv("temperature_monthly.csv", index=False)
yearly[yearly["variable"] == "Temperature"].to_csv("temperature_yearly.csv", index=False)

# Rainfall
monthly[monthly["variable"] == "Rainfall"].to_csv("rainfall_monthly.csv", index=False)
yearly[yearly["variable"] == "Rainfall"].to_csv("rainfall_yearly.csv", index=False)

print("Done! 4 files created.")