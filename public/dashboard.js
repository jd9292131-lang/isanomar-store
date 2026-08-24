// ============================================================
// ISANOMAR store — Dashboard do Operador
// Ficheiro separado: dashboard.js
// ============================================================

const $dash = (s) => document.querySelector(s);
const $$dash = (s) => [...document.querySelectorAll(s)];
const Sdash = () => window.__isanomar.store;
const fmtDash = (v) => window.__isanomar.store.fmt(v);

const escDash = (t) => {
  const d = document.createElement('div');
  d.textContent = t ?? '';
  return d.innerHTML;
};

const elDash = (tag, className) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
};

const toastDash = (message) => {
  window.dispatchEvent(new CustomEvent('toast', { detail: message }));
  const toastEl = $dash('#toast');
  if (toastEl) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
};

// ============================================================
// LABELS
// ============================================================

const STATUS_LABEL_DASH = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

const PAY_LABEL_DASH = {
  cod: 'Entrega',
  transfer: 'Transferência',
  express: 'MULTICAIXA Express',
  install: 'Prestações'
};

const STATUS_COLOR_DASH = {
  pendente: 'var(--warning)',
  confirmado: 'var(--blue-600)',
  enviado: '#0877a8',
  entregue: 'var(--success)',
  cancelado: 'var(--danger)'
};

// ============================================================
// CACHE DE DADOS
// ============================================================

let dashboardData = null;
let dashboardDataTimestamp = 0;
const DASHBOARD_CACHE_MS = 30_000; // 30 segundos

// ============================================================
// RENDER PRINCIPAL
// ============================================================

async function renderDashboard() {
  const container = $dash('#adminDashboard');
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-loading">
      <i class="ph ph-spinner-gap"></i>
      <span>A carregar estatísticas...</span>
    </div>
  `;

  try {
    await loadDashboardData();
    container.innerHTML = '';

    renderStatsCards(container);
    renderOperationalAlerts(container);
    renderRevenueChart(container);
    renderPaymentBreakdown(container);
    renderStatusBreakdown(container);
    renderTopProducts(container);
    renderOrdersHistory(container);

  } catch (e) {
    console.error('Erro no dashboard:', e);
    container.innerHTML = `
      <div class="dashboard-empty">
        <i class="ph ph-warning"></i>
        <p>Não foi possível carregar o dashboard.</p>
        <button class="btn btn-primary" onclick="renderDashboard()">
          <i class="ph ph-arrow-clockwise"></i> Tentar novamente
        </button>
      </div>
    `;
  }
}

// ============================================================
// CARREGAR DADOS
// ============================================================

async function loadDashboardData() {
  const now = Date.now();
  if (dashboardData && (now - dashboardDataTimestamp) < DASHBOARD_CACHE_MS) {
    return;
  }

  const [summaryRes, ordersRes, storeRes] = await Promise.all([
    api('/admin/dashboard').catch(() => ({ summary: {}, lowStock: [], paymentMethods: [] })),
    api('/admin/orders').catch(() => ({ orders: [] })),
    api('/admin/products').catch(() => ({ products: [], categories: [], settings: {} }))
  ]);

  const orders = ordersRes.orders || [];
  const products = storeRes.products || [];
  const categories = storeRes.categories || [];

  // Métricas
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const totalDelivery = orders.reduce((s, o) => s + (Number(o.delivery) || 0), 0);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum,p) => sum + (Number(p.stock)||0), 0);
  const totalCategories = categories.length;
  const uniqueClients = new Set(orders.map(o => o.phone)).size;

  // Encomendas por estado
  const byStatus = {};
  orders.forEach(o => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  });

  // Encomendas por método de pagamento
  const byPayment = {};
  orders.forEach(o => {
    byPayment[o.method] = (byPayment[o.method] || 0) + 1;
  });
  const paymentRevenue = {};
  orders.forEach(o => {
    paymentRevenue[o.method] = (paymentRevenue[o.method] || 0) + (Number(o.total) || 0);
  });

  // Produtos mais vendidos
  const productSales = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const id = item.id || item.productId;
      if (!productSales[id]) {
        productSales[id] = { id, name: item.name, qty: 0, revenue: 0, price: item.price };
      }
      productSales[id].qty += Number(item.qty) || 0;
      productSales[id].revenue += (Number(item.price) || 0) * (Number(item.qty) || 0);
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Receita por mês (últimos 6 meses)
  const byMonth = {};
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!byMonth[key]) byMonth[key] = { label, revenue: 0, count: 0 };
    byMonth[key].revenue += Number(o.total) || 0;
    byMonth[key].count += 1;
  });
  const monthKeys = Object.keys(byMonth).sort().slice(-6);
  const revenueByMonth = monthKeys.map(k => byMonth[k]);

  // Encomendas recentes (últimas 50)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);

  dashboardData = {
    summary: summaryRes.summary || {},
    lowStock: summaryRes.lowStock || [],
    paymentMethods: summaryRes.paymentMethods || [],
    totalOrders,
    totalRevenue,
    totalDelivery,
    totalProducts,
    totalStock,
    totalCategories,
    uniqueClients,
    byStatus,
    byPayment,
    paymentRevenue,
    topProducts,
    revenueByMonth,
    recentOrders,
    products
  };

  dashboardDataTimestamp = now;
}

// ============================================================
// CARDS DE ESTATÍSTICAS
// ============================================================

function renderStatsCards(container) {
  const d = dashboardData;
  const s = d.summary || {};
  const section = elDash('div', 'dashboard-section');
  section.innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card stat-blue"><div class="stat-icon"><i class="ph ph-receipt"></i></div><div class="stat-info"><span class="stat-value">${fmtDash(s.todayOrders ?? d.totalOrders)}</span><span class="stat-label">Encomendas hoje</span></div></div>
      <div class="stat-card stat-green"><div class="stat-icon"><i class="ph ph-coins"></i></div><div class="stat-info"><span class="stat-value">${fmtDash(s.todayRevenue ?? d.totalRevenue)}</span><span class="stat-label">Receita hoje</span></div></div>
      <div class="stat-card stat-gold"><div class="stat-icon"><i class="ph ph-package"></i></div><div class="stat-info"><span class="stat-value">${fmtDash(s.stock ?? d.totalStock)}</span><span class="stat-label">Unidades disponíveis</span></div></div>
      <div class="stat-card stat-purple"><div class="stat-icon"><i class="ph ph-users"></i></div><div class="stat-info"><span class="stat-value">${fmtDash(s.clients ?? d.uniqueClients)}</span><span class="stat-label">Clientes</span></div></div>
    </div>
    <div class="dashboard-kpi-strip">
      <span><i class="ph ph-hourglass"></i> ${s.pending ?? 0} encomendas pendentes</span>
      <span><i class="ph ph-wallet"></i> ${s.unpaid ?? 0} pagamentos pendentes</span>
      <span><i class="ph ph-warning"></i> ${s.overdue ?? 0} entregas em atraso</span>
      <span><i class="ph ph-squares-four"></i> ${d.totalProducts} produtos</span>
    </div>`;
  container.appendChild(section);
}

function renderOperationalAlerts(container) {
  const d=dashboardData; const s=d.summary||{}; const section=elDash('div','dashboard-section');
  const alerts=[];
  if((s.pending||0)>0) alerts.push(`<div class="ops-alert warning"><i class="ph ph-receipt"></i><div><strong>${s.pending} encomenda(s) pendente(s)</strong><span>Requerem revisão no separador Encomendas.</span></div></div>`);
  if((s.unpaid||0)>0) alerts.push(`<div class="ops-alert warning"><i class="ph ph-wallet"></i><div><strong>${s.unpaid} pagamento(s) pendente(s)</strong><span>Confirme os pagamentos antes de avançar o estado.</span></div></div>`);
  if((s.overdue||0)>0) alerts.push(`<div class="ops-alert danger"><i class="ph ph-truck"></i><div><strong>${s.overdue} entrega(s) em atraso</strong><span>Verifique os prazos e actualize o estado.</span></div></div>`);
  if(d.lowStock.length) alerts.push(`<div class="ops-alert danger"><i class="ph ph-package"></i><div><strong>${d.lowStock.length} produto(s) em stock crítico</strong><span>${d.lowStock.slice(0,4).map(p=>escDash(p.name)+': '+p.stock).join(' · ')}</span></div></div>`);
  section.innerHTML=`<div class="ops-alerts"><div class="dashboard-title-row"><h3 class="dashboard-title"><i class="ph ph-warning-circle"></i> Requer atenção</h3></div>${alerts.length?alerts.join(''):'<div class="ops-alert success"><i class="ph ph-check-circle"></i><div><strong>Operação em dia</strong><span>Não existem alertas críticos neste momento.</span></div></div>'}</div>`;
  container.appendChild(section);
}

// ============================================================
// GRÁFICO DE RECEITAS (barras CSS)
// ============================================================

function renderRevenueChart(container) {
  const d = dashboardData;
  const section = elDash('div', 'dashboard-section');

  if (!d.revenueByMonth.length) {
    section.innerHTML = `
      <h3 class="dashboard-title"><i class="ph ph-chart-bar"></i> Receita mensal</h3>
      <p class="dashboard-empty-text">Sem dados suficientes.</p>
    `;
    container.appendChild(section);
    return;
  }

  const maxRev = Math.max(...d.revenueByMonth.map(m => m.revenue), 1);

  let barsHTML = '';
  d.revenueByMonth.forEach(m => {
    const pct = Math.round((m.revenue / maxRev) * 100);
    barsHTML += `
      <div class="chart-bar-wrap">
        <div class="chart-bar-label">${escDash(m.label)}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="chart-bar-value">${fmtDash(m.revenue)}</div>
      </div>
    `;
  });

  section.innerHTML = `
    <h3 class="dashboard-title"><i class="ph ph-chart-bar"></i> Receita mensal</h3>
    <div class="chart-container">
      ${barsHTML}
    </div>
  `;

  container.appendChild(section);
}

// ============================================================
// BREAKDOWN POR PAGAMENTO
// ============================================================

function renderPaymentBreakdown(container) {
  const d = dashboardData;
  const section = elDash('div', 'dashboard-section');

  const entries = Object.entries(d.byPayment);
  if (!entries.length) {
    section.innerHTML = `
      <h3 class="dashboard-title"><i class="ph ph-wallet"></i> Métodos de pagamento</h3>
      <p class="dashboard-empty-text">Sem dados.</p>
    `;
    container.appendChild(section);
    return;
  }

  const total = d.totalOrders;

  let rowsHTML = '';
  entries.forEach(([method, count]) => {
    const pct = Math.round((count / total) * 100);
    const label = PAY_LABEL_DASH[method] || method;
    const rev = d.paymentRevenue[method] || 0;
    rowsHTML += `
      <div class="breakdown-row">
        <div class="breakdown-info">
          <span class="breakdown-name">${escDash(label)}</span>
          <span class="breakdown-count">${count} encomenda${count !== 1 ? 's' : ''}</span>
        </div>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="breakdown-pct">${pct}%</span>
        </div>
        <div class="breakdown-rev">${fmtDash(rev)}</div>
      </div>
    `;
  });

  section.innerHTML = `
    <h3 class="dashboard-title"><i class="ph ph-wallet"></i> Métodos de pagamento</h3>
    <div class="breakdown-list">
      ${rowsHTML}
    </div>
  `;

  container.appendChild(section);
}

// ============================================================
// BREAKDOWN POR ESTADO
// ============================================================

function renderStatusBreakdown(container) {
  const d = dashboardData;
  const section = elDash('div', 'dashboard-section');

  const entries = Object.entries(d.byStatus);
  if (!entries.length) {
    section.innerHTML = `
      <h3 class="dashboard-title"><i class="ph ph-check-circle"></i> Estados das encomendas</h3>
      <p class="dashboard-empty-text">Sem dados.</p>
    `;
    container.appendChild(section);
    return;
  }

  const total = d.totalOrders;

  let rowsHTML = '';
  entries.forEach(([status, count]) => {
    const pct = Math.round((count / total) * 100);
    const label = STATUS_LABEL_DASH[status] || status;
    const color = STATUS_COLOR_DASH[status] || 'var(--muted)';
    rowsHTML += `
      <div class="breakdown-row">
        <div class="breakdown-info">
          <span class="breakdown-dot" style="background:${color}"></span>
          <span class="breakdown-name">${escDash(label)}</span>
          <span class="breakdown-count">${count}</span>
        </div>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="breakdown-pct">${pct}%</span>
        </div>
      </div>
    `;
  });

  section.innerHTML = `
    <h3 class="dashboard-title"><i class="ph ph-check-circle"></i> Estados das encomendas</h3>
    <div class="breakdown-list">
      ${rowsHTML}
    </div>
  `;

  container.appendChild(section);
}

// ============================================================
// PRODUTOS MAIS PEDIDOS
// ============================================================

function renderTopProducts(container) {
  const d = dashboardData;
  const section = elDash('div', 'dashboard-section');

  if (!d.topProducts.length) {
    section.innerHTML = `
      <h3 class="dashboard-title"><i class="ph ph-trophy"></i> Produtos mais pedidos</h3>
      <p class="dashboard-empty-text">Sem vendas registadas.</p>
    `;
    container.appendChild(section);
    return;
  }

  const maxQty = Math.max(...d.topProducts.map(p => p.qty), 1);

  let rowsHTML = '';
  d.topProducts.forEach((p, i) => {
    const pct = Math.round((p.qty / maxQty) * 100);
    rowsHTML += `
      <div class="top-product-row">
        <span class="top-product-rank">${i + 1}</span>
        <div class="top-product-info">
          <span class="top-product-name">${escDash(p.name)}</span>
          <span class="top-product-meta">${p.qty} vendido${p.qty !== 1 ? 's' : ''} · ${fmtDash(p.revenue)}</span>
        </div>
        <div class="top-product-bar-wrap">
          <div class="top-product-bar-track">
            <div class="top-product-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  });

  section.innerHTML = `
    <h3 class="dashboard-title"><i class="ph ph-trophy"></i> Produtos mais pedidos</h3>
    <div class="top-products-list">
      ${rowsHTML}
    </div>
  `;

  container.appendChild(section);
}

// ============================================================
// HISTÓRICO DE ENCOMENDAS
// ============================================================

function renderOrdersHistory(container) {
  const d = dashboardData;
  const section = elDash('div', 'dashboard-section');

  if (!d.recentOrders.length) {
    section.innerHTML = `
      <h3 class="dashboard-title"><i class="ph ph-clock-counter-clockwise"></i> Histórico de encomendas</h3>
      <p class="dashboard-empty-text">Nenhuma encomenda registada.</p>
    `;
    container.appendChild(section);
    return;
  }

  let rowsHTML = '';
  d.recentOrders.forEach(order => {
    const date = new Date(order.createdAt).toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const items = (order.items || []).map(i => `${i.qty}× ${i.name}`).join(', ');
    const statusLabel = STATUS_LABEL_DASH[order.status] || order.status;
    const statusColor = STATUS_COLOR_DASH[order.status] || 'var(--muted)';
    const payLabel = PAY_LABEL_DASH[order.method] || order.method;

    rowsHTML += `
      <div class="history-row">
        <div class="history-header">
          <div class="history-id-date">
            <span class="history-id">${escDash(order.id)}</span>
            <span class="history-date">${escDash(date)}</span>
          </div>
          <span class="history-status" style="color:${statusColor};border-color:${statusColor}">${escDash(statusLabel)}</span>
        </div>
        <div class="history-client">
          <i class="ph ph-user"></i>
          <span>${escDash(order.name)}</span>
          <span class="history-phone">${escDash(order.phone)}</span>
        </div>
        <div class="history-address">
          <i class="ph ph-map-pin"></i>
          <span>${escDash(order.address)} · ${escDash(order.province)}${order.municipality ? ' · ' + escDash(order.municipality) : ''}</span>
        </div>
        <div class="history-items">${escDash(items)}</div>
        <div class="history-footer">
          <span class="history-pay">${escDash(payLabel)}${order.install ? ' · ' + order.install + 'x' : ''}</span>
          <span class="history-total">${fmtDash(order.total)}${order.delivery ? ' + ' + fmtDash(order.delivery) + ' entrega' : ''}</span>
        </div>
      </div>
    `;
  });

  section.innerHTML = `
    <h3 class="dashboard-title"><i class="ph ph-clock-counter-clockwise"></i> Histórico de encomendas <small>(${d.recentOrders.length} recentes)</small></h3>
    <div class="history-list">
      ${rowsHTML}
    </div>
  `;

  container.appendChild(section);
}

// ============================================================
// EXPORTAR PARA O ADMIN.JS
// ============================================================

window.__isanomarDashboard = {
  render: renderDashboard,
  invalidateCache: () => {
    dashboardData = null;
    dashboardDataTimestamp = 0;
  }
};