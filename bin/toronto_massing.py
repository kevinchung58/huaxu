#!/usr/bin/env python3
"""Audit/extract City of Toronto 2025 massing around the CN Tower.

Optional data-prep tool only; no website dependency. Requires:
    python3 -m pip install pmtiles mapbox-vector-tile shapely

The script reads School of Cities' PMTiles derivative (repo commit
7bb3596ae7a443f403324857912dd7e361bb8f4d, static/buildings-2025.pmtiles.gz), joins clipped
z14 MVT parts by feature ID, converts to the local metre frame in _gen_html.py, and compares
source polygons with the existing TOR_TOWERS boxes. Counts are massing polygons, not unique
buildings. The .gz suffix is not a gzip wrapper around the PMTiles archive; its MVT tiles are
individually gzip-compressed.

Example:
    python3 bin/toronto_massing.py /path/to/buildings-2025.pmtiles.gz --output data/toronto-massing-2025.json
"""
from __future__ import annotations

import argparse
import ast
import gzip
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

try:
    import mapbox_vector_tile
    from pmtiles.reader import Reader
    from pmtiles.tile import Compression, TileType
    from shapely.geometry import MultiPolygon, Polygon, shape
    from shapely.ops import unary_union
except ImportError as exc:  # optional research dependencies, never site dependencies
    raise SystemExit("Install optional tools: pip install pmtiles mapbox-vector-tile shapely") from exc

ROOT = Path(__file__).resolve().parents[1]
ZOOM, LAYER = 14, "buildings2025"
DATA_URL = "https://open.toronto.ca/dataset/3d-massing/"
LICENSE_URL = "https://open.toronto.ca/open-data-licence/"
CKAN_PACKAGE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=387b2e3b-2a76-4199-8b3b-0b7d22e2ec10"
TILE_MAP_URL = "https://schoolofcities.github.io/toronto-buildings/heights-2025"
TILE_REPO_URL = "https://github.com/schoolofcities/toronto-buildings"
TILE_REPO_COMMIT = "7bb3596ae7a443f403324857912dd7e361bb8f4d"
PMTILES_PATH = "static/buildings-2025.pmtiles.gz"
PMTILES_SOURCE_URL = f"{TILE_REPO_URL}/blob/{TILE_REPO_COMMIT}/{PMTILES_PATH}"


def toronto_constants(path: Path):
    """Read only literal data; importing _gen_html.py would rewrite generated pages."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    wanted, found = {"TOR_O", "TOR_GRID", "TOR_TOWERS"}, {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id in wanted:
                    found[target.id] = ast.literal_eval(node.value)
    if found.keys() != wanted:
        raise ValueError(f"Missing Toronto constants in {path}: {wanted - found.keys()}")
    return tuple(found["TOR_O"]), float(found["TOR_GRID"]), found["TOR_TOWERS"]


def scales(lat0):
    p = math.radians(lat0)
    return (111132.954 - 559.822 * math.cos(2*p) + 1.175 * math.cos(4*p),
            111412.84 * math.cos(p) - 93.5 * math.cos(3*p))


def local(lat, lon, origin):
    ky, kx = scales(origin[0])
    return (lon - origin[1]) * kx, (lat - origin[0]) * ky


def tile_xy(lat, lon):
    n = 1 << ZOOM
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def map_geometry(geom, tx, ty, extent, origin):
    """Convert y-down MVT coordinates (not lat/lon) to local east/north metres."""
    n = 1 << ZOOM

    def walk(coords):
        if not coords:
            return coords
        if isinstance(coords[0][0], (int, float)):
            out = []
            for x, y in coords:
                lon = ((tx + x / extent) / n) * 360 - 180
                my = (ty + y / extent) / n
                lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * my))))
                out.append(local(lat, lon, origin))
            return out
        return [walk(child) for child in coords]

    return {"type": geom["type"], "coordinates": walk(geom["coordinates"])}


def tower_boxes(origin, grid, towers):
    """The same rotated square footprints used by toronto_world(), for overlap diagnostics."""
    a = math.radians(grid)
    north, east = (math.sin(a), math.cos(a)), (math.cos(a), -math.sin(a))
    out = []
    for name, lat, lon, height, width, _base in towers:
        e, n = local(lat, lon, origin)
        h = width / 2
        ring = [(e + sx*h*east[0] + sy*h*north[0], n + sx*h*east[1] + sy*h*north[1])
                for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        out.append({"name": name, "center": (e, n), "geometry": Polygon(ring)})
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("archive", type=Path, help="School of Cities Toronto 2025 PMTiles archive")
    ap.add_argument("--radius-m", type=float, default=15000)
    ap.add_argument("--query-buffer-m", type=float, default=3000,
                    help="tile margin so clipped polygon pieces can be rejoined")
    ap.add_argument("--min-height-m", type=float, default=100)
    ap.add_argument("--max-height-m", type=float, default=150,
                    help="exclusive upper AVG_HEIGHT bound")
    ap.add_argument("--min-area-m2", type=float, default=100,
                    help="view-scale review threshold; does not define a building")
    ap.add_argument("--tower-clearance-m", type=float, default=40,
                    help="omit centroids this close to a named TOR_TOWERS box")
    ap.add_argument("--tower-overlap-fraction", type=float, default=0.5)
    ap.add_argument("--simplify-m", type=float, default=1.5)
    ap.add_argument("--output", type=Path, help="optional compact review JSON; not a site asset")
    ap.add_argument("--generator", type=Path, default=ROOT / "_gen_html.py")
    a = ap.parse_args()
    if not a.archive.is_file():
        ap.error(f"archive not found: {a.archive}")
    if a.radius_m <= 0 or a.query_buffer_m < 0 or a.min_area_m2 < 0 or a.simplify_m < 0 or a.tower_clearance_m < 0:
        ap.error("radius must be positive; buffers, area, simplification, and clearance must be non-negative")
    if a.max_height_m <= a.min_height_m or not 0 <= a.tower_overlap_fraction <= 1:
        ap.error("height bounds or overlap fraction are invalid")

    digest = hashlib.sha256()
    with a.archive.open("rb") as source_file:
        for chunk in iter(lambda: source_file.read(1024 * 1024), b""):
            digest.update(chunk)
    archive_sha256 = digest.hexdigest()

    origin, grid, source_towers = toronto_constants(a.generator)
    ky, kx = scales(origin[0])
    radius = a.radius_m + a.query_buffer_m
    x0, y1 = tile_xy(origin[0] - radius/ky, origin[1] - radius/kx)
    x1, y0 = tile_xy(origin[0] + radius/ky, origin[1] + radius/kx)
    n = 1 << ZOOM
    x0, x1 = max(0, math.floor(x0)), min(n-1, math.floor(x1))
    y0, y1 = max(0, math.floor(y0)), min(n-1, math.floor(y1))

    archive = a.archive.open("rb")
    def get_bytes(offset, length):
        archive.seek(offset)
        return archive.read(length)

    reader = Reader(get_bytes)
    header, metadata = reader.header(), reader.metadata()
    if header["tile_type"] != TileType.MVT or header["tile_compression"] != Compression.GZIP:
        ap.error("expected gzip-compressed MVT PMTiles")
    if header["max_zoom"] < ZOOM:
        ap.error(f"archive max zoom {header['max_zoom']} is below z{ZOOM}")
    layer_meta = next((x for x in metadata.get("vector_layers", []) if x.get("id") == LAYER), {})
    if "AVG_HEIGHT" not in layer_meta.get("fields", {}):
        ap.error(f"missing {LAYER}.AVG_HEIGHT in PMTiles metadata")
    stats = next((x for x in metadata.get("tilestats", {}).get("layers", [])
                  if x.get("layer") == LAYER), {})

    fragments, heights = defaultdict(list), {}
    hits = tiles = nonempty = no_id = invalid = disagreements = 0
    for tx in range(x0, x1 + 1):
        for ty in range(y0, y1 + 1):
            tiles += 1
            data = reader.get(ZOOM, tx, ty)
            if not data:
                continue
            nonempty += 1
            decoded = mapbox_vector_tile.decode(gzip.decompress(data),
                                                default_options={"y_coord_down": True})
            layer = decoded.get(LAYER)
            if not layer:
                continue
            extent = int(layer.get("extent", 4096))
            for feature in layer.get("features", []):
                try:
                    height = float(feature["properties"]["AVG_HEIGHT"])
                except (KeyError, TypeError, ValueError):
                    continue
                if not a.min_height_m <= height < a.max_height_m:
                    continue
                hits += 1
                fid = feature.get("id")
                if fid is None:
                    no_id += 1
                    continue
                old = heights.setdefault(fid, height)
                disagreements += abs(old - height) > 1e-4
                try:
                    geom = shape(map_geometry(feature["geometry"], tx, ty, extent, origin))
                except (KeyError, TypeError, ValueError):
                    invalid += 1
                    continue
                if geom.is_empty or not geom.is_valid or geom.geom_type not in ("Polygon", "MultiPolygon"):
                    invalid += 1
                    continue
                fragments[fid].append(geom)

    towers = tower_boxes(origin, grid, source_towers)
    tower_union = unary_union([x["geometry"] for x in towers])
    rows, repaired = [], 0
    for fid, parts in fragments.items():
        geom = unary_union(parts)
        if geom.is_empty or not geom.is_valid:
            repaired += 1
            geom = geom.buffer(0)
        if geom.is_empty or not geom.is_valid:
            continue
        center = geom.centroid
        distance = math.hypot(center.x, center.y)
        if distance > a.radius_m:
            continue
        nearest = min(towers, key=lambda t: math.hypot(center.x-t["center"][0], center.y-t["center"][1]))
        near_distance = math.hypot(center.x-nearest["center"][0], center.y-nearest["center"][1])
        overlap_fraction = geom.intersection(tower_union).area / geom.area if geom.area else 0
        overlaps = []
        for tower in towers:
            area = geom.intersection(tower["geometry"]).area
            if area > 0.01:
                overlaps.append({"name": tower["name"], "area_m2": round(area, 1),
                                 "source_fraction": round(area/geom.area, 4)})
        rows.append({"id": fid, "height_m": heights[fid], "area_m2": geom.area,
                     "geometry": geom, "centroid": center, "distance_m": distance,
                     "nearest_tower": nearest["name"], "nearest_tower_distance_m": near_distance,
                     "tower_overlap_fraction": overlap_fraction, "tower_overlaps": overlaps})

    radii = [r for r in (5000, 7500, 10000, 15000) if r < a.radius_m] + [a.radius_m]
    reports = []
    for r in sorted(set(radii)):
        within = [x for x in rows if x["distance_m"] <= r]
        area_rows = [x for x in within if x["area_m2"] >= a.min_area_m2]
        overlap_pass = [x for x in area_rows if x["tower_overlap_fraction"] < a.tower_overlap_fraction]
        candidates = [x for x in overlap_pass if x["nearest_tower_distance_m"] > a.tower_clearance_m]
        reports.append({"radius_m": r, "polygons": len(within), "area_kept": len(area_rows),
                        "intersections": sum(x["tower_overlap_fraction"] > 0.01 for x in area_rows),
                        "overlap_flagged": len(area_rows)-len(overlap_pass),
                        "within_tower_clearance": len(area_rows)-sum(
                            x["nearest_tower_distance_m"] > a.tower_clearance_m for x in area_rows),
                        "candidates": len(candidates),
                        "height_100_125": sum(x["height_m"] < 125 for x in within),
                        "height_125_150": sum(x["height_m"] >= 125 for x in within)})

    print(f"PMTiles v{header['version']} {header['tile_type'].name}/{header['tile_compression'].name}, "
          f"z{header['min_zoom']}–{header['max_zoom']}; {header['tile_entries_count']} entries")
    print(f"archive sha256: {archive_sha256}")
    print(f"{LAYER}: {stats.get('count', '?'):,} tilestats polygons; "
          f"AVG_HEIGHT [{a.min_height_m:g}, {a.max_height_m:g}) m")
    print(f"query {tiles} tiles ({nonempty} nonempty), {hits} tile hits → "
          f"{len(rows)} unique in {a.radius_m/1000:g} km; missing IDs {no_id}, invalid {invalid}, "
          f"height mismatches {disagreements}, repaired unions {repaired}")
    print("radius | raw polygons | area kept | intersect boxes | overlap flagged | near named | candidates")
    for r in reports:
        print(f"{r['radius_m']/1000:5.1f} km | {r['polygons']:12} | {r['area_kept']:9} | "
              f"{r['intersections']:15} | {r['overlap_flagged']:15} | "
              f"{r['within_tower_clearance']:10} | {r['candidates']:10}")

    if a.output:
        review = [x for x in rows if x["area_m2"] >= a.min_area_m2]
        exported = []
        for row in review:
            geom = row["geometry"].simplify(a.simplify_m, preserve_topology=True)
            polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
            rings = []
            holes = 0
            for poly in polys:
                if not isinstance(poly, Polygon) or poly.is_empty or not poly.is_valid:
                    continue
                holes += len(poly.interiors)
                coords = list(poly.exterior.coords)[:-1]
                if len(coords) < 3:
                    continue
                rings.append([[round(round(x*2)/2, 1), round(round(y*2)/2, 1)] for x, y in coords])
            candidate = (row["tower_overlap_fraction"] < a.tower_overlap_fraction
                         and row["nearest_tower_distance_m"] > a.tower_clearance_m)
            exported.append({"id": row["id"], "candidate_for_scene": candidate,
                             "near_named_tower": row["nearest_tower_distance_m"] <= a.tower_clearance_m,
                             "avg_height_m": round(row["height_m"], 1),
                             "area_m2": round(row["area_m2"], 1),
                             "centroid_en_m": [round(row["centroid"].x, 1), round(row["centroid"].y, 1)],
                             "distance_from_cn_tower_m": round(row["distance_m"], 1),
                             "nearest_existing_tower": row["nearest_tower"],
                             "nearest_existing_tower_distance_m": round(row["nearest_tower_distance_m"], 1),
                             "tower_overlap_fraction": round(row["tower_overlap_fraction"], 4),
                             "tower_overlaps": row["tower_overlaps"], "holes_omitted": holes,
                             "polygons_en_m": rings})
        payload = {"source": {"dataset": "City of Toronto 3D Massing, 2025 resource",
                               "dataset_url": DATA_URL,
                               "pmtiles_sha256": archive_sha256,
                               "pmtiles_size_bytes": a.archive.stat().st_size,
                               "pmtiles_generator": metadata.get("generator"),
                               "dataset_page_license_display": "Open Government Licence – Toronto",
                               "license_url": LICENSE_URL,
                               "ckan_package_metadata_url": CKAN_PACKAGE_URL,
                               "license_metadata_checked": "2026-10-17",
                               "license_metadata_conflict": "The dataset page displays the Open Government Licence – Toronto and package notes say ‘Further to the Open Government Licence’, but structured CKAN fields report license_id=notspecified and isopen=false; this metadata mismatch remains unclarified.",
                               "tile_derivative": "School of Cities Toronto Building Heights (2025)",
                               "tile_derivative_url": TILE_MAP_URL,
                               "tile_repository_url": TILE_REPO_URL,
                               "tile_repository_commit": TILE_REPO_COMMIT,
                               "pmtiles_path": PMTILES_PATH,
                               "pmtiles_source_url": PMTILES_SOURCE_URL},
                   "processing": {"zoom": ZOOM, "layer": LAYER,
                                  "coordinates": "local east/north metres from TOR_O",
                                  "height_semantics": "source field AVG_HEIGHT is shown in metres by the School of Cities map; exact City field definition unverified; used only as approximate extrusion height, not a surveyed roof maximum",
                                  "height_range_m": [a.min_height_m, a.max_height_m],
                                  "radius_m": a.radius_m, "min_area_m2": a.min_area_m2,
                                  "tower_clearance_m": a.tower_clearance_m,
                                  "tower_overlap_fraction": a.tower_overlap_fraction,
                                  "simplify_tolerance_m": a.simplify_m,
                                  "coordinate_quantization_m": 0.5,
                                  "holes": "exterior rings only; interior rings omitted"},
                   "stats": {"queried_tiles": tiles, "nonempty_tiles": nonempty,
                             "tile_feature_hits": hits, "unique_features": len(rows),
                             "missing_ids": no_id, "invalid_geometries": invalid,
                             "height_mismatches": disagreements, "repaired_unions": repaired,
                             "distance_bands": reports}, "features": exported}
        a.output.parent.mkdir(parents=True, exist_ok=True)
        a.output.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"wrote {len(exported)} area-filtered review polygons to {a.output} "
              f"({a.output.stat().st_size:,} bytes)")
    archive.close()


if __name__ == "__main__":
    main()
