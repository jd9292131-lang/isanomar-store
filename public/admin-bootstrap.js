(() => {
  'use strict';

  const adminApi = window.isaApi.api;

  let products = [];
  let categories = [];
  let settings = {};
  let adminSession = false;
  let storeSyncInFlight = false;

  const fmt = (value) => {
    return new Intl.NumberFormat('pt-AO', {
      maximumFractionDigits: 0
    }).format(Number(value) || 0) + ' Kz';
  };

  async function loadStore() {
    if (storeSyncInFlight) return false;

    storeSyncInFlight = true;

    try {
      const data = await adminApi('/store');

      products = data.products || [];
      categories = data.categories || [];

      settings = {
        ...(data.settings || {})
      };

      return true;

    } catch (error) {
      console.error('Sincronização administrativa:', error);
      return false;

    } finally {
      storeSyncInFlight = false;
    }
  }

  function isAdmin() {
    return adminSession === true;
  }

  function setAdmin(value, token) {
    adminSession = Boolean(value);

    if (token) {
      localStorage.setItem(
        'isanomar_admin_token',
        token
      );
    }

    if (!value) {
      localStorage.removeItem(
        'isanomar_admin_token'
      );
    }
  }

  /*
   * Interface que o admin.js e dashboard.js esperam encontrar.
   */
  window.__isanomar = {
    isAdmin,

    setAdmin,

    store: {
      get products() {
        return products;
      },

      set products(value) {
        products = value;
      },

      get categories() {
        return categories;
      },

      set categories(value) {
        categories = value;
      },

      get settings() {
        return settings;
      },

      set settings(value) {
        settings = value;
      },

      get orders() {
        return [];
      },

      set orders(value) {
        // Mantido apenas por compatibilidade.
      },

      saveProducts: async () => {
        return true;
      },

      saveCategories: async () => {
        return true;
      },

      saveSettings: async () => {
        return true;
      },

      saveOrders: async () => {
        return true;
      },

      fmt,

      refresh: loadStore
    },

    refresh: loadStore
  };

  /*
   * Tema do painel.
   */
  function setupTheme() {
    const saved =
      localStorage.getItem('isanomar_theme') || 'dark';

    document.documentElement.dataset.theme = saved;

    const btn = document.querySelector('#themeToggle');

    if (!btn) return;

    const paint = () => {
      const dark =
        document.documentElement.dataset.theme === 'dark';

      btn.innerHTML = `
        <i class="ph ${dark ? 'ph-sun' : 'ph-moon'}"></i>
      `;
    };

    paint();

    btn.addEventListener('click', () => {
      const current =
        document.documentElement.dataset.theme;

      const next =
        current === 'dark'
          ? 'light'
          : 'dark';

      document.documentElement.dataset.theme = next;

      localStorage.setItem(
        'isanomar_theme',
        next
      );

      paint();
    });
  }

  /*
   * Verifica se já existe uma sessão administrativa válida.
   */
  async function restoreAdminSession() {
    const token = localStorage.getItem(
      'isanomar_admin_token'
    );

    if (!token) {
      adminSession = false;
      return;
    }

    try {
      await adminApi('/admin/me');
      adminSession = true;

    } catch (error) {
      adminSession = false;

      localStorage.removeItem(
        'isanomar_admin_token'
      );
    }
  }

  /*
   * Inicialização do painel independente da loja pública.
   */
async function initAdminBootstrap() {
  setupTheme();

  await restoreAdminSession();

  if (adminSession) {
    await loadStore();
  }

  window.dispatchEvent(
    new CustomEvent('admin:render')
  );
}
  /*
   * O setTimeout garante que admin.js já foi carregado
   * e registou o evento antes da primeira renderização.
   */
  setTimeout(() => {
    initAdminBootstrap().catch((error) => {
      console.error(
        'Erro ao iniciar o painel administrativo:',
        error
      );
    });
  }, 0);

})();