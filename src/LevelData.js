// 迷宫网格定义：0=空地, 1=墙壁, 2=起点, 3=终点, 4=陷阱洞, 5=星星
// 15x15 网格，5关难度递增

const CELL = {
  EMPTY: 0,
  WALL: 1,
  START: 2,
  GOAL: 3,
  TRAP: 4,
  STAR: 5,
};

// ===================== 配色 CONFIG =====================
// 五面主色 — 青春多巴胺风格，高饱和明亮
const FACE_COLORS = [
  { name: '第 1 关 · 启程', color: '#FFD93D', wall: '#FFCA28', bg: '#FFFDE7' },   // 活力黄
  { name: '第 2 关 · 暗坑', color: '#FF6B6B', wall: '#EF5350', bg: '#FFF0F0' },   // 青春红
  { name: '第 3 关 · 星途', color: '#51CF66', wall: '#43A047', bg: '#F0FFF0' },   // 清新绿
  { name: '第 4 关 · 绝路', color: '#FF922B', wall: '#FB8C00', bg: '#FFF8F0' },   // 明亮橙
  { name: '第 5 关 · 终幕', color: '#CC5DE8', wall: '#AB47BC', bg: '#FFF0FF' },   // 粉紫
];
// ========================================================

const LEVELS = [
  // ========== 第 1 关：基础入门，无陷阱无星星 ==========
  {
    name: FACE_COLORS[0].name,
    color: FACE_COLORS[0].color,
    colorDark: FACE_COLORS[0].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[0].bg}, #FFFFFF)`,
    difficulty: 1,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,1,1,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  // ========== 第 2 关：1 个陷阱洞 ==========
  {
    name: FACE_COLORS[1].name,
    color: FACE_COLORS[1].color,
    colorDark: FACE_COLORS[1].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[1].bg}, #FFFFFF)`,
    difficulty: 2,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,1,1,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,1,0,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,1,1,1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,4,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  // ========== 第 3 关：4 陷阱 + 3 星星（收集完星星解锁终点） ==========
  {
    name: FACE_COLORS[2].name,
    color: FACE_COLORS[2].color,
    colorDark: FACE_COLORS[2].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[2].bg}, #FFFFFF)`,
    difficulty: 3,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,0,0,0,5,0,1],
      [1,0,0,0,0,1,1,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,1,0,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,4,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,4,1],
      [1,0,0,1,1,1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,5,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,4,0,0,0,0,0,0,5,0,1],
      [1,0,0,0,0,0,0,0,0,4,0,0,0,3,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  // ========== 第 4 关：6 移动陷阱 + 6 星星 ==========
  {
    name: FACE_COLORS[3].name,
    color: FACE_COLORS[3].color,
    colorDark: FACE_COLORS[3].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[3].bg}, #FFFFFF)`,
    difficulty: 4,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,0,0,5,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,1,1,1,0,0,0,0,0,0,0,0,1],
      [1,5,0,0,0,1,0,0,0,0,1,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,5,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,5,0,0,0,0,0,5,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,5,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  // ========== 第 5 关：6 星星 + 4 移动陷阱 ==========
  {
    name: FACE_COLORS[4].name,
    color: FACE_COLORS[4].color,
    colorDark: FACE_COLORS[4].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[4].bg}, #FFFFFF)`,
    difficulty: 5,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,0,0,0,5,0,0,0,0,0,1],
      [1,0,0,0,1,1,1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,1,0,0,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,5,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,5,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,1,0,0,0,5,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,5,0,0,1],
      [1,5,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
];

// ===================== 第 4 关移动陷阱路径 — 6 个原陷阱洞改为移动 =====================
const MOVING_TRAP_PATHS_L4 = [
  // (1,5) → 横向巡逻 row 1, 避开起点 (1,1)
  {
    startCol: 2, startRow: 1,
    waypoints: [
      { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 },
      { col: 5, row: 1 }, { col: 6, row: 1 }, { col: 7, row: 1 },
      { col: 6, row: 1 }, { col: 5, row: 1 }, { col: 4, row: 1 }, { col: 3, row: 1 },
    ],
    speed: 0.85,
  },
  // (5,8) → 横向巡逻 row 5, col 6~13
  {
    startCol: 6, startRow: 5,
    waypoints: [
      { col: 6, row: 5 }, { col: 7, row: 5 }, { col: 8, row: 5 }, { col: 9, row: 5 },
      { col: 10, row: 5 }, { col: 11, row: 5 }, { col: 12, row: 5 }, { col: 13, row: 5 },
      { col: 12, row: 5 }, { col: 11, row: 5 }, { col: 10, row: 5 }, { col: 9, row: 5 },
      { col: 8, row: 5 }, { col: 7, row: 5 },
    ],
    speed: 0.85,
  },
  // (8,13) → 纵向巡逻 col 13
  {
    startCol: 13, startRow: 4,
    waypoints: [
      { col: 13, row: 4 }, { col: 13, row: 5 }, { col: 13, row: 6 }, { col: 13, row: 7 },
      { col: 13, row: 8 }, { col: 13, row: 9 }, { col: 13, row: 10 }, { col: 13, row: 11 },
      { col: 13, row: 12 },
      { col: 13, row: 11 }, { col: 13, row: 10 }, { col: 13, row: 9 }, { col: 13, row: 8 },
      { col: 13, row: 7 }, { col: 13, row: 6 }, { col: 13, row: 5 },
    ],
    speed: 0.85,
  },
  // (9,7) → 横向巡逻 row 9, col 5~13
  {
    startCol: 5, startRow: 9,
    waypoints: [
      { col: 5, row: 9 }, { col: 6, row: 9 }, { col: 7, row: 9 }, { col: 8, row: 9 },
      { col: 9, row: 9 }, { col: 10, row: 9 }, { col: 11, row: 9 }, { col: 12, row: 9 },
      { col: 13, row: 9 },
      { col: 12, row: 9 }, { col: 11, row: 9 }, { col: 10, row: 9 }, { col: 9, row: 9 },
      { col: 8, row: 9 }, { col: 7, row: 9 }, { col: 6, row: 9 },
    ],
    speed: 0.85,
  },
  // (12,6) → 横向巡逻 row 12
  {
    startCol: 1, startRow: 12,
    waypoints: [
      { col: 1, row: 12 }, { col: 2, row: 12 }, { col: 3, row: 12 }, { col: 4, row: 12 },
      { col: 5, row: 12 }, { col: 6, row: 12 }, { col: 7, row: 12 }, { col: 8, row: 12 },
      { col: 9, row: 12 }, { col: 10, row: 12 }, { col: 11, row: 12 },
      { col: 10, row: 12 }, { col: 9, row: 12 }, { col: 8, row: 12 }, { col: 7, row: 12 },
      { col: 6, row: 12 }, { col: 5, row: 12 }, { col: 4, row: 12 }, { col: 3, row: 12 },
      { col: 2, row: 12 },
    ],
    speed: 0.85,
  },
  // (13,9) → 横向巡逻 row 13
  {
    startCol: 1, startRow: 13,
    waypoints: [
      { col: 1, row: 13 }, { col: 2, row: 13 }, { col: 3, row: 13 }, { col: 4, row: 13 },
      { col: 5, row: 13 }, { col: 6, row: 13 }, { col: 7, row: 13 }, { col: 8, row: 13 },
      { col: 9, row: 13 }, { col: 10, row: 13 }, { col: 11, row: 13 }, { col: 12, row: 13 },
      { col: 13, row: 13 },
      { col: 12, row: 13 }, { col: 11, row: 13 }, { col: 10, row: 13 }, { col: 9, row: 13 },
      { col: 8, row: 13 }, { col: 7, row: 13 }, { col: 6, row: 13 }, { col: 5, row: 13 },
      { col: 4, row: 13 }, { col: 3, row: 13 }, { col: 2, row: 13 },
    ],
    speed: 0.85,
  },
];

// ===================== 第 5 关移动陷阱路径（相邻格移动 + 分裂走不同路线） =====================
const MOVING_TRAP_PATHS = [
  // 陷阱 1 — 右侧垂直走廊 (col 13, row 3~12)  |  克隆走顶部横向 (row 1)
  {
    startCol: 13, startRow: 3,
    waypoints: [
      { col: 13, row: 3 }, { col: 13, row: 4 }, { col: 13, row: 5 }, { col: 13, row: 6 },
      { col: 13, row: 7 }, { col: 13, row: 8 }, { col: 13, row: 9 }, { col: 13, row: 10 },
      { col: 13, row: 11 }, { col: 13, row: 12 },
      { col: 13, row: 11 }, { col: 13, row: 10 }, { col: 13, row: 9 }, { col: 13, row: 8 },
      { col: 13, row: 7 }, { col: 13, row: 6 }, { col: 13, row: 5 }, { col: 13, row: 4 },
    ],
    altWaypoints: [
      { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 },
      { col: 5, row: 1 }, { col: 6, row: 1 }, { col: 7, row: 1 }, { col: 8, row: 1 },
      { col: 9, row: 1 }, { col: 10, row: 1 }, { col: 11, row: 1 }, { col: 12, row: 1 },
      { col: 13, row: 1 },
      { col: 12, row: 1 }, { col: 11, row: 1 }, { col: 10, row: 1 }, { col: 9, row: 1 },
      { col: 8, row: 1 }, { col: 7, row: 1 }, { col: 6, row: 1 }, { col: 5, row: 1 },
      { col: 4, row: 1 }, { col: 3, row: 1 }, { col: 2, row: 1 },
    ],
    speed: 0.85,
  },
  // 陷阱 2 — 中间横向走廊 (row 6, col 1~12)  |  克隆走左侧纵向 (col 1)
  {
    startCol: 1, startRow: 6,
    waypoints: [
      { col: 1, row: 6 }, { col: 2, row: 6 }, { col: 3, row: 6 }, { col: 4, row: 6 },
      { col: 5, row: 6 }, { col: 6, row: 6 }, { col: 7, row: 6 }, { col: 8, row: 6 },
      { col: 9, row: 6 }, { col: 10, row: 6 }, { col: 11, row: 6 }, { col: 12, row: 6 },
      { col: 11, row: 6 }, { col: 10, row: 6 }, { col: 9, row: 6 }, { col: 8, row: 6 },
      { col: 7, row: 6 }, { col: 6, row: 6 }, { col: 5, row: 6 }, { col: 4, row: 6 },
      { col: 3, row: 6 }, { col: 2, row: 6 },
    ],
    altWaypoints: [
      { col: 1, row: 3 }, { col: 1, row: 4 }, { col: 1, row: 5 }, { col: 1, row: 6 },
      { col: 1, row: 7 }, { col: 1, row: 8 }, { col: 1, row: 9 }, { col: 1, row: 10 },
      { col: 1, row: 11 }, { col: 1, row: 12 }, { col: 1, row: 13 },
      { col: 1, row: 12 }, { col: 1, row: 11 }, { col: 1, row: 10 }, { col: 1, row: 9 },
      { col: 1, row: 8 }, { col: 1, row: 7 }, { col: 1, row: 6 }, { col: 1, row: 5 },
      { col: 1, row: 4 },
    ],
    speed: 0.85,
  },
  // 陷阱 3 — 底部横向走廊 (row 13, col 1~11)  |  克隆走 col 7 纵向
  {
    startCol: 1, startRow: 13,
    waypoints: [
      { col: 1, row: 13 }, { col: 2, row: 13 }, { col: 3, row: 13 }, { col: 4, row: 13 },
      { col: 5, row: 13 }, { col: 6, row: 13 }, { col: 7, row: 13 }, { col: 8, row: 13 },
      { col: 9, row: 13 }, { col: 10, row: 13 }, { col: 11, row: 13 },
      { col: 10, row: 13 }, { col: 9, row: 13 }, { col: 8, row: 13 }, { col: 7, row: 13 },
      { col: 6, row: 13 }, { col: 5, row: 13 }, { col: 4, row: 13 }, { col: 3, row: 13 },
      { col: 2, row: 13 },
    ],
    altWaypoints: [
      { col: 7, row: 1 }, { col: 7, row: 2 }, { col: 7, row: 3 }, { col: 7, row: 4 },
      { col: 7, row: 5 }, { col: 7, row: 6 }, { col: 7, row: 7 }, { col: 7, row: 8 },
      { col: 7, row: 9 }, { col: 7, row: 10 }, { col: 7, row: 11 }, { col: 7, row: 12 },
      { col: 7, row: 13 },
      { col: 7, row: 12 }, { col: 7, row: 11 }, { col: 7, row: 10 }, { col: 7, row: 9 },
      { col: 7, row: 8 }, { col: 7, row: 7 }, { col: 7, row: 6 }, { col: 7, row: 5 },
      { col: 7, row: 4 }, { col: 7, row: 3 }, { col: 7, row: 2 },
    ],
    speed: 0.85,
  },
  // 陷阱 4 — 左侧绕墙巡逻  |  克隆走 row 8 横向
  {
    startCol: 2, startRow: 3,
    waypoints: [
      { col: 2, row: 3 }, { col: 2, row: 4 }, { col: 2, row: 5 }, { col: 2, row: 6 },
      { col: 2, row: 7 }, { col: 2, row: 8 }, { col: 1, row: 8 }, { col: 1, row: 9 },
      { col: 1, row: 10 }, { col: 1, row: 11 }, { col: 1, row: 12 }, { col: 1, row: 13 },
      { col: 2, row: 13 }, { col: 2, row: 12 }, { col: 2, row: 11 }, { col: 2, row: 10 },
      { col: 1, row: 10 }, { col: 1, row: 9 }, { col: 1, row: 8 }, { col: 2, row: 8 },
      { col: 2, row: 7 }, { col: 2, row: 6 }, { col: 2, row: 5 }, { col: 2, row: 4 },
    ],
    altWaypoints: [
      { col: 1, row: 8 }, { col: 2, row: 8 }, { col: 3, row: 8 }, { col: 4, row: 8 },
      { col: 5, row: 8 }, { col: 6, row: 8 }, { col: 7, row: 8 }, { col: 8, row: 8 },
      { col: 9, row: 8 }, { col: 10, row: 8 }, { col: 11, row: 8 }, { col: 12, row: 8 },
      { col: 13, row: 8 },
      { col: 12, row: 8 }, { col: 11, row: 8 }, { col: 10, row: 8 }, { col: 9, row: 8 },
      { col: 8, row: 8 }, { col: 7, row: 8 }, { col: 6, row: 8 }, { col: 5, row: 8 },
      { col: 4, row: 8 }, { col: 3, row: 8 }, { col: 2, row: 8 },
    ],
    speed: 0.85,
  },
];

function getStartPosition(levelIndex) {
  const grid = LEVELS[levelIndex].grid;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === CELL.START) {
        return { col: c, row: r };
      }
    }
  }
  return { col: 1, row: 1 };
}

function getGoalPosition(levelIndex) {
  const grid = LEVELS[levelIndex].grid;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === CELL.GOAL) {
        return { col: c, row: r };
      }
    }
  }
  return { col: 13, row: 13 };
}

function getStarPositions(levelIndex) {
  const grid = LEVELS[levelIndex].grid;
  const stars = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === CELL.STAR) {
        stars.push({ col: c, row: r });
      }
    }
  }
  return stars;
}

function getMovingTrapPaths(levelIndex) {
  if (levelIndex === 3) return MOVING_TRAP_PATHS_L4;   // 第 4 关
  if (levelIndex === 4) return MOVING_TRAP_PATHS;      // 第 5 关
  return [];
}

export { CELL, LEVELS, FACE_COLORS, MOVING_TRAP_PATHS, MOVING_TRAP_PATHS_L4, getStartPosition, getGoalPosition, getStarPositions, getMovingTrapPaths };
