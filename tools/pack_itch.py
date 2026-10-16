"""Pack the itch.io build. index.html is at the root of the zip."""

import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "client"
DIST = ROOT / "dist"
STAGE = DIST / "itch"
ZIP_PATH = DIST / "xarcanoid-1.0.0.itch.zip"


def main():
    if STAGE.exists():
        shutil.rmtree(STAGE)
    STAGE.mkdir(parents=True)

    for path in CLIENT.rglob("*"):
        if not path.is_file() or "__pycache__" in path.parts:
            continue
        target = STAGE / path.relative_to(CLIENT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)

    shutil.copy2(ROOT / "CHANGELOG.md", STAGE / "CHANGELOG.md")

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in STAGE.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(STAGE).as_posix())

    print(ZIP_PATH)


if __name__ == "__main__":
    main()
