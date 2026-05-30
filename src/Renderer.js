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
    const chrome = vw < 600 ? 100 : 120;
    const maxW = vw * 0.88;
    const maxH = vh - chrome;
    const scale = Math.min(maxW / this.mazeWidth, maxH / this.mazeHeight);

    this.canvas.width = this.mazeWidth;
    this.canvas.height = this.mazeHeight;
    this.canvas.style.width = `${Math.floor(this.mazeWidth * scale)}px`;
    this.canvas.style.height = `${Math.floor(this.mazeHeight * scale)}px`;
    this.scale = scale;
  }

  draw(levelIndex, ball, gravityX, gravityY) {
    const level = LEVELS[levelIndex];
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.mazeWidth, this.mazeHeight);

    this.drawBackground(level);
    this.drawFloor(level);
    this.drawGoal(level);
    this.drawWalls(level);
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

  drawFloor(level) {
    const ctx = this.ctx;
    const grid = level.grid;
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] === CELL.WALL) continue;
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        ctx.fillStyle = level.color + '08';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = level.color + '12';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  drawWalls(level) {
    const ctx = this.ctx;
    const grid = level.grid;
    // 薄条参数：墙厚度约为格子的 25%，对齐 SVG 亚克力板比例
    const wallThick = CELL_SIZE * 0.25;
    const offset = (CELL_SIZE - wallThick) / 2;
    const rx = 4;

    // 第一步：把每个墙格分类 → 横板 / 竖板 / 十字交叉 / 孤立
    const type = [];
    for (let r = 0; r < this.gridRows; r++) {
      type[r] = [];
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] !== CELL.WALL) { type[r][c] = null; continue; }
        const hasH = (c > 0 && grid[r][c - 1] === CELL.WALL) || (c < this.gridCols - 1 && grid[r][c + 1] === CELL.WALL);
        const hasV = (r > 0 && grid[r - 1][c] === CELL.WALL) || (r < this.gridRows - 1 && grid[r + 1][c] === CELL.WALL);
        if (hasH && hasV) type[r][c] = 'cross';
        else if (hasH) type[r][c] = 'h';
        else if (hasV) type[r][c] = 'v';
        else type[r][c] = 'dot';
      }
    }

    // 第二步：画横板 — 把连续的 h/cross 格子合并成一条长横板
    for (let r = 0; r < this.gridRows; r++) {
      let start = -1;
      for (let c = 0; c <= this.gridCols; c++) {
        const isH = c < this.gridCols && (type[r][c] === 'h' || type[r][c] === 'cross');
        if (isH && start === -1) start = c;
        else if (!isH && start !== -1) {
          const x = start * CELL_SIZE;
          const y = r * CELL_SIZE + offset;
          const w = (c - start) * CELL_SIZE;
          this._drawStrip(ctx, x, y, w, wallThick, rx, level.color, level.colorDark);
          start = -1;
        }
      }
    }

    // 第三步：画竖板 — 把连续的 v/cross 格子合并成一条长竖板
    for (let c = 0; c < this.gridCols; c++) {
      let start = -1;
      for (let r = 0; r <= this.gridRows; r++) {
        const isV = r < this.gridRows && (type[r][c] === 'v' || type[r][c] === 'cross');
        if (isV && start === -1) start = r;
        else if (!isV && start !== -1) {
          const x = c * CELL_SIZE + offset;
          const y = start * CELL_SIZE;
          const w = wallThick;
          const h = (r - start) * CELL_SIZE;
          this._drawStrip(ctx, x, y, w, h, rx, level.color, level.colorDark);
          start = -1;
        }
      }
    }

    // 第四步：画孤立点（四周没邻居的单个墙格）
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (type[r][c] !== 'dot') continue;
        const x = c * CELL_SIZE + offset;
        const y = r * CELL_SIZE + offset;
        this._drawStrip(ctx, x, y, wallThick, wallThick, rx, level.color, level.colorDark);
      }
    }
  }

  _drawStrip(ctx, x, y, w, h, r, color, colorDark) {
    r = Math.min(r, w / 2, h / 2);
    // 主体渐变
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color);
    grad.addColorStop(1, colorDark);
    ctx.fillStyle = grad;
    this._roundRect(ctx, x, y, w, h, r);
    ctx.fill();

    // 顶部高光
    ctx.save();
    this._roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y, w, h * 0.3);
    ctx.restore();

    // 底部阴影
    ctx.save();
    this._roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(x, y + h * 0.8, w, h * 0.2);
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
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

  drawGoal(level) {
    const ctx = this.ctx;
    const grid = level.grid;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (grid[r][c] !== CELL.GOAL) continue;
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE * 0.35;

        const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, CELL_SIZE * 0.8);
        glowGrad.addColorStop(0, level.color + '50');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL_SIZE * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = level.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        const time = Date.now() / 1000;
        const pulse = 0.5 + Math.sin(time * 3) * 0.3;
        ctx.fillStyle = level.color + Math.round(pulse * 120).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  addFlash(col, row) {
    this.flashWalls.push({ col, row, alpha: 1.0 });
  }

  drawFlash() {
    const ctx = this.ctx;
    const wallThick = CELL_SIZE * 0.25;
    const offset = (CELL_SIZE - wallThick) / 2;
    this.flashWalls = this.flashWalls.filter(f => {
      f.alpha -= 0.08;
      if (f.alpha <= 0) return false;
      const x = f.col * CELL_SIZE + offset;
      const y = f.row * CELL_SIZE + offset;
      ctx.fillStyle = `rgba(255,255,255,${f.alpha * 0.6})`;
      this._roundRect(ctx, x, y, wallThick, wallThick, 4);
      ctx.fill();
      return true;
    });
  }

  drawBall(ball, level) {
    const ctx = this.ctx;
    const { x, y, radius } = ball.getDrawPos();
    if (radius <= 0) return;

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, radius, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();

    const dotX = cx + gx * 8;
    const dotY = cy + gy * 8;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
