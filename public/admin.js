// ============================================================
// ISANOMAR store — Painel do Operador
// ============================================================

const { api } = window.isaApi;

const $ = (s) => document.querySelector(s);

const S = () => window.__isanomar.store;

const fmt = (v) => window.__isanomar.store.fmt(v);

let currentTab = 'dashboard';


// ============================================================
// LABELS
// ============================================================

const STATUS_LABEL = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

const PAY_LABEL = {
  cod: 'Entrega',
  transfer: 'Transferência',
  install: 'Prestações'
};

const genreLabel = (g) => {
  if (g === 'f') return 'Feminino';
  if (g === 'm') return 'Masculino';
  return 'Unissexo';
};


// ============================================================
// HELPERS
// ============================================================

const esc = (t) => {
  const d = document.createElement('div');
  d.textContent = t ?? '';
  return d.innerHTML;
};

const el = (tag, className) => {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  return node;
};

const toast = (message) => {
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: message
    })
  );

  // fallback para o toast que já existe no index
  const toastEl = $('#toast');

  if (toastEl) {
    toastEl.textContent = message;
    toastEl.classList.add('show');

    clearTimeout(toastEl._timer);

    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2600);
  }
};

const openModal = (id) => {
  const modal = $(id);

  if (modal) {
    modal.classList.add('open');
  }
};

const closeModal = (id) => {
  const modal = $(id);

  if (modal) {
    modal.classList.remove('open');
  }
};


// ============================================================
// RENDER PRINCIPAL
// ============================================================

async function render() {
  if (!window.__isanomar || !window.__isanomar.isAdmin) {
    console.error('window.__isanomar ainda não está disponível.');
    return;
  }

  if (!window.__isanomar.isAdmin()) {
    $('#adminLogin').hidden = false;
    $('#adminPanel').hidden = true;
    return;
  }

  $('#adminLogin').hidden = true;
  $('#adminPanel').hidden = false;

  await updateOrderBadge();
  await renderTab();
}


// ============================================================
// TABS
// ============================================================

async function updateOrderBadge() {
  try {
    const result = await api('/admin/orders');
    const orders = result.orders || [];
    const pending = orders.filter(o => o.status === 'pendente').length;
    const badge = $('#ordersBadge');
    if (badge) {
      badge.textContent = pending;
      badge.hidden = pending === 0;
    }
  } catch (e) {
    // silencioso — não bloquear interface
  }
}

async function renderTab() {
  const tabs = $('#adminTabs');
  const bodies = $('#adminPanel');

  if (!tabs || !bodies) return;

  tabs
    .querySelectorAll('.tab')
    .forEach((tab) => {
      tab.classList.toggle(
        'active',
        tab.dataset.tab === currentTab
      );
    });

  bodies
    .querySelectorAll('.tab-body')
    .forEach((body) => {
      body.classList.toggle(
        'hidden',
        body.dataset.body !== currentTab
      );
    });

  if (currentTab === 'dashboard') {
    if (window.__isanomarDashboard) {
      await window.__isanomarDashboard.render();
    }
  } else if (currentTab === 'products') {
    await renderProducts();
  } else if (currentTab === 'stock') {
    await renderStock();
  } else if (currentTab === 'orders') {
    await renderOrders();
  } else if (currentTab === 'clients') {
    await renderClients();
  } else if (currentTab === 'categories') {
    await renderCats();
  } else if (currentTab === 'settings') {
    renderSettings();
  } else if (currentTab === 'audit') {
    await renderAudit();
  }
}


// ============================================================
// LOGIN
// ============================================================

$('#adminLoginBtn').onclick = async () => {
  const password = $('#adminPass').value.trim();

  if (!password) {
    toast('Digite a senha do operador.');
    return;
  }

  const btn = $('#adminLoginBtn');

  try {
    btn.disabled = true;
    btn.textContent = 'A entrar...';

    const result = await api('/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        password
      })
    });

    window.__isanomar.setAdmin(
      true,
      result.token
    );

    $('#adminPass').value = '';

    toast('Bem-vindo, operador ✓');

    await render();

  } catch (e) {
    console.error('Erro no login:', e);

    toast(
      e?.message === 'Senha incorreta'
        ? 'Senha incorreta.'
        : e?.message || 'Não foi possível entrar.'
    );

  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
};


$('#adminPass').addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Enter') {
      $('#adminLoginBtn').click();
    }
  }
);


// ============================================================
// LOGOUT
// ============================================================

$('#logoutAdminBtn').onclick = () => {
  window.__isanomar.setAdmin(false);

  toast('Sessão terminada');

  render();
};

$('#logoutAdminBtnTop').onclick = () => {
  window.__isanomar.setAdmin(false);

  toast('Sessão terminada');

  render();
};


// ============================================================
// TABS — CLICK
// ============================================================

$('#adminTabs')
  .querySelectorAll('.tab')
  .forEach((tab) => {
    tab.onclick = async () => {
      currentTab = tab.dataset.tab;

      await renderTab();
    };
  });


// ============================================================
// PRODUTOS
// ============================================================

async function renderProducts() {
  const box = $('#adminProducts');

  if (!box) return;

  box.innerHTML = '';

  const result = await api('/admin/products');
  const products = result.products || [];

  products.forEach((p) => {
    const row = el('div', 'admin-row');

    // imagem
    if (p.img) {
      const image = document.createElement('img');

      image.src = p.img;
      image.alt = p.name || 'Produto';
      image.loading = 'lazy';

      image.onerror = () => {
        image.style.display = 'none';
      };

      row.appendChild(image);

    } else {
      const placeholder = el('div', 'thumb');
      placeholder.innerHTML = '<i class="ph ph-image"></i>';
      row.appendChild(placeholder);
    }

    // informações
    const info = el('div', 'info');

    const name = document.createElement('strong');
    name.textContent = p.name || '';

    const details = document.createElement('small');
    details.textContent =
      `${fmt(p.price)} · ${genreLabel(p.genre)} · Stock: ${Number(p.stock)||0} · Alerta: ${Number(p.lowStockThreshold)||0}`;

    info.appendChild(name);
    info.appendChild(details);

    row.appendChild(info);

    // ações
    const actions = el('div', 'actions');

    const editBtn = el('button', 'icon-btn dark');
    editBtn.type = 'button';
    editBtn.innerHTML = '<i class="ph ph-pencil-simple"></i>';

    const deleteBtn = el('button', 'icon-btn red');
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = '<i class="ph ph-trash"></i>';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(actions);

    box.appendChild(row);

    editBtn.onclick = () => {
      openProductForm(p);
    };

    deleteBtn.onclick = () => {
      confirmDeleteProduct(p);
    };
  });

  if (!products.length) {
    box.innerHTML =
      '<p class="empty">Sem produtos ainda.</p>';
  }
}


// ============================================================
// SELECT DE CATEGORIAS
// ============================================================

function fillCatSelect() {
  const select = $('#pCat');

  if (!select) return;

  select.innerHTML = '';

  const categories = S().categories || [];

  categories.forEach((category) => {
    const option = document.createElement('option');

    option.value = category.id;
    option.textContent = category.name;

    select.appendChild(option);
  });
}


// ============================================================
// NOVO PRODUTO
// ============================================================

$('#addProductBtn').onclick = () => {
  openProductForm(null);
};


// ============================================================
// PREVIEW DA IMAGEM
// ============================================================

function createImagePreview() {
  const existing = $('#productImagePreview');

  if (existing) {
    return existing;
  }

  const preview = document.createElement('div');

  preview.id = 'productImagePreview';

  preview.style.cssText = `
    margin-top: 10px;
    width: 100%;
    min-height: 160px;
    border: 1px dashed var(--line);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--surface, #f7f7f7);
  `;

  const fileField = $('#pImageFile');

  if (fileField && fileField.parentElement) {
    fileField.parentElement.appendChild(preview);
  }

  return preview;
}


function showImagePreview(src) {
  const preview = createImagePreview();

  preview.innerHTML = '';

  if (!src) {
    const text = document.createElement('span');

    text.textContent = 'Pré-visualização da imagem';

    text.style.opacity = '0.55';

    preview.appendChild(text);

    return;
  }

  const image = document.createElement('img');

  image.src = src;
  image.alt = 'Pré-visualização';
  image.style.cssText = `
    width: 100%;
    max-height: 220px;
    object-fit: contain;
    display: block;
  `;

  image.onerror = () => {
    preview.innerHTML = '';

    const text = document.createElement('span');

    text.textContent = 'Não foi possível carregar a imagem.';
    text.style.opacity = '0.6';

    preview.appendChild(text);
  };

  preview.appendChild(image);
}


// ============================================================
// FORMULÁRIO DE PRODUTO
// ============================================================

function openProductForm(product) {
  fillCatSelect();

  $('#productModalTitle').textContent =
    product
      ? 'Editar produto'
      : 'Novo produto';

  $('#pId').value =
    product?.id || '';

  $('#pName').value =
    product?.name || '';

  $('#pPrice').value =
    product?.price ?? '';

  $('#pCat').value =
    product?.catId ||
    S().categories[0]?.id ||
    '';

  $('#pGenre').value =
    product?.genre || 'unisex';

  $('#pDesc').value =
    product?.desc || '';

  $('#pImage').value =
    product?.img || '';

  $('#pImageFile').value = '';

  $('#pDelete').hidden = !product;
  $('#pInitialStock').value = '0';
  $('#pInitialLotCode').value = '';
  $('#pLowStock').value = product?.lowStockThreshold ?? 3;
  const stockBlock = $('#productStockCreate');
  if (stockBlock) stockBlock.hidden = !!product;

  showImagePreview(
    product?.img || ''
  );

  openModal('#productModal');
}


// ============================================================
// SELEÇÃO DE IMAGEM
// ============================================================

$('#pImageFile').addEventListener(
  'change',
  (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      showImagePreview(
        $('#pImage').value.trim()
      );

      return;
    }

    if (!file.type.startsWith('image/')) {
      toast('Selecione um ficheiro de imagem válido.');

      e.target.value = '';

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('A imagem deve ter no máximo 5 MB.');

      e.target.value = '';

      return;
    }

    const url = URL.createObjectURL(file);

    showImagePreview(url);
  }
);


// ============================================================
// URL DA IMAGEM — PREVIEW
// ============================================================

$('#pImage').addEventListener(
  'input',
  (e) => {
    const url = e.target.value.trim();

    if (!$('#pImageFile').files?.length) {
      showImagePreview(url);
    }
  }
);


// ============================================================
// GUARDAR PRODUTO
// ============================================================

$('#productForm').addEventListener(
  'submit',
  async (e) => {
    e.preventDefault();

    let imageUrl =
      $('#pImage').value.trim();

    const file =
      $('#pImageFile').files?.[0];

    const saveButton =
      $('#productForm button[type="submit"]');

    try {
      saveButton.disabled = true;
      saveButton.textContent = 'A guardar...';


      // ------------------------------------------------------
      // UPLOAD DA IMAGEM
      // ------------------------------------------------------

      if (file) {
        toast('A carregar imagem...');

        const formData = new FormData();

        formData.append(
          'image',
          file
        );

        const result = await api(
          '/admin/uploads',
          {
            method: 'POST',
            body: formData
          }
        );

        imageUrl = result.url;

        $('#pImage').value =
          imageUrl;

        toast('Imagem carregada ✓');
      }


      // ------------------------------------------------------
      // DADOS DO PRODUTO
      // ------------------------------------------------------

      const data = {
        name: $('#pName').value.trim(),

        price:
          Number($('#pPrice').value) || 0,

        catId:
          $('#pCat').value || null,

        genre:
          $('#pGenre').value,

        desc:
          $('#pDesc').value.trim(),

        img:
          imageUrl,

        // Mantido apenas por compatibilidade
        // com a estrutura atual da API.
        emoji: '',
        initialStock: Number($('#pInitialStock')?.value || 0),
        lotCode: $('#pInitialLotCode')?.value.trim() || '',
        lowStockThreshold: Number($('#pLowStock')?.value || 3)
      };


      // ------------------------------------------------------
      // VALIDAÇÃO
      // ------------------------------------------------------

      if (!data.name) {
        throw new Error(
          'Digite o nome do produto.'
        );
      }

      if (data.price < 0) {
        throw new Error(
          'O preço não pode ser negativo.'
        );
      }


      // ------------------------------------------------------
      // CRIAR OU EDITAR
      // ------------------------------------------------------

      const id =
        $('#pId').value.trim();

      if (id) {

        await api(
          '/admin/products/' +
          encodeURIComponent(id),
          {
            method: 'PUT',
            body: JSON.stringify(data)
          }
        );

        toast(
          'Produto atualizado ✓'
        );

      } else {

        await api(
          '/admin/products',
          {
            method: 'POST',
            body: JSON.stringify(data)
          }
        );

        toast(
          'Produto criado ✓'
        );
      }


      // ------------------------------------------------------
      // ATUALIZAR INTERFACE
      // ------------------------------------------------------

      closeModal('#productModal');

      await window.__isanomar.refresh();

      if (window.__isanomarDashboard) {
        window.__isanomarDashboard.invalidateCache();
      }

      await renderProducts();

    } catch (err) {

      console.error(
        'Erro ao guardar produto:',
        err
      );

      toast(
        err?.message ||
        'Erro ao guardar produto.'
      );

    } finally {

      saveButton.disabled = false;
      saveButton.textContent = 'Guardar';
    }
  }
);


// ============================================================
// FECHAR MODAL
// ============================================================

$('#closeModalBtn').onclick = () => {
  closeModal('#productModal');
};


// ============================================================
// ELIMINAR PRODUTO
// ============================================================

$('#pDelete').onclick = () => {
  const product =
    S().products.find(
      (x) =>
        x.id === $('#pId').value
    );

  if (product) {
    confirmDeleteProduct(product);
  }
};


function confirmDeleteProduct(product) {

  confirmModal(
    'Eliminar produto',
    `Eliminar "${product.name}"?`,
    async () => {

      try {

        await api(
          '/admin/products/' +
          encodeURIComponent(product.id),
          {
            method: 'DELETE'
          }
        );

        toast(
          'Produto eliminado ✓'
        );

        await window.__isanomar.refresh();

        if (window.__isanomarDashboard) {
          window.__isanomarDashboard.invalidateCache();
        }

        await renderProducts();

      } catch (e) {

        toast(
          e?.message ||
          'Erro ao eliminar.'
        );
      }
    }
  );
}


// ============================================================
// STOCK & LOTES
// ============================================================

async function renderStock() {
  const box = $('#adminStock');
  if (!box) return;
  box.innerHTML = '<div class="empty">A carregar inventário...</div>';
  try {
    const result = await api('/admin/stock');
    const products = result.products || [];
    box.innerHTML = '';
    products.forEach(p => {
      const card = el('section','stock-product-card');
      const lots = p.lots || [];
      card.innerHTML = `<div class="stock-product-top"><div><strong>${esc(p.name)}</strong><small style="display:block;color:var(--text-soft)">${fmt(p.price)} · ${esc(genreLabel(p.genre))}</small></div><div class="stock-total">${Number(p.stock)||0}</div></div>`;
      const list = el('div');
      lots.forEach(l => {
        const row = el('div','lot-row');
        row.innerHTML = `<div><strong>${esc(l.code)}</strong><small style="display:block">${l.expiresAt ? 'Validade: '+esc(l.expiresAt) : 'Sem validade definida'}</small></div><div><strong>${l.availableQty}</strong><small style="display:block">disponível</small></div><div><strong>${l.receivedQty}</strong><small style="display:block">recebido</small></div><div class="lot-actions"><button class="icon-btn dark lot-edit" type="button"><i class="ph ph-pencil-simple"></i></button><button class="icon-btn red lot-delete" type="button"><i class="ph ph-trash"></i></button></div>`;
        row.querySelector('.lot-edit').onclick=()=>openLotForm(l);
        row.querySelector('.lot-delete').onclick=async()=>{ if(!confirm(`Eliminar o lote ${l.code}?`)) return; try{await api('/admin/lots/'+l.id,{method:'DELETE'});toast('Lote eliminado.');await renderStock();}catch(e){toast(e.message||'Não foi possível eliminar.');} };
        list.appendChild(row);
      });
      if (!lots.length) { const empty=el('p','empty'); empty.textContent='Sem lotes reais. Adicione stock através de um novo lote.'; list.appendChild(empty); }
      const add=el('button','btn btn-secondary btn-block'); add.type='button'; add.innerHTML='<i class="ph ph-plus"></i> Adicionar lote'; add.onclick=()=>openLotForm({productId:p.id}); list.appendChild(add); card.appendChild(list); box.appendChild(card);
    });
    if(!products.length) box.innerHTML='<div class="empty">Sem produtos no inventário.</div>';
  } catch(e) { box.innerHTML=`<div class="empty">${esc(e.message||'Erro ao carregar stock.')}</div>`; }
}

async function fillLotProducts(selected='') {
  const select=$('#lotProduct'); if(!select) return; select.innerHTML='';
  const result=await api('/admin/products');
  const products=result.products||[];
  products.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name} — stock ${p.stock||0}`;select.appendChild(o);});
  if(selected) select.value=selected;
}

async function openLotForm(lot=null) {
  $('#lotId').value=lot?.id||''; $('#lotModalTitle').textContent=lot?.id?'Editar lote':'Novo lote';
  await fillLotProducts(lot?.productId||''); $('#lotCode').value=lot?.code||''; $('#lotReceived').value=lot?.receivedQty??''; $('#lotAvailable').value=lot?.availableQty??''; $('#lotExpires').value=lot?.expiresAt||''; $('#lotNote').value=lot?.note||''; openModal('#lotModal');
}

$('#addLotBtn')?.addEventListener('click',()=>openLotForm());
$('#closeLotModal')?.addEventListener('click',()=>closeModal('#lotModal'));
$('#cancelLot')?.addEventListener('click',()=>closeModal('#lotModal'));
$('#lotForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const id=$('#lotId').value.trim(); const data={productId:$('#lotProduct').value,code:$('#lotCode').value.trim(),receivedQty:Number($('#lotReceived').value)||0,availableQty:Number($('#lotAvailable').value)||0,expiresAt:$('#lotExpires').value,note:$('#lotNote').value.trim()};
  try{await api(id?'/admin/lots/'+id:'/admin/lots',{method:id?'PUT':'POST',body:JSON.stringify(data)});closeModal('#lotModal');toast(id?'Lote atualizado ✓':'Lote criado ✓');await window.__isanomar.refresh();await renderStock();}catch(err){toast(err.message||'Erro ao guardar lote.');}
});


// ============================================================
// CATEGORIAS
// ============================================================

async function renderCats() {

  const box =
    $('#adminCats');

  box.innerHTML = '';

  const categories =
    S().categories || [];

  categories.forEach((category) => {

    const row =
      el('div', 'cat-row');

    const left =
      el('div', 'left');

    const name =
      document.createElement('span');

    name.textContent =
      category.name;

    left.appendChild(name);

    const deleteButton =
      document.createElement('button');

    deleteButton.className =
      'del';

    deleteButton.type =
      'button';

    deleteButton.innerHTML = '<i class="ph ph-trash"></i>';

    row.appendChild(left);
    row.appendChild(deleteButton);

    box.appendChild(row);

    deleteButton.onclick = () => {

      confirmModal(
        'Eliminar categoria',
        `Eliminar "${category.name}"? Os produtos continuam, mas ficam sem categoria.`,
        async () => {

          try {

            await api(
              '/admin/categories/' +
              encodeURIComponent(category.id),
              {
                method: 'DELETE'
              }
            );

            toast(
              'Categoria eliminada ✓'
            );

            await window.__isanomar.refresh();

            await renderCats();

          } catch (e) {

            toast(
              e?.message ||
              'Erro ao eliminar.'
            );
          }
        }
      );
    };
  });


  if (!categories.length) {
    box.innerHTML =
      '<p class="empty">Sem categorias.</p>';
  }
}


// ============================================================
// ADICIONAR CATEGORIA
// ============================================================

$('#addCatBtn').onclick = async () => {

  const name =
    $('#newCatInput')
      .value
      .trim();

  if (!name) {
    toast(
      'Digite o nome da categoria.'
    );

    return;
  }

  try {

    await api(
      '/admin/categories',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          emoji: ''
        })
      }
    );

    $('#newCatInput').value = '';

    toast(
      'Categoria adicionada ✓'
    );

    await window.__isanomar.refresh();

    if (window.__isanomarDashboard) {
      window.__isanomarDashboard.invalidateCache();
    }

    await renderCats();

  } catch (e) {

    toast(
      e?.message ||
      'Erro ao adicionar categoria.'
    );
  }
};


$('#newCatInput').addEventListener(
  'keydown',
  (e) => {

    if (e.key === 'Enter') {
      $('#addCatBtn').click();
    }

  }
);


// ============================================================
// ENCOMENDAS
// ============================================================

async function renderOrders() {

  const box =
    $('#adminOrders');

  box.innerHTML = '';

  try {

    const result =
      await api('/admin/orders');

    const orders =
      result.orders || [];

    if (!orders.length) {

      box.innerHTML =
        '<p class="empty">Sem encomendas.</p>';

      return;
    }


    orders.forEach((order) => {

      const row =
        el('div', 'order');


      // topo
      const top =
        el('div', 'o-top');

      const id =
        document.createElement('span');

      id.className =
        'o-id';

      id.textContent =
        order.id +
        ' ' +
        new Date(
          order.createdAt
        ).toLocaleDateString(
          'pt-PT'
        );


      const status =
        document.createElement('span');

      status.className =
        'status ' +
        esc(order.status);

      status.textContent =
        STATUS_LABEL[order.status] ||
        order.status;

      top.appendChild(id);
      top.appendChild(status);

      row.appendChild(top);


      // produtos
      const items =
        el('div', 'o-items');

      items.textContent =
        (order.items || [])
          .map(
            (item) =>
              `${item.qty}× ${item.name}`
          )
          .join(', ');

      row.appendChild(items);


      // total
      const total =
        el('div', 'o-total');

      total.textContent =
        fmt(order.total) +
        (
          order.install
            ? ` · ${order.install}x`
            : ''
        );

      row.appendChild(total);


      // pagamento + status
      const payment =
        el('div', 'o-pay');

      payment.appendChild(
        document.createTextNode(
          PAY_LABEL[order.method] ||
          order.method
        )
      );

      if (order.delivery) {
        payment.appendChild(document.createTextNode(` · Entrega: ${fmt(order.delivery)}`));
      }

      const payBadge = document.createElement('span');
      payBadge.className = 'status ' + (order.paymentStatus || 'pendente');
      payBadge.textContent = order.method === 'cod' ? 'Pagamento na entrega' : (order.paymentStatus === 'pago' ? 'Pago' : 'Pagamento pendente');
      payment.appendChild(payBadge);

      if (order.method !== 'cod' && order.method !== 'install' && order.paymentStatus !== 'pago') {
        const payBtn = el('button','btn btn-secondary btn-sm');
        payBtn.type='button'; payBtn.innerHTML='<i class="ph ph-check"></i> Confirmar pagamento';
        payBtn.onclick=async()=>{ try{ payBtn.disabled=true; await api('/admin/orders/'+encodeURIComponent(order.id)+'/payment',{method:'POST'}); toast('Pagamento confirmado ✓'); window.__isanomarDashboard?.invalidateCache(); await renderOrders(); } catch(e){toast(e.message||'Não foi possível confirmar o pagamento.');} finally{payBtn.disabled=false;} };
        payment.appendChild(payBtn);
      }

      const deliverySelect = document.createElement('select');
      deliverySelect.className='status-select';
      [[48,'48h'],[72,'72h']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;deliverySelect.appendChild(o);});
      deliverySelect.value=String(order.deliveryHours||72);
      deliverySelect.title='Prazo de entrega';
      payment.appendChild(deliverySelect);

      if (order.method === 'install' && order.installments?.length) {
        order.installments.forEach(inst=>{
          const ib=el('button','btn btn-ghost btn-sm'); ib.type='button'; ib.textContent=`${inst.number}ª ${inst.status==='paga'?'paga':'pendente'}`;
          if(inst.status!=='paga'){ ib.onclick=async()=>{try{ib.disabled=true;await api('/admin/installments/'+encodeURIComponent(order.id)+'/pay',{method:'POST',body:JSON.stringify({number:inst.number})});toast(`${inst.number}ª prestação registada ✓`);window.__isanomarDashboard?.invalidateCache();await renderOrders();}catch(e){toast(e.message||'Não foi possível registar.');}finally{ib.disabled=false;}}; }
          payment.appendChild(ib);
        });
      }

      const select =
        document.createElement('select');

      select.className =
        'status-select';

      [
        ['pendente', 'Pendente'],
        ['confirmado', 'Confirmado'],
        ['enviado', 'Enviado'],
        ['entregue', 'Entregue'],
        ['cancelado', 'Cancelado']
      ].forEach(
        ([value, label]) => {

          const option =
            document.createElement('option');

          option.value = value;
          option.textContent = label;

          select.appendChild(option);
        }
      );

      select.value =
        order.status;

      payment.appendChild(select);

      row.appendChild(payment);


      // cliente
      const meta =
        el('div', 'o-meta');

      meta.textContent =
        `👤 ${order.name} · ${order.phone} · ${order.province}` +
        (
          order.municipality
            ? ` · ${order.municipality}`
            : ''
        );

      row.appendChild(meta);


      // endereço
      const address =
        el('div', 'o-deliv');

      address.textContent =
        `📍 ${order.address}`;

      row.appendChild(address);


      box.appendChild(row);


      deliverySelect.onchange = async () => {
        try { deliverySelect.disabled=true; await api('/admin/orders/'+encodeURIComponent(order.id),{method:'PATCH',body:JSON.stringify({status:order.status,deliveryHours:Number(deliverySelect.value)})}); toast('Prazo actualizado ✓'); window.__isanomarDashboard?.invalidateCache(); } catch(e){ toast(e.message||'Não foi possível actualizar o prazo.'); deliverySelect.value=String(order.deliveryHours||72); } finally { deliverySelect.disabled=false; }
      };

      // alterar estado
      select.onchange =
        async () => {

          try {

            select.disabled = true;

            await api(
              '/admin/orders/' +
              encodeURIComponent(order.id),
              {
                method: 'PATCH',
                body: JSON.stringify({
                  status: select.value,
                  deliveryHours: Number(deliverySelect.value)
                })
              }
            );

            toast(
              'Estado atualizado ✓'
            );

            if (window.__isanomarDashboard) {
              window.__isanomarDashboard.invalidateCache();
            }

            await renderOrders();

          } catch (e) {

            toast(
              e?.message ||
              'Erro ao atualizar estado.'
            );

            select.disabled = false;
          }
        };
    });

  } catch (e) {

    console.error(
      'Erro nas encomendas:',
      e
    );

    box.innerHTML =
      '<p class="empty">Sessão expirada ou erro do servidor.</p>';

    toast(
      e?.message ||
      'Erro ao carregar encomendas.'
    );
  }

  await updateOrderBadge();
}


// ============================================================
// CLIENTES
// ============================================================

async function renderClients() {
  const box = $('#adminClients');
  if (!box) return;

  box.innerHTML = `
    <div class="dashboard-loading">
      <i class="ph ph-spinner-gap"></i>
      <span>A carregar clientes...</span>
    </div>
  `;

  try {
    const result = await api('/admin/orders');
    const orders = result.orders || [];

    if (!orders.length) {
      box.innerHTML = '<p class="empty">Sem clientes registados.</p>';
      return;
    }

    // Agrupar por telefone
    const clients = {};
    orders.forEach((order) => {
      const key = order.phone || '—';
      if (!clients[key]) {
        clients[key] = {
          name: order.name,
          phone: order.phone,
          province: order.province,
          municipality: order.municipality,
          address: order.address,
          orders: [],
          totalSpent: 0,
          lastOrder: null
        };
      }
      clients[key].orders.push(order);
      clients[key].totalSpent += Number(order.total) || 0;
      const d = new Date(order.createdAt);
      if (!clients[key].lastOrder || d > new Date(clients[key].lastOrder.createdAt)) {
        clients[key].lastOrder = order;
      }
    });

    const list = Object.values(clients).sort((a, b) => b.orders.length - a.orders.length);

    box.innerHTML = '';

    list.forEach((client) => {
      const card = el('div', 'client-card');

      const pending = client.orders.filter(o => o.status === 'pendente').length;
      const pendingBadge = pending ? `<span class="tab-badge" style="margin-left:8px">${pending}</span>` : '';

      let ordersHTML = '';
      client.orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .forEach((o) => {
          const date = new Date(o.createdAt).toLocaleDateString('pt-PT', {
            day: '2-digit', month: 'short'
          });
          ordersHTML += `
            <div class="client-order-row">
              <span class="client-order-id">${esc(o.id)}</span>
              <span>${date}</span>
              <span>${fmt(o.total)}</span>
              <span class="client-order-status ${esc(o.status)}">${STATUS_LABEL[o.status] || o.status}</span>
            </div>
          `;
        });

      if (client.orders.length > 3) {
        ordersHTML += `<div class="client-order-row" style="color:#6b7b8e;font-size:12px">+ ${client.orders.length - 3} encomenda(s) mais antiga(s)</div>`;
      }

      card.innerHTML = `
        <div class="client-header">
          <div class="client-avatar"><i class="ph ph-user"></i></div>
          <div>
            <div class="client-name">${esc(client.name)} ${pendingBadge}</div>
            <div class="client-phone">${esc(client.phone)} · ${esc(client.province)}${client.municipality ? ' · ' + esc(client.municipality) : ''}</div>
          </div>
        </div>
        <div class="client-meta">
          <span><strong>${client.orders.length}</strong> encomenda(s)</span>
          <span><strong>${fmt(client.totalSpent)}</strong> total</span>
          <span>Última: <strong>${new Date(client.lastOrder.createdAt).toLocaleDateString('pt-PT', {day:'2-digit',month:'short',year:'numeric'})}</strong></span>
        </div>
        <div class="client-orders">
          ${ordersHTML}
        </div>
      `;

      box.appendChild(card);
    });

  } catch (e) {
    console.error('Erro nos clientes:', e);
    box.innerHTML = '<p class="empty">Erro ao carregar clientes.</p>';
    toast(e?.message || 'Erro ao carregar clientes.');
  }
}


// ============================================================
// AUDITORIA
// ============================================================
async function renderAudit() {
  const box=$('#adminAudit'); if(!box) return;
  box.innerHTML='<div class="empty">A carregar actividade...</div>';
  try {
    const result=await api('/admin/audit?limit=100'); const logs=result.logs||[];
    if(!logs.length){box.innerHTML='<div class="empty">Ainda não existem registos de actividade.</div>';return;}
    box.innerHTML=logs.map(log=>`<div class="audit-row"><div class="audit-icon"><i class="ph ph-activity"></i></div><div class="audit-main"><strong>${esc(log.action)}</strong><span>${esc(log.entity)} ${esc(log.entityId)}</span><small>${esc(log.details||'')}</small></div><time>${new Date(log.createdAt).toLocaleString('pt-PT')}</time></div>`).join('');
  } catch(e) { box.innerHTML=`<div class="empty">${esc(e.message||'Erro ao carregar auditoria.')}</div>`; }
}

$('#refreshAuditBtn')?.addEventListener('click',renderAudit);

// ============================================================
// DEFINIÇÕES
// ============================================================

function renderSettings() {

  const settings =
    S().settings || {};

  $('#setShopName').value =
    settings.shopName || '';

  $('#setShopPhone').value =
    settings.phone || '';

  $('#setShopIban').value =
    settings.iban || '';

  $('#setMaxInstall').value =
    settings.maxInstall || 3;

  $('#setDelOther').value =
    settings.delivery?.other ?? 0;


  const box =
    $('#delList');

  box.innerHTML = '';


  const list =
    settings.delivery?.municipalities || [];


  list.forEach((municipality, index) => {

    const row =
      el('div', 'cat-row');


    // LEFT
    // --------------------------------------------------------
    // Esta variável estava em falta no teu código original.
    // --------------------------------------------------------

    const left =
      el('div', 'left');

    const name =
      document.createElement('span');

    name.textContent =
      municipality.name;

    left.appendChild(name);


    // RIGHT
    // --------------------------------------------------------

    const right =
      el('div', 'left');

    right.style.cssText =
      'gap:8px;align-items:center';


    // taxa
    const fee =
      document.createElement('input');

    fee.type =
      'number';

    fee.min =
      '0';

    fee.value =
      municipality.fee;

    fee.style.cssText =
      'width:100px;padding:8px;border-radius:10px;border:1px solid var(--line);font-size:14px';


    // eliminar
    const deleteButton =
      document.createElement('button');

    deleteButton.type =
      'button';

    deleteButton.innerHTML = '<i class="ph ph-trash"></i>';

    deleteButton.style.cssText =
      'border:none;background:none;color:var(--danger);font-size:17px;cursor:pointer';


    deleteButton.onclick =
      () => {

        list.splice(
          index,
          1
        );

        renderSettings();
      };


    fee.onchange =
      () => {

        list[index].fee =
          Number(fee.value) || 0;
      };


    right.appendChild(fee);
    right.appendChild(deleteButton);

    row.appendChild(left);
    row.appendChild(right);

    box.appendChild(row);
  });


  if (!list.length) {

    box.innerHTML =
      '<p class="empty">Nenhum município configurado.</p>';
  }
}


// ============================================================
// LER TAXAS DE ENTREGA
// ============================================================

function readDeliveryList() {

  const rows =
    [
      ...$('#delList').children
    ];

  return rows
    .map((row) => {

      const name =
        row
          .querySelector('.left span')
          ?.textContent
          ?.trim() || '';

      const input =
        row.querySelector('input');

      if (!name || !input) {
        return null;
      }

      return {
        name,
        fee:
          Number(input.value) || 0
      };
    })
    .filter(Boolean);
}


// ============================================================
// ADICIONAR MUNICÍPIO
// ============================================================

$('#addDelBtn').onclick = () => {

  const name =
    $('#newDelInput')
      .value
      .trim();

  const fee =
    Number(
      $('#newDelFee').value
    );


  if (!name) {

    toast(
      'Digite o nome do município.'
    );

    return;
  }

  if (!Number.isFinite(fee) || fee < 0) {

    toast(
      'Digite uma taxa válida.'
    );

    return;
  }


  if (!S().settings.delivery) {

    S().settings.delivery = {
      municipalities: [],
      other: 0
    };
  }

  if (!Array.isArray(
    S().settings.delivery.municipalities
  )) {

    S().settings.delivery.municipalities = [];
  }


  S()
    .settings
    .delivery
    .municipalities
    .push({
      name,
      fee
    });


  $('#newDelInput').value = '';
  $('#newDelFee').value = '';

  renderSettings();
};


// ============================================================
// GUARDAR DEFINIÇÕES
// ============================================================

$('#saveSettingsBtn').onclick =
  async () => {

    try {

      const payload = {

        shopName:
          $('#setShopName')
            .value
            .trim() ||
          'ISANOMAR store',

        phone:
          $('#setShopPhone')
            .value
            .trim(),

        iban:
          $('#setShopIban')
            .value
            .trim(),

        maxInstall:
          Math.max(
            1,
            Math.min(
              12,
              Number(
                $('#setMaxInstall').value
              ) || 3
            )
          ),

        delivery: {

          municipalities:
            readDeliveryList(),

          other:
            Math.max(
              0,
              Number(
                $('#setDelOther').value
              ) || 0
            )
        }
      };


      await api(
        '/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify(
            payload
          )
        }
      );


      await window.__isanomar.refresh();

      if (window.__isanomarDashboard) {
        window.__isanomarDashboard.invalidateCache();
      }

      toast(
        'Definições guardadas ✓'
      );

      renderSettings();

    } catch (e) {

      console.error(
        'Erro ao guardar definições:',
        e
      );

      toast(
        e?.message ||
        'Erro ao guardar definições.'
      );
    }
  };


// ============================================================
// CONFIRM MODAL
// ============================================================

let _cb = null;


function confirmModal(
  title,
  message,
  callback
) {

  $('#confirmTitle').textContent =
    title;

  $('#confirmMsg').textContent =
    message;

  _cb =
    callback;

  openModal(
    '#confirmModal'
  );
}


$('#confirmOk').onclick =
  async () => {

    closeModal(
      '#confirmModal'
    );

    if (_cb) {

      const callback =
        _cb;

      _cb = null;

      await callback();
    }
  };


$('#confirmCancel').onclick =
  () => {

    closeModal(
      '#confirmModal'
    );

    _cb = null;
  };


$('#confirmModal').addEventListener(
  'click',
  (e) => {

    if (
      e.target ===
      e.currentTarget
    ) {

      closeModal(
        '#confirmModal'
      );

      _cb = null;
    }
  }
);


// ============================================================
// EVENTO DO PAINEL
// ============================================================

window.addEventListener(
  'admin:render',
  render
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

// O painel só é renderizado quando o utilizador navega para admin
// via o evento admin:render disparado por app.js.
// Não inicializamos aqui para evitar condição de corrida
// com a verificação de sessão em app.js.

// Sincronização administrativa silenciosa. Nunca reconstrói a aba actual
// automaticamente, evitando perda de scroll, foco, formulários ou modais.
setInterval(async () => {
  if (!window.__isanomar?.isAdmin?.() || document.hidden) return;
  try {
    await updateOrderBadge();
  } catch (e) {
    console.warn('Sincronização administrativa:', e);
  }
}, 20000);
