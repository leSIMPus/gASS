const leaderboardConfig = {
  animationDuration: 500, // Длительность анимации в ms
  maxPlayers: 10,         // Максимум игроков в таблице
};

class Leaderboard {
  constructor() {
    this.players = [];
    this.isVisible = false;
    this.initDOM();
  }

  initDOM() {
    // Создаем HTML-структуру
    this.container = document.createElement('div');
    this.container.className = 'leaderboard';
    this.container.innerHTML = `
      <div class="leaderboard-header">
        <h3>ЛИДЕРБОРД</h3>
        <button class="close-btn">&times;</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Рейтинг</th>
            <th>Игрок</th>
            <th>Баллы</th>
          </tr>
        </thead>
        <tbody class="leaderboard-body">
          <!-- Строки будут добавлены динамически -->
        </tbody>
      </table>
    `;

    document.body.appendChild(this.container);

    // Обработчики событий
    this.container.querySelector('.close-btn').addEventListener('click', () => this.hide());
  }

  updatePlayers(playersData) {
    this.players = playersData
      .sort((a, b) => b.score - a.score)
      .slice(0, leaderboardConfig.maxPlayers);

    this.render();
  }

  render() {
    const tbody = this.container.querySelector('.leaderboard-body');
    tbody.innerHTML = '';

    this.players.forEach((player, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${player.name}</td>
        <td>${player.score}</td>
      `;
      tbody.appendChild(row);
    });
  }

  show() {
    this.container.style.display = 'block';
    setTimeout(() => {
      this.container.classList.add('visible');
    }, 10);
    this.isVisible = true;
  }

  hide() {
    this.container.classList.remove('visible');
    setTimeout(() => {
      this.container.style.display = 'none';
    }, leaderboardConfig.animationDuration);
    this.isVisible = false;
  }

  toggle() {
    this.isVisible ? this.hide() : this.show();
  }
}

// Стили (можно вынести в отдельный CSS-файл)
const style = document.createElement('style');
style.textContent = `
.leaderboard {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  opacity: 0;
  width: 400px;
  max-width: 90%;
  background: #2a2e3a;
  color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  z-index: 1000;
  transition: all ${leaderboardConfig.animationDuration}ms ease;
  display: none;
}

.leaderboard.visible {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #444;
}

th {
  background: #3a3f4d;
}
`;
document.head.appendChild(style);

// Экспорт инстанса лидерборда
const leaderboard = new Leaderboard();

// Пример использования
// leaderboard.updatePlayers([
//   { name: "Player1", score: 1500 },
//   { name: "Player2", score: 1200 },
//   { name: "You", score: 1800 }
// ]);
// leaderboard.show();