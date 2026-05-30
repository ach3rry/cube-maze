# 正方体迷宫 · Cube Maze

一款手机陀螺仪控制的钢球迷宫游戏。倾斜手机操控钢球穿越正方体六个面的迷宫，每面不同配色、不同难度。

## 玩法

- **手机端**：倾斜手机控制钢球滚动方向，把球滚到洞口即可过关
- **桌面端**：WASD / 方向键控制
- 共 6 面（6 关），难度递增
- 钢球撞击墙壁会有音效 + 震动反馈（Android 震动、iOS 视觉补偿）
- 通关后显示总用时

## 技术栈

- **渲染**：Canvas 2D（无框架，ES Modules）
- **物理**：自写简化物理引擎（加速度 / 摩擦 / 碰撞反弹）
- **输入**：DeviceOrientation API（陀螺仪）+ 键盘备选
- **音效**：Web Audio API 合成（无外部音频文件）
- **转场**：CSS 3D Transform 正方体翻转动画
- **部署**：纯静态文件，无需构建工具

## 项目结构

```
├── index.html          # 主入口
├── style.css           # 全局样式（多巴胺主题）
├── src/
│   ├── main.js         # 入口：初始化、事件绑定
│   ├── Game.js         # 游戏状态机（开始/游玩/转场/通关）
│   ├── Renderer.js     # Canvas 渲染器（迷宫、钢球、特效）
│   ├── Physics.js      # 物理引擎（加速度/摩擦/碰撞）
│   ├── InputManager.js # 输入管理（陀螺仪 + 键盘）
│   ├── LevelData.js    # 6 面迷宫数据 + 配色 CONFIG
│   ├── AudioManager.js # 音效（Web Audio 合成）
│   └── Transition.js   # 正方体翻转动画（CSS 3D）
```

## 本地运行

由于使用了 ES Modules，需要通过 HTTP 服务器访问：

```bash
# 方式一：Python
python -m http.server 8080

# 方式二：Node.js
npx serve .
```

然后浏览器打开 `http://localhost:8080`

## 手机测试（陀螺仪）

陀螺仪 API 需要 HTTPS。可用 localtunnel 穿透：

```bash
# 启动本地服务器
python -m http.server 8888

# 另开终端，创建 HTTPS 隧道
npx localtunnel --port 8888
```

手机浏览器打开输出的 HTTPS 地址即可。

## 自定义配色

六面颜色集中在 `src/LevelData.js` 顶部的 `FACE_COLORS` 数组中，修改对应颜色值即可：

```js
const FACE_COLORS = [
  { name: '第 1 面 · 启程', color: '#FFD93D', wall: '#FFCA28', bg: '#FFFDE7' },  // 活力黄
  { name: '第 2 面 · 转角', color: '#FF6B6B', wall: '#EF5350', bg: '#FFF0F0' },  // 青春红
  // ...
];
```

## 浏览器兼容

| 特性 | iOS Safari | Android Chrome | 桌面 Chrome |
|------|-----------|----------------|-------------|
| 陀螺仪 | ✅ (需授权) | ✅ (需 HTTPS) | ❌ |
| 键盘控制 | - | - | ✅ |
| Web Audio | ✅ | ✅ | ✅ |
| 震动反馈 | ❌ (视觉补偿) | ✅ | ❌ (视觉补偿) |

## License

MIT
