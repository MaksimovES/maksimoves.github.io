let currentLevel = 'normal';
let gameInProgress = true;

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

// ==== Проигрывание звуков ====
function playSound(type) {
  const sounds = {
    button: document.getElementById("sound-button"),
    click: document.getElementById("sound-click"),
    win: document.getElementById("sound-win"),
    lose: document.getElementById("sound-lose"),
    auto: document.getElementById("sound-auto-reveal"),
    background: document.getElementById("background-music"),
  };

  if (sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play().catch(() => {});
  }
}

// ==== Вибрация ====
function vibrate(pattern = [100]) {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Ошибка вибрации:", e);
    }
  }
}

document.body.addEventListener("click", () => {
  vibrate([50]);
}, { once: true });

// ==== Начало игры ====
function startGame(level = 'normal') {
  gameInProgress = true;
  currentLevel = level;

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
  const startTime = Date.now();

  function revealCell(x, y) {
    const cell = table.rows[y]?.cells[x];
    const value = board[y][x];

    if (!cell || cell.classList.contains("revealed")) return;

    cell.classList.add("revealed");

    if (value === "X") {
      cell.textContent = "💣";
      cell.classList.add("mine-cell", "explode");
      playSound("lose");
      vibrate([300]);
      revealAll(board);
      endGame(false, startTime);
      return;
    }

    cell.textContent = value || "";
    if (value === 0) {
      cell.classList.add("empty-cell");
      playSound("auto");
      vibrate([30]);

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
    } else {
      cell.classList.add("safe-cell");
      playSound("click");
      vibrate([50]);
    }

    revealedCells++;
    if (revealedCells === totalSafeCells) {
      playSound("win");
      vibrate([200, 100, 200]);
      endGame(true, startTime);
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
  const levelButtons = document.getElementById("level-buttons") || document.createElement("div");
  levelButtons.id = "level-buttons";
  levelButtons.innerHTML = `
    <button onclick="handleLevelClick('easy')">Easy</button>
    <button onclick="handleLevelClick('normal')" class="${level === 'normal' ? 'active' : ''}">Normal</button>
    <button onclick="handleLevelClick('hard')">Hard</button>
  `;
  if (!document.getElementById("level-buttons")) {
    gameDiv.before(levelButtons);
  }

  // Результат
  const resultBox = document.getElementById("result-box");
  if (resultBox) resultBox.remove();

  // Первое взаимодействие — запуск музыки
  document.body.addEventListener("click", () => {
    playSound("background");
  }, { once: true });
}

// ==== Раскрытие всех мин ====
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

// ==== Конец игры ====
function endGame(won, startTime) {
  gameInProgress = false;

  const timeElapsed = Math.round((Date.now() - startTime) / 1000);
  const points = calculatePoints(currentLevel, won, timeElapsed);
  const achievements = checkAchievements(won, timeElapsed);

  const resultBox = document.getElementById("result-box") || document.createElement("div");
  resultBox.id = "result-box";
  resultBox.style.marginTop = "20px";

  resultBox.innerHTML = `
    <p><strong>${won ? "🎉 Победа!" : "💥 Вы проиграли!"}</strong></p>
    <p>⏱ Время: ${timeElapsed} сек</p>
    <p>🏆 Очков: ${points}</p>
    ${achievements.map(a => `<div>🌟 ${a}</div>`).join("")}
    <button onclick="restartGame()">🔄 Заново</button>
    ${won && currentLevel !== 'hard' ? `<button onclick="nextLevelGame()">➡️ Следующий уровень</button>` : ""}
  `;

  const existingBox = document.getElementById("result-box");
  if (existingBox) {
    existingBox.replaceWith(resultBox);
  } else {
    document.getElementById("game").after(resultBox);
  }

  sendResultToBot(won, points, timeElapsed, achievements);
}

// ==== Подсчёт очков ====
function calculatePoints(level, won, time) {
  const base = { easy: 10, normal: 30, hard: 50 };
  const bonusTime = Math.max(0, 100 - time);
  return won ? base[level] + bonusTime : 0;
}

// ==== Достижения ====
function checkAchievements(won, time) {
  const key = `best_time_${currentLevel}`;
  const bestTime = localStorage.getItem(key);
  const newBest = won && (!bestTime || time < parseInt(bestTime));

  if (newBest) {
    localStorage.setItem(key, time);
  }

  let gamesPlayed = parseInt(localStorage.getItem("sapper_games_played")) || 0;
  gamesPlayed++;
  localStorage.setItem("sapper_games_played", gamesPlayed);

  let achievements = [];

  if (gamesPlayed === 1) {
    achievements.push("Первая игра!");
  }

  if (gamesPlayed === 10) {
    achievements.push("Вы сыграли 10 игр!");
  }

  if (currentLevel === "hard" && won) {
    achievements.push("Пройден уровень HARD!");
  }

  if (newBest) {
    achievements.push(`Новый рекорд на уровне ${currentLevel.toUpperCase()} — ${time} сек`);
  }

  return achievements;
}

// ==== Отправка результата в бота ====
function sendResultToBot(won, points, time, achievements) {
  if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    Telegram.WebApp.sendData(
      JSON.stringify({
        action: "game_result",
        result: won ? "win" : "lose",
        level: currentLevel,
        time: time,
        points: points,
        achievements: achievements,
        games_played: localStorage.getItem("sapper_games_played"),
        best_time_easy: localStorage.getItem("sapper_easy_best_time"),
        best_time_normal: localStorage.getItem("sapper_normal_best_time"),
        best_time_hard: localStorage.getItem("sapper_hard_best_time"),
      })
    );
  }
}

// ==== Обработчики кнопок ====
window.handleLevelClick = (level) => {
  playSound("button");
  vibrate([100]);
  startGame(level);
};

window.restartGame = () => {
  playSound("button");
  vibrate([100]);
  startGame(currentLevel);
};

window.nextLevelGame = () => {
  playSound("button");
  vibrate([100]);
  startGame(nextLevel());
};

function nextLevel() {
  const levels = ['easy', 'normal', 'hard'];
  const index = levels.indexOf(currentLevel);
  return levels[index + 1] || currentLevel;
}

window.onload = () => startGame();