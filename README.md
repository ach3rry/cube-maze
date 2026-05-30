# 腕有引力 · WRISTBOUND

一款使用手机陀螺仪控制的金属钢球迷宫游戏。倾斜手机，让钢球穿过教学面和五个正式关卡；桌面端可使用 `WASD` 或方向键试玩。

## 当前版本

- 教学面：熟悉滚动、碰墙和进入终点暗井。
- 第 1 关：纯迷宫路线。
- 第 2 关：加入静态蓝色陷阱洞，掉入后重置当前关。
- 第 3 关：收集全部黄色星星后，终点才会解锁。
- 第 4 关：蓝色陷阱洞沿可见轨道往返巡游。
- 第 5 关：三颗星星被收集后，钢球离开原位置两格，原地会生成沿迷宫追击的蓝洞。

## 视觉与交互

- Three.js WebGL 渲染亚克力迷宫、银色金属钢球和黑色终点井。
- 多光源动态色池，以及与光源方向对应的球体阴影。
- 钢球滚动旋转，并留下先保持尺寸、再逐级缩小淡出的虚影拖尾。
- 黄色 3D 星星、蓝色静态洞、巡游洞和追击洞。
- CSS 3D 六面体翻转转场、HUD、计时和通关结算。
- Web Audio 合成碰墙、掉洞、星星收集和终点解锁音效。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

桌面端使用 `WASD` 或方向键。手机陀螺仪需要浏览器授权；用于真机测试时应使用 HTTPS 地址。

## 生产构建

```bash
npm run build
```

构建产物位于 `dist/`。这是一个纯静态 Vite 项目，不依赖后端服务、数据库或环境变量。交给任意静态托管平台时：

| 项目 | 值 |
| --- | --- |
| 安装命令 | `npm install` |
| 构建命令 | `npm run build` |
| 发布目录 | `dist` |
| Node.js | 建议使用支持 Vite 8 的当前 LTS 版本 |

## 项目结构

```text
index.html             UI 骨架
style.css              页面主题、HUD、动画和响应式布局
src/main.js            应用入口和本地调试挂钩
src/LevelData.js       教学面 + 五关地图、配色和巡游轨道
src/Physics.js         滚动、碰撞、掉洞、星星和动态陷阱碰撞
src/Game.js            状态机、星星门槛、巡游洞和追击洞逻辑
src/Renderer.js        Three.js 场景、材质、灯光和动态物件
src/InputManager.js    陀螺仪与键盘输入
src/AudioManager.js    Web Audio 合成音效
src/Transition.js      六面体翻转转场
docs/DELIVERY_HANDOFF.md
                       交付、验收和维护说明
```

## 文档导航

- [`docs/DELIVERY_HANDOFF.md`](docs/DELIVERY_HANDOFF.md)：交付范围、玩法合同、验证结果、部署参数和接手注意事项。

## 调试入口

开发环境可在浏览器控制台使用：

```js
window.__cubeMazeGame
```

它用于本地验收关卡状态，不应作为业务 API 使用。
