from playwright.sync_api import sync_playwright
import sys

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto("file:///home/hsu/Desktop/anatomy/index.html")
    page.wait_for_load_state("domcontentloaded")

    print(f"Page title: {page.title()}")
    print(f"URL: {page.url}")

    page.screenshot(path="/tmp/anatomy-app.png", full_page=True)
    print("Screenshot saved to /tmp/anatomy-app.png")

    browser.close()
