# 輔助與診斷工具集 (Internal Tools)

本目錄存放開發期間用於影像標註、座標校正、OCR 文字識別與除錯的輔助網頁工具。

## 開啟方式

在專案根目錄啟動本機伺服器：
```bash
python3 -m http.server 8000
```
然後以瀏覽器開啟下方各工具之對應網址。

---

## 工具列表

| 工具檔名 | 用途說明 | 本機開啟網址 |
|---|---|---|
| `auto-calibrate-teeth.html` | **牙齒座標自動校正工具**：自動辨識並校正牙齒解剖圖像中的各牙齒定位點。 | `http://localhost:8000/doc/tools/auto-calibrate-teeth.html` |
| `auto-tooth-detection.html` | **自動牙齒偵測工具**：使用 OpenCV.js 演算法自動偵測牙齒邊界與區域。 | `http://localhost:8000/doc/tools/auto-tooth-detection.html` |
| `debug-tooth-detection.html` | **牙齒映射除錯頁面**：載入 DentalImageMapper 並診斷牙齒座標載入與命中測試。 | `http://localhost:8000/doc/tools/debug-tooth-detection.html` |
| `eye-calibration.html` | **眼睛結構座標校正工具**：手動校正眼睛 3D 結構的中心座標與半徑數據。 | `http://localhost:8000/doc/tools/eye-calibration.html` |
| `eye-label-mapping-tool.html` | **眼睛文字標籤配對工具**：將辨識出的英文解剖標籤配對至眼睛對應位置。 | `http://localhost:8000/doc/tools/eye-label-mapping-tool.html` |
| `eye-text-recognition.html` | **眼睛圖像 OCR 文字識別**：使用 Tesseract.js 辨識眼睛圖像中的英文解剖文字。 | `http://localhost:8000/doc/tools/eye-text-recognition.html` |
| `tooth-calibration.html` | **牙齒座標手動校正工具**：互動式手動點擊校準各 FDI 牙位座標。 | `http://localhost:8000/doc/tools/tooth-calibration.html` |
| `visualize-coordinates.html` | **座標資料視覺化工具**：在 Canvas 上疊加預覽座標 JSON 檔案的標記範圍。 | `http://localhost:8000/doc/tools/visualize-coordinates.html` |
| `index-simplified.html` | **簡化版病歷標註系統**：獨立原型介面，驗證核心標註與儲存流程。 | `http://localhost:8000/doc/tools/index-simplified.html` |
