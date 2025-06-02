let currentLevel = "normal";
let gameInProgress = true;

document.body.addEventListener("click", () => {}, { once: true });

function playSound(type) {
  const sounds = {
    button: document.getElementById("sound-button"),
    click: document.getElementById("sound-click"),
    win: document.getElementById("sound-win"),
    lose: document.getElementById("sound-lose"),
  };

  if (sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play().catch(() => {});
  }
}

function createMinesweeperBoard(width, height, mineCount) {
  const board = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));
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

function startGame(level = "normal") {
  gameInProgress = true;
  currentLevel = level;

  let width, height, mines;

  switch (level) {
    case "easy":
      width = height = 5;
      mines = 5;
      break;
    case "normal":
      width = height = 9;
      mines = 10;
      break;
    case "hard":
      width = height = 16;
      mines = 40;
      break;
  }

  const board = createMinesweeperBoard(width, height, mines);
  const gameDiv = document.getElementById("game");
  const table = document.createElement("table");

  let revealedCells = 0;
  const totalSafeCells = width * height - mines;

  function revealCell(x, y) {
    const cell = table.rows[y]?.cells[x];
    const value = board[y][x];

    if (!cell || cell.classList.contains("revealed")) return;

    cell.classList.add("revealed");

    if (value === "X") {
      cell.textContent = "💣";
      cell.classList.add("mine-cell", "explode");
      playSound("lose");
      cell.classList.add("explode");
      revealAll(board);
      endGame(false); // Проиграл
      return;
    }

    cell.textContent = value || "";
    cell.classList.add(value === 0 ? "empty-cell" : "safe-cell");

    if (value === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (
            ny >= 0 &&
            ny < height &&
            nx >= 0 &&
            nx < width &&
            !(dx === 0 && dy === 0)
          ) {
            revealCell(nx, ny);
          }
        }
      }
    }

    if (value === 0) {
      cell.classList.add("empty-cell");
      playSound("click");
    } else {
      cell.classList.add("safe-cell");
      playSound("click");
    }

    revealedCells++;
    if (revealedCells === totalSafeCells) {
      playSound("win");
      endGame(true); // Выиграл
    }
  }

  board.forEach((row, y) => {
    const tr = document.createElement("tr");
    row.forEach((cell, x) => {
      const td = document.createElement("td");
      td.dataset.value = cell === "X" ? "mine" : cell || "";
      td.onclick = () => {
        if (!gameInProgress || td.classList.contains("revealed")) return;
        revealCell(x, y);
      };
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  gameDiv.innerHTML = "";
  gameDiv.appendChild(table);

  // Кнопки уровней
  levelButtons.innerHTML = `
  <button onclick="handleLevelClick('easy')">Easy</button>
  <button onclick="handleLevelClick('normal')" class="${
    level === "normal" ? "active" : ""
  }">Normal</button>
  <button onclick="handleLevelClick('hard')">Hard</button>
`;

  if (!document.getElementById("level-buttons")) {
    gameDiv.before(levelButtons);
  }

  // Функция для обработки клика по уровням
  window.handleLevelClick = (level) => {
    playSound("button");
    startGame(level);
  };

  // Блокируем повторный запуск
  const resultBox = document.getElementById("result-box");
  if (resultBox) resultBox.remove();
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

function endGame(won) {
  gameInProgress = false;

  const resultBox =
    document.getElementById("result-box") || document.createElement("div");
  resultBox.id = "result-box";
  resultBox.style.marginTop = "20px";

  resultBox.innerHTML = `
  <p><strong>${won ? "🎉 Победа!" : "💥 Вы проиграли!"}</strong></p>
  <button onclick="restartGame()">🔄 Заново</button>
  ${
    won && currentLevel !== "hard"
      ? `<button onclick="nextLevelGame()">➡️ Следующий уровень</button>`
      : ""
  }
`;

  window.restartGame = () => {
    playSound("button");
    startGame(currentLevel);
  };

  window.nextLevelGame = () => {
    playSound("button");
    startGame(nextLevel());
  };

  const existingBox = document.getElementById("result-box");
  if (existingBox) {
    existingBox.replaceWith(resultBox);
  } else {
    document.getElementById("game").after(resultBox);
  }

  sendResultToBot(won);
}
window.onload = () => startGame();
