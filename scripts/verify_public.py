"""Validate the intended public file tree and source download; not an exhaustive secret scanner."""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import json
import re
root = Path(__file__).resolve().parents[1]
allowed_dirs = ['src', 'skills', 'scripts', 'tests', '.github']
files = []
for name in allowed_dirs:
    files.extend(p for p in (root / name).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
files.extend(root / n for n in ['README.md', 'LICENSE', 'package.json', 'package-lock.json', 'index.html', 'mini.html', 'vite.config.js', '.gitignore', 'public/OFL-Manrope.txt', 'public/manrope.woff2'])
patterns = [r'gh[pousr]_[A-Za-z0-9]{20,}', r'AKIA[A-Z0-9]{16}', r'-----BEGIN [A-Z ]*PRIVATE KEY-----', r'/home/' + r'gregory/', r'horn[.]gregory' + r'@', r'CAREER_' + r'BRIEF', r'(?i)CLOUDFLARE_API_TOKEN\s*=\s*[A-Za-z0-9]']
for p in files:
    if p.suffix == '.woff2': continue
    text = p.read_text()
    # The scanner's own patterns are split so they cannot create a self-match.
    for pattern in patterns:
        assert not re.search(pattern, text), f'Potential private payload: {p.relative_to(root)}'
for name in ['exomorphic-particle-test', 'exomorphic-particle-page']:
    content = (root / 'skills' / name / 'SKILL.md').read_text()
    assert content.startswith('---\n') and '\n---\n' in content[4:]
    match = re.search(r'^description: (.+)$', content, re.M)
    assert match is not None
    description = match.group(1)
    assert len(description) <= 60 and description.endswith('.')
    assert f'name: {name}' in content
with ZipFile(root / 'public/downloads/Exomorphic-Particle.zip') as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(files)
    for p in files:
        name = 'Exomorphic-Particle/' + p.relative_to(root).as_posix()
        assert z.read(name) == p.read_bytes(), f'Download stale: {name}'
    assert not any('/node_modules/' in n or '/private/' in n or '/.env' in n for n in z.namelist())
report = {'public_files': len(files), 'skills': 2, 'zip_matches_source': True, 'limited_secret_and_privacy_patterns_passed': True, 'download_sha256': hashlib.sha256((root / 'public/downloads/Exomorphic-Particle.zip').read_bytes()).hexdigest()}
(root / 'evidence').mkdir(exist_ok=True)
(root / 'evidence/public-check.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
