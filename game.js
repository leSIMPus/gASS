let playerName = "герой";
const gameContainer = document.getElementById("game-container");
const dialogueBox = document.getElementById("dialogue-text");
const speakerName = document.getElementById("speaker-name");
const namePopup = document.getElementById("name-popup");
const nameInput = document.getElementById("player-name");
const nameBtn = document.getElementById("name-btn");
const popup = document.getElementById("popup");
const startBtn = document.getElementById("start-btn");

let step = 0;
let typing = false;
let typingInterval = null;

// Диалоги
let dialogues = [
  { speaker: "Финн", text: `Приветствую, ${playerName}! Я Финн – хранитель знаний о финансах и их законах.`, color: "#ff6600" },
  { speaker: "Газпи", text: "🫧🫧🫧", color: "#00ccff" },
  { speaker: "Финн", text: "А это Газпи – мой верный напарник и друг. Не обманывайся его видом – он знает куда больше, чем кажется.", color: "#00ccff" },
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

// Обработчик кнопки имени
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
    // если имя ещё не введено или клик на кнопке — игнорируем
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

// Кнопка старта игры
startBtn.addEventListener("click", () => {
    popup.style.display = "none";
});
