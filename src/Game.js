import { CELL, LEVELS, FACE_COLORS, getStartPosition, getMovingTrapPaths } from './LevelData.js';
import { CELL_SIZE } from './Physics.js';
import Physics from './Physics.js';
import Renderer from './Renderer.js';
import InputManager from './InputManager.js';
import AudioManager from './AudioManager.js';
import Transition from './Transition.js';

const State = {
  START: 'START',
  PLAYING: 'PLAYING',
  FALLING: 'FALLING',
  DEAD: 'DEAD',
  TRANSITION: 'TRANSITION',
  COMPLETE: 'COMPLETE',
};

const CHASE_SPAWN_DISTANCE = CELL_SIZE * 2;
const CHASE_SPEED = 58;

export default class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.physics = new Physics();
    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.transition = new Transition();

    this.state = State.START;
    this.currentFace = 0;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.faceTimes = [];
    this.grid = LEVELS[0].grid.map(row => [...row]);
    this.movingTraps = [];
    this.pendingChaseTraps = [];
    this.collectedStars = 0;
    this.totalStars = 0;
    this.goalUnlocked = true;
    this.deathTimer = 0;
    this._nextTrapId = 1;
    this._lastFrameMs = performance.now();
    this._animFrame = null;
    this._boundLoop = this._loop.bind(this);
    this._toastToken = 0;

    this.startScreen = document.getElementById('start-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.completeScreen = document.getElementById('complete-screen');
    this.timerEl = document.getElementById('timer');
    this.totalTimeEl = document.getElementById('total-time');
    this.faceToast = document.getElementById('face-toast');
    this.faceToastText = document.getElementById('face-toast-text');
    this.faceToastKicker = document.querySelector('.toast-kicker');
    this.levelLabel = document.getElementById('level-label');
    this.faceNameEl = document.getElementById('face-name');
    this.starCounterEl = document.getElementById('star-counter');
    this.mechanicHintEl = document.getElementById('mechanic-hint');
    this.progressDots = document.querySelectorAll('#progress-dots .dot');
  }

  start() {
    this.audio.init();
    this._showScreen('start');
  }

  async startGame() {
    await this.input.requestGyroPermission();
    this.currentFace = 0;
    this.faceTimes = [];
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this._showScreen('game');
    this.renderer.resize();
    this._loadFace(0);
    this._showFaceToast(LEVELS[0].name, 'TUTORIAL');
    this.state = State.PLAYING;
    this._lastFrameMs = performance.now();
    this._startLoop();
  }

  _loadFace(index) {
    const level = LEVELS[index];
    const start = getStartPosition(index);
    this.currentFace = index;
    this.grid = level.grid.map(row => [...row]);
    this.physics.reset(start.col, start.row);
    this.movingTraps = this._createPatrolTraps(getMovingTrapPaths(index));
    this.pendingChaseTraps = [];
    this.totalStars = this._countStars();
    this.collectedStars = 0;
    this.goalUnlocked = this.totalStars === 0;
    this.deathTimer = 0;

    this.levelLabel.textContent = index === 0 ? 'TUTORIAL' : `LEVEL ${String(index).padStart(2, '0')}`;
    this.faceNameEl.textContent = level.name;
    this._setFaceTheme(level);
    this._updateProgressDots(index);
    this._updateStarHUD();
    this._updateMechanicHint();
    this.renderer.resetLevelEffects();
  }

  _loop(now = performance.now()) {
    if (this.state === State.START || this.state === State.COMPLETE) return;

    const dt = Math.min(50, Math.max(0, now - this._lastFrameMs));
    this._lastFrameMs = now;
    this.input.update();

    if (this.state === State.DEAD) {
      this.physics.update(0, 0, this.grid, [], false);
      this.deathTimer -= dt;
      this._renderFrame();
      if (this.deathTimer <= 0) {
        this._loadFace(this.currentFace);
        this._showFaceToast('陷阱吞噬 · 本关重置', 'TRY AGAIN', 'danger');
        this.state = State.PLAYING;
      }
      this._animFrame = requestAnimationFrame(this._boundLoop);
      return;
    }

    if (this.state === State.PLAYING || this.state === State.FALLING) {
      const { x: gx, y: gy } = this.input.getGravity();
      if (this.state === State.PLAYING) {
        this._updatePatrolTraps(dt);
        this._spawnReadyChaseTraps();
        this._updateChaseTraps(dt);
      }

      const result = this.physics.update(gx, gy, this.grid, this.movingTraps, this.goalUnlocked);
      if (this.state === State.PLAYING) this._handlePlayingResult(result);
      if (this.state === State.FALLING && result.complete) this._onFaceComplete();
      this._renderFrame(gx, gy);
    }

    this._animFrame = requestAnimationFrame(this._boundLoop);
  }

  _handlePlayingResult(result) {
    if (result.hit) {
      this.audio.playHit(result.speed);
      this._vibrateHit(result.speed);
      this._shakeScreen();
      this.physics.hitWalls.forEach(({ col, row }) => this.renderer.addFlash(col, row));
    }

    if (result.hitTrap || result.hitMovingTrap) {
      this._onTrapDeath();
      return;
    }

    if (result.collectedStar) this._collectStar(result.collectedStar);
    if (result.goalReached && this.goalUnlocked) {
      this.state = State.FALLING;
      this.audio.playFall();
    }
  }

  _collectStar({ col, row }) {
    if (this.grid[row][col] !== CELL.STAR) return;
    this.grid[row][col] = CELL.EMPTY;
    this.collectedStars++;
    this.audio.playStarCollect();
    this.renderer.notifyStarCollected(col, row);

    if (LEVELS[this.currentFace].chaseStars) {
      this.pendingChaseTraps.push({ col, row, x: this._cellCenter(col), y: this._cellCenter(row) });
    }

    if (this.collectedStars >= this.totalStars) {
      this.goalUnlocked = true;
      this.audio.playGoalUnlock();
      this._showFaceToast('星星收集完成 · 终点已解锁', 'GOAL UNLOCKED', 'success');
    }

    this._updateStarHUD();
  }

  _createPatrolTraps(paths) {
    return paths.map(path => ({
      id: path.id || `patrol-${this._nextTrapId++}`,
      kind: 'patrol',
      active: true,
      x: this._cellCenter(path.startCol),
      y: this._cellCenter(path.startRow),
      waypoints: path.waypoints,
      waypointIndex: 1,
      speed: path.speed,
      radius: 13,
      spawnFlash: 1,
    }));
  }

  _updatePatrolTraps(dt) {
    for (const trap of this.movingTraps) {
      if (trap.kind !== 'patrol' || !trap.active) continue;
      const target = trap.waypoints[trap.waypointIndex];
      if (!target) continue;
      const reached = this._moveTrapToward(trap, this._cellCenter(target.col), this._cellCenter(target.row), trap.speed, dt);
      if (reached) trap.waypointIndex = (trap.waypointIndex + 1) % trap.waypoints.length;
    }
  }

  _spawnReadyChaseTraps() {
    this.pendingChaseTraps = this.pendingChaseTraps.filter((spawn) => {
      const dx = this.physics.x - spawn.x;
      const dy = this.physics.y - spawn.y;
      if (Math.sqrt(dx * dx + dy * dy) < CHASE_SPAWN_DISTANCE) return true;
      this.movingTraps.push({
        id: `chase-${this._nextTrapId++}`,
        kind: 'chase',
        active: true,
        x: spawn.x,
        y: spawn.y,
        speed: CHASE_SPEED,
        radius: 13,
        repathTimer: 0,
        path: [],
        pathIndex: 0,
        spawnFlash: 1,
      });
      return false;
    });
  }

  _updateChaseTraps(dt) {
    for (const trap of this.movingTraps) {
      if (trap.kind !== 'chase' || !trap.active) continue;
      trap.repathTimer -= dt;
      if (trap.repathTimer <= 0 || trap.pathIndex >= trap.path.length) {
        trap.path = this._findPath(
          this._toCell(trap.x),
          this._toCell(trap.y),
          this._toCell(this.physics.x),
          this._toCell(this.physics.y)
        );
        trap.pathIndex = Math.min(1, trap.path.length - 1);
        trap.repathTimer = 280;
      }
      const target = trap.path[trap.pathIndex];
      if (!target) continue;
      const reached = this._moveTrapToward(trap, this._cellCenter(target.col), this._cellCenter(target.row), trap.speed, dt);
      if (reached) trap.pathIndex++;
    }
  }

  _moveTrapToward(trap, x, y, speed, dt) {
    const dx = x - trap.x;
    const dy = y - trap.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 0.01) return true;
    const step = speed * (dt / 1000);
    if (step >= distance) {
      trap.x = x;
      trap.y = y;
      return true;
    }
    trap.x += (dx / distance) * step;
    trap.y += (dy / distance) * step;
    return false;
  }

  _findPath(startCol, startRow, endCol, endRow) {
    const queue = [{ col: startCol, row: startRow }];
    const previous = new Map([[`${startCol},${startRow}`, null]]);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      if (current.col === endCol && current.row === endRow) {
        const path = [];
        let key = `${current.col},${current.row}`;
        while (key) {
          const [col, row] = key.split(',').map(Number);
          path.push({ col, row });
          key = previous.get(key);
        }
        return path.reverse();
      }

      for (const [dc, dr] of directions) {
        const col = current.col + dc;
        const row = current.row + dr;
        const key = `${col},${row}`;
        if (row < 0 || col < 0 || row >= this.grid.length || col >= this.grid[row].length) continue;
        if (this.grid[row][col] === CELL.WALL || previous.has(key)) continue;
        previous.set(key, `${current.col},${current.row}`);
        queue.push({ col, row });
      }
    }
    return [];
  }

  _onTrapDeath() {
    this.state = State.DEAD;
    this.deathTimer = 680;
    this.audio.playTrapDeath();
    this._vibrateDeath();
    this._shakeScreen();
  }

  async _onFaceComplete() {
    this.state = State.TRANSITION;
    const previousTotal = this.faceTimes.reduce((sum, value) => sum + value, 0);
    this.faceTimes.push(Date.now() - this.startTime - previousTotal);

    if (this.currentFace >= LEVELS.length - 1) {
      this._onGameComplete();
      return;
    }

    this.audio.playFlip();
    this.transition.show();
    await this.transition.play(this.currentFace, this.currentFace + 1);
    this._loadFace(this.currentFace + 1);
    this._showFaceToast(LEVELS[this.currentFace].name);
    this.transition.hide();
    this.state = State.PLAYING;
  }

  _renderFrame(gx = this.input.gx, gy = this.input.gy) {
    this.elapsedTime = Date.now() - this.startTime;
    this.timerEl.textContent = this._formatTime(this.elapsedTime);
    this.renderer.draw(
      this.currentFace,
      this.physics,
      gx,
      gy,
      this.goalUnlocked,
      this.movingTraps,
      this.grid
    );
  }

  _onGameComplete() {
    this._stopLoop();
    this.audio.playComplete();
    this.totalTimeEl.textContent = this._formatTime(this.elapsedTime);
    this._showScreen('complete');
    this.state = State.COMPLETE;
  }

  _countStars() {
    return this.grid.flat().filter(cell => cell === CELL.STAR).length;
  }

  _updateStarHUD() {
    this.starCounterEl.textContent = `★ ${this.collectedStars}/${this.totalStars}`;
    this.starCounterEl.classList.toggle('hidden', this.totalStars === 0);
    this.starCounterEl.classList.toggle('unlocked', this.totalStars > 0 && this.goalUnlocked);
  }

  _updateMechanicHint() {
    const level = LEVELS[this.currentFace];
    let text = '倾斜手机控制金属球 · 桌面端使用 WASD';
    if (this.totalStars > 0) text = '收集全部星星后进入终点暗井';
    if (this.movingTraps.length > 0) text = '蓝色陷阱会沿轨道巡游 · 先收集星星';
    if (level.chaseStars) text = '收集星星后尽快离开 · 蓝洞会从原地追来';
    this.mechanicHintEl.textContent = text;
  }

  _updateProgressDots(currentIndex) {
    this.progressDots.forEach((dot, index) => {
      dot.classList.remove('active', 'done');
      dot.style.borderColor = '';
      dot.style.background = '';
      dot.style.boxShadow = '';
      const color = FACE_COLORS[index].color;
      if (index < currentIndex) {
        dot.classList.add('done');
        dot.style.background = color;
        dot.style.borderColor = color;
      } else if (index === currentIndex) {
        dot.classList.add('active');
        dot.style.borderColor = color;
        dot.style.boxShadow = `0 0 6px ${color}80`;
      }
    });
  }

  _setFaceTheme(level) {
    const hex = level.color.replace('#', '');
    const rgb = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ');
    this.gameScreen.style.setProperty('--face-color', level.color);
    this.gameScreen.style.setProperty('--face-rgb', rgb);
  }

  _showFaceToast(text, kicker = 'NEW FACE UNLOCKED', variant = '') {
    const token = ++this._toastToken;
    this.faceToastText.textContent = text;
    this.faceToastKicker.textContent = kicker;
    this.faceToast.classList.toggle('danger', variant === 'danger');
    this.faceToast.classList.toggle('success', variant === 'success');
    this.faceToast.classList.remove('hidden');
    this.faceToast.classList.add('show');
    setTimeout(() => {
      if (token !== this._toastToken) return;
      this.faceToast.classList.remove('show');
      setTimeout(() => {
        if (token === this._toastToken) this.faceToast.classList.add('hidden');
      }, 300);
    }, 1200);
  }

  _showScreen(name) {
    [this.startScreen, this.gameScreen, this.completeScreen, this.transition.screen]
      .forEach(screen => screen.classList.remove('active'));
    if (name === 'start') this.startScreen.classList.add('active');
    if (name === 'game') this.gameScreen.classList.add('active');
    if (name === 'complete') this.completeScreen.classList.add('active');
  }

  _startLoop() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    this._animFrame = requestAnimationFrame(this._boundLoop);
  }

  _stopLoop() {
    if (!this._animFrame) return;
    cancelAnimationFrame(this._animFrame);
    this._animFrame = null;
  }

  restart() {
    this.startGame();
  }

  _vibrateHit(speed = 0) {
    const intensity = Math.min(speed / this.physics.maxSpeed, 1);
    if (navigator.vibrate) navigator.vibrate(30 + Math.round(intensity * 90));
    else this.audio.playBuzz(intensity);
  }

  _vibrateDeath() {
    if (navigator.vibrate) navigator.vibrate([70, 45, 150]);
  }

  _shakeScreen() {
    this.canvas.classList.add('shake');
    setTimeout(() => this.canvas.classList.remove('shake'), 100);
  }

  _cellCenter(value) {
    return value * CELL_SIZE + CELL_SIZE / 2;
  }

  _toCell(value) {
    return Math.max(0, Math.min(14, Math.floor(value / CELL_SIZE)));
  }

  _formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
