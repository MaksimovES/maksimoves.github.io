let currentLevel = 'normal';

function createMinesweeperBoard(width, height, mineCount) {
  const board = Array(height).fill(null).map(() => Array(width).fill(0));
  let placed = 0;

  while (placed < mineCount) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (board[y][x] !== "X") {
      board[y][x] = "X";
      placed++;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (board[y][x] === "X") continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (
            ny >= 0 &&
            ny < height &&
            nx >= 0 &&
            nx < width &&
            board[ny][nx] === "X"
          ) {
            count++;
          }
        }
      }
      board[y][x] = count;
    }
  }

  return board;
}

function startGame(level = 'normal') {
  let width, height, mines;

  switch (level) {
    case 'easy':
      width = height = 5;
      mines = 5;
      break;
    case 'normal':
      width = height = 9;
      mines = 10;
      break;
    case 'hard':
      width = height = 16;
      mines = 40;
      break;
  }

  const board = createMinesweeperBoard(width, height, mines);
  const gameDiv = document.getElementById("game");
  const table = document.createElement("table");

  let revealedCells = 0;
  const totalSafeCells = width * height - mines;

  board.forEach((row, y) => {
    const tr = document.createElement("tr");
    row.forEach((cell, x) => {
      const td = document.createElement("td");
      td.dataset.value = cell === "X" ? "mine" : cell || "";
      td.textContent = "";

      td.onclick = () => {
        td.textContent = cell === "X" ? "💣" : cell || "";
        td.classList.add(cell === "X" ? "mine-cell" : "safe-cell");

        if (cell === "X") {
          revealAll(board);
          sendResultToBot(false); // Проиграл
        } else {
          revealedCells++;
          if (revealedCells === totalSafeCells) {
            sendResultToBot(true); // Выиграл
          }
        }

        td.onclick = null;
      };

      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  gameDiv.innerHTML = "";
  gameDiv.appendChild(table);

  // Кнопки уровней
  const levelButtons = document.getElementById("level-buttons") || document.createElement("div");
  levelButtons.id = "level-buttons";
  levelButtons.innerHTML = `
    <button onclick="startGame('easy')">Easy</button>
    <button onclick="startGame('normal')" class="active">Normal</button>
    <button onclick="startGame('hard')">Hard</button>
  `;
  if (!document.getElementById("level-buttons")) {
    gameDiv.before(levelButtons);
  }
}

function revealAll(board) {
  const gameDiv = document.getElementById("game");
  const table = gameDiv.querySelector("table");

  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (let j = 0; j < row.cells.length; j++) {
      const cell = row.cells[j];
      const value = cell.dataset.value;
      cell.textContent = value === "mine" ? "💣" : value || "";
      cell.style.background = value === "mine" ? "#ffcccc" : "#eeeeee";
    }
  }
}

function sendResultToBot(won) {
  if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    Telegram.WebApp.sendData(
      JSON.stringify({
        action: "game_result",
        result: won ? "win" : "lose",
        level: currentLevel,
      })
    );
  }
}

window.onload = () => startGame();