"""Convert public PNG/JPEG artwork to same-name WebP assets before Vite runs."""
from pathlib import Path
from tempfile import NamedTemporaryFile

public = Path(__file__).resolve().parents[1] / "public"
sources = sorted(p for p in public.rglob("*") if p.suffix.lower() in {".png", ".jpg", ".jpeg"})
if sources:
    try:
        from PIL import Image, ImageOps
    except ImportError:
        raise SystemExit("Image conversion requires Pillow. Install with python3 -m pip install Pillow.")

for source in sources:
    target = source.with_suffix(".webp")
    if target.exists():
        raise SystemExit(f"Both {source} and {target} exist. Resolve the duplicate before converting.")
    with NamedTemporaryFile(dir=source.parent, suffix=".tmp", delete=False) as tmp:
        temporary = Path(tmp.name)
    try:
        with Image.open(source) as original:
            if getattr(original, "is_animated", False):
                raise SystemExit(f"Export {source} as animated WebP to preserve every frame.")
            image = ImageOps.exif_transpose(original)
            image.save(temporary, "WEBP", quality=85, method=6)
            with Image.open(temporary) as check:
                check.load()
                if check.size != image.size:
                    raise ValueError(f"Unexpected dimensions for {source}")
        temporary.replace(target)
        print(f"{source.name}: {source.stat().st_size:,} → {target.stat().st_size:,} bytes")
        source.unlink()
    finally:
        temporary.unlink(missing_ok=True)
