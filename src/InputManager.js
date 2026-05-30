export default class InputManager {
  constructor() {
    this.gx = 0; // 归一化重力方向 x (-1 ~ 1)
    this.gy = 0; // 归一化重力方向 y (-1 ~ 1)

    this.keys = {};
    this.hasGyro = false;
    this.sensitivity = 1.1;

    // 陀螺仪校准基准
    this.calibrationBeta = 0;
    this.calibrationGamma = 0;

    this._onKeydown = (e) => {
      this.keys[e.key] = true;
      // 阻止方向键滚动页面
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    this._onKeyup = (e) => { this.keys[e.key] = false; };

    window.addEventListener('keydown', this._onKeydown);
    window.addEventListener('keyup', this._onKeyup);
  }

  async requestGyroPermission() {
    // iOS 13+ 需要用户手势触发权限请求
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          this._startGyro();
          return true;
        }
        return false;
      } catch (e) {
        console.warn('陀螺仪权限请求失败:', e);
        return false;
      }
    }

    // 安卓或不需要权限的平台
    this._startGyro();
    return true;
  }

  _startGyro() {
    this.hasGyro = true;
    if (this._onDeviceOrientation) return;
    this.gyroActive = false;
    this._onDeviceOrientation = (e) => {
      if (e.gamma === null || e.beta === null) return;

      this.gyroActive = true;

      // Use the physical horizontal plane as the neutral position.
      // 右侧抬起 (gamma>0) → gx>0 (球向右滚)
      // 顶部前倾 (beta>0) → gy>0 (球向下滚)
      const betaRad = e.beta * Math.PI / 180;
      const gammaRad = e.gamma * Math.PI / 180;

      let gx = Math.sin(gammaRad) * Math.cos(betaRad);
      let gy = Math.sin(betaRad);

      // 死区：过滤陀螺仪噪声（手机平放不漂移）
      const DEAD_ZONE = 0.06;
      if (Math.abs(gx) < DEAD_ZONE) gx = 0;
      if (Math.abs(gy) < DEAD_ZONE) gy = 0;

      this.gx = gx * this.sensitivity;
      this.gy = gy * this.sensitivity;
    };
    window.addEventListener('deviceorientation', this._onDeviceOrientation);
  }

  calibrate() {
    // 以当前姿态作为校准基准（在开始时调用）
    // 通过下一次陀螺仪事件获取基准值
    const handler = (e) => {
      if (e.gamma !== null) this.calibrationGamma = e.gamma;
      if (e.beta !== null) this.calibrationBeta = e.beta;
      window.removeEventListener('deviceorientation', handler);
    };
    window.addEventListener('deviceorientation', handler);
  }

  update() {
    if (this.hasGyro && this.gyroActive) return;

    // 键盘输入
    let kx = 0, ky = 0;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) kx -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) kx += 1;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) ky -= 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) ky += 1;

    // 归一化对角线
    if (kx !== 0 && ky !== 0) {
      const len = Math.sqrt(kx * kx + ky * ky);
      kx /= len;
      ky /= len;
    }

    this.gx = kx * this.sensitivity;
    this.gy = ky * this.sensitivity;
  }

  getGravity() {
    return { x: this.gx, y: this.gy };
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeydown);
    window.removeEventListener('keyup', this._onKeyup);
    if (this._onDeviceOrientation) {
      window.removeEventListener('deviceorientation', this._onDeviceOrientation);
    }
  }
}
