import os
import pandas as pd

# Determine the path to trend_results.csv relative to this file
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_CANDIDATE_PATHS = [
    os.path.join(_CURRENT_DIR, "results", "trend_results.csv"),
    os.path.join(_CURRENT_DIR, "trend_results.csv"),
    os.path.join(_CURRENT_DIR, "..", "results", "trend_results.csv"),
    os.path.join(_CURRENT_DIR, "..", "Team_Data_Analysis", "trend_results.csv"),
    "trend_results.csv",
]
_TREND_PATH = next((p for p in _CANDIDATE_PATHS if os.path.exists(p)), "trend_results.csv")

df = pd.read_csv(_TREND_PATH)


def get_stats(variable, lat, lon):
    d = df[df.variable.str.lower() == str(variable).strip().lower()].copy()
    if d.empty:
        # Fallback if variable doesn't match directly
        d = df.copy()
    # sabse qareebi grid cell (nearest Euclidean grid cell)
    d["dist"] = (d.lat - lat) ** 2 + (d.lon - lon) ** 2
    r = d.sort_values("dist").iloc[0]
    if bool(r.significant_fdr):
        word = "increase" if r.slope > 0 else "decrease"
        label = f"Significant {word}: {r.total_change:+.2f} over 1990-2024 (p_fdr={r.p_fdr:.3f})"
    else:
        label = "No significant change"
    return {
        "variable": str(r.variable),
        "lat": int(r.lat),
        "lon": int(r.lon),
        "slope": float(r.slope),
        "total_change": float(r.total_change),
        "p_fdr": float(r.p_fdr),
        "trend_map": int(r.trend_map),
        "label": label,
    }


if __name__ == "__main__":
    print(get_stats("Temperature", -58, 28))
