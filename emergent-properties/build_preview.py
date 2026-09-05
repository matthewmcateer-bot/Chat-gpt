"""Build the Field Organism preview without changing installed devices."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("baseline", ROOT / "source" / "baseline_suite.py")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.CONDUCTOR_CODE = (ROOT / "source" / "organism.genexpr").read_text(encoding="utf-8")
patch = base.build_conductor()
p = patch["patcher"]
p["title"] = "FIELD CONDUCTOR ORGANISM preview 0.1"
p["description"] = "Weighted breathing and rare cascading disturbances; audio passes through."
for item in p["boxes"]:
    box = item["box"]
    if box.get("text") == "FIELD CONDUCTOR":
        box["text"] = "FIELD ORGANISM"
    if box.get("text", "").startswith("MACRO FORM ENGINE"):
        box["text"] = "WEIGHTED BREATH\nflurry / thinning / return"
out = ROOT / "devices"
out.mkdir(exist_ok=True)
target = out / "FIELD_CONDUCTOR_ORGANISM_preview_0_1.amxd"
base.write_amxd(target, patch)
(out / "FIELD_CONDUCTOR_ORGANISM_preview_0_1.maxpat").write_text(json.dumps(patch, indent=2), encoding="utf-8")
ids = {item["box"]["id"] for item in p["boxes"]}
assert len(ids) == len(p["boxes"])
for item in p["lines"]:
    line = item["patchline"]
    assert line["source"][0] in ids and line["destination"][0] in ids
raw = target.read_bytes()
assert raw[:4] == b"ampf"
assert int.from_bytes(raw[28:32], "little") == len(raw) - 32
assert json.loads(raw[32:].rstrip(b"\x00")) == patch
print(f"Built and structurally checked: {target}")
print("Max/Live compilation and listening validation remain pending.")
