// Cache utilities for development
window.cacheUtils = {
  // Clear all caches
  clearAllCaches: async function() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  },

  // Clear service worker cache
  clearServiceWorkerCache: async function() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('Service Worker cache cleared');
    }
  },

  // Force reload from server (bypass cache)
  forceReload: function() {
    window.location.reload(true);
  },

  // Clear all caches and reload
  clearAndReload: async function() {
    await this.clearAllCaches();
    await this.clearServiceWorkerCache();
    this.forceReload();
  },

  // Development mode: Auto-clear cache on page load
  enableDevMode: function() {
    // Clear cache on page load in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.clearAllCaches();
    }
  },

  // Mobile-specific cache clearing
  showMobileCacheMenu: function() {
    // Create mobile cache menu
    const menu = document.createElement('div');
    menu.id = 'mobile-cache-menu';
    menu.innerHTML = `
      <div class="mobile-cache-overlay"></div>
      <div class="mobile-cache-panel">
        <h3>Cache Options</h3>
        <button class="mobile-cache-btn" onclick="window.cacheUtils.clearAllCaches(); this.textContent='Cache Cleared!'; setTimeout(() => this.textContent='Clear Cache Only', 2000);">
          Clear Cache Only
        </button>
        <button class="mobile-cache-btn primary" onclick="window.cacheUtils.clearAndReload();">
          Clear Cache & Reload
        </button>
        <button class="mobile-cache-btn" onclick="window.cacheUtils.hideMobileCacheMenu();">
          Cancel
        </button>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .mobile-cache-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
      }
      .mobile-cache-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--card);
        border-top: 1px solid #1f2937;
        border-radius: 12px 12px 0 0;
        padding: 20px;
        z-index: 9999;
        transform: translateY(100%);
        transition: transform 0.3s ease;
      }
      .mobile-cache-panel.show {
        transform: translateY(0);
      }
      .mobile-cache-panel h3 {
        margin: 0 0 16px 0;
        text-align: center;
        color: var(--fg);
      }
      .mobile-cache-btn {
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #374151;
        background: #0b1220;
        color: var(--fg);
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      }
      .mobile-cache-btn.primary {
        background: var(--accent);
        border-color: var(--accent);
        color: #052e16;
        font-weight: 600;
      }
      .mobile-cache-btn:active {
        transform: translateY(1px);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(menu);
    
    // Animate in
    setTimeout(() => {
      menu.querySelector('.mobile-cache-panel').classList.add('show');
    }, 10);
  },

  hideMobileCacheMenu: function() {
    const menu = document.getElementById('mobile-cache-menu');
    if (menu) {
      menu.querySelector('.mobile-cache-panel').classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(menu);
      }, 300);
    }
  },

  // Add mobile cache button to header
  addMobileCacheButton: function() {
    // Check if we're on mobile
    if (window.innerWidth <= 768) {
      const header = document.querySelector('.app-header');
      if (header && !document.getElementById('mobile-cache-btn')) {
        const cacheBtn = document.createElement('button');
        cacheBtn.id = 'mobile-cache-btn';
        cacheBtn.className = 'btn';
        cacheBtn.innerHTML = '🗑️';
        cacheBtn.title = 'Clear Cache';
        cacheBtn.style.cssText = `
          padding: 8px 10px !important;
          min-width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          margin-left: 8px;
        `;
        
        cacheBtn.addEventListener('click', () => {
          this.showMobileCacheMenu();
        });
        
        // Insert before logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.parentNode.insertBefore(cacheBtn, logoutBtn);
        } else {
          header.appendChild(cacheBtn);
        }
      }
    }
  }
};

// Auto-enable dev mode
window.cacheUtils.enableDevMode();

// Add mobile cache button when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.cacheUtils.addMobileCacheButton();
});

// Add mobile cache button on resize
window.addEventListener('resize', () => {
  window.cacheUtils.addMobileCacheButton();
});

// Add keyboard shortcuts for development (desktop only)
document.addEventListener('keydown', function(e) {
  // Only on desktop
  if (window.innerWidth > 768) {
    // Ctrl+Shift+R or Cmd+Shift+R: Clear cache and reload
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      window.cacheUtils.clearAndReload();
    }
    
    // Ctrl+Shift+C or Cmd+Shift+C: Clear cache only
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      window.cacheUtils.clearAllCaches();
      alert('Cache cleared!');
    }
  }
});

// Add touch gestures for mobile
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
  touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
  touchEndY = e.changedTouches[0].clientY;
  
  // Swipe down from top to show cache menu (mobile only)
  if (window.innerWidth <= 768 && touchStartY < 100 && touchEndY > touchStartY + 100) {
    window.cacheUtils.showMobileCacheMenu();
  }
});

console.log('Cache utilities loaded with mobile support!');
console.log('Mobile: Swipe down from top or tap 🗑️ button to clear cache');
console.log('Desktop: Use Ctrl+Shift+R to clear cache and reload');
