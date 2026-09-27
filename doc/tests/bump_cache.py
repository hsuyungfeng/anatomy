"""
快取版本升版與資產雜湊工具
在 assets/、data/、index.html 或 manifest.json 變更時，自動為 sw.js 升版並更新基準檔
"""

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_BASELINE_PATH = _PROJECT_ROOT / "doc" / "tests" / "baseline" / "assets-hash.json"
_SW_PATH = _PROJECT_ROOT / "sw.js"


def get_monitored_files(project_root: Path) -> list:
    """收集所有需要監控的靜態檔案相對路徑列表（按 POSIX 相對路徑排序）"""
    files = []

    # 1. 根目錄關鍵檔案
    for name in ["index.html", "manifest.json"]:
        p = project_root / name
        if p.is_file():
            files.append(name)

    # 2. assets/ 目錄（排除 assets/images/**/*.md）
    assets_dir = project_root / "assets"
    if assets_dir.is_dir():
        for p in assets_dir.rglob("*"):
            if not p.is_file():
                continue
            rel = p.relative_to(project_root).as_posix()
            if rel.startswith("assets/images/") and rel.endswith(".md"):
                continue
            files.append(rel)

    # 3. data/ 目錄
    data_dir = project_root / "data"
    if data_dir.is_dir():
        for p in data_dir.rglob("*"):
            if p.is_file():
                files.append(p.relative_to(project_root).as_posix())

    return sorted(files)


def compute_assets_hash(project_root: Path = _PROJECT_ROOT) -> str:
    """計算所有監控資產檔案的總體 SHA-256 雜湊"""
    files = get_monitored_files(project_root)
    hasher = hashlib.sha256()

    for rel in files:
        abs_path = project_root / rel
        hasher.update(rel.encode("utf-8"))
        hasher.update(b"\0")
        with open(abs_path, "rb") as f:
            hasher.update(f.read())
        hasher.update(b"\0")

    return hasher.hexdigest()


def extract_cache_name(sw_path: Path = _SW_PATH) -> str:
    """從 sw.js 中提取 CACHE_NAME 字串"""
    content = sw_path.read_text(encoding="utf-8")
    m = re.search(r"const\s+CACHE_NAME\s*=\s*['\"]([^'\"]+)['\"];", content)
    if not m:
        raise ValueError(f"無法在 {sw_path} 中找到 const CACHE_NAME 定義")
    return m.group(1)


def bump_cache_name(cache_name: str) -> str:
    """將快取名稱後綴版本號 +1（例如 anatomy-v2 -> anatomy-v3）"""
    m = re.match(r"^(.*-v)(\d+)$", cache_name)
    if m:
        prefix, num = m.groups()
        return f"{prefix}{int(num) + 1}"
    return f"{cache_name}-v2"


def main():
    parser = argparse.ArgumentParser(description="快取版本檢查與升版工具")
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="僅檢查當前資產雜湊與快取版本是否符合基準，不寫入任何變更",
    )
    args = parser.parse_args()

    if not _SW_PATH.exists():
        print(f"[ERROR] 找不到 sw.js: {_SW_PATH}", file=sys.stderr)
        sys.exit(1)

    current_cache_name = extract_cache_name(_SW_PATH)
    current_hash = compute_assets_hash(_PROJECT_ROOT)

    if args.check_only:
        if not _BASELINE_PATH.exists():
            print(f"[FAIL] 基準檔不存在: {_BASELINE_PATH}")
            print("請執行 `python3 doc/tests/bump_cache.py` 建立基準檔。")
            sys.exit(1)

        with open(_BASELINE_PATH, "r", encoding="utf-8") as f:
            baseline = json.load(f)

        base_cache = baseline.get("cacheName")
        base_hash = baseline.get("hash")

        if current_hash != base_hash:
            if current_cache_name == base_cache:
                print("[FAIL] assets 已變更但 CACHE_NAME 未升版，請執行 python3 doc/tests/bump_cache.py")
            else:
                print("[FAIL] assets 已變更且 CACHE_NAME 已升版，但基準檔未更新，請執行 python3 doc/tests/bump_cache.py")
            sys.exit(1)

        if current_cache_name != base_cache:
            print(f"[FAIL] assets 未變更但 CACHE_NAME ({current_cache_name}) 與基準 ({base_cache}) 不符，請執行 python3 doc/tests/bump_cache.py")
            sys.exit(1)

        print(f"[PASS] 快取版本 ({current_cache_name}) 與資產雜湊 ({current_hash[:12]}...) 與基準完全一致。")
        sys.exit(0)

    # 執行升版與寫入基準
    new_cache_name = bump_cache_name(current_cache_name)
    sw_content = _SW_PATH.read_text(encoding="utf-8")
    new_sw_content = re.sub(
        r"(const\s+CACHE_NAME\s*=\s*['\"])[^'\"]+(['\"];)",
        rf"\g<1>{new_cache_name}\g<2>",
        sw_content,
        count=1,
    )
    _SW_PATH.write_text(new_sw_content, encoding="utf-8")

    # 重新計算雜湊（注意：sw.js 本身不在雜湊監控清單內，但保持流程清晰）
    updated_hash = compute_assets_hash(_PROJECT_ROOT)

    _BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    baseline_data = {
        "cacheName": new_cache_name,
        "hash": updated_hash,
    }
    with open(_BASELINE_PATH, "w", encoding="utf-8") as f:
        json.dump(baseline_data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"快取版本已升級: {current_cache_name} -> {new_cache_name}")
    print(f"基準檔已更新: {_BASELINE_PATH} (hash: {updated_hash[:12]}...)")


if __name__ == "__main__":
    main()
