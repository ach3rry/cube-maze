// Grid cells: 0 empty, 1 wall, 2 start, 3 goal, 4 trap hole, 5 star.
const CELL = {
  EMPTY: 0,
  WALL: 1,
  START: 2,
  GOAL: 3,
  TRAP: 4,
  STAR: 5,
};

const FACE_COLORS = [
  { name: '教学面 · 初次滚动', color: '#FFD93D', wall: '#FFCA28', bg: '#FFFDE7' },
  { name: '第 1 关 · 回廊', color: '#FF6B6B', wall: '#EF5350', bg: '#FFF0F0' },
  { name: '第 2 关 · 暗坑', color: '#51CF66', wall: '#43A047', bg: '#F0FFF0' },
  { name: '第 3 关 · 星途', color: '#FF922B', wall: '#FB8C00', bg: '#FFF8F0' },
  { name: '第 4 关 · 巡游', color: '#339AF0', wall: '#1E88E5', bg: '#F0F8FF' },
  { name: '第 5 关 · 追迹', color: '#CC5DE8', wall: '#AB47BC', bg: '#FFF0FF' },
];

const LEVELS = [
  {
    name: FACE_COLORS[0].name,
    color: FACE_COLORS[0].color,
    colorDark: FACE_COLORS[0].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[0].bg}, #FFFFFF)`,
    difficulty: 0,
    tutorial: true,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,2,0,1,0,0,0,0,0,1,0,3,0,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    name: FACE_COLORS[1].name,
    color: FACE_COLORS[1].color,
    colorDark: FACE_COLORS[1].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[1].bg}, #FFFFFF)`,
    difficulty: 1,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,1,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,1,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    name: FACE_COLORS[2].name,
    color: FACE_COLORS[2].color,
    colorDark: FACE_COLORS[2].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[2].bg}, #FFFFFF)`,
    difficulty: 2,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,1,0,0,0,0,0,1,0,0,1],
      [1,1,1,1,0,1,0,1,1,1,0,1,0,1,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,0,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,1,1,0,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,4,1],
      [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
      [1,0,0,0,1,0,0,4,0,0,1,0,0,0,1],
      [1,1,1,0,1,1,1,1,1,0,1,0,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    name: FACE_COLORS[3].name,
    color: FACE_COLORS[3].color,
    colorDark: FACE_COLORS[3].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[3].bg}, #FFFFFF)`,
    difficulty: 3,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,1,0,0,0,1,0,0,0,0,0,1],
      [1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,5,1,0,1],
      [1,0,1,1,1,0,1,1,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,4,1],
      [1,0,1,0,1,1,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
      [1,1,1,0,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,1,0,0,5,1],
      [1,0,1,1,1,0,1,1,1,0,1,1,1,1,1],
      [1,0,1,0,0,4,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,0,1,1,1,1,1,1,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    name: FACE_COLORS[4].name,
    color: FACE_COLORS[4].color,
    colorDark: FACE_COLORS[4].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[4].bg}, #FFFFFF)`,
    difficulty: 4,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,1,0,0,0,1,0,0,0,1,0,5,1],
      [1,1,0,1,0,1,0,1,0,1,0,1,0,1,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
      [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,1,5,0,0,0,0,1,3,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
  {
    name: FACE_COLORS[5].name,
    color: FACE_COLORS[5].color,
    colorDark: FACE_COLORS[5].wall,
    bg: `linear-gradient(135deg, ${FACE_COLORS[5].bg}, #FFFFFF)`,
    difficulty: 5,
    chaseStars: true,
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,0,1,0,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,1,0,0,1],
      [1,0,1,1,1,1,1,1,1,1,0,1,0,1,1],
      [1,0,1,0,0,0,0,0,0,1,0,1,0,5,1],
      [1,0,1,0,1,1,1,1,0,1,0,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,0,1,0,1,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,1,5,1,0,1,5,1],
      [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,1,0,0,3,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
];

const MOVING_TRAP_PATHS_L4 = [
  {
    id: 'patrol-horizontal',
    startCol: 3,
    startRow: 5,
    waypoints: linePath(3, 5, 11, 5),
    speed: 72,
  },
  {
    id: 'patrol-vertical',
    startCol: 13,
    startRow: 3,
    waypoints: linePath(13, 3, 13, 13),
    speed: 64,
  },
];

function linePath(startCol, startRow, endCol, endRow) {
  const points = [];
  const colStep = Math.sign(endCol - startCol);
  const rowStep = Math.sign(endRow - startRow);
  let col = startCol;
  let row = startRow;
  points.push({ col, row });
  while (col !== endCol || row !== endRow) {
    col += colStep;
    row += rowStep;
    points.push({ col, row });
  }
  for (let index = points.length - 2; index > 0; index--) {
    points.push({ ...points[index] });
  }
  return points;
}

function getStartPosition(levelIndex) {
  return findCell(levelIndex, CELL.START, { col: 1, row: 1 });
}

function getGoalPosition(levelIndex) {
  return findCell(levelIndex, CELL.GOAL, { col: 13, row: 13 });
}

function getStarPositions(levelIndex) {
  return findCells(levelIndex, CELL.STAR);
}

function getMovingTrapPaths(levelIndex) {
  return levelIndex === 4 ? MOVING_TRAP_PATHS_L4 : [];
}

function findCell(levelIndex, cellType, fallback) {
  return findCells(levelIndex, cellType)[0] || fallback;
}

function findCells(levelIndex, cellType) {
  const positions = [];
  const grid = LEVELS[levelIndex].grid;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === cellType) positions.push({ col, row });
    }
  }
  return positions;
}

export {
  CELL,
  LEVELS,
  FACE_COLORS,
  MOVING_TRAP_PATHS_L4,
  getStartPosition,
  getGoalPosition,
  getStarPositions,
  getMovingTrapPaths,
};
