export default class InputManager {
  constructor() {
    this.gx = 0; // 归一化重力方向 x (-1 ~ 1)
    this.gy = 0; // 归一化重力方向 y (-1 ~ 1)

    this.keys = {};
    this.hasGyro = false;
    this.sensitivity = 1.3;

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
    this._onDeviceOrientation = (e) => {
      if (e.gamma === null || e.beta === null) return;

      // gamma: 左右倾斜 (-90 ~ 90)
      // beta: 前后倾斜 (-180 ~ 180)
      let gx = (e.gamma - this.calibrationGamma) / 30;
      let gy = (e.beta - this.calibrationBeta - 20) / 30; // 减20度补偿自然持握角度

      // 限幅
      gx = Math.max(-1, Math.min(1, gx));
      gy = Math.max(-1, Math.min(1, gy));

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
    if (this.hasGyro) return; // 陀螺仪优先

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
