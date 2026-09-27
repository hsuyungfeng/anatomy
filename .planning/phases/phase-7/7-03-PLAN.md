---
phase: phase-7
plan: 03
type: execute
wave: 3
depends_on: [02]
files_modified:
  - .github/workflows/test.yml
  - doc/tests/README.md
autonomous: true
requirements:
  - CI-01
must_haves:
  truths:
    - "push 到 master 或開 PR 時，GitHub Actions 會自動執行 python3 doc/tests/run_all.py --with-snapshot"
    - "workflow 在本機用 act 或語法檢查通過；實際在 GitHub 上的第一次執行由使用者 push 後確認"
---

<objective>
建立 CI，讓每次 push／PR 都自動跑完整測試。
</objective>

<context>
- 測試需求：Python 3、`playwright`（pip）、Chromium（`python -m playwright install --with-deps chromium`）。專案本身沒有其他相依套件。
- 注意：`run_all.py` 會用 `python -m http.server` 在 127.0.0.1:8765 啟動伺服器，GitHub Actions 的 ubuntu-latest 可以直接執行。
- 部分測試會從 CDN 載入 Chart.js、Tesseract，CI 有網路，沒問題。
- **不要 push**（使用者會在審查後自己 push，屆時才會觸發第一次 CI）。
</context>

<tasks>

<task type="auto">
  <name>Task 1：建立 workflow</name>
  <files>.github/workflows/test.yml</files>
  <action>
```yaml
name: tests
on:
  push:
    branches: [master]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install playwright
      - run: python -m playwright install --with-deps chromium
      - run: python doc/tests/run_all.py --with-snapshot
```
（版本號以撰寫當下 GitHub 官方 action 的最新穩定主版本為準，並在 SUMMARY 註明。）
  </action>
  <verify>用 `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))"` 檢查語法（沒有 PyYAML 就用 `ruby -ryaml -e` 或跳過，並在 SUMMARY 說明）</verify>
</task>

<task type="auto">
  <name>Task 2：文件</name>
  <files>doc/tests/README.md</files>
  <action>在 README 加上「CI」一節：什麼時候會觸發、失敗時怎麼在本機重現。</action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 仍然全部通過</verify>
</task>

</tasks>

<commit>
ci: 新增 GitHub Actions 自動執行完整測試
</commit>
