import { CELL, LEVELS } from './LevelData.js';
import { CELL_SIZE } from './Physics.js';

export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridCols = 15;
    this.gridRows = 15;
    this.mazeWidth = this.gridCols * CELL_SIZE;
    this.mazeHeight = this.gridRows * CELL_SIZE;

    this.flashWalls = [];
    this.resize();
  }

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // HUD + 进度条 + 底部栏高度
    const chrome = vw < 600 ? 100 : 120;
    // 迷宫宽度占屏幕 88%
    const maxW = vw * 0.88;
    const maxH = vh - chrome;

    const scale = Math.min(maxW / this.mazeWidth, maxH / this.mazeHeight);

    this.canvas.width = this.mazeWidth;
    this.canvas.height = this.mazeHeight;
    this.canvas.style.width = `${Math.floor(this.mazeWidth * scale)}px`;
    this.canvas.style.height = `${Math.floor(this.mazeHeight * scale)}px`;
    this.scale = scale;
  }

  draw(levelIndex, ball, gravityX, gravityY, goalUnlocked = true, movingTraps = [], grid = null) {
    const level = LEVELS[levelIndex];
    const ctx = this.ctx;
    const g = grid || level.grid;

    ctx.clearRect(0, 0, this.mazeWidth, this.mazeHeight);

    this.drawBackground(level);
    this.drawFloor(level, g);
    this.drawTraps(level, g);
    this.drawStars(level, g);
    this.drawMovingTraps(movingTraps);
    this.drawGoal(level, goalUnlocked, g);
    this.drawWalls(level, g);
    this.drawFlash();
    this.drawBall(ball, level);
    this.drawGravityIndicator(gravityX, gravityY);
  }

  drawBackground(level) {
    const ctx = this.ctx;
    const bg = level.bg;
    const colors = bg.match(/#[A-Fa-f0-9]{6}/g) || ['#FFFFFF', '#FFFFFF'];
    const gradient = ctx.createLinearGradient(0, 0, this.mazeWidth, this.mazeHeight);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.mazeWidth, this.mazeHeight);
  }

  drawFloor(level, grid) {
    const ctx = this.ctx;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] === CELL.WALL) continue;
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;

        // 浅色底板
        ctx.fillStyle = level.color + '10';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = level.color + '18';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  drawWalls(level, grid) {
    const ctx = this.ctx;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] !== CELL.WALL) continue;

        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;

        // 墙体主体 — 圆角效果
        const inset = 2;
        const wallGrad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
        wallGrad.addColorStop(0, level.color);
        wallGrad.addColorStop(1, level.colorDark);
        ctx.fillStyle = wallGrad;

        // 画圆角矩形
        this._roundRect(ctx, x + inset, y + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2, 6);
        ctx.fill();

        // 顶部高光
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this._roundRect(ctx, x + inset, y + inset, CELL_SIZE - inset * 2, 4, 3);
        ctx.fill();

        // 底部阴影
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(x + inset + 2, y + CELL_SIZE - inset - 2, CELL_SIZE - inset * 2 - 4, 2);
      }
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawGoal(level, goalUnlocked = true, grid) {
    const ctx = this.ctx;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] !== CELL.GOAL) continue;

        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE * 0.35;

        if (goalUnlocked) {
          // 外圈发光
          const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, CELL_SIZE * 0.8);
          glowGrad.addColorStop(0, level.color + '50');
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, CELL_SIZE * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // 洞口
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // 彩色边框
          ctx.strokeStyle = level.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();

          // 呼吸脉冲
          const time = Date.now() / 1000;
          const pulse = 0.5 + Math.sin(time * 3) * 0.3;
          ctx.fillStyle = level.color + Math.round(pulse * 120).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 锁定状态：灰色暗淡
          const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, CELL_SIZE * 0.8);
          glowGrad.addColorStop(0, 'rgba(100,100,100,0.3)');
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, CELL_SIZE * 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(50,50,50,0.5)';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();

          // 锁图标（简化为十字叉）
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 5, cy - 5);
          ctx.lineTo(cx + 5, cy + 5);
          ctx.moveTo(cx + 5, cy - 5);
          ctx.lineTo(cx - 5, cy + 5);
          ctx.stroke();
        }
      }
    }
  }

  drawTraps(level, grid) {
    const ctx = this.ctx;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] !== CELL.TRAP) continue;

        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE * 0.33;

        // 红色外圈发光
        const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, CELL_SIZE * 0.7);
        glowGrad.addColorStop(0, 'rgba(220,40,40,0.5)');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL_SIZE * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // 暗红洞口
        ctx.fillStyle = 'rgba(60,5,5,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 红色边框
        ctx.strokeStyle = '#CC3333';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 快速脉冲
        const time = Date.now() / 1000;
        const pulse = 0.4 + Math.sin(time * 5) * 0.35;
        ctx.fillStyle = `rgba(255,50,50,${pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawStars(level, grid) {
    const ctx = this.ctx;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] !== CELL.STAR) continue;

        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        const outerR = CELL_SIZE * 0.28;
        const innerR = outerR * 0.4;
        const time = Date.now() / 1000;

        // 光晕
        const glowGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR * 1.8);
        glowGrad.addColorStop(0, 'rgba(255,215,0,0.4)');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 旋转五角星
        const rotation = time * 0.5;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = rotation + (i * Math.PI * 2) / 5 - Math.PI / 2;
          const ix = cx + Math.cos(angle) * outerR;
          const iy = cy + Math.sin(angle) * outerR;
          if (i === 0) ctx.moveTo(ix, iy);
          else ctx.lineTo(ix, iy);

          const innerAngle = angle + Math.PI / 5;
          const innerX = cx + Math.cos(innerAngle) * innerR;
          const innerY = cy + Math.sin(innerAngle) * innerR;
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 中心亮光
        ctx.fillStyle = 'rgba(255,255,200,0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, innerR * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawMovingTraps(movingTraps) {
    const ctx = this.ctx;
    const radius = 16;

    for (const mt of movingTraps) {
      if (!mt.active) continue;

      const cx = mt.x;
      const cy = mt.y;

      // 分裂闪光 — 扩散白环
      if (mt.spawnFlash !== undefined && mt.spawnFlash > 0) {
        const flashRadius = radius * (1 + (1 - mt.spawnFlash) * 2.5);
        const flashAlpha = mt.spawnFlash * 0.8;
        ctx.strokeStyle = `rgba(255,255,255,${flashAlpha})`;
        ctx.lineWidth = 3 * mt.spawnFlash + 1;
        ctx.beginPath();
        ctx.arc(cx, cy, flashRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 2.2 * (1 + (1 - mt.spawnFlash)), 0, Math.PI * 2);
        ctx.fill();
      }

      // 青色外圈发光
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.2);
      glowGrad.addColorStop(0, 'rgba(0,200,180,0.55)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 深青洞口
      ctx.fillStyle = 'rgba(0,60,55,0.75)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 青色边框
      ctx.strokeStyle = '#00BFA5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 快速脉冲
      const time = Date.now() / 1000;
      const pulse = 0.4 + Math.sin(time * 6) * 0.4;
      ctx.fillStyle = `rgba(100,255,240,${pulse * 0.7})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  addFlash(col, row) {
    this.flashWalls.push({ col, row, alpha: 1.0 });
  }

  drawFlash() {
    const ctx = this.ctx;
    this.flashWalls = this.flashWalls.filter(f => {
      f.alpha -= 0.08;
      if (f.alpha <= 0) return false;

      const x = f.col * CELL_SIZE;
      const y = f.row * CELL_SIZE;
      ctx.fillStyle = `rgba(255,255,255,${f.alpha * 0.6})`;
      this._roundRect(ctx, x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
      ctx.fill();
      return true;
    });
  }

  drawBall(ball, level) {
    const ctx = this.ctx;
    const { x, y, radius } = ball.getDrawPos();
    if (radius <= 0) return;

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, radius, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 球体 — 金属渐变
    const ballGrad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );
    ballGrad.addColorStop(0, '#FFFFFF');
    ballGrad.addColorStop(0.3, '#EAEAEA');
    ballGrad.addColorStop(0.7, '#B0B0B0');
    ballGrad.addColorStop(1, '#707070');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 边缘
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawGravityIndicator(gx, gy) {
    const ctx = this.ctx;
    const cx = this.mazeWidth - 25;
    const cy = 25;

    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();

    const dotX = cx + gx * 8;
    const dotY = cy + gy * 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
