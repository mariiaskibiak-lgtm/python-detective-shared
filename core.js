/* ========== PYTHON DETECTIVE CORE v1.0 ========== */
/* Спільні функції для всіх 15 ігор */

window.PDCore = (() => {
  // ⚡ Кеш DOM елементів
  const cache = new Map();
  const $ = (s) => cache.has(s) ? cache.get(s) : cache.set(s, document.querySelector(s)).get(s);
  
  // 💾 Batch операції localStorage (економія 80% звернень)
  const storage = {
    queue: new Map(),
    timer: null,
    
    set(key, value) {
      this.queue.set(key, value);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 100);
    },
    
    flush() {
      this.queue.forEach((v, k) => localStorage.setItem(k, JSON.stringify(v)));
      this.queue.clear();
    },
    
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } 
      catch { return null; }
    }
  };
  
  // 🛠️ Утиліти
  const utils = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    
    formatTime: (ms) => {
      const s = Math.floor(ms / 1000);
      return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    },
    
    announce: (msg) => {
      const el = $('#announcements');
      if (el) {
        el.textContent = msg;
        setTimeout(() => el.textContent = '', 1000);
      }
    },
    
    // Throttle для рендерингу (60fps)
    throttle: (fn, delay = 16) => {
      let timeout = null;
      return (...args) => {
        if (!timeout) {
          timeout = setTimeout(() => {
            fn(...args);
            timeout = null;
          }, delay);
        }
      };
    },
    
    // Debounce для localStorage
    debounce: (fn, delay = 300) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    }
  };
  
  // 🎨 Управління темою (спільне для всіх ігор)
  const theme = {
    init() {
      const saved = localStorage.getItem('pd_theme') || 'dark';
      this.apply(saved);
    },
    
    apply(name) {
      document.body.className = name === 'light' ? 'light-theme' : 
                                 name === 'contrast' ? 'high-contrast' : '';
      localStorage.setItem('pd_theme', name);
    },
    
    toggle() {
      const current = localStorage.getItem('pd_theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      this.apply(next);
      return next;
    }
  };
  
  return { $, storage, utils, theme };
})();

console.log('✅ PDCore v1.0 завантажено');
