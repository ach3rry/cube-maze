import Game from './Game.js';

// 全局错误捕获
window.onerror = (msg, src, line, col, err) => {
  const el = document.getElementById('error-msg');
  if (el) {
    el.style.display = 'block';
    el.textContent = `Error: ${msg} (${src}:${line})`;
  }
  console.error(msg, err);
};

try {
  const game = new Game();

  // 开始按钮
  document.getElementById('btn-start').addEventListener('click', () => {
    game.startGame();
  });

  // 重新开始按钮
  document.getElementById('btn-restart').addEventListener('click', () => {
    game.restart();
  });

  // 窗口大小变化时重新适配 Canvas
  window.addEventListener('resize', () => {
    if (game.renderer) {
      game.renderer.resize();
    }
  });

  // 防止手机端拖拽滚动
  document.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  // 初始化
  game.start();
  console.log('Game initialized successfully');
} catch (e) {
  console.error('Game init error:', e);
  const el = document.getElementById('error-msg');
  if (el) {
    el.style.display = 'block';
    el.textContent = 'Init Error: ' + e.message;
  }
  // Try to show error on start screen
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    const div = document.createElement('div');
    div.style.cssText = 'color:red;background:white;padding:10px;margin:10px;border-radius:5px;position:absolute;top:0;z-index:999;';
    div.textContent = 'Error: ' + e.message;
    startScreen.appendChild(div);
  }
}
