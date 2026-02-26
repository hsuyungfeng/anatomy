from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    # Switch to body system
    page.click('button.system-tab[data-system="body"]')
    page.wait_for_timeout(1000)

    # Get image element size
    img = page.locator("#image-canvas img")
    img_box = img.bounding_box()

    print(f"Image element: {img_box}")

    # Get canvas container size
    canvas = page.locator("#image-canvas")
    canvas_box = canvas.bounding_box()
    print(f"Canvas container: {canvas_box}")

    # Click at center (should be around chest/stomach area in body image)
    click_x = canvas_box["x"] + canvas_box["width"] * 0.5
    click_y = canvas_box["y"] + canvas_box["height"] * 0.5

    print(f"Clicking at: {click_x}, {click_y}")

    page.mouse.click(click_x, click_y)
    page.wait_for_timeout(1500)

    # Get modal content
    html = page.locator("#modal-location").inner_html()
    print(f"Modal: {html[:300]}")

    browser.close()
