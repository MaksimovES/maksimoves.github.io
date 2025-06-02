async function startGame() {
  const res = await fetch("/api/minesweeper/start");
  const { board } = await res.json();
  const gameDiv = document.getElementById("game");
  const table = document.createElement("table");

  board.forEach((row, y) => {
    const tr = document.createElement("tr");
    row.forEach((cell, x) => {
      const td = document.createElement("td");
      td.textContent = cell === "X" ? "💣" : cell;
      td.onclick = () => {
        if (cell === "X") td.style.background = "red";
        else td.textContent = cell;
        td.onclick = null;
      };
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  gameDiv.innerHTML = "";
  gameDiv.appendChild(table);
}

window.onload = startGame;