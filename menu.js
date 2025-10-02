const lobby = document.getElementById("lobby");
const levelBtn = document.getElementById("level-btn");
const levelPopup = document.getElementById("level-popup");
const closeLevels = document.getElementById("close-levels");
const levelButtons = document.querySelectorAll(".level-btn");
const infoPopup = document.getElementById("info-popup");
const closeInfoPopup = document.getElementById("close-info-popup");
const shopBtn = document.getElementById("shop-btn");
const leaderboardBtn = document.getElementById("leaderboard-btn");

// Показываем меню сразу при открытии menu.html
lobby.style.display = 'block';

// Открытие окна выбора уровня
levelBtn.addEventListener("click", () => {
  levelPopup.style.display = "flex";
});

// Закрытие окна выбора уровня
closeLevels.addEventListener("click", () => {
  levelPopup.style.display = "none";
});

// Обработка выбора уровня
levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const level = btn.dataset.level;
    location.href = `level${level}/level${level}.html`;
  });
});

// Открытие предупреждения
shopBtn.addEventListener("click", () => {
    infoPopup.style.display = "flex";
});
leaderboardBtn.addEventListener("click", () => {
    infoPopup.style.display = "flex";
});

// Закрытие предупреждения
closeInfoPopup.addEventListener("click", () => {
    infoPopup.style.display = "none";
});
