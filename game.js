let playerName = "герой";
const gameContainer = document.getElementById("game-container");
const dialogueBox = document.getElementById("dialogue-text");
const speakerName = document.getElementById("speaker-name");
const namePopup = document.getElementById("name-popup");
const nameInput = document.getElementById("player-name");
const nameBtn = document.getElementById("name-btn");
const popup = document.getElementById("popup");
const startBtn = document.getElementById("start-btn");
const lobby = document.getElementById("lobby");
const playerDisplay = document.getElementById("player-display");

let step = 0;
let typing = false;
let typingInterval = null;

// Диалоги
let dialogues = [
  { speaker: "Финн", text: `Приветствую, ${playerName}! Я Финн – хранитель знаний о финансах и их законах.`, color: "#ff6600" },
  { speaker: "Финн", text: "Здесь ты сможешь научиться грамотно распределять свои финансы, узнавать новое о продуктах Газпромбанка и получать приятные бонусы за прохождение уровней.", color: "#ff6600" },
  { speaker: "Финн", text: "Готов начать своё финансовое путешествие?", color: "#ff6600" }
];

// Функция печати текста
function typeText(dialogue, speed = 30) {
    speakerName.textContent = dialogue.speaker;
    speakerName.style.color = dialogue.color;
    dialogueBox.textContent = "";
    typing = true;
    let i = 0;
    typingInterval = setInterval(() => {
        dialogueBox.textContent += dialogue.text[i];
        i++;
        if (i >= dialogue.text.length) {
            clearInterval(typingInterval);
            typing = false;
        }
    }, speed);
}


nameBtn.addEventListener("click", () => {
    const inputName = nameInput.value.trim();
    if(inputName !== "") playerName = inputName;
    dialogues[0].text = `Приветствую, ${playerName}! Я Финн – хранитель знаний о финансах и их законах.`;
    namePopup.style.display = "none";
    typeText(dialogues[step]);
});

// Enter для имени
nameInput.addEventListener("keyup", (e) => {
    if(e.key === "Enter") nameBtn.click();
});

// Листание диалогов по тапу
gameContainer.addEventListener("click", (e) => {
    if(lobby.style.display !== "none") return;
    if(namePopup.style.display !== "none" || e.target.tagName === "BUTTON") return;

    if(typing) {
        clearInterval(typingInterval);
        dialogueBox.textContent = dialogues[step].text;
        typing = false;
        return;
    }

    step++;
    if(step < dialogues.length) {
        typeText(dialogues[step]);
    } else {
        popup.style.display = "block";
    }
});


startBtn.addEventListener('click', () => {
    popup.style.display = 'none';

    document.getElementById('dialogue-box').style.display = 'none';
    document.getElementById('finn').style.display = 'none';
    namePopup.style.display = 'none';

    lobby.style.display = 'block';

});

//выбор уровня
const levelBtn = document.getElementById("level-btn");
const levelPopup = document.getElementById("level-popup");
const closeLevels = document.getElementById("close-levels");
const levelButtons = document.querySelectorAll(".level-btn");

// открыть окно выбора уровня
levelBtn.addEventListener("click", () => {
  levelPopup.style.display = "flex";
});

// закрыть окно
closeLevels.addEventListener("click", () => {
  levelPopup.style.display = "none";
});

// обработка выбора уровня
levelButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const level = btn.dataset.level;
    console.log(`Выбран уровень ${level}`);
    // здесь потом подставим переход в конкретный уровень
    levelPopup.style.display = "none";
  });
});

const infoPopup = document.getElementById("info-popup");
const closeInfoPopup = document.getElementById("close-info-popup");
const shopBtn = document.getElementById("shop-btn");
const leaderboardBtn = document.getElementById("leaderboard-btn");

// открыть предупреждение
shopBtn.addEventListener("click", () => {
    infoPopup.style.display = "flex";
});

leaderboardBtn.addEventListener("click", () => {
    infoPopup.style.display = "flex";
});

// закрыть предупреждение
closeInfoPopup.addEventListener("click", () => {
    infoPopup.style.display = "none";
});

//открытие уровней
const levelBtns = document.querySelectorAll('.level-btn');

levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const level = btn.dataset.level;
    location.href = `level${level}/level${level}.html`;
  });
});