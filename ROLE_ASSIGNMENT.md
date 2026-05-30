# 角色分工文档

## 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **A · 玩法工程师** | （待分配） | 物理引擎、游戏机制、状态机、输入系统、音效、迷宫数据 |
| **B · 前端工程师** | 你 | UI 界面、视觉样式、Canvas 渲染、转场动画、移动端适配 |

---

## 文件所有权

### A 独占（只有 A 可以修改）

| 文件 | 内容 |
|------|------|
| `src/Physics.js` | 物理引擎：加速度、摩擦、碰撞检测、反弹、掉洞 |
| `src/Game.js` | 游戏状态机：START → PLAYING → FALLING → TRANSITION → COMPLETE |
| `src/InputManager.js` | 输入系统：陀螺仪 API、键盘输入、校准 |
| `src/AudioManager.js` | 音效合成：撞墙、掉洞、翻转、通关 |
| `src/main.js` | 入口：游戏循环启动、事件绑定 |

### B 独占（只有 B 可以修改）

| 文件 | 内容 |
|------|------|
| `index.html` | HTML 结构：界面骨架、DOM 元素 |
| `style.css` | 样式：布局、主题、动画、响应式 |
| `src/Renderer.js` | 渲染器：Canvas 绘制、背景、墙壁、钢球、特效 |
| `src/Transition.js` | 转场：CSS 3D 正方体翻转动画 |

### 共享（需协商）

| 文件 | A 负责 | B 负责 |
|------|--------|--------|
| `src/LevelData.js` | 迷宫网格数据（`grid`）、难度定义 | 配色方案（`FACE_COLORS`、`color`、`bg`） |

**共享文件规则**：修改前先同步，各自只改自己负责的区域。`FACE_COLORS` 数组和 `grid` 数组在文件中物理隔离，互不干扰。

---

## 接口约定

A 和 B 之间的代码通过以下接口耦合，双方需遵守：

### 1. Physics → Renderer

```js
// Physics 暴露给 Renderer 的接口
ball.getDrawPos() → { x, y, radius }  // 钢球绘制坐标（含掉洞缩小动画）
ball.hitWalls                       → [{ col, row }]  // 本次碰撞的墙壁（用于闪光）
```

### 2. Game → Renderer

```js
// Game 调用 Renderer 的方式
renderer.draw(levelIndex, physics, gravityX, gravityY)
renderer.addFlash(col, row)          // 碰撞闪光
renderer.resize()                    // 窗口变化时调用
```

### 3. Game → Transition

```js
transition.show() / transition.hide()
transition.playSimple() → Promise    // B 可自行替换动画实现
```

### 4. LevelData 数据格式

```js
LEVELS[i] = {
  name: String,        // 关卡名（B 可改显示文案）
  color: '#hex',       // 主色（B 控制）
  colorDark: '#hex',   // 墙壁深色（B 控制）
  bg: 'linear-gradient(...)',  // 背景（B 控制）
  difficulty: Number,  // 难度（A 控制）
  grid: Number[][]     // 迷宫网格（A 控制）
}
```

---

## 分支策略

```
main              ← 稳定版本，只有合并进来
  ├── dev/a       ← A 的开发分支
  └── dev/b       ← B 的开发分支
```

### 工作流程

1. **各自在自己的分支开发**：A 在 `dev/a`，B 在 `dev/b`
2. **阶段性合并**：功能完成后提 PR 到 `main`，对方 review
3. **共享文件冲突**：提前沟通，避免同时改 `LevelData.js` 的同一区域

### 合并节奏

- 每完成一个阶段（如某面关卡调试完、某个 UI 特性做完）合并一次
- 合并前先 `git merge main` 把对方的更新拉到自己的分支

---

## 当前阶段 TODO

### A（玩法工程师）

- [ ] 调优物理参数（摩擦、加速度、反弹系数）让手感更真实
- [ ] 设计更有趣的迷宫（当前 6 面偏简单，可增加复杂度）
- [ ] 掉洞动画优化（缩小 + 旋转效果）
- [ ] 键盘输入微调（对角线移动手感）
- [ ] 可选：加计时排行、最佳记录存储

### B（前端工程师）

- [ ] 移动端布局微调（不同机型适配测试）
- [ ] 开始/通关界面视觉打磨
- [ ] 墙壁渲染效果优化（圆角阴影、3D 质感）
- [ ] 转场动画优化（真正的六面翻转而非简单 2D）
- [ ] 撞墙闪光特效优化
- [ ] 进度条动画过渡
