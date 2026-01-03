/* ========== PYTHON DETECTIVE - CORE FUNCTIONS (v1.0) ========== */
/* Централізований JavaScript для всіх 15 ігор */

const PythonDetectiveCore = (function() {
  'use strict';

  /* ========== КОНФІГУРАЦІЯ ========== */
  const CONFIG = {
    LB_PREFIX: 'python_detective_leaderboard_',
    FEEDBACK_KEY: 'python_detective_feedbacks',
    ANALYTICS_KEY: 'teacher_analytics_backup',
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbw6EdoOF0gv2F9Ihzj-wUUrF5NJ77WfXRICvqnTOu_nPLabcB57-nTbTC9ejYlbQNHX/exec'
  };

  /* ========== УПРАВЛІННЯ КОРИСТУВАЧЕМ ========== */
  const UserManager = {
    getCurrentUser: function() {
      try {
        // Спроба 1: localStorage
        const agentData = localStorage.getItem('python_detective_current_agent');
        if (agentData) {
          const agent = JSON.parse(agentData);
          if (agent && agent.name) {
            console.log("✅ Користувач з localStorage:", agent.name);
            return agent;
          }
        }
      } catch (e) {
        console.warn("⚠️ Помилка localStorage:", e);
      }
      
      // Спроба 2: глобальна функція
      if (typeof window.getPythonDetectiveAgent === 'function') {
        const agent = window.getPythonDetectiveAgent();
        if (agent && agent.name) {
          console.log("✅ Користувач з глобальної функції:", agent.name);
          return agent;
        }
      }
      
      // Спроба 3: URL параметри
      const urlParams = new URLSearchParams(window.location.search);
      const nameFromUrl = urlParams.get('agent');
      const groupFromUrl = urlParams.get('group');
      
      if (nameFromUrl) {
        console.log("✅ Користувач з URL:", nameFromUrl);
        return { name: nameFromUrl, group: groupFromUrl };
      }
      
      console.log("❌ Користувач не знайдений");
      return null;
    },

    loadUserToFields: function(nameFieldId = 'playerName', groupFieldId = 'playerGroup') {
      const user = this.getCurrentUser();
      const nameInput = document.getElementById(nameFieldId);
      const groupInput = document.getElementById(groupFieldId);
      
      if (user) {
        if (nameInput && user.name) {
          nameInput.value = user.name;
          nameInput.setAttribute('readonly', 'readonly');
        }
        if (groupInput && user.group) {
          groupInput.value = user.group;
        }
      } else {
        // Увімкнути ручний ввід
        if (nameInput) {
          nameInput.removeAttribute('readonly');
          nameInput.placeholder = "Введіть ім'я детектива";
        }
      }
    }
  };

  /* ========== УПРАВЛІННЯ ПРОГРЕСОМ ========== */
  const ProgressManager = {
    getStorageKey: function(name, group, gameId) {
      const safeName = (name || "unknown").toLowerCase().replace(/[^a-z0-9]/g, '_');
      const safeGroup = (group || "unknown").toLowerCase().replace(/[^a-z0-9]/g, '_');
      return `python_detective_${gameId}_${safeName}_${safeGroup}`;
    },

    load: function(name, group, gameId) {
      try {
        const key = this.getStorageKey(name, group, gameId);
        const saved = JSON.parse(localStorage.getItem(key)) || {};
        console.log(`📥 Завантажено прогрес:`, key, saved);
        return saved;
      } catch(e) {
        console.warn("⚠️ Помилка завантаження прогресу:", e);
        return {};
      }
    },

    save: function(state, gameId) {
      try {
        const key = this.getStorageKey(state.name, state.group, gameId);
        const progressData = {
          attempts: state.attempts,
          awarded: state.awarded,
          code: state.code,
          name: state.name,
          group: state.group
        };
        localStorage.setItem(key, JSON.stringify(progressData));
        console.log(`💾 Збережено прогрес:`, key);
      } catch(e) {
        console.warn("⚠️ Помилка збереження прогресу:", e);
      }
    },

    reset: function(name, group, gameId) {
      try {
        const key = this.getStorageKey(name, group, gameId);
        localStorage.removeItem(key);
        console.log(`🧹 Прогрес скинуто:`, key);
      } catch(e) {
        console.warn("⚠️ Помилка скидання прогресу:", e);
      }
    }
  };

  /* ========== ЛІДЕРБОРД ========== */
  const Leaderboard = {
    getKey: function(gameId) {
      return CONFIG.LB_PREFIX + gameId;
    },

    get: function(gameId) {
      try {
        const key = this.getKey(gameId);
        const lb = JSON.parse(localStorage.getItem(key)) || [];
        console.log("📊 Завантажено лідерборд:", lb);
        return lb;
      } catch(e) {
        console.warn("⚠️ Помилка завантаження лідерборду:", e);
        return [];
      }
    },

    add: function(gameId, name, group, score, time) {
      console.log("🏆 Додаємо до лідерборду:", { name, group, score, time });
      
      let lb = this.get(gameId);
      const existingIndex = lb.findIndex(r => r.name === name && r.group === group);
      
      if (existingIndex !== -1) {
        if (score > lb[existingIndex].score) {
          lb[existingIndex].score = score;
          lb[existingIndex].time = time;
          console.log("🔄 Оновлено існуючий запис");
        }
      } else {
        lb.push({
          name: name || "Невідомий",
          group: group || "Без групи",
          score: score,
          time: time
        });
        console.log("✅ Додано новий запис");
      }
      
      lb.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time.localeCompare(b.time);
      });
      
      localStorage.setItem(this.getKey(gameId), JSON.stringify(lb));
      console.log("📋 Фінальний лідерборд:", lb);
    },

    clear: function(gameId) {
      localStorage.removeItem(this.getKey(gameId));
      console.log("🧹 Лідерборд очищено");
    },

    render: function(gameId, tbodySelector = '#lbTable tbody') {
      const lb = this.get(gameId);
      const tbody = document.querySelector(tbodySelector);
      
      if (!tbody) {
        console.warn("⚠️ Не знайдено tbody для лідерборду");
        return;
      }
      
      tbody.innerHTML = lb.map((r, i) => `
        <tr role="row">
          <td role="cell">${i + 1}</td>
          <td role="cell">${r.name || "—"}</td>
          <td role="cell">${r.group || "—"}</td>
          <td role="cell">${r.score}</td>
          <td role="cell">${r.time}</td>
        </tr>
      `).join("");
      
      console.log("🎨 Лідерборд відображено:", lb.length, "записів");
    }
  };

  /* ========== АНАЛІТИКА ТА ФІДБЕК ========== */
  const Analytics = {
    saveGameResult: function(gameData) {
      try {
        console.log("💾 Зберігаємо результати гри");
        
        const attemptData = {
          studentName: gameData.name,
          studentGroup: gameData.group,
          gameId: gameData.gameId,
          gameTitle: gameData.gameTitle,
          score: gameData.score,
          maxScore: gameData.maxScore || 100,
          timeSpent: Math.floor(gameData.totalTimeMs / 1000),
          scenesCompleted: gameData.scenesCompleted,
          totalScenes: gameData.totalScenes,
          dateCompleted: new Date().toISOString(),
          details: {
            awarded: gameData.awarded,
            attempts: gameData.attempts
          }
        };

        // Зберегти в аналітику
        let allAttempts = JSON.parse(localStorage.getItem(CONFIG.ANALYTICS_KEY) || '[]');
        allAttempts.push(attemptData);
        localStorage.setItem(CONFIG.ANALYTICS_KEY, JSON.stringify(allAttempts));
        
        console.log('✅ Аналітику збережено!');
        
        // Зберегти найкращий результат гри
        const gameResultKey = `python_detective_${gameData.name}_${gameData.group}_${gameData.gameId}`;
        const existingResult = localStorage.getItem(gameResultKey);
        
        if (!existingResult || JSON.parse(existingResult).score < gameData.score) {
          const gameResult = {
            name: gameData.name,
            group: gameData.group,
            score: gameData.score,
            awarded: gameData.awarded,
            scenesCompleted: gameData.scenesCompleted,
            totalTime: gameData.totalTimeMs,
            timeFormatted: gameData.timeFormatted,
            date: new Date().toISOString(),
            gameId: gameData.gameId,
            gameName: gameData.gameTitle
          };
          
          localStorage.setItem(gameResultKey, JSON.stringify(gameResult));
          console.log('✅ Результат збережено для рейтингу');
        }
        
        return true;
      } catch (error) {
        console.warn('⚠️ Помилка збереження результатів:', error);
        return false;
      }
    },

    saveFeedback: function(feedbackData) {
      try {
        // Зберегти локально
        let feedbacks = JSON.parse(localStorage.getItem(CONFIG.FEEDBACK_KEY) || '[]');
        feedbacks.push(feedbackData);
        localStorage.setItem(CONFIG.FEEDBACK_KEY, JSON.stringify(feedbacks));
        
        console.log('✅ Фідбек збережено локально:', feedbackData);
        
        // Відправити на Google Sheets
        fetch(CONFIG.GOOGLE_SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData)
        }).then(() => {
          console.log('📊 Відправлено на Google Sheets');
        }).catch(err => {
          console.warn('⚠️ Помилка відправки на Google Sheets:', err);
        });
        
        return true;
      } catch (error) {
        console.warn('⚠️ Помилка збереження фідбеку:', error);
        return false;
      }
    }
  };

  /* ========== ДОПОМІЖНІ ФУНКЦІЇ ========== */
  const Utils = {
    formatTime: function(ms) {
      const s = Math.floor(ms / 1000);
      const minutes = Math.floor(s / 60);
      const seconds = s % 60;
      return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
    },

    announce: function(message) {
      const announcer = document.getElementById('announcements');
      if (announcer) {
        announcer.textContent = message;
        setTimeout(() => { announcer.textContent = ''; }, 1000);
      }
    },

    clamp: function(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },

    normalizeNumber: function(str) {
      const num = parseFloat(str);
      if (!isNaN(num)) {
        return Number.isInteger(num) ? num.toString() : num.toString();
      }
      return str;
    }
  };

  /* ========== PYTHON ВИКОНАННЯ (SKULPT) ========== */
  const PythonRunner = {
    init: function() {
      if (typeof Sk === 'undefined') {
        console.warn('⚠️ Skulpt не завантажено');
        return false;
      }
      return true;
    },

    run: async function(code) {
      if (!this.init()) {
        return { ok: false, err: "Python виконавець не завантажено" };
      }

      const buf = { out: "" };
      
      Sk.configure({
        output: (text) => { buf.out += text; },
        read: (x) => {
          if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
            throw "Файл не знайдено: " + x;
          }
          return Sk.builtinFiles["files"][x];
        }
      });

      try {
        await Sk.misceval.asyncToPromise(() => 
          Sk.importMainWithBody("<stdin>", false, code, true)
        );
        return { ok: true, out: buf.out };
      } catch (e) {
        return { ok: false, err: "⚠️ Помилка: " + e.toString() };
      }
    },

    compareOutput: function(got, expected) {
      console.log("🔍 Порівняння виводу:");
      console.log("Отримано:", got);
      console.log("Очікується:", expected);
      
      const normalize = (arr) => arr
        .map(x => x.trim())
        .filter(x => x.length > 0)
        .map(x => Utils.normalizeNumber(x));
      
      const gotLines = normalize((got || "").replace(/\r/g, "").trim().split("\n"));
      const expLines = normalize(expected);
      
      console.log("Нормалізовано отримане:", gotLines);
      console.log("Нормалізовано очікуване:", expLines);
      
      if (gotLines.length !== expLines.length) {
        console.log("❌ Кількість рядків не співпадає!");
        return false;
      }
      
      for (let i = 0; i < gotLines.length; i++) {
        if (gotLines[i] !== expLines[i]) {
          console.log(`❌ Рядок ${i + 1} не співпадає!`);
          return false;
        }
      }
      
      console.log("✅ Всі рядки співпадають!");
      return true;
    }
  };

  /* ========== ТЕМИ ========== */
  const ThemeManager = {
    init: function() {
      // Завантаження збереженої теми
      const savedTheme = localStorage.getItem('theme') || 'dark';
      this.applyTheme(savedTheme);
      
      // Обробники подій
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => this.toggleTheme());
      }
      
      const contrastToggle = document.getElementById('contrastToggle');
      if (contrastToggle) {
        contrastToggle.addEventListener('click', () => this.toggleContrast());
      }
    },

    applyTheme: function(theme) {
      const body = document.body;
      const themeToggle = document.getElementById('themeToggle');
      
      body.classList.remove('light-theme', 'high-contrast');
      
      if (theme === 'light') {
        body.classList.add('light-theme');
        if (themeToggle) themeToggle.textContent = '☀';
      } else if (theme === 'high-contrast') {
        body.classList.add('high-contrast');
        if (themeToggle) themeToggle.textContent = '🌙';
      } else {
        if (themeToggle) themeToggle.textContent = '🌙';
      }
      
      localStorage.setItem('theme', theme);
      
      // Оновити CodeMirror якщо є
      if (window.codeEditor && window.codeEditor.setOption) {
        const cmTheme = theme === 'light' ? 'github' : 'monokai';
        window.codeEditor.setOption('theme', cmTheme);
      }
    },

    toggleTheme: function() {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme(newTheme);
      Utils.announce(newTheme === 'light' ? 'Увімкнено світлу тему' : 'Увімкнено темну тему');
    },

    toggleContrast: function() {
      const button = document.getElementById('contrastToggle');
      const isActive = button && button.classList.contains('active');
      
      if (button) {
        button.classList.toggle('active');
      }
      
      this.applyTheme(isActive ? 'dark' : 'high-contrast');
      Utils.announce(isActive ? 'Вимкнено високий контраст' : 'Увімкнено високий контраст');
    }
  };

  /* ========== ПУБЛІЧНИЙ API ========== */
  return {
    // Модулі
    User: UserManager,
    Progress: ProgressManager,
    Leaderboard: Leaderboard,
    Analytics: Analytics,
    Python: PythonRunner,
    Theme: ThemeManager,
    Utils: Utils,
    
    // Конфігурація
    config: CONFIG,
    
    // Швидкий доступ до часто використовуваних функцій
    getCurrentUser: () => UserManager.getCurrentUser(),
    formatTime: (ms) => Utils.formatTime(ms),
    announce: (msg) => Utils.announce(msg),
    
    // Ініціалізація
    init: function() {
      console.log('🚀 Python Detective Core v1.0 ініціалізовано');
      ThemeManager.init();
      
      // Автоматичне завантаження користувача
      document.addEventListener('DOMContentLoaded', () => {
        UserManager.loadUserToFields();
      });
    }
  };
})();

// Автоматична ініціалізація
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PythonDetectiveCore.init());
} else {
  PythonDetectiveCore.init();
}

// Глобальний доступ
window.PDCore = PythonDetectiveCore;

console.log('✅ Python Detective Core завантажено!');
