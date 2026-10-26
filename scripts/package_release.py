"""Create curated source and static ZIPs with Python's standard library."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
NAME = f'ai-triage-desk-v{VERSION}'
OUT = ROOT / 'releases'
BUILD = ROOT / 'dist' / 'servicedesk' / 'browser'
ROOT_FILES = {'README.md', 'LICENSE', 'NOTICE.md', 'package.json', 'package-lock.json', 'angular.json',
              'tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json', '.gitignore', '.gitattributes',
              '.editorconfig', '.prettierrc', '.prettierignore', '.nvmrc'}
DIRS = {'src', 'public', 'data', 'docs', 'scripts', '.github'}
EXCLUDED_PARTS = {'__pycache__', 'node_modules', '.agents', '.git', 'demo截图'}
EXCLUDED_FILES = {'简历作品优化计划-讨论稿.md', '求职材料.md', '.DS_Store', 'Thumbs.db'}


def source_files():
    for path in sorted(ROOT.iterdir()):
        if path.is_file() and path.name in ROOT_FILES:
            yield path
        elif path.is_dir() and path.name in DIRS:
            for item in sorted(path.rglob('*')):
                if not item.is_file():
                    continue
                rel = item.relative_to(ROOT)
                if EXCLUDED_PARTS.intersection(rel.parts) or item.name in EXCLUDED_FILES:
                    continue
                if item.suffix in {'.pyc', '.pyo', '.zip'} or item.name.startswith('.env'):
                    continue
                yield item


def archive(path, files, base, prefix):
    count = 0
    with ZipFile(path, 'w', ZIP_DEFLATED, compresslevel=9) as output:
        for item in files:
            output.write(item, f'{prefix}/{item.relative_to(base).as_posix()}')
            count += 1
    return count


def main():
    if not (BUILD / 'index.html').exists():
        raise SystemExit('Run npm run build:pages before packaging.')
    OUT.mkdir(exist_ok=True)
    source = OUT / f'{NAME}-source.zip'
    static = OUT / f'{NAME}-static.zip'
    source_count = archive(source, source_files(), ROOT, NAME)
    static_count = archive(static, sorted(p for p in BUILD.rglob('*') if p.is_file()), BUILD, NAME)
    with ZipFile(static, 'a', ZIP_DEFLATED) as output:
        output.writestr(f'{NAME}/START-HERE.txt',
            'AlphaESS Service Desk v' + VERSION + '\n\n'
            'Serve this directory over HTTP; do not open index.html directly.\n'
            'Python: python -m http.server 4173 --bind 127.0.0.1\n'
            'Then open http://127.0.0.1:4173/#/dashboard\n\n'
            'Synthetic data, preset suggestions, browser-memory-only changes.\n'
            'Refresh restores the seed dataset. No real model or outbound messages.\n')
        static_count += 1
    sums = '\n'.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}' for p in (source, static)) + '\n'
    (OUT / 'SHA256SUMS.txt').write_text(sums, encoding='utf-8')
    print(json.dumps({'source': str(source), 'source_files': source_count, 'static': str(static),
                      'static_files': static_count, 'checksums': str(OUT / 'SHA256SUMS.txt')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
