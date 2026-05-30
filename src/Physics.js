import { CELL } from './LevelData.js';

const CELL_SIZE = 40;

export default class Physics {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;

    this.accelScale = 0.55;
    this.friction = 0.97;
    this.maxSpeed = 8.5;
    this.bounceCoeff = 0.45;

    this.hitWalls = [];
    this._prevWallKeys = new Set();
    this.falling = false;
    this.fallProgress = 0;
    this.fallType = null;
    this.goalX = null;
    this.goalY = null;
  }

  reset(col, row) {
    this.x = col * CELL_SIZE + CELL_SIZE / 2;
    this.y = row * CELL_SIZE + CELL_SIZE / 2;
    this.vx = 0;
    this.vy = 0;
    this.hitWalls = [];
    this._prevWallKeys = new Set();
    this.falling = false;
    this.fallProgress = 0;
    this.fallType = null;
    this.goalX = null;
    this.goalY = null;
  }

  update(ax, ay, grid, movingTraps = [], goalUnlocked = true) {
    if (this.falling) {
      this.fallProgress += 0.055;
      return {
        falling: true,
        complete: this.fallProgress >= 1,
        fallType: this.fallType,
      };
    }

    this.vx += ax * this.accelScale;
    this.vy += ay * this.accelScale;
    this.vx *= this.friction;
    this.vy *= this.friction;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    if (speed < 0.15 && Math.abs(ax) < 0.02 && Math.abs(ay) < 0.02) {
      this.vx = 0;
      this.vy = 0;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.hitWalls = [];
    const { impacted } = this.resolveCollisions(grid);
    const staticTrap = this.findStaticTrap(grid);
    const movingTrap = this.findMovingTrap(movingTraps);

    if (staticTrap || movingTrap) {
      const trap = staticTrap || movingTrap;
      this.beginFall('trap', trap.x, trap.y);
      return {
        hit: impacted,
        hitTrap: Boolean(staticTrap),
        hitMovingTrap: Boolean(movingTrap),
        speed: this.getSpeed(),
      };
    }

    const collectedStar = this.findStar(grid);
    const goalReached = goalUnlocked ? this.checkGoal(grid) : false;

    return {
      hit: impacted,
      goalReached,
      collectedStar,
      speed: this.getSpeed(),
    };
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

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (grid[row][col] !== CELL.WALL) continue;

        const left = col * CELL_SIZE;
        const top = row * CELL_SIZE;
        const right = left + CELL_SIZE;
        const bottom = top + CELL_SIZE;
        const closestX = Math.max(left, Math.min(this.x, right));
        const closestY = Math.max(top, Math.min(this.y, bottom));
        const dx = this.x - closestX;
        const dy = this.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= this.radius) continue;
        touching = true;

        if (dist === 0) {
          this.x += this.radius;
        } else {
          const overlap = this.radius - dist;
          this.x += (dx / dist) * overlap;
          this.y += (dy / dist) * overlap;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          const intoWall = (dx > 0 && this.vx < 0) || (dx < 0 && this.vx > 0);
          if (intoWall) this.vx = -this.vx * this.bounceCoeff;
          else if (Math.abs(this.vx) < 0.5) this.vx *= 0.1;
        } else {
          const intoWall = (dy > 0 && this.vy < 0) || (dy < 0 && this.vy > 0);
          if (intoWall) this.vy = -this.vy * this.bounceCoeff;
          else if (Math.abs(this.vy) < 0.5) this.vy *= 0.1;
        }

        this.hitWalls.push({ col, row });
      }
    }

    if (touching) {
      const keys = this.hitWalls.map(({ col, row }) => `${col},${row}`);
      impacted = keys.some(key => !this._prevWallKeys.has(key));
      this._prevWallKeys = new Set(keys);
    } else {
      this._prevWallKeys = new Set();
    }

    return { touching, impacted };
  }

  checkGoal(grid) {
    const goal = this.findGridCell(grid, CELL.GOAL, this.radius * 0.8);
    if (!goal) return false;
    this.beginFall('goal', goal.x, goal.y);
    return true;
  }

  findStaticTrap(grid) {
    return this.findGridCell(grid, CELL.TRAP, this.radius * 0.9);
  }

  findStar(grid) {
    const star = this.findGridCell(grid, CELL.STAR, this.radius * 1.2);
    return star ? { col: star.col, row: star.row } : null;
  }

  findMovingTrap(movingTraps) {
    for (const trap of movingTraps) {
      if (!trap.active) continue;
      const dx = this.x - trap.x;
      const dy = this.y - trap.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.radius + (trap.radius || 13)) {
        return { x: trap.x, y: trap.y };
      }
    }
    return null;
  }

  findGridCell(grid, cellType, threshold) {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] !== cellType) continue;
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;
        const dx = this.x - x;
        const dy = this.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return { col, row, x, y };
      }
    }
    return null;
  }

  beginFall(type, x, y) {
    this.falling = true;
    this.fallProgress = 0;
    this.fallType = type;
    this.goalX = x;
    this.goalY = y;
    this.vx = 0;
    this.vy = 0;
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  getDrawPos() {
    if (!this.falling) return { x: this.x, y: this.y, radius: this.radius };
    const scale = 1 - this.fallProgress;
    return {
      x: this.goalX ?? this.x,
      y: this.goalY ?? this.y,
      radius: this.radius * Math.max(0, scale),
    };
  }
}

export { CELL_SIZE };
