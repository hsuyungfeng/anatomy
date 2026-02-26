from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to page...")
    page.goto("http://localhost:8080", timeout=10000)
    time.sleep(2)

    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")

    browser.close()
