# Tasks: UI 布局重设与疾病可视化系统

**Change ID**: `refactor-ui-layout-disease-viz`
**Total Estimated Time**: 6-9 hours

---

## 📋 实施任务清单

### 阶段 1: UI 布局重设 (2-3 小时)

#### Task 1.1: 添加永久齿/乳齿标签页
- **文件**: `index.html`
- **工作**:
  - [ ] 在牙齿系统内添加子标签页容器
  - [ ] 创建「永久齒」和「乳齒」两个标签按钮
  - [ ] 添加对应的内容容器
  - [ ] 添加 CSS 样式支持

- **验收标准**:
  - [ ] 标签页能正常切换
  - [ ] 样式美观，与现有设计一致
  - [ ] 保留现有牙齿图表加载逻辑

**依赖**: 无
**优先级**: 🔴 高

---

#### Task 1.2: 更新主应用逻辑以支持牙齿类型切换
- **文件**: `assets/scripts/main.js`
- **工作**:
  - [ ] 添加 `currentTeethType` 状态变量
  - [ ] 创建 `handleTeethTypeChange(type)` 事件处理器
  - [ ] 创建 `loadTeethSystem(type)` 方法
  - [ ] 集成现有的 `loadSystemImage()` 方法

- **实现伪代码**:
  ```javascript
  handleTeethTypeChange(type) {
    this.currentTeethType = type;

    // 清除旧的标注和可视化
    this.annotator.clearAnnotations();

    // 加载新的牙齒系統
    this.loadTeethSystem(type);

    // 更新病歷列表（可选：只显示该系统的记录）
    this.updateRecordList('teeth');
  }

  loadTeethSystem(type) {
    const systemId = type === 'permanent' ? 'teeth' : 'primary_teeth';
    const system = this.anatomicalSystems.find(s => s.id === systemId);

    if (system) {
      // 加载对应的图像
      this.loadSystemImage(system.id);
    }
  }
  ```

- **验收标准**:
  - [ ] 切换牙齿类型时图像正确更新
  - [ ] 病歷列表能正确显示该系统的记录
  - [ ] 无控制台错误

**依赖**: Task 1.1
**优先级**: 🔴 高

---

#### Task 1.3: 移除 OCR 上传功能
- **文件**: `index.html`, `assets/scripts/main.js`, `assets/styles/main.css`
- **工作**:
  - [ ] 从 HTML 中删除 OCR 标签页和相关 HTML
  - [ ] 从 main.js 删除 `handleOCRUpload()` 方法
  - [ ] 删除 OCR 相关的事件监听代码
  - [ ] 删除 OCR 相关的 CSS 样式

- **要删除的代码**:
  ```html
  <!-- 删除此部分 -->
  <button class="record-tab" data-tab="ocr">
    <i class="fas fa-camera"></i>
    <span>OCR 上傳</span>
  </button>

  <div id="record-ocr" class="record-panel">
    <!-- OCR 上传内容 -->
  </div>
  ```

- **验收标准**:
  - [ ] OCR 标签页完全移除
  - [ ] 病歷列表标签自动激活
  - [ ] 无遗留的 OCR 代码
  - [ ] 无控制台错误

**依赖**: 无
**优先级**: 🟡 中

---

### 阶段 2: 导出功能简化 (1-1.5 小时)

#### Task 2.1: 移除 JSON 导出按钮
- **文件**: `index.html`, `assets/scripts/main.js`
- **工作**:
  - [ ] 从 HTML 中删除「匯出 JSON」按钮
  - [ ] 从 main.js 删除相关的 JSON 导出事件监听

- **验收标准**:
  - [ ] JSON 导出按钮移除
  - [ ] 仅保留「匯出文字」按钮
  - [ ] 按钮布局调整后仍美观

**依赖**: 无
**优先级**: 🟡 中

---

#### Task 2.2: 优化文本导出格式
- **文件**: `assets/scripts/record-manager.js`
- **工作**:
  - [ ] 修改 `exportAsText()` 方法
  - [ ] 实现新的格式结构（包含标题、时间轴、统计）
  - [ ] 添加颜色编码和分隔符
  - [ ] 测试多记录导出

- **新格式示例**:
  ```
  醫療結構化病歷報告
  =====================================

  病歷 ID: a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p
  患者 ID: P123456
  創建時間: 2025-12-31 10:30:00
  更新時間: 2025-12-31 14:45:30

  [治療時間軸]
  =====================================

  2025-12-31 14:30 - 左上第一門牙
    疾病: K02 牙根龋齒
    摘要: 初期龋齒，建議補綴
    ─────────────────────────

  [統計信息]
  =====================================
  總標註數: 1
  系統數量: 1 (牙齒系統)
  疾病種類: 1
  ```

- **验收标准**:
  - [ ] 导出文本包含所有必要信息
  - [ ] 格式清晰易读
  - [ ] 时间轴按倒序显示
  - [ ] 特殊字符正确显示

**依赖**: 无
**优先级**: 🟡 中

---

### 阶段 3: 疾病可视化 (2-3 小时)

#### Task 3.1: 创建疾病连接线渲染器
- **文件**: 新建 `assets/scripts/disease-visualization.js`
- **工作**:
  - [ ] 创建 `DiseaseVisualizationManager` 类
  - [ ] 实现连接线计算算法
  - [ ] 创建 SVG overlay 层
  - [ ] 实现颜色映射表

- **关键方法**:
  ```javascript
  class DiseaseVisualizationManager {
    constructor(canvasElement) {
      this.canvas = canvasElement;
      this.svgLayer = this.createSVGLayer();
      this.colorMap = this.initializeColorMap();
    }

    render(annotations) {
      // 清除旧的连接线
      this.svgLayer.innerHTML = '';

      // 对每个标注绘制连接线
      annotations.forEach(annotation => {
        this.drawDiseaseConnections(annotation);
      });
    }

    drawDiseaseConnections(annotation) {
      // 计算起点（牙齿位置）
      const startPoint = this.getToothPosition(annotation.locationName);

      // 对每个疾病绘制连接线和标签
      annotation.diseases.forEach((disease, index) => {
        const endPoint = this.calculateLabelPosition(startPoint, index);
        this.drawLine(startPoint, endPoint, disease.id);
        this.drawLabel(endPoint, disease.name, disease.id);
      });
    }

    initializeColorMap() {
      return {
        'K00': '#FF6B6B',
        'K01': '#FF8E72',
        'K02': '#FFA500',
        'K03': '#FFD700',
        'K04': '#FF69B4',
        'K05': '#00CED1',
        'K06': '#87CEEB',
        'K08': '#8A2BE2'
      };
    }
  }
  ```

- **验收标准**:
  - [ ] 连接线计算正确
  - [ ] 颜色映射准确
  - [ ] SVG 层正确覆盖在画布上
  - [ ] 无性能问题

**依赖**: 无
**优先级**: 🔴 高

---

#### Task 3.2: 集成疾病可视化到主应用
- **文件**: `assets/scripts/main.js`, `index.html`
- **工作**:
  - [ ] 在 `MedicalRecordApp` 中初始化 `DiseaseVisualizationManager`
  - [ ] 在保存标注后触发可视化更新
  - [ ] 在系统/牙齿类型切换时更新可视化
  - [ ] 添加鼠标交互（hover、click）

- **实现点**:
  ```javascript
  // 在 MedicalRecordApp constructor 中
  this.diseaseVisualizer = new DiseaseVisualizationManager(
    $('#image-canvas')
  );

  // 在 saveDiseaseAnnotation 后
  this.diseaseVisualizer.render(
    this.recordManager.getAnnotationsBySystem(this.currentSystemId)
  );

  // 在 handleTeethTypeChange 后
  this.diseaseVisualizer.render(
    this.recordManager.getAnnotationsBySystem(this.currentSystemId)
  );
  ```

- **验收标准**:
  - [ ] 新增标注后立即显示连接线
  - [ ] 切换系统/牙齿类型后连接线正确更新
  - [ ] 删除标注后连接线移除
  - [ ] 交互流畅无延迟

**依赖**: Task 3.1
**优先级**: 🔴 高

---

#### Task 3.3: 添加连接线交互功能（可选）
- **文件**: `assets/scripts/disease-visualization.js`
- **工作**:
  - [ ] 实现 hover 高亮效果
  - [ ] 实现 click 弹出详情
  - [ ] 添加键盘导航
  - [ ] 添加触摸支持（移动端）

- **验收标准**:
  - [ ] Hover 时连接线和标签高亮
  - [ ] Click 时显示详细信息
  - [ ] 易用性良好

**依赖**: Task 3.2
**优先级**: 🟢 低

---

### 阶段 4: 测试与优化 (1-2 小时)

#### Task 4.1: 单元测试
- **文件**: `test-disease-visualization.js` (新建)
- **工作**:
  - [ ] 编写颜色映射测试
  - [ ] 编写连接线计算测试
  - [ ] 编写系统切换测试
  - [ ] 编写导出格式测试

- **验收标准**:
  - [ ] 所有新增单元测试通过
  - [ ] 代码覆盖率 > 80%

**依赖**: Task 3.1, 3.2
**优先级**: 🔴 高

---

#### Task 4.2: 集成测试
- **文件**: `test-disease-form-automated.js` (更新)
- **工作**:
  - [ ] 添加永久齿/乳齿切换测试
  - [ ] 添加连接线显示测试
  - [ ] 添加文本导出测试
  - [ ] 添加兼容性测试

- **验收标准**:
  - [ ] 所有集成测试通过
  - [ ] 32/32 原有测试仍通过
  - [ ] 新增 8/8 测试通过

**依赖**: Task 1.2, 2.2, 3.2
**优先级**: 🔴 高

---

#### Task 4.3: 浏览器测试
- **工作**:
  - [ ] Chrome 测试
  - [ ] Firefox 测试
  - [ ] Safari 测试
  - [ ] Edge 测试
  - [ ] 移动浏览器测试（iOS Safari、Chrome Mobile）

- **验收标准**:
  - [ ] 所有功能在主流浏览器中正常工作
  - [ ] 响应式设计在各屏幕尺寸上表现良好
  - [ ] 无控制台错误或警告

**依赖**: Task 1.2, 2.2, 3.2
**优先级**: 🔴 高

---

#### Task 4.4: 性能优化
- **工作**:
  - [ ] 分析渲染性能
  - [ ] 优化连接线计算
  - [ ] 实施缓存机制
  - [ ] 测试大数据集性能

- **目标**:
  - [ ] 100+ 标注时渲染时间 < 500ms
  - [ ] 60fps 交互帧率

**依赖**: Task 3.1, 3.2
**优先级**: 🟡 中

---

### 阶段 5: 文档与发布 (30-60 分钟)

#### Task 5.1: 更新项目文档
- **文件**: `progress.md`, `README.md`
- **工作**:
  - [ ] 更新 progress.md Phase 4 完成情况
  - [ ] 记录设计决策和技术选择
  - [ ] 更新用户指南
  - [ ] 添加新功能使用说明

- **验收标准**:
  - [ ] 文档完整、清晰
  - [ ] 包含使用示例和截图

**依赖**: 所有任务完成
**优先级**: 🟡 中

---

#### Task 5.2: 提交变更
- **工作**:
  - [ ] 运行 `openspec validate refactor-ui-layout-disease-viz --strict`
  - [ ] 修复所有验证错误
  - [ ] 运行所有测试
  - [ ] 创建 git commit

- **验收标准**:
  - [ ] OpenSpec 验证通过
  - [ ] 所有测试通过
  - [ ] Commit message 清晰

**依赖**: Task 5.1
**优先级**: 🔴 高

---

## 📊 任务依赖关系

```
Task 1.1 (UI 标签页)
   ↓
Task 1.2 (切换逻辑)
   ├─→ Task 1.3 (移除 OCR)
   ├─→ Task 2.1 (移除 JSON 按钮)
   └─→ Task 3.1 (可视化器) → Task 3.2 (集成)
        ↓
Task 2.2 (文本导出)
   ↓
Task 4.1, 4.2, 4.3 (测试 - 可并行)
   ↓
Task 5.1, 5.2 (文档和发布)
```

## 🎯 可并行执行的任务

- Task 1.3 与 Task 2.1 (移除功能)
- Task 4.1, 4.2, 4.3 (各种测试)
- Task 3.1 与 Task 2.2 (独立功能)

## ⏱️ 实施时间线

| 阶段 | 预计时间 | 优先级 |
|------|---------|--------|
| 阶段 1 | 2-3 小时 | 🔴 高 |
| 阶段 2 | 1-1.5 小时 | 🟡 中 |
| 阶段 3 | 2-3 小时 | 🔴 高 |
| 阶段 4 | 1-2 小时 | 🔴 高 |
| 阶段 5 | 0.5-1 小时 | 🟡 中 |
| **总计** | **6-9 小时** | |

---

## ✅ 最终验收清单

- [ ] 所有 5 个阶段的任务完成
- [ ] 32/32 原有测试通过
- [ ] 8/8 新增测试通过
- [ ] 浏览器兼容性验证通过
- [ ] 性能测试通过
- [ ] 文档更新完成
- [ ] OpenSpec 验证通过
- [ ] Code review 通过
- [ ] 无遗留 TODO 或 FIXME 注释
