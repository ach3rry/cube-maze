import { LEVELS } from './LevelData.js';

// 正方体六个面对应的 CSS 旋转角度
const FACE_ROTATIONS = [
  { x: 0, y: 0 },       // front
  { x: 0, y: 90 },      // right
  { x: 0, y: 180 },     // back
  { x: 0, y: -90 },     // left
  { x: -90, y: 0 },     // top
  { x: 90, y: 0 },      // bottom
];

export default class Transition {
  constructor() {
    this.container = document.getElementById('cube-container');
    this.cube = document.getElementById('cube');
    this.screen = document.getElementById('transition-screen');
    this.faces = [
      document.getElementById('cube-front'),
      document.getElementById('cube-right'),
      document.getElementById('cube-back'),
      document.getElementById('cube-left'),
      document.getElementById('cube-top'),
      document.getElementById('cube-bottom'),
    ];

    // 初始化面样式
    this.faces.forEach((face, i) => {
      face.style.background = LEVELS[i].bg;
      face.style.display = 'flex';
      face.style.alignItems = 'center';
      face.style.justifyContent = 'center';
    });
  }

  show() {
    this.screen.classList.add('active');
  }

  hide() {
    this.screen.classList.remove('active');
  }

  // 播放翻转动画：从 currentFace 到 nextFace
  play(currentFace, nextFace) {
    return new Promise((resolve) => {
      this._updateFaceVisuals(currentFace, nextFace);

      const from = FACE_ROTATIONS[currentFace];
      this.cube.style.transition = 'none';
      this.cube.style.transform = `rotateX(${-from.x}deg) rotateY(${-from.y}deg)`;

      this.cube.offsetHeight;

      const to = FACE_ROTATIONS[nextFace];
      this.cube.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      this.cube.style.transform = `rotateX(${-to.x}deg) rotateY(${-to.y}deg)`;

      setTimeout(() => {
        resolve();
      }, 850);
    });
  }

  _updateFaceVisuals(currentFace, nextFace) {
    [currentFace, nextFace].forEach((fi) => {
      const level = LEVELS[fi];
      const face = this.faces[fi];
      face.style.background = level.bg;

      // 清除旧内容并安全添加新内容
      while (face.firstChild) face.removeChild(face.firstChild);
      const label = document.createElement('div');
      label.style.textAlign = 'center';
      label.style.color = level.colorDark;
      label.style.fontWeight = '800';
      label.style.fontSize = '1.5rem';
      label.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
      label.textContent = level.name;
      face.appendChild(label);
    });
  }

  // 简单转场（2D 翻转模拟）
  playSimple() {
    return new Promise((resolve) => {
      this.cube.style.transition = 'transform 0.6s ease-in-out';
      this.cube.style.transform = 'rotateX(90deg)';
      setTimeout(() => {
        this.cube.style.transition = 'none';
        this.cube.style.transform = 'rotateX(0deg)';
        this.cube.offsetHeight;
        this.cube.style.transition = 'transform 0.4s ease-out';
        this.cube.style.transform = 'rotateX(0deg)';
        setTimeout(resolve, 450);
      }, 600);
    });
  }
}
