from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, args=["--no-sandbox"])
    page = browser.new_page()
    page.goto("http://127.0.0.1:8080")
    page.wait_for_load_state("networkidle")
    print(f"Opened: {page.url}")
    input("Press Enter to close...")
    browser.close()
