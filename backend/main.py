import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

try:
    from backend.stats_api import get_stats
except ImportError:
    from stats_api import get_stats

# Base directory for resolving data files
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_BASE_DIR, ".."))


def _resolve_path(rel_path: str, fallback_path: str) -> str:
    candidate_1 = os.path.join(_REPO_ROOT, rel_path)
    if os.path.exists(candidate_1):
        return candidate_1
    candidate_2 = os.path.join(_BASE_DIR, rel_path)
    if os.path.exists(candidate_2):
        return candidate_2
    candidate_3 = os.path.join(_REPO_ROOT, fallback_path)
    if os.path.exists(candidate_3):
        return candidate_3
    return candidate_1


CLEAN_YEARLY_PATH = _resolve_path("data/clean_yearly.csv", "Team_Data_Analysis/clean_yearly.csv")
TREND_RESULTS_PATH = _resolve_path("results/trend_results.csv", "Team_Data_Analysis/trend_results.csv")
DRIVER_CORR_PATH = _resolve_path("results/driver_correlation.csv", "Team_Data_Analysis/driver_correlation.csv")
OPPOSITE_TRENDS_PATH = _resolve_path("results/opposite_trends.csv", "Team_Data_Analysis/opposite_trends.csv")

# Load datasets into memory
try:
    df_yearly = pd.read_csv(CLEAN_YEARLY_PATH)
except Exception as e:
    df_yearly = pd.DataFrame()
    print(f"Warning: Could not load clean_yearly.csv: {e}")

try:
    df_trends = pd.read_csv(TREND_RESULTS_PATH)
except Exception as e:
    df_trends = pd.DataFrame()
    print(f"Warning: Could not load trend_results.csv: {e}")

try:
    df_drivers = pd.read_csv(DRIVER_CORR_PATH)
except Exception as e:
    df_drivers = pd.DataFrame()
    print(f"Warning: Could not load driver_correlation.csv: {e}")

try:
    df_opposite = pd.read_csv(OPPOSITE_TRENDS_PATH)
except Exception as e:
    df_opposite = pd.DataFrame()
    print(f"Warning: Could not load opposite_trends.csv: {e}")

# Initialize FastAPI application
app = FastAPI(
    title="Earth Trend Detective API",
    description="NASA Space Apps Challenge 2026 — Environmental & Climate Trend Detective API",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _clean_record(d: Dict[str, Any]) -> Dict[str, Any]:
    """Clean NaN and Inf values for valid JSON serialization."""
    out = {}
    for k, v in d.items():
        if isinstance(v, (float, np.floating)):
            if np.isnan(v) or np.isinf(v):
                out[k] = None
            else:
                out[k] = float(v)
        elif isinstance(v, (int, np.integer)):
            out[k] = int(v)
        elif isinstance(v, (bool, np.bool_)):
            out[k] = bool(v)
        else:
            out[k] = v
    return out


@app.get("/")
def root():
    return {
        "message": "Welcome to the Earth Trend Detective API",
        "documentation": "/docs",
        "health": "/api/health",
        "variables": "/api/variables",
    }


@app.get("/api/health")
def get_health():
    """Return backend status and dataset accessibility."""
    return {
        "status": "healthy",
        "service": "Earth Trend Detective API",
        "challenge": "NASA Space Apps Challenge 2026",
        "study_period": "1990-2024 (35 years)",
        "grid_points_count": 30,
        "datasets": {
            "clean_yearly": {
                "loaded": not df_yearly.empty,
                "rows": len(df_yearly),
                "path": CLEAN_YEARLY_PATH,
            },
            "trend_results": {
                "loaded": not df_trends.empty,
                "rows": len(df_trends),
                "path": TREND_RESULTS_PATH,
            },
            "driver_correlation": {
                "loaded": not df_drivers.empty,
                "rows": len(df_drivers),
                "path": DRIVER_CORR_PATH,
            },
            "opposite_trends": {
                "loaded": not df_opposite.empty,
                "rows": len(df_opposite),
                "path": OPPOSITE_TRENDS_PATH,
            },
        },
    }


@app.get("/api/variables")
def get_variables():
    """Return available climate variables."""
    return {
        "variables": [
            {
                "id": "Temperature",
                "nasa_code": "T2M",
                "name": "Temperature",
                "unit": "°C (anomaly)",
                "description": "Air Temperature at 2 Meters (NASA POWER Monthly Temporal API)",
            },
            {
                "id": "Rainfall",
                "nasa_code": "PRECTOTCORR",
                "name": "Precipitation / Rainfall",
                "unit": "mm/day (anomaly)",
                "description": "Precipitation Corrected (NASA POWER Monthly Temporal API)",
            },
        ]
    }


@app.get("/api/trends")
def get_trends(variable: Optional[str] = Query(None, description="Filter by variable name (e.g. Temperature or Rainfall)")):
    """Return trend analysis results (Theil-Sen slope, Mann-Kendall p-value, FDR significance, trend_map)."""
    if df_trends.empty:
        raise HTTPException(status_code=500, detail="Trend results dataset is not loaded.")

    data = df_trends.copy()
    if variable:
        var_norm = variable.strip().lower()
        data = data[data["variable"].str.lower() == var_norm]
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"Variable '{variable}' not found. Available variables: Temperature, Rainfall",
            )

    records = [_clean_record(r) for r in data.to_dict(orient="records")]
    return {
        "count": len(records),
        "variable_filter": variable,
        "trends": records,
    }


@app.get("/api/series")
def get_time_series(
    variable: str = Query(..., description="Variable name: Temperature or Rainfall"),
    lat: float = Query(..., description="Target Latitude (-60 to 60)"),
    lon: float = Query(..., description="Target Longitude (-150 to 150)"),
):
    """
    Return the 35-year annual anomaly time series (1990-2024) for the nearest available grid point.
    """
    if df_yearly.empty:
        raise HTTPException(status_code=500, detail="Yearly dataset is not loaded.")

    var_norm = variable.strip().lower()
    subset = df_yearly[df_yearly["variable"].str.lower() == var_norm].copy()

    if subset.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Variable '{variable}' not found in yearly dataset.",
        )

    # Find the nearest unique grid cell using Euclidean squared distance
    unique_cells = subset[["lat", "lon"]].drop_duplicates().copy()
    unique_cells["dist"] = (unique_cells["lat"] - lat) ** 2 + (unique_cells["lon"] - lon) ** 2
    nearest = unique_cells.sort_values("dist").iloc[0]

    matched_lat = float(nearest["lat"])
    matched_lon = float(nearest["lon"])

    cell_data = subset[
        (subset["lat"] == matched_lat) & (subset["lon"] == matched_lon)
    ].sort_values("year")

    series_list = [
        {"year": int(row["year"]), "value": float(row["value"])}
        for _, row in cell_data.iterrows()
    ]

    return {
        "variable": variable,
        "requested_location": {"lat": lat, "lon": lon},
        "matched_grid_cell": {"lat": matched_lat, "lon": matched_lon},
        "observations_count": len(series_list),
        "series": series_list,
    }


@app.get("/api/stats")
def get_grid_stats(
    variable: str = Query(..., description="Variable name: Temperature or Rainfall"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """
    Nearest grid cell statistical summary using Person 2's get_stats implementation.
    """
    try:
        result = get_stats(variable=variable, lat=lat, lon=lon)
        return _clean_record(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate stats: {e}")


@app.get("/api/drivers")
def get_drivers():
    """Return driver correlation analysis (global mean temperature correlation)."""
    if df_drivers.empty:
        raise HTTPException(status_code=500, detail="Driver correlation dataset is not loaded.")

    records = [_clean_record(r) for r in df_drivers.to_dict(orient="records")]
    return {
        "count": len(records),
        "description": "Pearson correlation against latitude-weighted global mean temperature",
        "drivers": records,
    }


@app.get("/api/comparisons")
def get_comparisons():
    """Return opposing climate trend comparisons across disparate regions."""
    if df_opposite.empty:
        raise HTTPException(status_code=500, detail="Opposite trends dataset is not loaded.")

    records = [_clean_record(r) for r in df_opposite.to_dict(orient="records")]
    return {
        "count": len(records),
        "description": "Regional opposing trends demonstrating climate divergence",
        "comparisons": records,
    }
