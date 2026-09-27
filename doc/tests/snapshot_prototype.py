"""
原型方法快照工具
記錄與驗證 MedicalRecordApp.prototype 所有方法的 SHA-256 雜湊基準
"""

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, Tuple, List

# 確保在 snap 環境下能找到相依函式庫
_SNAP_LIB = "/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu"
if os.path.isdir(_SNAP_LIB):
    current_ld = os.environ.get("LD_LIBRARY_PATH", "")
    if _SNAP_LIB not in current_ld.split(":"):
        os.environ["LD_LIBRARY_PATH"] = f"{_SNAP_LIB}:{current_ld}" if current_ld else _SNAP_LIB

from playwright.sync_api import sync_playwright

_TESTS_DIR = Path(__file__).resolve().parent
_BASELINE_PATH = _TESTS_DIR / "baseline" / "prototype-methods.json"

JS_EXTRACT_PROTOTYPE = """
(() => {
  const proto = Object.getPrototypeOf(window.app);
  const out = {};
  for (const name of Object.getOwnPropertyNames(proto).sort()) {
    if (name === 'constructor') continue;
    const v = proto[name];
    out[name] = typeof v === 'function' ? v.toString() : JSON.stringify(v);
  }
  return out;
})()
"""


def capture_snapshot(browser, base_url: str) -> Dict[str, str]:
    """從運行中的頁面提取 MedicalRecordApp.prototype 的正規化雜湊字典"""
    page = browser.new_page()
    try:
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined && window.app !== null", timeout=10000)

        raw_methods = page.evaluate(JS_EXTRACT_PROTOTYPE)
        snapshot = {}
        for name in sorted(raw_methods.keys()):
            val_str = str(raw_methods[name])
            normalized = re.sub(r"\s+", " ", val_str).strip()
            sha256 = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
            snapshot[name] = sha256
        return snapshot
    finally:
        page.close()


def compare_with_baseline(
    current: Dict[str, str], baseline: Dict[str, str]
) -> Tuple[List[str], List[str], List[str]]:
    """比對當前快照與基準檔，返回 (新增列表, 缺少列表, 內容變更列表)"""
    added = [k for k in current if k not in baseline]
    removed = [k for k in baseline if k not in current]
    changed = [
        k for k in current
        if k in baseline and current[k] != baseline[k]
    ]
    return sorted(added), sorted(removed), sorted(changed)


def check_snapshot(browser, base_url: str) -> bool:
    """供 run_all.py 或內部呼叫的比對方法，返回 True 表示完全一致"""
    if not _BASELINE_PATH.exists():
        print(f"[FAIL] 基準檔不存在: {_BASELINE_PATH}")
        print("請先執行 `python3 doc/tests/snapshot_prototype.py --write` 建立基準。")
        return False

    with open(_BASELINE_PATH, "r", encoding="utf-8") as f:
        baseline = json.load(f)

    current = capture_snapshot(browser, base_url)
    added, removed, changed = compare_with_baseline(current, baseline)

    if not added and not removed and not changed:
        print(f"[PASS] 原型方法快照比對完全一致（共 {len(current)} 個方法）")
        return True

    print(f"[FAIL] 原型方法快照與基準不符:")
    if added:
        print(f"  新增方法 ({len(added)}):")
        for m in added:
            print(f"    + {m}")
    if removed:
        print(f"  缺少方法 ({len(removed)}):")
        for m in removed:
            print(f"    - {m}")
    if changed:
        print(f"  內容變更方法 ({len(changed)}):")
        for m in changed:
            print(f"    * {m} (舊: {baseline[m][:8]}... 新: {current[m][:8]}...)")
    return False


def main():
    parser = argparse.ArgumentParser(description="MedicalRecordApp 原型方法快照工具")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--write", action="store_true", help="寫入基準檔 baseline/prototype-methods.json")
    group.add_argument("--check", action="store_true", help="與基準檔比對，有差異時退出碼為 1")
    args = parser.parse_args()

    # 匯入伺服器模組
    sys.path.insert(0, str(_TESTS_DIR))
    import conftest_server as s

    server_proc = s.start_server()
    base_url = s.get_base_url()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                if args.write:
                    snapshot = capture_snapshot(browser, base_url)
                    _BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
                    with open(_BASELINE_PATH, "w", encoding="utf-8") as f:
                        json.dump(snapshot, f, indent=2, ensure_ascii=False)
                        f.write("\n")
                    print(f"已成功寫入基準檔: {_BASELINE_PATH}（共 {len(snapshot)} 個方法）")
                    sys.exit(0)
                elif args.check:
                    success = check_snapshot(browser, base_url)
                    sys.exit(0 if success else 1)
            finally:
                browser.close()
    finally:
        s.stop_server(server_proc)


if __name__ == "__main__":
    main()
