# 腕有引力 · WRISTBOUND 交付文档

交付日期：2026-05-31

## 1. 交付结论

当前仓库已经是可构建、可静态部署的完整前端项目。玩法逻辑、关卡数据、Three.js 渲染、输入、音效和转场均已整合，无需依赖外部后端服务。

## 2. 玩法合同

| 序号 | 名称 | 机制 |
| --- | --- | --- |
| 0 | 教学面 · 初次滚动 | 基础移动和进入终点 |
| 1 | 第 1 关 · 回廊 | 纯迷宫路线 |
| 2 | 第 2 关 · 暗坑 | 静态陷阱洞 |
| 3 | 第 3 关 · 星途 | 静态陷阱洞；收集全部星星后解锁终点 |
| 4 | 第 4 关 · 巡游 | 收集星星；两个蓝洞沿轨道往返移动 |
| 5 | 第 5 关 · 追迹 | 三颗星星；收集后离开原位置两格，原地生成匀速追击洞 |

交互约定：

- 钢球进入任意陷阱洞后被吞噬，并返回教学关之后的第 1 关。
- 未收集完本关星星时，终点保持锁定。
- 第 5 关采用“离开两格后生成追击洞”的最终逻辑，不使用旧版定时无限分裂逻辑。

## 3. 已交付范围

| 范围 | 状态 | 说明 |
| --- | --- | --- |
| 教学面 + 五关 | 已完成 | 共六个立方体平面 |
| 静态陷阱洞 | 已完成 | 钢球掉入后返回第 1 关 |
| 星星收集 | 已完成 | 未集齐时终点锁定 |
| 巡游洞 | 已完成 | 第 4 关沿可见路径往返移动 |
| 追击洞 | 已完成 | 第 5 关星星收集后，离开两格才生成并开始追击 |
| 金属球 | 已完成 | 银色材质、滚动动画、多光源光影 |
| 终点暗井 | 已完成 | 黑洞式视觉和锁定状态 |
| 拖尾 | 已完成 | 前段同尺寸虚影，后段逐级缩小淡出 |
| 响应式布局 | 已完成 | 已做桌面与手机视口检查 |

## 4. 快速接手

首次运行：

```bash
npm install
npm run dev
```

桌面浏览器打开：

```text
http://localhost:5173
```

生产构建：

```bash
npm run build
```

构建产物：

```text
dist/
```

这是纯静态 Vite 项目。用于静态托管平台时，构建命令为 `npm run build`，发布目录为 `dist`，当前没有环境变量。

## 5. 关键文件

| 文件 | 作用 |
| --- | --- |
| `src/LevelData.js` | 六面关卡、格子语义、配色和第 4 关巡游路线 |
| `src/Game.js` | 游戏状态机、星星门槛、巡游洞和追击洞 |
| `src/Physics.js` | 钢球运动、碰撞、掉洞和星星检测 |
| `src/Renderer.js` | Three.js 场景、材质、灯光、阴影、拖尾和动态物件 |
| `src/InputManager.js` | 手机陀螺仪授权与桌面键盘输入 |
| `src/AudioManager.js` | Web Audio 合成音效 |
| `src/Transition.js` | 六面体翻转转场 |
| `index.html` | 页面结构和 HUD |
| `style.css` | 页面视觉、动画和响应式布局 |

## 6. 模块约定

状态机：

```text
START -> PLAYING -> FALLING -> TRANSITION -> PLAYING -> COMPLETE
PLAYING -> DEAD -> PLAYING
```

`src/LevelData.js` 使用 15×15 网格：

| 值 | 含义 |
| --- | --- |
| `0` | 可通行区域 |
| `1` | 墙体 |
| `2` | 起点 |
| `3` | 终点 |
| `4` | 静态陷阱洞 |
| `5` | 黄色星星 |

动态陷阱不写入固定网格：

- 第 4 关由 `MOVING_TRAP_PATHS_L4` 定义往返轨迹。
- 第 5 关由 `Game` 在星星收集后创建追击洞。

关键渲染接口：

```js
renderer.draw(levelIndex, physics, gravityX, gravityY, goalUnlocked, movingTraps, grid)
renderer.addFlash(col, row)
renderer.notifyStarCollected(col, row)
renderer.resetLevelEffects()
renderer.resize()
```

## 7. 已完成验证

- `npm run build` 构建成功。
- 六张地图均存在可通关路径。
- 静态洞可以触发吞噬，并返回第 1 关。
- 星星门槛、终点解锁、巡游移动和两格后生成追击洞均已验证。
- 追击洞会沿迷宫路径靠近钢球，不会直接穿墙。
- 桌面浏览器与 390×844 手机视口均已检查，未发现业务报错。

构建阶段仍会提示主 JavaScript 文件体积超过 500 kB。这不影响运行；如需继续优化首屏加载，可以将 Three.js 相关代码拆包。

## 8. 真机验收事项

手机浏览器的陀螺仪 API 通常需要 HTTPS，iOS Safari 还需要用户主动点击后授权。音频也会在“开始挑战”点击时解锁。

iOS Safari 网页端不提供标准硬件震动接口，因此当前使用低频碰撞音效和画面抖动作为降级反馈；Android 等支持 `navigator.vibrate` 的浏览器会触发原生震动。上线前建议完成：

- iOS Safari 真机授权、方向和灵敏度测试。
- Android Chrome 真机方向和灵敏度测试。
- 不同屏幕比例下的 HUD、地图尺寸和手势区域检查。
- 根据试玩反馈微调摩擦、反弹和追击速度。

## 9. 接手注意事项

- 当前地图和机制以 `src/LevelData.js`、`src/Game.js` 为准。
- 任意陷阱失败后固定回到第 1 关，不回到当前关。
- `window.__cubeMazeGame` 是浏览器控制台中的本地验收挂钩，仅用于调试。
- `vite.stdout.log` 和 `vite.stderr.log` 是本地预览服务日志，不属于交付内容。

## 10. 推荐后续工具

- `frontend-skill`：继续优化视觉、动效和移动端布局。
- `browser:control-in-app-browser` 或 `playwright`：执行本地浏览器验收。
- `netlify:netlify-deploy`：真正开始静态部署时使用。
