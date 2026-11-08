"""Create the real public source download from a strict allowlist."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
out = root / 'public/downloads/Exomorphic-Particle.zip'
out.parent.mkdir(parents=True, exist_ok=True)
files = []
for name in ['src', 'skills', 'scripts', 'tests', '.github']:
    folder = root / name
    if folder.exists():
        files.extend(p for p in folder.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
for name in ['package.json', 'package-lock.json', 'index.html', 'mini.html', 'vite.config.js', 'README.md', 'LICENSE', '.gitignore', 'public/manrope.woff2', 'public/OFL-Manrope.txt']:
    path = root / name
    if path.is_file(): files.append(path)
with ZipFile(out, 'w', ZIP_DEFLATED) as z:
    for p in sorted(set(files)):
        relative = p.relative_to(root)
        assert not any(part in {'private', '.git', 'node_modules'} or part.startswith('.env') for part in relative.parts)
        z.write(p, 'Exomorphic-Particle/' + relative.as_posix())
print(f'Packaged {len(set(files))} public project files: {out.name}')
