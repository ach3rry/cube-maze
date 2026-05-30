import { LEVELS, FACE_COLORS, getStartPosition, getGoalPosition, getMovingTrapPaths } from './LevelData.js';
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

    this._animFrame = null;
    this._boundLoop = this._loop.bind(this);

    // DOM 引用
    this.startScreen = document.getElementById('start-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.completeScreen = document.getElementById('complete-screen');
    this.timerEl = document.getElementById('timer');
    this.totalTimeEl = document.getElementById('total-time');
    this.faceToast = document.getElementById('face-toast');
    this.faceToastText = document.getElementById('face-toast-text');
    this.levelLabel = document.getElementById('level-label');
    this.progressDots = document.querySelectorAll('#progress-dots .dot');
    this.starCounterEl = document.getElementById('star-counter');

    this.collectedStars = 0;
    this.totalStars = 0;
    this.goalUnlocked = false;
    this.movingTraps = [];
    this.deathTimer = 0;
    this.levelStartMs = 0;
  }

  start() {
    this.audio.init();
    this._showScreen('start');
  }

  async startGame() {
    const gyroOk = await this.input.requestGyroPermission();

    this.currentFace = 0;
    this.faceTimes = [];
    this.startTime = Date.now();
    this.elapsedTime = 0;

    this.collectedStars = 0;
    this.totalStars = 0;
    this.goalUnlocked = false;
    this.movingTraps = [];
    this.deathTimer = 0;

    this._loadFace(0);
    this._showScreen('game');
    this._showFaceToast(LEVELS[0].name);
    this.state = State.PLAYING;

    this._startLoop();
  }

  _loadFace(index) {
    const pos = getStartPosition(index);
    this.physics.reset(pos.col, pos.row);
    this.currentFace = index;
    this.levelLabel.textContent = `LEVEL ${index + 1}`;
    this._updateProgressDots(index);
    this.renderer.flashWalls = [];

    // 深拷贝 grid，避免星星收集污染原始 LEVELS 数据
    const srcGrid = LEVELS[index].grid;
    this.grid = srcGrid.map(row => [...row]);

    this.totalStars = this._countStarsInGrid(this.grid);
    this.collectedStars = 0;
    this.goalUnlocked = (this.totalStars === 0);
    this._updateStarHUD();

    // 初始化移动陷阱（第4关、第5关）
    this.movingTraps = [];
    const trapPaths = getMovingTrapPaths(index);
    if (trapPaths.length > 0) {
      this.levelStartMs = Date.now();
      this._initMovingTraps(trapPaths);
    }
  }

  _updateProgressDots(currentIndex) {
    this.progressDots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      dot.style.borderColor = '';
      dot.style.background = '';
      dot.style.boxShadow = '';
      const c = FACE_COLORS[i].color;
      if (i < currentIndex) {
        dot.classList.add('done');
        dot.style.background = c;
        dot.style.borderColor = c;
      } else if (i === currentIndex) {
        dot.classList.add('active');
        dot.style.borderColor = c;
        dot.style.boxShadow = `0 0 6px ${c}80`;
      }
    });
  }

  _startLoop() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    this._animFrame = requestAnimationFrame(this._boundLoop);
  }

  _stopLoop() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  _loop() {
    if (this.state === State.START || this.state === State.COMPLETE) return;

    this.input.update();

    // DEAD 状态：等待死亡动画完成后重置
    if (this.state === State.DEAD) {
      this.deathTimer -= 16;
      if (this.deathTimer <= 0) {
        console.log('[DEAD] restarting from level 1');
        this.currentFace = 0;
        this._loadFace(0);
        this.state = State.PLAYING;
      }
      this.elapsedTime = Date.now() - this.startTime;
      this.timerEl.textContent = this._formatTime(this.elapsedTime);
      this.renderer.draw(this.currentFace, this.physics, this.input.gx, this.input.gy, this.goalUnlocked, this.movingTraps, this.grid);
      this._animFrame = requestAnimationFrame(this._boundLoop);
      return;
    }

    if (this.state === State.PLAYING || this.state === State.FALLING) {
      const { x: gx, y: gy } = this.input.getGravity();

      // 更新移动陷阱
      this._updateMovingTraps(16);

      const result = this.physics.update(gx, gy, this.grid, this.movingTraps, this.goalUnlocked);

      if (this.state === State.PLAYING) {
        // 撞墙反馈
        if (result.hit) {
          this.audio.playHit();
          this._vibrateHit();
          this._shakeScreen();
          this.physics.hitWalls.forEach(w => this.renderer.addFlash(w.col, w.row));
        }

        // 陷阱死亡（静态陷阱或移动陷阱）
        if (result.hitTrap || result.hitMovingTrap) {
          this._onTrapDeath();
        }

        // 收集星星
        if (result.collectedStar) {
          const s = result.collectedStar;
          this.grid[s.row][s.col] = 0; // EMPTY
          this.collectedStars++;
          this.audio.playStarCollect();
          this._updateStarHUD();

          if (this.collectedStars >= this.totalStars && this.totalStars > 0) {
            this.goalUnlocked = true;
            this.audio.playGoalUnlock();
          }
        }

        // 终点到达（仅在解锁后生效）
        if (result.goalReached && this.goalUnlocked) {
          this.state = State.FALLING;
          this.audio.playFall();
        }
      }

      if (this.state === State.FALLING && result.complete) {
        this._onFaceComplete();
      }

      this.elapsedTime = Date.now() - this.startTime;
      this.timerEl.textContent = this._formatTime(this.elapsedTime);

      this.renderer.draw(this.currentFace, this.physics, gx, gy, this.goalUnlocked, this.movingTraps, this.grid);
    }

    this._animFrame = requestAnimationFrame(this._boundLoop);
  }

  async _onFaceComplete() {
    this.state = State.TRANSITION;
    const faceTime = Date.now() - this.startTime - this.faceTimes.reduce((a, b) => a + b, 0);
    this.faceTimes.push(faceTime);

    if (this.currentFace >= LEVELS.length - 1) { // LEVELS.length = 5, last face index = 4
      this._onGameComplete();
      return;
    }

    this.audio.playFlip();
    this.transition.show();

    await this.transition.playSimple();

    this._loadFace(this.currentFace + 1);
    this._showFaceToast(LEVELS[this.currentFace].name);

    this.transition.hide();
    this.state = State.PLAYING;
  }

  _onGameComplete() {
    this._stopLoop();
    this.audio.playComplete();

    const totalTime = this.elapsedTime;
    this.totalTimeEl.textContent = this._formatTime(totalTime);

    this._showScreen('complete');
    this.state = State.COMPLETE;
  }

  _countStarsInGrid(grid) {
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 5) count++; // CELL.STAR
      }
    }
    return count;
  }

  _initMovingTraps(paths) {
    // 所有陷阱从关卡开始即活跃，错开首次分裂时间
    this.movingTraps = paths.map((p, i) => {
      const firstSplit = p.altWaypoints ? 6 + i * 2 : Infinity;
      return {
        x: p.startCol * 40 + 20,
        y: p.startRow * 40 + 20,
        waypoints: p.waypoints,
        altWaypoints: p.altWaypoints || null,
        waypointIndex: 1,
        speed: p.speed,
        startDelay: 0,
        elapsed: 0,
        active: true,
        jumpTimer: 0,
        splitCount: 0,
        splitInterval: 8,
        nextSplitTime: firstSplit,
      };
    });
    // 初始定位到第一个路径点
    for (const mt of this.movingTraps) {
      const wp0 = mt.waypoints[0];
      mt.x = wp0.col * 40 + 20;
      mt.y = wp0.row * 40 + 20;
    }
  }

  _updateMovingTraps(dt) {
    const levelElapsed = (Date.now() - this.levelStartMs) / 1000;
    const newTraps = [];
    const dtSec = dt / 1000;

    for (const mt of this.movingTraps) {
      mt.elapsed = levelElapsed;
      if (!mt.active && levelElapsed >= mt.startDelay) {
        mt.active = true;
        const wp0 = mt.waypoints[0];
        mt.x = wp0.col * 40 + 20;
        mt.y = wp0.row * 40 + 20;
      }
      if (!mt.active) continue;

      // 跳跃计时器：停留 1/speed 秒后跳到下一格
      const jumpInterval = 1 / mt.speed;
      mt.jumpTimer += dtSec;

      if (mt.jumpTimer >= jumpInterval) {
        mt.jumpTimer -= jumpInterval;
        const wp = mt.waypoints[mt.waypointIndex];
        mt.x = wp.col * 40 + 20;
        mt.y = wp.row * 40 + 20;
        mt.waypointIndex = (mt.waypointIndex + 1) % mt.waypoints.length;
      }

      // 分裂：克隆体走 altWaypoints（不同走廊），交替路线，无数量上限
      if (levelElapsed >= mt.nextSplitTime && mt.altWaypoints) {
        mt.splitCount++;
        mt.nextSplitTime = levelElapsed + mt.splitInterval;
        const clonePath = mt.altWaypoints;
        // 找到克隆路径上离当前点最近的格子，就近切入
        let closestIdx = 0;
        let closestDist = Infinity;
        for (let i = 0; i < clonePath.length; i++) {
          const dx = mt.x - (clonePath[i].col * 40 + 20);
          const dy = mt.y - (clonePath[i].row * 40 + 20);
          const d = dx * dx + dy * dy;
          if (d < closestDist) { closestDist = d; closestIdx = i; }
        }
        const cp = clonePath[closestIdx];
        newTraps.push({
          x: cp.col * 40 + 20,
          y: cp.row * 40 + 20,
          waypoints: clonePath,
          altWaypoints: mt.waypoints,  // 子代交换路线，孙代回到主路径
          waypointIndex: (closestIdx + 1) % clonePath.length,
          speed: mt.speed * 0.9,
          startDelay: 0,
          elapsed: levelElapsed,
          active: true,
          jumpTimer: 0,
          splitCount: 0,
          splitInterval: mt.splitInterval,
          nextSplitTime: levelElapsed + mt.splitInterval,
          spawnFlash: 1.0,
        });
      }

      // 分裂闪光衰减
      if (mt.spawnFlash !== undefined && mt.spawnFlash > 0) {
        mt.spawnFlash -= dtSec / 0.4;
        if (mt.spawnFlash < 0) mt.spawnFlash = 0;
      }
    }

    for (const t of newTraps) {
      this.movingTraps.push(t);
    }
  }

  _onTrapDeath() {
    this.state = State.DEAD;
    this.deathTimer = 500;
    this.audio.playTrapDeath();
    this._vibrateDeath();
    this._shakeScreen();
  }

  _updateStarHUD() {
    if (this.starCounterEl) {
      this.starCounterEl.textContent = `★ ${this.collectedStars}/${this.totalStars}`;
      if (this.goalUnlocked && this.totalStars > 0) {
        this.starCounterEl.classList.add('unlocked');
      } else {
        this.starCounterEl.classList.remove('unlocked');
      }
    }
  }

  _vibrateDeath() {
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  }

  restart() {
    this.startGame();
  }

  _vibrateHit() {
    if (navigator.vibrate) {
      navigator.vibrate([20, 25, 20]);
    }
  }

  _shakeScreen() {
    this.canvas.classList.add('shake');
    setTimeout(() => this.canvas.classList.remove('shake'), 100);
  }

  async _showFaceToast(text) {
    this.faceToastText.textContent = text;
    this.faceToast.classList.remove('hidden');
    this.faceToast.classList.add('show');
    await new Promise(r => setTimeout(r, 1200));
    this.faceToast.classList.remove('show');
    setTimeout(() => this.faceToast.classList.add('hidden'), 300);
  }

  _showScreen(name) {
    [this.startScreen, this.gameScreen, this.completeScreen, this.transition.screen].forEach(s => {
      s.classList.remove('active');
    });
    switch (name) {
      case 'start': this.startScreen.classList.add('active'); break;
      case 'game': this.gameScreen.classList.add('active'); break;
      case 'complete': this.completeScreen.classList.add('active'); break;
    }
  }

  _formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}
