import { LEVELS, FACE_COLORS, getStartPosition, getGoalPosition } from './LevelData.js';
import Physics from './Physics.js';
import Renderer from './Renderer.js';
import InputManager from './InputManager.js';
import AudioManager from './AudioManager.js';
import Transition from './Transition.js';

const State = {
  START: 'START',
  PLAYING: 'PLAYING',
  FALLING: 'FALLING',
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
  }

  start() {
    this.audio.init();
    this._showScreen('start');
  }

  async startGame() {
    const gyroOk = await this.input.requestGyroPermission();
    if (gyroOk) {
      setTimeout(() => this.input.calibrate(), 500);
    }

    this.currentFace = 0;
    this.faceTimes = [];
    this.startTime = Date.now();
    this.elapsedTime = 0;

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

    if (this.state === State.PLAYING || this.state === State.FALLING) {
      const { x: gx, y: gy } = this.input.getGravity();
      const grid = LEVELS[this.currentFace].grid;

      const result = this.physics.update(gx, gy, grid);

      if (this.state === State.PLAYING) {
        // 撞墙反馈（只在首次接触帧触发）
        if (result.hit) {
          const speed = result.speed || 0;
          this.audio.playHit(speed);
          this._vibrateHit(speed);
          this._shakeScreen();
          this.physics.hitWalls.forEach(w => this.renderer.addFlash(w.col, w.row));
        }

        if (result.goalReached) {
          this.state = State.FALLING;
          this.audio.playFall();
        }
      }

      if (this.state === State.FALLING && result.complete) {
        this._onFaceComplete();
      }

      this.elapsedTime = Date.now() - this.startTime;
      this.timerEl.textContent = this._formatTime(this.elapsedTime);

      this.renderer.draw(this.currentFace, this.physics, gx, gy);
    }

    this._animFrame = requestAnimationFrame(this._boundLoop);
  }

  async _onFaceComplete() {
    this.state = State.TRANSITION;
    const faceTime = Date.now() - this.startTime - this.faceTimes.reduce((a, b) => a + b, 0);
    this.faceTimes.push(faceTime);

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

  _onGameComplete() {
    this._stopLoop();
    this.audio.playComplete();

    const totalTime = this.elapsedTime;
    this.totalTimeEl.textContent = this._formatTime(totalTime);

    this._showScreen('complete');
    this.state = State.COMPLETE;
  }

  restart() {
    this.startGame();
  }

  _vibrateHit(speed = 0) {
    const intensity = Math.min(speed / this.physics.maxSpeed, 1);
    const duration = 200 + Math.round(intensity * 400); // 200ms ~ 600ms

    if (navigator.vibrate) {
      // Android: 来电式强震 pattern (震-停-震-停-震)
      navigator.vibrate([duration, 80, duration, 80, duration]);
    } else {
      // iOS: Web Audio 合成嗡嗡声模拟震动感
      this.audio.playBuzz(intensity);
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
