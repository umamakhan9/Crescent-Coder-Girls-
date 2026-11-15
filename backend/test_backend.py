import sys
import os

# Set working directory to Crescent-Coder-Girls-
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))

import main

print("--- Testing root() ---")
r_root = main.root()
print("Root:", r_root)
assert "message" in r_root
assert "TerraPulse" in r_root["message"]

print("\n--- Testing get_health() ---")
r_health = main.get_health()
print("Status:", r_health["status"])
print("Service:", r_health["service"])
print("Datasets loaded:", r_health["datasets"])
assert r_health["status"] == "healthy"
assert r_health["service"] == "TerraPulse API"
assert r_health["datasets"]["clean_yearly"]["loaded"] is True
assert r_health["datasets"]["trend_results"]["loaded"] is True

print("\n--- Testing get_variables() ---")
r_vars = main.get_variables()
print("Variables:", [v["id"] for v in r_vars["variables"]])
assert len(r_vars["variables"]) == 2

print("\n--- Testing get_trends(variable='Temperature') ---")
r_temp = main.get_trends(variable="Temperature")
print("Temperature trends count:", r_temp["count"])
print("Sample cell:", r_temp["trends"][0])
assert r_temp["count"] == 30

print("\n--- Testing get_trends(variable='Rainfall') ---")
r_rain = main.get_trends(variable="Rainfall")
print("Rainfall trends count:", r_rain["count"])
assert r_rain["count"] == 30

print("\n--- Testing get_time_series('Temperature', lat=0, lon=30) ---")
r_series = main.get_time_series(variable="Temperature", lat=0, lon=30)
print("Matched grid cell:", r_series["matched_grid_cell"])
print("Observations count:", r_series["observations_count"])
print("First observation (1990):", r_series["series"][0])
print("Last observation (2024):", r_series["series"][-1])
assert r_series["observations_count"] == 35
assert r_series["series"][0]["year"] == 1990
assert r_series["series"][-1]["year"] == 2024

print("\n--- Testing get_grid_stats('Temperature', lat=-58, lon=28) ---")
r_stats = main.get_grid_stats(variable="Temperature", lat=-58, lon=28)
print("Stats:", r_stats)
assert r_stats["lat"] == -60
assert r_stats["lon"] == 30
assert "decrease" in r_stats["label"].lower()

print("\n--- Testing get_drivers() ---")
r_drivers = main.get_drivers()
print("Drivers count:", r_drivers["count"])
print("Drivers:", r_drivers["drivers"])
assert r_drivers["count"] == 4

print("\n--- Testing get_comparisons() ---")
r_comp = main.get_comparisons()
print("Comparisons count:", r_comp["count"])
print("Comparisons:", r_comp["comparisons"])
assert r_comp["count"] == 4

print("\n==================================")
print("ALL FASTAPI ENDPOINTS VERIFIED 100%!")
print("==================================")
