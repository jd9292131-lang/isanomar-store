// ============================================================
// ISANOMAR store
// APP.JS — iOS MOBILE UI
// ============================================================

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];

const el = (tag, className = "", text = "") => {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text) {
    node.textContent = text;
  }

  return node;
};


const { api } = window.isaApi;


// ============================================================
// LOCAL STORAGE
// ============================================================

const loadLocal = (key, fallback) => {
  try {
    return JSON.parse(
      localStorage.getItem(key) ||
      JSON.stringify(fallback)
    );
  } catch {
    return fallback;
  }
};


const saveLocal = (key, value) => {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
};


// ============================================================
// FORMATADORES
// ============================================================

const fmt = (value) => {

  return new Intl.NumberFormat("pt-AO", {
    maximumFractionDigits: 0
  }).format(
    Number(value) || 0
  ) + " Kz";

};


function esc(value) {

  const div = document.createElement("div");

  div.textContent =
    value ?? "";

  return div.innerHTML;
}


function genreLabel(genre) {

  if (genre === "f") {
    return "Feminino";
  }

  if (genre === "m") {
    return "Masculino";
  }

  return "Unissexo";
}

function getCategoryIcon(name) {
  const map = {
    'acessórios': 'ph-watch',
    'acessorios': 'ph-watch',
    'relógios': 'ph-watch',
    'relogios': 'ph-watch',
    'bolsas': 'ph-handbag',
    'calçado': 'ph-sneaker',
    'calcado': 'ph-sneaker',
    'roupas': 'ph-t-shirt',
    'vestuário': 'ph-t-shirt',
    'vestuario': 'ph-t-shirt',
    'camisas': 'ph-t-shirt',
    't-shirts': 'ph-t-shirt',
    'calças': 'ph-pants',
    'calcas': 'ph-pants',
    'perfumes': 'ph-drop',
    'cosméticos': 'ph-sparkle',
    'cosmeticos': 'ph-sparkle',
    'beleza': 'ph-sparkle',
    'maquilhagem': 'ph-sparkle',
    'joias': 'ph-diamond',
    'bijuteria': 'ph-diamond',
    'eletrônicos': 'ph-device-mobile',
    'eletronicos': 'ph-device-mobile',
    'telemóveis': 'ph-device-mobile',
    'telefones': 'ph-device-mobile',
    'masculino': 'ph-user',
    'feminino': 'ph-user',
    'unissexo': 'ph-users',
    'promoções': 'ph-percent',
    'promocoes': 'ph-percent',
    'novidades': 'ph-star',
    'destaques': 'ph-star',
    'relogios': 'ph-watch',
    'sapatos': 'ph-sneaker',
    'oculos': 'ph-sunglasses',
    'óculos': 'ph-sunglasses',
    'cintos': 'ph-belt',
    'carteiras': 'ph-wallet',
    'chapeus': 'ph-hard-hats',
    'chapéus': 'ph-hard-hats',
    'bones': 'ph-hard-hats',
    'bonés': 'ph-hard-hats',
    'meias': 'ph-sock',
    'luvas': 'ph-hand',
    'cachecois': 'ph-scarf',
    'cachecóis': 'ph-scarf',
    'brincos': 'ph-earrings',
    'colares': 'ph-necklace',
    'pulseiras': 'ph-bracelet',
    'aneis': 'ph-ring',
    'anéis': 'ph-ring',
  };
  const key = (name || '').toLowerCase().trim();
  return map[key] || 'ph-squares-four';
}


// ============================================================
// ESTADO
// ============================================================

let products = [];
let categories = [];
let settings = {};

let cart =
  loadLocal(
    "isanomar_cart",
    []
  );

let orderIds =
  loadLocal(
    "isanomar_order_ids",
    []
  );

let adminSession = false;


let currentView = "home";

let selectedProduct = null;

let payMethod = "cod";

let currentDelivery = 0;


const state = {

  filterCat: "",

  filterGenre: "",

  search: ""

};


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {

  shopName:
    "ISANOMAR store",

  phone:
    "+244 930 806 413",

  iban:
    "",

  maxInstall:
    3,

  delivery: {

    municipalities: [],

    other: 5000

  }

};


// ============================================================
// PAGAMENTOS
// ============================================================

const PAY = [

  {
    id: "cod",

    emoji: "💰",

    icon: "ph-hand-coins",

    title:
      "Pagamento na entrega",

    sub:
      "Pague em kwanzas quando receber"

  },

  {
    id: "express",

    emoji: "📲",

    icon: "ph-bank",

    title:
      "MULTICAIXA Express",

    sub:
      "Pagamento imediato — referência copiada"

  },

  {
    id: "transfer",
    emoji: "🏦",
    icon: "ph-bank",
    title: "Transferência bancária",
    sub: "IBAN / conta bancária da loja"
  },

  {
    id: "install",

    emoji: "📆",

    icon: "ph-calendar-check",

    title:
      "Pagamento por prestações",

    sub:
      "Compre agora e pague em partes"

  }

];


// ============================================================
// STATUS
// ============================================================

const PAY_LABEL = {

  cod:
    "Pagamento na entrega",

  express:
    "MULTICAIXA Express",

  transfer:
    "Transferência bancária",

  install:
    "Prestações"

};


const STATUS_LABEL = {

  pendente:
    "Pendente",

  confirmado:
    "Confirmado",

  enviado:
    "Enviado",

  entregue:
    "Entregue",

  cancelado:
    "Cancelado"

};


// ============================================================
// TOAST
// ============================================================

function toast(message) {

  const node =
    $("#toast");

  if (!node) {
    return;
  }

  const span =
    node.querySelector("span");

  if (span) {
    span.textContent = message;
  }

  node.classList.add("show");

  clearTimeout(
    toast.timer
  );

  toast.timer =
    setTimeout(() => {

      node.classList.remove(
        "show"
      );

    }, 2700);

}


// ============================================================
// CATEGORIA
// ============================================================

function catName(id) {

  return (
    categories.find(
      c => c.id === id
    )?.name ||
    id ||
    "Sem categoria"
  );

}


// ============================================================
// MEDIA
// ============================================================

function mediaHTML(product) {

  if (product.img) {

    return `
      <img
        class="img"
        src="${esc(product.img)}"
        alt="${esc(product.name)}"
        loading="lazy"
        onerror="
          this.outerHTML =
          '<div class=\'imgph\'><i class=\'ph ph-image\'></i></div>'
        "
      >
    `;

  }

  return `
    <div class="imgph">
      <i class="ph ph-image"></i>
    </div>
  `;

}


// ============================================================
// STORE
// ============================================================

let storeSignature = '';
let storeSyncInFlight = false;

function computeStoreSignature(data) {
  return JSON.stringify({
    products: data?.products || [],
    categories: data?.categories || [],
    settings: data?.settings || {}
  });
}

function canRefreshVisibleUI() {
  if (document.hidden) return false;
  const active = document.activeElement;
  if (active && ['INPUT','TEXTAREA','SELECT'].includes(active.tagName)) return false;
  if (active?.isContentEditable) return false;
  if (document.querySelector('.modal.open, .drawer.open')) return false;
  return true;
}

async function loadStore({ render = true, silent = false, force = false } = {}) {
  if (storeSyncInFlight) return false;
  storeSyncInFlight = true;

  try {
    const data = await api('/store');
    const nextSignature = computeStoreSignature(data);
    const changed = force || nextSignature !== storeSignature;

    products = data.products || [];
    categories = data.categories || [];
    settings = {
      ...DEFAULT_SETTINGS,
      ...(data.settings || {})
    };

    cart = cart.filter(item => {
      const fresh = products.find(p => p.id === item.id);
      if (!fresh) return false;
      item.stock = Number(fresh.stock || 0);
      if (item.qty > item.stock) item.qty = item.stock;
      return item.qty > 0;
    });
    saveLocal('isanomar_cart', cart);
    updateCartUI();
    storeSignature = nextSignature;

    // O sincronismo em segundo plano NUNCA reconstrói a página que o cliente
    // está a ler. Isso evita saltos de scroll, perda de foco e fecho de modais.
    if (render && !silent && (changed || force) && canRefreshVisibleUI()) {
      renderHome();
      if (currentView === 'catalog') renderCatalog();
      if (currentView === 'orders') await renderOrders();
      if (currentView === 'checkout') refreshDelivery();
    }

    return changed;
  } catch (error) {
    console.error('Sincronização da loja:', error);
    if (!silent) toast('Não foi possível actualizar a loja.');
    return false;
  } finally {
    storeSyncInFlight = false;
  }
}


// ============================================================
// NAVIGATION
// ============================================================

function closeDrawer() {

  $("#drawer")
    ?.classList.remove(
      "open"
    );

  $("#drawerOverlay")
    ?.classList.remove(
      "open"
    );

}


function go(view, data = null) {

  currentView =
    view;

  const viewEls = {

    home:
      $("#view-home"),

    catalog:
      $("#view-catalog"),

    product:
      $("#view-product"),

    cart:
      $("#view-cart"),

    checkout:
      $("#view-checkout"),

    orders:
      $("#view-orders"),

    admin:
      $("#view-admin")

  };


  Object.entries(
    viewEls
  ).forEach(
    ([key, node]) => {

      if (!node) {
        return;
      }

      node.classList.toggle(
        "active",
        key === view
      );

    }
  );


  $$(".drawer-link[data-view]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.view ===
        view
      );

    });


  $$(".bottom-nav-item[data-view]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.view ===
        view
      );

    });


  closeDrawer();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  switch (view) {

    case "home":
      renderHome();
      break;

    case "catalog":
      renderCatalog();
      break;

    case "product":
      renderProduct(data);
      break;

    case "cart":
      renderCart();
      break;

    case "checkout":
      renderCheckout();
      break;

    case "orders":
      renderOrders();
      break;

    case "admin":
      renderAdmin();
      break;

  }

}


// ============================================================
// CART
// ============================================================

function cartCount() {

  return cart.reduce(
    (total, item) =>
      total + item.qty,
    0
  );

}


function cartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      (
        Number(item.price) *
        Number(item.qty)
      ),
    0
  );

}


function updateCartUI() {

  const count =
    cartCount();


  const cartCountNode =
    $("#cartCount");

  if (cartCountNode) {

    cartCountNode.hidden =
      !count;

    cartCountNode.textContent =
      count;

  }


  const drawerCount =
    $("#drawerCartCount");

  if (drawerCount) {

    drawerCount.textContent =
      count;

  }


  const bottomCount =
    $("#bottomCartCount");

  if (bottomCount) {

    bottomCount.hidden =
      !count;

    bottomCount.textContent =
      count;

  }


  const catalogCount =
    $("#catalogCartCount");

  if (catalogCount) {

    catalogCount.textContent =
      count;

  }


  const pageCount =
    $("#cartPageCount");

  if (pageCount) {

    pageCount.textContent =
      count;

  }

}


// ============================================================
// PRODUCT CARD
// ============================================================

function addProductToCart(product, qty=1) {
  const current = cart.find(i => i.id === product.id);
  const next = (current?.qty || 0) + qty;
  if (next > Number(product.stock || 0)) { toast(`Stock disponível: ${product.stock || 0}`); return false; }
  if (current) current.qty = next;
  else cart.push({id:product.id,name:product.name,price:product.price,qty,stock:product.stock});
  saveLocal("isanomar_cart", cart); updateCartUI(); toast(`${product.name} adicionado ao carrinho.`); return true;
}

function productCard(product) {
  const card = el("article", "card");
  card.innerHTML = `
    <div class="product-media-wrap">
      ${mediaHTML(product)}
      <button class="product-add-btn" type="button" aria-label="Adicionar ${esc(product.name)} ao carrinho"><i class="ph ph-plus"></i></button>
      <span class="stock-pill">${Number(product.stock)||0} disponíveis</span>
    </div>
    <div class="body">
      <div class="gender">${esc(genreLabel(product.genre))}</div>
      <div class="name">${esc(product.name)}</div>
      <div class="price">${fmt(product.price)}</div>
      <div class="cat-lab">${esc(catName(product.catId))}</div>
    </div>`;
  card.addEventListener("click", () => go("product", product));
  card.querySelector('.product-add-btn')?.addEventListener('click', e => { e.stopPropagation(); addProductToCart(product,1); });
  return card;
}


// ============================================================
// HOME
// ============================================================

function renderHome() {

  const categoryBox =
    $("#homeCategories");

  if (categoryBox) {

    categoryBox.innerHTML =
      "";

    categories
      .forEach(category => {

        const tile =
          el(
            "button",
            "cat-tile"
          );

        const iconClass = getCategoryIcon(category.name);
        tile.innerHTML = `

          <span class="cat-icon">
            <i class="ph ${esc(iconClass)}"></i>
          </span>

          <span class="name">
            ${esc(
              category.name
            )}
          </span>

        `;


        tile.addEventListener(
          "click",
          () => {

            state.filterCat =
              category.id;

            go(
              "catalog"
            );

          }
        );


        categoryBox.appendChild(
          tile
        );

      });

  }


  const featured =
    $("#featuredGrid");

  if (!featured) {
    return;
  }

  featured.innerHTML =
    "";


  products
    .slice(0, 6)
    .forEach(product => {

      featured.appendChild(
        productCard(
          product
        )
      );

    });

}


// ============================================================
// FILTER PRODUCTS
// ============================================================

function filteredProducts() {

  let list =
    products.slice();


  if (
    state.filterCat
  ) {

    list =
      list.filter(
        product =>
          product.catId ===
          state.filterCat
      );

  }


  if (
    state.filterGenre
  ) {

    list =
      list.filter(
        product =>
          product.genre ===
            state.filterGenre ||
          product.genre ===
            "unisex"
      );

  }


  const query =
    state.search
      .trim()
      .toLowerCase();


  if (query) {

    list =
      list.filter(
        product => {

          const text = [

            product.name,

            catName(
              product.catId
            ),

            product.desc || ""

          ]
            .join(" ")
            .toLowerCase();


          return text.includes(
            query
          );

        }
      );

  }


  return list;

}


// ============================================================
// CATALOG
// ============================================================

function renderCatalog() {

  const categoryChips =
    $("#catChips");

  if (!categoryChips) {
    return;
  }


  categoryChips.innerHTML =
    "";


  const allCategory =
    el(
      "button",
      "chip" +
      (
        state.filterCat
          ? ""
          : " active"
      ),
      "Todos"
    );


  allCategory.addEventListener(
    "click",
    () => {

      state.filterCat =
        "";

      renderCatalog();

    }
  );


  categoryChips.appendChild(
    allCategory
  );


  categories
    .forEach(category => {

      const chip =
        el(
          "button",
          "chip" +
          (
            state.filterCat ===
            category.id
              ? " active"
              : ""
          ),
          category.name
        );


      chip.addEventListener(
        "click",
        () => {

          state.filterCat =
            category.id;

          renderCatalog();

        }
      );


      categoryChips.appendChild(
        chip
      );

    });


  const genreChips =
    $("#genChips");


  if (genreChips) {

    genreChips.innerHTML =
      "";


    [
      ["", "Todos"],
      ["f", "Feminino"],
      ["m", "Masculino"]
    ]
      .forEach(
        ([value, label]) => {

          const chip =
            el(
              "button",
              "chip" +
              (
                state.filterGenre ===
                value
                  ? " active"
                  : ""
              ),
              label
            );


          chip.addEventListener(
            "click",
            () => {

              state.filterGenre =
                value;

              renderCatalog();

            }
          );


          genreChips.appendChild(
            chip
          );

        }
      );

  }


  const list =
    filteredProducts();


  const grid =
    $("#catalogGrid");


  if (grid) {

    grid.innerHTML =
      "";

    list.forEach(
      product =>
        grid.appendChild(
          productCard(
            product
          )
        )
    );

  }


  const empty =
    $("#catalogEmpty");

  if (empty) {

    empty.hidden =
      list.length >
      0;

  }


  const count =
    $("#catalogResultCount");

  if (count) {

    count.textContent =
      `${list.length} ${
        list.length === 1
          ? "produto"
          : "produtos"
      }`;

  }


  const clear =
    $("#searchClear");

  if (clear) {

    clear.hidden =
      !state.search;

  }

}


// ============================================================
// PRODUCT DETAIL
// ============================================================

function renderProduct(product) {

  if (!product) {
    go("catalog");
    return;
  }


  selectedProduct =
    product;


  const box =
    $("#view-product");


  box.innerHTML = `

    <div class="detail">

      <button
        class="btn-back detail-back"
        id="backCatalog"
        aria-label="Voltar"
      >
        <i class="ph ph-arrow-left"></i>
      </button>


      ${mediaHTML(product)}


      <div class="detail-head">

        <div class="titles">

          <div class="gender">

            ${esc(
              genreLabel(
                product.genre
              )
            )}

            ·

            ${esc(
              catName(
                product.catId
              )
            )}

          </div>


          <h2>
            ${esc(
              product.name
            )}
          </h2>


          <div class="price-lg">
            ${fmt(
              product.price
            )}
          </div>

        </div>

      </div>


      <p class="desc">
        ${esc(
          product.desc ||
          "Sem descrição disponível."
        )}
      </p>


      <div class="qty-row">

        <button
          class="qty-btn"
          id="qMinus"
        >
          −
        </button>

        <span
          class="qty-val"
          id="qVal"
        >
          1
        </span>

        <button
          class="qty-btn"
          id="qPlus"
        >
          +
        </button>

      </div>


      <button
        class="btn btn-primary btn-block"
        id="addToCart"
      >

        <i class="ph ph-shopping-bag"></i>

        Adicionar ao carrinho

      </button>

    </div>

  `;


  let quantity = 1;


  $("#backCatalog")
    .addEventListener(
      "click",
      () => go("catalog")
    );


  $("#qMinus")
    .addEventListener(
      "click",
      () => {

        if (
          quantity > 1
        ) {

          quantity--;

          $("#qVal")
            .textContent =
            quantity;

        }

      }
    );


  $("#qPlus")
    .addEventListener(
      "click",
      () => {

        if (quantity >= Number(product.stock || 0)) { toast(`Stock disponível: ${product.stock || 0}`); return; }

        quantity++;

        $("#qVal")
          .textContent =
          quantity;

      }
    );


  $("#addToCart")
    .addEventListener(
      "click",
      () => {
        addProductToCart(product, quantity);
      }
    );
}