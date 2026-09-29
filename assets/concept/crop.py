"""Cut the concept sheet into individual reference images.

Usage: python3 assets/concept/crop.py
Boxes are (left, top, right, bottom) in pixels of concept-sheet.png (1536x1024).
Each crop is also saved upscaled 4x (LANCZOS) for image-to-3D tools.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
SCALE = 4

BOXES = {
    "character": {
        "front": (26, 58, 130, 245),
        "left": (132, 58, 218, 245),
        "back": (216, 58, 302, 245),
        "right": (298, 58, 388, 245),
        "expression-1": (398, 76, 448, 130),
        "expression-2": (448, 76, 500, 130),
        "expression-3": (498, 76, 550, 130),
        "expression-4": (398, 130, 450, 182),
        "accessory-laptop": (396, 262, 458, 318),
        "accessory-backpack": (456, 252, 514, 328),
        "accessory-staff": (508, 248, 550, 358),
        "anim-idle": (28, 292, 88, 388),
        "anim-walk": (94, 292, 154, 388),
        "anim-run": (160, 292, 228, 388),
        "anim-jump": (224, 290, 290, 388),
        "anim-wave": (310, 292, 380, 388),
    },
    "pets": {
        "luna": (582, 62, 668, 182),
        "bo": (684, 62, 768, 182),
        "miso": (776, 62, 862, 182),
        "panda": (870, 62, 958, 182),
        "chip": (964, 62, 1056, 168),
        "luna-anims": (580, 228, 670, 412),
        "bo-anims": (678, 228, 770, 412),
        "miso-anims": (774, 228, 866, 412),
        "panda-anims": (870, 228, 962, 412),
        "chip-anims": (964, 228, 1056, 412),
    },
    "buildings": {
        "fpt-is": (1082, 52, 1228, 182),
        "career-tower": (1236, 48, 1370, 184),
        "project-workshop": (1374, 62, 1518, 184),
        "skills-garden": (1082, 202, 1230, 330),
        "learning-center": (1232, 202, 1370, 330),
        "about-me-house": (1374, 202, 1518, 330),
        "contact-shrine": (1082, 348, 1236, 442),
    },
    "environment": {
        "tree": (20, 496, 106, 584),
        "rock": (104, 496, 192, 584),
        "bush": (188, 496, 264, 584),
        "flower": (262, 496, 342, 584),
        "grass": (338, 496, 418, 584),
        "bridge": (22, 594, 110, 682),
        "fence": (110, 594, 184, 682),
        "lantern": (186, 594, 250, 682),
        "signboard": (250, 594, 324, 682),
        "road-tile": (326, 594, 418, 682),
        "waterfall": (22, 692, 106, 788),
        "river": (104, 692, 188, 788),
        "pond": (186, 692, 268, 788),
        "cloud": (288, 704, 340, 772),
        "floating-island": (342, 692, 418, 788),
        "prop-crates": (20, 818, 62, 872),
        "prop-crate": (62, 818, 112, 872),
        "prop-barrel": (116, 818, 162, 872),
        "prop-bench": (164, 818, 230, 872),
        "prop-signpost": (234, 818, 278, 872),
        "prop-chest": (278, 818, 342, 872),
        "prop-lamp": (342, 812, 372, 876),
        "prop-crystal-lamp": (370, 812, 414, 876),
    },
    "style": {
        "mat-wood": (1090, 504, 1150, 562),
        "mat-roof": (1152, 504, 1212, 562),
        "mat-stone": (1214, 504, 1274, 562),
        "mat-grass": (1276, 504, 1336, 562),
        "mat-water": (1338, 504, 1398, 562),
        "mat-metal": (1400, 504, 1460, 562),
        "mat-glass": (1462, 504, 1522, 562),
        "color-palette": (1084, 600, 1306, 664),
        "lighting-day": (1318, 624, 1378, 684),
        "lighting-sunset": (1378, 624, 1436, 684),
        "lighting-night": (1436, 624, 1518, 684),
        "icons": (1084, 704, 1526, 818),
    },
    "scenes": {
        "island-map": (438, 444, 1070, 878),
        "central-plaza": (10, 896, 322, 1010),
        "project-workshop-detail": (330, 896, 588, 1010),
        "skills-garden-detail": (594, 896, 828, 1010),
        "night-scene": (832, 896, 1070, 1010),
        "wireframes": (1082, 836, 1528, 1020),
    },
}


def main() -> None:
    sheet = Image.open(ROOT / "concept-sheet.png").convert("RGB")
    for group, boxes in BOXES.items():
        out = ROOT / group
        (out / "x4").mkdir(parents=True, exist_ok=True)
        for name, box in boxes.items():
            img = sheet.crop(box)
            img.save(out / f"{name}.png")
            big = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS)
            big.save(out / "x4" / f"{name}.png")
    print(sum(len(b) for b in BOXES.values()), "crops written")


if __name__ == "__main__":
    main()
