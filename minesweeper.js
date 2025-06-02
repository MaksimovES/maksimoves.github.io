let currentLevel = 'normal';
let gameInProgress = true;
let timerInterval = null;
let timeElapsed = 0;

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
  gameInProgress = true;
  currentLevel = level;
  timeElapsed = 0;

  const timerDisplay = document.getElementById("timer");
  timerDisplay.textContent = "Время: 0 сек";

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeElapsed++;
    timerDisplay.textContent = `⏱ Время: ${timeElapsed} сек`;
  }, 1000);

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
        if (!gameInProgress) return;

        // Анимация клика
        td.classList.add("reveal");
        td.textContent = cell === "X" ? "💣" : cell || "";
        td.classList.add(cell === "X" ? "mine-cell" : "safe-cell");

        if (cell === "X") {
          revealAll(board);
          endGame(false); // Проиграл
        } else {
          revealedCells++;
          playSound("click");
          if (revealedCells === totalSafeCells) {
            endGame(true); // Выиграл
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
    <button onclick="startGame('normal')" class="${level === 'normal' ? 'active' : ''}">Normal</button>
    <button onclick="startGame('hard')">Hard</button>
  `;
  if (!document.getElementById("level-buttons")) {
    gameDiv.before(levelButtons);
  }

  // Таймер
  const timer = document.getElementById("timer") || document.createElement("div");
  timer.id = "timer";
  timer.style.margin = "10px auto";
  timer.style.fontSize = "18px";
  timer.textContent = "⏱ Время: 0 сек";
  if (!document.getElementById("timer")) {
    levelButtons.after(timer);
  }

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

function calculatePoints(level, won, time) {
  const base = { easy: 10, normal: 30, hard: 50 };
  const bonusTime = Math.max(0, 100 - time); // бонус за скорость
  return won ? base[level] + bonusTime : 0;
}

function nextLevel() {
  const levels = ['easy', 'normal', 'hard'];
  const index = levels.indexOf(currentLevel);
  return levels[index + 1] || currentLevel;
}

function endGame(won) {
  gameInProgress = false;
  clearInterval(timerInterval);

  const points = calculatePoints(currentLevel, won, timeElapsed);
  const achievements = checkAchievements(won, timeElapsed);

  const resultBox = document.getElementById("result-box") || document.createElement("div");
  resultBox.id = "result-box";
  resultBox.style.marginTop = "20px";
  resultBox.style.padding = "15px";
  resultBox.style.backgroundColor = won ? "#ccffcc" : "#ffe0e0";
  resultBox.style.borderRadius = "10px";

  const achievementText = achievements.map(a => `<div>🌟 ${a}</div>`).join("");

  resultBox.innerHTML = `
    <p><strong>${won ? "🎉 Победа!" : "💥 Вы проиграли!"}</strong></p>
    <p>⏱ Время: ${timeElapsed} сек</p>
    <p>🏆 Очков: ${points}</p>
    ${achievementText}
    <button onclick="startGame(currentLevel)">🔄 Заново</button>
    ${won && currentLevel !== 'hard' ? `<button onclick="startGame(nextLevel())">➡️ Следующий уровень</button>` : ""}
  `;

  const existingBox = document.getElementById("result-box");
  if (existingBox) {
    existingBox.replaceWith(resultBox);
  } else {
    document.getElementById("game").after(resultBox);
  }

  playSound(won ? "win" : "lose");

  sendResultToBot(won, points, timeElapsed, checkAchievements(won, timeElapsed));
}

function playSound(type) {
  const sounds = {
    click: new Audio("sounds/click.mp3"),
    win: new Audio("sounds/win.mp3"),
    lose: new Audio("sounds/lose.mp3"),
  };
  if (sounds[type]) {
    sounds[type].play();
  }
}

function sendResultToBot(won, points, time, achievements) {
  if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    Telegram.WebApp.sendData(
      JSON.stringify({
        action: "game_result",
        result: won ? "win" : "lose",
        level: currentLevel,
        points: points,
        time: time,
        achievements: achievements,
      })
    );
  }
}

function checkAchievements(won, time) {
  let achievements = [];

  // Первые 10 игр
  let gamesPlayed = localStorage.getItem("gamesPlayed") || 0;
  gamesPlayed++;
  localStorage.setItem("gamesPlayed", gamesPlayed);
  if (gamesPlayed === 10) {
    achievements.push("Вы сыграли 10 игр!");
  }

  // Пройден уровень Hard
  if (currentLevel === "hard" && won) {
    achievements.push("Пройден уровень HARD!");
  }

  // Рекордное время
  const key = `best_time_${currentLevel}`;
  const bestTime = localStorage.getItem(key) || Infinity;
  if (won && time < bestTime) {
    localStorage.setItem(key, time);
    achievements.push(`Новое рекордное время на уровне ${currentLevel.toUpperCase()} — ${time} сек`);
  }

  return achievements;
}