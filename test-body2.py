from playwright.sync_api import sync_playwright

# 根據實際顯示的圖像區域計算點擊位置
# 圖像顯示大小約 497x391，水平置中（offsetX ≈ 180）
# 使用相對於圖像顯示區域的比例

body_parts = [
    {"name": "鼻子 (nose)", "display_x": 0.77, "display_y": 0.22},  # 382/497, 80/391
    {
        "name": "前額 (forehead)",
        "display_x": 0.77,
        "display_y": 0.13,
    },  # 382/497, 50/391
    {"name": "眼睛 (eye)", "display_x": 0.71, "display_y": 0.19},  # 355/497, 75/391
    {"name": "耳朵 (ear)", "display_x": 0.60, "display_y": 0.20},  # 300/497, 80/391
    {"name": "下巴 (chin)", "display_x": 0.77, "display_y": 0.32},  # 382/497, 125/391
    {"name": "頸部 (neck)", "display_x": 0.77, "display_y": 0.38},  # 382/497, 150/391
    {"name": "胸部 (chest)", "display_x": 0.77, "display_y": 0.56},  # 382/497, 220/391
    {
        "name": "腹部 (abdomen)",
        "display_x": 0.77,
        "display_y": 0.77,
    },  # 382/497, 300/391
    {
        "name": "左肩 (left shoulder)",
        "display_x": 0.24,
        "display_y": 0.45,
    },  # 120/497, 175/391
    {
        "name": "左手 (left hand)",
        "display_x": 0.22,
        "display_y": 1.02,
    },  # 110/497, 400/391 - 超出範圍!
    {
        "name": "右肩 (right shoulder)",
        "display_x": 1.30,
        "display_y": 0.45,
    },  # 644/497 - 超出範圍!
    {
        "name": "右手 (right hand)",
        "display_x": 1.32,
        "display_y": 1.02,
    },  # 654/497 - 超出範圍!
    {
        "name": "左膝蓋 (left knee)",
        "display_x": 0.60,
        "display_y": 1.28,
    },  # 300/497 - 超出!
    {
        "name": "右膝蓋 (right knee)",
        "display_x": 0.93,
        "display_y": 1.28,
    },  # 464/497 - 超出!
    {
        "name": "左腳 (left foot)",
        "display_x": 0.60,
        "display_y": 1.64,
    },  # 300/497 - 超出!
    {
        "name": "右腳 (right foot)",
        "display_x": 0.93,
        "display_y": 1.64,
    },  # 464/497 - 超出!
]

# 重新計算：使用canvas實際顯示區域
# Canvas: 858x391
# 圖像顯示: 497x391 (水平置中，offsetX=180)
# 測試時使用相對於canvas的比例

body_parts_canvas = [
    # 頭部區域 (在中央)
    {"name": "鼻子 (nose)", "canvas_x": 0.77, "canvas_y": 0.20},
    {"name": "前額 (forehead)", "canvas_x": 0.77, "canvas_y": 0.13},
    {"name": "眼睛 (eye)", "canvas_x": 0.72, "canvas_y": 0.19},
    {"name": "耳朵 (ear)", "canvas_x": 0.62, "canvas_y": 0.20},
    {"name": "下巴 (chin)", "canvas_x": 0.77, "canvas_y": 0.32},
    {"name": "頸部 (neck)", "canvas_x": 0.77, "canvas_y": 0.38},
    {"name": "胸部 (chest)", "canvas_x": 0.77, "canvas_y": 0.56},
    {"name": "腹部 (abdomen)", "canvas_x": 0.77, "canvas_y": 0.77},
    # 左側 - 需要轉換
    {"name": "左肩 (left shoulder)", "canvas_x": 0.24, "canvas_y": 0.45},
    {"name": "左手 (left hand)", "canvas_x": 0.22, "canvas_y": 1.0},
    # 右側 - 需要轉換
    {"name": "右肩 (right shoulder)", "canvas_x": 1.30, "canvas_y": 0.45},
    {"name": "右手 (right hand)", "canvas_x": 1.32, "canvas_y": 1.0},
    # 腿部
    {"name": "左膝蓋 (left knee)", "canvas_x": 0.60, "canvas_y": 1.28},
    {"name": "右膝蓋 (right knee)", "canvas_x": 0.93, "canvas_y": 1.28},
    {"name": "左腳 (left foot)", "canvas_x": 0.60, "canvas_y": 1.6},
    {"name": "右腳 (right foot)", "canvas_x": 0.93, "canvas_y": 1.6},
]

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto("http://localhost:9000")
    page.wait_for_load_state("networkidle")

    # Switch to body system
    page.click('button.system-tab[data-system="body"]')
    page.wait_for_timeout(1000)

    canvas = page.locator("#image-canvas")
    box = canvas.bounding_box()

    print(f"Canvas: {box['width']}x{box['height']}")

    for part in body_parts_canvas:
        # Skip parts outside canvas
        if part["canvas_y"] > 1.0:
            print(f"⏭️ {part['name']} - 超出範圍")
            continue

        click_x = box["x"] + box["width"] * part["canvas_x"]
        click_y = box["y"] + box["height"] * part["canvas_y"]

        page.mouse.click(click_x, click_y)
        page.wait_for_timeout(1000)

        # Check for error
        has_error = page.locator(".structure-info__error").count() > 0

        if has_error:
            results.append({"name": part["name"], "status": "FAIL"})
            print(f"❌ {part['name']}")
        else:
            try:
                detected = page.locator(
                    ".body-region-info strong, .structure-info__main strong"
                ).first.text_content(timeout=2000)
                if detected:
                    results.append(
                        {"name": part["name"], "status": "OK", "detected": detected}
                    )
                    print(f"✅ {part['name']} -> {detected}")
                else:
                    results.append({"name": part["name"], "status": "NO_RESPONSE"})
                    print(f"⚠️ {part['name']} -> No response")
            except:
                results.append({"name": part["name"], "status": "NO_RESPONSE"})
                print(f"⚠️ {part['name']} -> No response")

    browser.close()

ok = len([r for r in results if r["status"] == "OK"])
fail = len([r for r in results if r["status"] == "FAIL"])
print(f"\nTotal: {len(results)}, OK: {ok}, Fail: {fail}")
