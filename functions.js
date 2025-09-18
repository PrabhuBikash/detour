function drawGame(canvas, ctx, pathWidth) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  function drawPath(start, points, end){
    ctx.strokeStyle = "white";
    ctx.lineWidth = pathWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i < points.length - 1;) ctx.quadraticCurveTo(points[i].x, points[i++].y, points[i].x, points[i++].y);
    ctx.quadraticCurveTo(points[points.length-1].x, points[points.length-1].y, end.x, end.y)
    ctx.stroke();
  }
  function drawCircle(point, clr){
    ctx.fillStyle = clr;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  const start = { x: 0, y: 0 };
  const end = { x: canvas.width, y: canvas.height };
  const points = pathToPoints(solveMaze(generateMaze(canvas.width / (pathWidth + 5), canvas.height / (pathWidth + 5))), pathWidth + 5, pathWidth + 5);
  drawPath(start, points, end);
  drawCircle(start, "blue");
  drawCircle(end, "lime");
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function generateMaze(cols, rows) {
  const grid = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      x, y,
      visited: false,
      walls: { top: true, right: true, bottom: true, left: true }
    }))
  );

  const getUnvisitedNeighbors = ({ x, y }) => [
                    grid[y - 1]?.[x],
    grid[y]?.[x - 1],               grid[y]?.[x + 1],
                    grid[y + 1]?.[x]
  ].filter(n => n && !n.visited);

  const removeWall = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 1)      { a.walls.right = b.walls.left = false; }
    else if (dx === -1){ a.walls.left = b.walls.right = false; }
    else if (dy === 1) { a.walls.bottom = b.walls.top = false; }
    else if (dy === -1){ a.walls.top = b.walls.bottom = false; }
  };

  const stack = [];
  let current = grid[0][0];
  do {
    current.visited = true;
    const neighbors = getUnvisitedNeighbors(current);
    if (neighbors.length) { // go forward!
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      stack.push(current);
      removeWall(current, next);
      current = next;
    } else current = stack.pop(); // go back!
  } while (stack.length);

  return grid;
}

function solveMaze(grid) {
  const start = grid[0][0];
  const end = grid[grid.length - 1][grid[0].length - 1];
  const queue = [[start]];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const path = queue.shift();
    const cell = path[path.length - 1];
    if (cell === end) return path;

    const { x, y, walls } = cell;
    const moves = [];
    if (!walls.top)    moves.push(grid[y - 1][x]    );
    if (!walls.right)  moves.push(grid[y]    [x + 1]);
    if (!walls.bottom) moves.push(grid[y + 1][x]    );
    if (!walls.left)   moves.push(grid[y]    [x - 1]);

    for (const n of moves) {
      const key = `${n.x},${n.y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push([...path, n]);
    }
  }
  return null;
}

function pathToPoints(path, cellSizeX, cellSizeY) {
  return path.map(cell => ({
    x: cell.x * cellSizeX + cellSizeX / 2,
    y: cell.y * cellSizeY + cellSizeY / 2
  }));
}

function closestColor(colors, r, g, b) {
  let best = "other", bestDist = Infinity;
  for (const [name, [cr, cg, cb]] of Object.entries(colors)) {
    const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (dist < bestDist) bestDist = dist, best = name;
  }
  return best;
}

function overlayMessage(canvas, ctx, msg, color){
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = color;
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(msg, canvas.width/2, canvas.height/2);
}

function playTone(audioCtx, freq = 440, type = "square") {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 1;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}