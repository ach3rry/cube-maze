import { CELL, LEVELS } from './LevelData.js';

const CELL_SIZE = 40;

export default class Physics {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;

    // 物理参数
    this.accelScale = 0.55;
    this.friction = 0.97;
    this.maxSpeed = 8.5;
    this.bounceCoeff = 0.45;

    // 碰撞反馈
    this.hitWalls = [];
    this.wasTouchingWall = false; // 上一帧是否接触墙壁

    // 掉洞动画
    this.falling = false;
    this.fallProgress = 0;
  }

  reset(col, row) {
    this.x = col * CELL_SIZE + CELL_SIZE / 2;
    this.y = row * CELL_SIZE + CELL_SIZE / 2;
    this.vx = 0;
    this.vy = 0;
    this.falling = false;
    this.fallProgress = 0;
    this.wasTouchingWall = false;
    this.hitWalls = [];
  }

  update(ax, ay, grid, movingTraps = [], goalUnlocked = true) {
    if (this.falling) {
      this.fallProgress += 0.04;
      return { falling: true, complete: this.fallProgress >= 1 };
    }

    // 应用加速度
    this.vx += ax * this.accelScale;
    this.vy += ay * this.accelScale;

    // 摩擦力
    this.vx *= this.friction;
    this.vy *= this.friction;

    // 限速
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    // 静态摩擦：输入接近零且速度极小时完全停止（防止平放漂移）
    if (speed < 0.15 && Math.abs(ax) < 0.02 && Math.abs(ay) < 0.02) {
      this.vx = 0;
      this.vy = 0;
    }

    // 更新位置
    this.x += this.vx;
    this.y += this.vy;

    // 碰撞检测
    this.hitWalls = [];
    const { touching, impacted } = this.resolveCollisions(grid);

    const hit = impacted; // 只在"从未接触 → 接触"的那一帧为 true

    // 检查是否到达终点（仅在解锁后触发，防止未解锁时球卡在缩小动画）
    const goalReached = goalUnlocked ? this.checkGoal(grid) : false;

    // 检查陷阱 / 星星 / 移动陷阱
    const hitTrap = this.checkTrap(grid);
    const collectedStar = this.checkStars(grid);
    const hitMovingTrap = this.checkMovingTraps(movingTraps);

    return { hit, goalReached, hitTrap, collectedStar, hitMovingTrap };
  }

  resolveCollisions(grid) {
    let touching = false;
    let impacted = false;
    const rows = grid.length;
    const cols = grid[0].length;

    const minCol = Math.max(0, Math.floor((this.x - this.radius) / CELL_SIZE));
    const maxCol = Math.min(cols - 1, Math.floor((this.x + this.radius) / CELL_SIZE));
    const minRow = Math.max(0, Math.floor((this.y - this.radius) / CELL_SIZE));
    const maxRow = Math.min(rows - 1, Math.floor((this.y + this.radius) / CELL_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (grid[r][c] !== CELL.WALL) continue;

        const wallLeft = c * CELL_SIZE;
        const wallTop = r * CELL_SIZE;
        const wallRight = wallLeft + CELL_SIZE;
        const wallBottom = wallTop + CELL_SIZE;

        const closestX = Math.max(wallLeft, Math.min(this.x, wallRight));
        const closestY = Math.max(wallTop, Math.min(this.y, wallBottom));

        const dx = this.x - closestX;
        const dy = this.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius) {
          touching = true;

          // 推出球（总是执行，防止穿墙）
          if (dist === 0) {
            this.x += this.radius;
          } else {
            const overlap = this.radius - dist;
            this.x += (dx / dist) * overlap;
            this.y += (dy / dist) * overlap;
          }

          // 速度修正：零化垂直分量（不反弹，贴墙即停）
          const isHorizontal = Math.abs(dx) > Math.abs(dy);
          if (isHorizontal) {
            // 只在球正在往墙里钻时才修正速度
            const goingIntoWall = (dx > 0 && this.vx < 0) || (dx < 0 && this.vx > 0);
            if (goingIntoWall) {
              this.vx = -this.vx * this.bounceCoeff;
            } else if (Math.abs(this.vx) < 0.5) {
              this.vx *= 0.1;
            }
          } else {
            const goingIntoWall = (dy > 0 && this.vy < 0) || (dy < 0 && this.vy > 0);
            if (goingIntoWall) {
              this.vy = -this.vy * this.bounceCoeff;
            } else if (Math.abs(this.vy) < 0.5) {
              this.vy *= 0.1;
            }
          }

          this.hitWalls.push({ col: c, row: r });
        }
      }
    }

    // 只在"上一帧未接触 且 这一帧接触"时算撞击
    if (touching && !this.wasTouchingWall) {
      impacted = true;
    }

    this.wasTouchingWall = touching;

    return { touching, impacted };
  }

  checkGoal(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== CELL.GOAL) continue;

        const goalX = c * CELL_SIZE + CELL_SIZE / 2;
        const goalY = r * CELL_SIZE + CELL_SIZE / 2;
        const dx = this.x - goalX;
        const dy = this.y - goalY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius * 0.8) {
          this.falling = true;
          this.fallProgress = 0;
          this.goalX = goalX;
          this.goalY = goalY;
          return true;
        }
      }
    }
    return false;
  }

  checkTrap(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== CELL.TRAP) continue;

        const trapX = c * CELL_SIZE + CELL_SIZE / 2;
        const trapY = r * CELL_SIZE + CELL_SIZE / 2;
        const dx = this.x - trapX;
        const dy = this.y - trapY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius * 0.8) {
          return true;
        }
      }
    }
    return false;
  }

  checkStars(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== CELL.STAR) continue;

        const starX = c * CELL_SIZE + CELL_SIZE / 2;
        const starY = r * CELL_SIZE + CELL_SIZE / 2;
        const dx = this.x - starX;
        const dy = this.y - starY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius * 1.0) {
          return { col: c, row: r };
        }
      }
    }
    return null;
  }

  checkMovingTraps(movingTraps) {
    const trapRadius = 14;
    for (let i = 0; i < movingTraps.length; i++) {
      const mt = movingTraps[i];
      if (!mt.active) continue;
      const dx = this.x - mt.x;
      const dy = this.y - mt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.radius + trapRadius) {
        return true;
      }
    }
    return false;
  }

  getDrawPos() {
    if (this.falling) {
      const scale = 1 - this.fallProgress;
      return {
        x: this.goalX || this.x,
        y: this.goalY || this.y,
        radius: this.radius * Math.max(0, scale),
      };
    }
    return { x: this.x, y: this.y, radius: this.radius };
  }
}

export { CELL_SIZE };
