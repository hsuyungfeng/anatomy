"""
Service Worker 離線與網路更新測試
驗證資產完整預先快取、離線可用性，以及程式碼 network-first 更新機制
"""

import os
import re
import shutil
import socket
import tempfile
from pathlib import Path
from playwright.sync_api import Browser

import conftest_server

_PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def test_precache_covers_index_assets(browser=None, base_url: str = ""):
    """
    1. 解析 index.html 中的所有本地腳本、樣式與 3 個 CDN 網址，
       斷言每一項都包含在 sw.js 的預先快取清單 ASSETS_TO_CACHE 中。
    """
    index_html = (_PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
    sw_js = (_PROJECT_ROOT / "sw.js").read_text(encoding="utf-8")

    # 提取 index.html 中的 script src 與 link href
    script_srcs = re.findall(r'<script\s+[^>]*src=["\']([^"\']+)["\']', index_html)
    link_hrefs = re.findall(r'<link\s+[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\']', index_html)
    link_hrefs += re.findall(r'<link\s+[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']stylesheet["\']', index_html)

    # 包含的 CDN 資源
    expected_cdns = [
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
        "https://cdn.jsdelivr.net/npm/tesseract.js@6",
        "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
    ]

    required_assets = set()
    for s in script_srcs:
        required_assets.add(s)
    for h in link_hrefs:
        required_assets.add(h)
    for cdn in expected_cdns:
        required_assets.add(cdn)

    # 提取 sw.js 中的 ASSETS_TO_CACHE 陣列內容
    m = re.search(r"const\s+ASSETS_TO_CACHE\s*=\s*\[(.*?)\];", sw_js, re.DOTALL)
    assert m, "無法在 sw.js 中找到 const ASSETS_TO_CACHE 定義"

    raw_items = re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))

    # 正規化函數：將相對路徑與 / 開頭路徑視為相同
    def normalize_path(p: str) -> str:
        p = p.strip()
        if p.startswith("http://") or p.startswith("https://"):
            return p
        return "/" + p.lstrip("/")

    sw_cached_set = {normalize_path(item) for item in raw_items}

    missing = []
    for asset in sorted(required_assets):
        norm = normalize_path(asset)
        if norm not in sw_cached_set:
            missing.append(asset)

    assert not missing, (
        f"sw.js 的預先快取清單缺少 index.html 所需的資產 ({len(missing)} 項):\n"
        + "\n".join(f"  - {item}" for item in missing)
    )


def test_offline_reload_works(browser: Browser, base_url: str):
    """
    2. 連線載入讓 Service Worker 就緒並接管頁面，
       隨後切換至離線模式並重新整理，確認 window.app 與 Chart.js 正常載入且無 pageerror。
    """
    context = browser.new_context()
    page = context.new_page()
    page_errors = []
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    try:
        # 1. 第一次載入，等待 Service Worker ready
        page.goto(f"{base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        page.evaluate("""async () => {
            if (!('serviceWorker' in navigator)) throw new Error('瀏覽器不支援 Service Worker');
            await navigator.serviceWorker.ready;
        }""")

        # 確認 controller 接管；若未接管則重新載入一次
        has_controller = page.evaluate("() => navigator.serviceWorker.controller !== null")
        if not has_controller:
            page.reload()
            page.wait_for_function("() => navigator.serviceWorker.controller !== null", timeout=10000)

        # 稍微等待資源快取完成
        page.wait_for_timeout(1000)

        # 2. 設為離線並重新整理
        context.set_offline(True)
        page.reload()
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        # 斷言 Chart.js 存在（CDN 離線快取成功）
        chart_defined = page.evaluate("() => typeof Chart !== 'undefined'")
        assert chart_defined, "離線重新整理後 Chart.js 未載入 (typeof Chart === 'undefined')"

        # 斷言 Service Worker Cache 中確實有快取 CDN 資源
        sw_has_chart = page.evaluate("""async () => {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
                const cache = await caches.open(name);
                const match = await cache.match('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
                if (match) return true;
            }
            return false;
        }""")
        assert sw_has_chart, "Service Worker 快取中缺少 Chart.js CDN 資源"

        # 斷言無 pageerror
        assert len(page_errors) == 0, f"離線重新整理發生 pageerror: {page_errors}"
    finally:
        context.close()


def test_code_update_reaches_client(browser: Browser, base_url: str):
    """
    3. 模擬「只改程式碼、沒升 CACHE_NAME」的情境：
       在暫存專案副本中運行伺服器，第一次載入讓 SW 接管；
       修改副本中的 main.js 追加版本標記後重新載入，
       在 network-first 策略下應能即時取得最新程式碼。
    """
    temp_dir = tempfile.mkdtemp(prefix="anatomy_sw_test_")
    test_port = _get_free_port()
    server_proc = None

    try:
        # 複製專案檔案至暫存目錄（排除 git 與暫存）
        shutil.copytree(
            _PROJECT_ROOT,
            temp_dir,
            dirs_exist_ok=True,
            ignore=shutil.ignore_patterns(".git", "__pycache__", ".planning"),
        )

        server_proc = conftest_server.start_server(port=test_port, cwd=Path(temp_dir))
        temp_base_url = f"http://127.0.0.1:{test_port}"

        context = browser.new_context()
        page = context.new_page()

        # 1. 第一次載入並等待 SW 接管
        page.goto(f"{temp_base_url}/index.html")
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        page.evaluate("""async () => {
            if (!('serviceWorker' in navigator)) throw new Error('瀏覽器不支援 Service Worker');
            await navigator.serviceWorker.ready;
        }""")

        has_controller = page.evaluate("() => navigator.serviceWorker.controller !== null")
        if not has_controller:
            page.reload()
            page.wait_for_function("() => navigator.serviceWorker.controller !== null", timeout=10000)

        page.wait_for_timeout(500)

        # 2. 修改副本中的 assets/scripts/main.js，不修改 CACHE_NAME
        main_js = Path(temp_dir) / "assets" / "scripts" / "main.js"
        with open(main_js, "a", encoding="utf-8") as f:
            f.write("\nwindow.__codeVersion = 'NEW';\n")

        # 3. 正常重新整理（連線狀態）
        page.reload()
        page.wait_for_function("() => window.app !== undefined", timeout=10000)

        code_version = page.evaluate("() => window.__codeVersion")
        assert code_version == "NEW", (
            f"程式碼更新未即時送達客戶端！window.__codeVersion 為 {code_version}（期望為 'NEW'）。\n"
            "目前的 Service Worker 採 cache-first 策略導致新代碼被舊快取阻擋。"
        )

        context.close()
    finally:
        if server_proc:
            conftest_server.stop_server(server_proc)
        shutil.rmtree(temp_dir, ignore_errors=True)


TESTS = [
    test_precache_covers_index_assets,
    test_offline_reload_works,
    test_code_update_reaches_client,
]
