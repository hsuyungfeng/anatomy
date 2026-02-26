from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")
    print(f"Opened: {page.url}")
    print("Browser is open. Close it when done testing.")
    browser.close()
