// index.js — стабильное получение имени и упрощённый диалог
(function () {
  // --- утилиты ---
  const $ = sel => document.querySelector(sel);
  const qs = sel => Array.from(document.querySelectorAll(sel));

  function getUrlName() {
    try {
      const p = new URLSearchParams(window.location.search);
      const n = p.get('name');
      return n ? n.trim() : null;
    } catch (e) { return null; }
  }

  // Попытка получить имя из "банка" — если бекенд/скрипт вставит его в window.__BANK_USER_NAME
  function getBankName() {
    try {
      if (window.__BANK_USER_NAME && typeof window.__BANK_USER_NAME === 'string') {
        return window.__BANK_USER_NAME.trim();
      }
      // возможный кастомный объект
      if (window.BANK && window.BANK.user && window.BANK.user.name) return String(window.BANK.user.name).trim();
    } catch (e) {}
    return null;
  }

  // --- DOM ---
  const nameDisplay = $('#nameDisplay');
  const editBtn = $('#editNameBtn');
  const nameForm = $('#nameForm');
  const nameInput = $('#nameInput');
  const saveBtn = $('#saveNameBtn');
  const skipBtn = $('#skipNameBtn');

  const dialogBox = $('#dialogBox');
  const dialogText = $('#dialogText');
  const nextDialogBtn = $('#nextDialogBtn');

  const startModal = $('#startModal');
  const startBtn = $('#startBtn');
  const greetingText = $('#greetingText');

  // --- имя пользователя (источники и приоритет) ---
  let playerName = localStorage.getItem('fg_name') || '';

  const bankName = getBankName();
  const urlName = getUrlName();

  if (bankName) {
    playerName = bankName;
    localStorage.setItem('fg_name', playerName);
  } else if (urlName && !playerName) {
    playerName = urlName;
    localStorage.setItem('fg_name', playerName);
  }

  function renderNameUI() {
    if (playerName && playerName.trim().length) {
      nameDisplay.textContent = playerName;
      nameDisplay.hidden = false;
      editBtn.hidden = false;
      nameForm.style.display = 'none';
      greetingText.textContent = `Приветствую, ${playerName}! Я Финн — хранитель знаний о финансах и их законах.`;
    } else {
      nameDisplay.hidden = true;
      editBtn.hidden = true;
      nameForm.style.display = 'block';
      greetingText.textContent = `Я Финн — хранитель знаний о финансах и их законах.`;
      nameInput.focus();
    }
  }

  function setName(name) {
    playerName = (name || '').trim().slice(0, 24);
    if (playerName) localStorage.setItem('fg_name', playerName);
    renderNameUI();
  }

  // --- события UI ---
  editBtn.addEventListener('click', () => {
    nameForm.style.display = 'flex';
    nameInput.value = playerName || '';
    nameInput.focus();
  });

  saveBtn.addEventListener('click', () => {
    const v = (nameInput.value || '').trim();
    if (!v) {
      nameInput.classList.add('invalid');
      setTimeout(() => nameInput.classList.remove('invalid'), 600);
      return;
    }
    setName(v);
  });

  skipBtn.addEventListener('click', () => {
    // позволяем продолжить без имени (останется пустым, будут обращения без имени)
    nameForm.style.display = 'none';
    nameDisplay.hidden = true;
    greetingText.textContent = `Я Финн — хранитель знаний о финансах и их законах.`;
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
  });

  // --- диалоги ---
  function makeDialogs(name) {
    const n = name && name.length ? name : 'друг';
    return [
      `Приветствую, ${n}! Я Финн – хранитель знаний о финансах и их законах.`,
      `Здесь вы сможете научиться грамотно распределять свои финансы, узнавать новое о продуктах Газпромбанка, а также получать приятные бонусы за прохождение уровней.`,
      `Готовы ли вы начать своё финансовое путешествие?`
    ];
  }

  let dialogs = makeDialogs(playerName);
  let idx = 0;

  function showDialog(i) {
    dialogText.textContent = dialogs[i] || '';
  }

  nextDialogBtn.addEventListener('click', () => {
    // если имя изменился после старта — пересобираем диалоги чтобы имя отобразилось
    const stored = localStorage.getItem('fg_name') || '';
    if (stored !== playerName) {
      playerName = stored;
      dialogs = makeDialogs(playerName);
    }

    idx++;
    if (idx < dialogs.length - 1) {
      showDialog(idx);
    } else {
      // последний шаг: показываем модал
      dialogBox.style.display = 'none';
      startModal.setAttribute('aria-hidden', 'false');
    }
  });

  // стартовая кнопка
  startBtn.addEventListener('click', () => {
    // сохраняем имя ещё раз на всякий случай
    if (playerName && playerName.trim()) localStorage.setItem('fg_name', playerName);
    // переход на уровень 1
    window.location.href = 'level1.html';
  });

  // инициализация UI
  (function init() {
    renderNameUI();
    dialogs = makeDialogs(playerName);
    idx = 0;
    showDialog(0);
    // если имя пустое — сразу покажем форму, но диалог остаётся доступным
    if (!playerName) {
      nameForm.style.display = 'flex';
    } else {
      nameForm.style.display = 'none';
    }
    // Initially hide modal
    startModal.setAttribute('aria-hidden', 'true');
  })();
})();
