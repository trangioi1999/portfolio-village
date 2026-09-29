"""Generate a textured 3D model (.glb) from a concept image via the free Hunyuan3D-2 Space.

Usage:
  python scripts/gen3d.py assets/concept/character/x4/front.png character
  -> public/models/character.glb

Requires: pip install gradio_client  (set HF_TOKEN for a larger free GPU quota)
"""

import os
import shutil
import sys
import time
from pathlib import Path

from gradio_client import Client, handle_file

SPACE = "tencent/Hunyuan3D-2"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "models"


def generate(image: Path, name: str, seed: int = 1234) -> Path:
    client = Client(SPACE, hf_token=os.environ.get("HF_TOKEN"), verbose=False)
    start = time.time()
    shape, textured, *_ = client.predict(
        caption=None,
        image=handle_file(str(image)),
        mv_image_front=None,
        mv_image_back=None,
        mv_image_left=None,
        mv_image_right=None,
        steps=30,
        guidance_scale=5.0,
        seed=seed,
        octree_resolution=256,
        check_box_rembg=True,
        num_chunks=8000,
        randomize_seed=False,
        api_name="/generation_all",
    )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Path(textured if isinstance(textured, str) else textured["value"])
    out = OUT_DIR / f"{name}{src.suffix}"
    shutil.copy(src, out)
    print(f"{name}: {out} ({out.stat().st_size / 1e6:.1f} MB, {time.time() - start:.0f}s)")
    return out


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    generate(Path(sys.argv[1]), sys.argv[2])
