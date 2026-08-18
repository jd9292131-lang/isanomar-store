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

        const existing =
          cart.find(
            item =>
              item.id ===
              product.id
          );


        if (existing) {

          existing.qty +=
            quantity;

        } else {

          cart.push({

            id:
              product.id,

            name:
              product.name,

            price:
              product.price,

            img:
              product.img,

            emoji:
              product.emoji,

            qty:
              quantity

          });

        }


        saveLocal(
          "isanomar_cart",
          cart
        );


        updateCartUI();


        toast(
          "Produto adicionado ao carrinho."
        );

      }
    );

}


// ============================================================
// CART
// ============================================================

function renderCart() {

  const box =
    $("#cartItems");

  if (!box) {
    return;
  }


  box.innerHTML =
    "";


  const empty =
    $("#cartEmpty");

  const summary =
    $("#cartSummary");


  const hasItems =
    cart.length >
    0;


  empty.hidden =
    hasItems;


  summary.hidden =
    !hasItems;


  cart.forEach(
    (item, index) => {

      const row =
        el(
          "div",
          "cart-item"
        );


      row.innerHTML = `

        ${
          item.img

            ? `
              <img
                src="${esc(item.img)}"
                alt="${esc(item.name)}"
              >
            `

            : `
              <div class="thumb">
                <i class="ph ph-image"></i>
              </div>
            `
        }


        <div class="info">

          <div class="name">
            ${esc(
              item.name
            )}
          </div>

          <div class="price">
            ${fmt(
              item.price
            )}
          </div>


          <div class="controls">

            <button
              class="mini-qty"
              data-action="minus"
              data-index="${index}"
            >
              −
            </button>


            <span class="q">
              ${item.qty}
            </span>


            <button
              class="mini-qty"
              data-action="plus"
              data-index="${index}"
            >
              +
            </button>

          </div>

        </div>


        <button
          class="remove"
          data-remove="${index}"
          aria-label="Remover produto"
        >
          <i class="ph ph-trash"></i>
        </button>

      `;


      box.appendChild(
        row
      );

    }
  );


  box
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.index
            );


          if (
            button.dataset.action ===
            "plus"
          ) {

            cart[index].qty++;

          } else {

            if (
              cart[index].qty >
              1
            ) {

              cart[index].qty--;

            } else {

              cart.splice(
                index,
                1
              );

            }

          }


          saveLocal(
            "isanomar_cart",
            cart
          );


          updateCartUI();

          renderCart();

        }
      );

    });


  box
    .querySelectorAll(
      "[data-remove]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.remove
            );


          cart.splice(
            index,
            1
          );


          saveLocal(
            "isanomar_cart",
            cart
          );


          updateCartUI();

          renderCart();


          toast(
            "Produto removido."
          );

        }
      );

    });


  $("#cartSubtotal")
    .textContent =
    fmt(
      cartTotal()
    );


  $("#cartTotal")
    .textContent =
    fmt(
      cartTotal()
    );

}


// ============================================================
// DELIVERY
// ============================================================

function municipalityFee(
  name
) {

  return (
    settings.delivery
      ?.municipalities
      ?.find(
        item =>
          item.name ===
          name
      )?.fee ||
    0
  );

}


function computeDelivery() {
  const subtotal = cartTotal();
  return subtotal > 0 ? Math.round(subtotal * 0.07) : 0;
}


function refreshDelivery() {

  currentDelivery =
    computeDelivery();


  const province =
    $("#provinceSelect")
      ?.value;


  const note =
    $("#deliveryNote");


  if (!note) {
    return;
  }


  note.innerHTML = `

    <strong>
      Taxa de entrega
    </strong>

    <span>
      ${
        currentDelivery
          ? fmt(
              currentDelivery
            )
          : "—"
      }
    </span>

    <br><small>Calculada automaticamente: 7% do valor dos produtos.</small>


    <div class="tot">

      <span>
        Total
      </span>

      <b>
        ${fmt(
          cartTotal() +
          currentDelivery
        )}
      </b>

    </div>

  `;


  const checkoutTotal =
    $("#checkoutTotal");


  if (checkoutTotal) {

    checkoutTotal.textContent =
      fmt(
        cartTotal() +
        currentDelivery
      );

  }

}


// ============================================================
// MUNICIPALITIES
// ============================================================

function populateMunicipalities() {

  const select =
    $("#munSelect");


  if (!select) {
    return;
  }


  select.innerHTML = `

    <option value="">
      Selecionar município...
    </option>

  `;


  // Usar municípios do servidor (settings); fallback só se vazio
  let municipalities =
    settings.delivery
      ?.municipalities || [];


  if (!municipalities.length) {
    municipalities = [
      { name: 'Luanda (Ingombota, Maianga, Rangel, Sambizanga, Samba, Kilamba-Kiaxi, Cazenga, Neves Bendinha)', fee: 1500 },
      { name: 'Belas (Benfica, Lar do Patriota, Ramiros)', fee: 2000 },
      { name: 'Talatona (Nova Vida, Talatona)', fee: 2500 },
      { name: 'Viana', fee: 3500 },
      { name: 'Cacuaco', fee: 3500 }
    ];
  }


  municipalities
    .forEach(
      municipality => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          municipality.name;


        option.textContent =
          `${municipality.name} — ${
            fmt(
              municipality.fee
            )
          }`;


        select.appendChild(
          option
        );

      }
    );

}


// ============================================================
// INSTALLMENT
// ============================================================

function installExtrasHTML(total) {
  const amount = Math.floor(Number(total || 0) / 3);
  const last = Number(total || 0) - amount * 2;
  return `
    <div class="pay-extras-box installment-plan">
      <strong>Plano obrigatório de 3 prestações</strong>
      <div class="installment-line"><span>1ª prestação — hoje</span><b>${fmt(amount)}</b></div>
      <div class="installment-line"><span>2ª prestação — +30 dias</span><b>${fmt(amount)}</b></div>
      <div class="installment-line"><span>3ª prestação — +60 dias</span><b>${fmt(last)}</b></div>
      <small>A 1ª prestação é obrigatória para activar a encomenda. O operador regista o pagamento antes de avançar com a encomenda.</small>
    </div>`;
}


// ============================================================
// CHECKOUT
// ============================================================

function renderCheckout() {

  if (
    !cart.length
  ) {

    go("cart");

    return;

  }


  $("#provinceSelect").value = "";
  $("#munSelect").value = "";


  const payBox =
    $("#payOptions");


  payBox.innerHTML =
    "";


  PAY.forEach(
    method => {

      const option =
        el(
          "div",
          "pay-opt" +
          (
            payMethod ===
            method.id
              ? " selected"
              : ""
          )
        );


      option.innerHTML = `

        <div class="radio"></div>

        <div class="pay-icon">
          <i class="ph ${method.icon}"></i>
        </div>

        <div class="txt">

          <strong>
            ${esc(
              method.title
            )}
          </strong>

          <small>
            ${esc(
              method.sub
            )}
          </small>

        </div>

      `;


      option.addEventListener(
        "click",
        () => {

          payMethod =
            method.id;

          renderCheckout();

        }
      );


      payBox.appendChild(
        option
      );

    }
  );


  const extras =
    $("#payExtras");

  if (payMethod === "express") {
    extras.innerHTML = `
      <div class="pay-extras-box">
        <strong>Pagamento por MULTICAIXA Express</strong><br>
        O sistema irá gerar a referência da encomenda. Copie os dados e abra o MULTICAIXA Express após confirmar.
        <div class="payment-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="copyPaymentData"><i class="ph ph-copy"></i> Copiar dados</button>
          <button type="button" class="btn btn-primary btn-sm" id="openMulticaixa"><i class="ph ph-device-mobile"></i> Abrir MULTICAIXA Express</button>
        </div>
      </div>`;
    const paymentText = () => `ISANOMAR STORE\nValor: ${fmt(cartTotal())}\nIBAN/Conta: ${settings.iban || "—"}\nContacto: ${settings.phone || "—"}`;
    $("#copyPaymentData")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(paymentText()); toast("Dados de pagamento copiados."); } catch { toast("Não foi possível copiar automaticamente."); } });
    $("#openMulticaixa")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(paymentText()); } catch {} try { window.location.href = "intent://#Intent;package=com.sibsint.mcxwallet;scheme=android-app;end"; } catch {} });
  } else if (payMethod === "transfer") {
    extras.innerHTML = `
      <div class="pay-extras-box">
        <strong>Transferência bancária</strong><br>
        Titular: <b>${esc(settings.shopName)}</b><br>
        IBAN/Conta: <b>${esc(settings.iban || "—")}</b><br>
        A referência e o valor final serão copiados depois de criar a encomenda.
        <div class="payment-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="copyBankInfo"><i class="ph ph-copy"></i> Copiar dados</button>
        </div>
      </div>`;
    $("#copyBankInfo")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(`ISANOMAR STORE\nIBAN/Conta: ${settings.iban || "—"}\nContacto: ${settings.phone || "—"}`); toast("Dados bancários copiados."); } catch {} });
  } else if (payMethod === "install") {
    extras.innerHTML = installExtrasHTML(cartTotal());
  } else {
    extras.innerHTML = "";
  }

  refreshDelivery();

}


// ============================================================
// SUBMIT ORDER
// ============================================================

async function submitOrder(
  event
) {

  event.preventDefault();


  if (
    !cart.length
  ) {

    go("cart");

    return;

  }


  const form =
    event.target;


  const name =
    form.name.value.trim();

  const phone =
    form.phone.value.trim();

  const province =
    form.province.value;

  const municipality =
    form.municipality.value;

  const address =
    form.address.value.trim();


  if (
    !name ||
    !phone ||
    !province ||
    !address
  ) {

    toast(
      "Preencha todos os dados."
    );

    return;

  }


  if (!municipality) { toast("Informe o município."); return; }


  const install = payMethod === "install" ? 3 : null;


  const payload = {

    name,

    phone,

    province,

    municipality,

    address,

    method:
      payMethod,

    install,

    items:
      cart.map(
        item => ({
          id:
            item.id,

          qty:
            item.qty
        })
      )

  };



  const button =
    $("#placeOrderBtn");


  button.disabled =
    true;


  button.innerHTML = `

    <i class="ph ph-spinner-gap"></i>

    A registar...

  `;


  try {

    const response =
      await api(
        "/orders",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const order =
      response.order;


    orderIds.unshift(
      order.id
    );


    saveLocal(
      "isanomar_order_ids",
      orderIds
    );


    cart =
      [];


    saveLocal(
      "isanomar_cart",
      cart
    );


    updateCartUI();


    toast("Encomenda registada com sucesso.");

    if (payMethod === "express") {
      const paymentText = `ISANOMAR STORE\nReferência: ${order.id}\nValor: ${fmt(order.total)}\nIBAN/Conta: ${settings.iban || "—"}\nContacto: ${settings.phone || "—"}`;
      try { await navigator.clipboard.writeText(paymentText); toast("Referência e valor copiados."); } catch {}
      setTimeout(() => { try { window.location.href = "intent://#Intent;package=com.sibsint.mcxwallet;scheme=android-app;end"; } catch {} }, 150);
    }

    if (payMethod === "transfer") {
      const paymentText = `ISANOMAR STORE\nReferência: ${order.id}\nValor: ${fmt(order.total)}\nIBAN/Conta: ${settings.iban || "—"}\nContacto: ${settings.phone || "—"}`;
      try { await navigator.clipboard.writeText(paymentText); toast("Referência e dados bancários copiados."); } catch {}
    }

    if (payMethod === "install") {
      const first = response.payment?.firstInstallment || order.installments?.[0]?.amount || 0;
      const paymentText = `ISANOMAR STORE\nReferência: ${order.id}\n1ª prestação: ${fmt(first)}\nIBAN/Conta: ${settings.iban || "—"}\nContacto: ${settings.phone || "—"}`;
      try { await navigator.clipboard.writeText(paymentText); toast("Dados da 1ª prestação copiados."); } catch {}
    }

    await updateClientOrderBadge();
    go("orders");


  } catch (error) {

    console.error(error);

    toast(
      error.message ||
      "Erro ao registar encomenda."
    );

  } finally {

    button.disabled =
      false;


    button.innerHTML = `

      <i class="ph ph-check-circle"></i>

      Confirmar encomenda

    `;

  }

}


// ============================================================
// CLIENT ORDER BADGE
// ============================================================

async function updateClientOrderBadge() {
  if (!orderIds.length) {
    $('#clientOrdersBadge')?.setAttribute('hidden', '');
    $('#bottomOrdersBadge')?.setAttribute('hidden', '');
    return;
  }

  try {
    const response = await api(
      '/orders?ids=' + encodeURIComponent(orderIds.join(','))
    );
    const orders = response.orders || [];

    // Verificar se há encomendas criadas ou alteradas depois da última visualização
    const lastSeenAt = Number(localStorage.getItem('isanomar_orders_seen_at') || '0');
    let unseenCount = 0;

    orders.forEach((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      // Se a encomenda foi criada ou alterada depois da última vez que o cliente viu
      if (orderTime > lastSeenAt) {
        unseenCount++;
      }
    });

    const drawerBadge = $('#clientOrdersBadge');
    const bottomBadge = $('#bottomOrdersBadge');

    if (drawerBadge) {
      drawerBadge.textContent = unseenCount;
      drawerBadge.hidden = unseenCount === 0;
    }
    if (bottomBadge) {
      bottomBadge.textContent = unseenCount;
      bottomBadge.hidden = unseenCount === 0;
    }

  } catch (e) {
    // silencioso
  }
}

function markOrdersAsSeen() {
  const seen = {};
  // Não podemos aceder directamente às orders aqui, vamos guardar os IDs actuais
  // e quando renderOrders carregar, marca como visto
  // Em vez disso, vamos usar uma flag simples: quando o cliente abre a view orders,
  // guardamos o timestamp. Se a encomenda foi criada ou alterada depois desse timestamp, é nova.
  localStorage.setItem('isanomar_orders_seen_at', Date.now().toString());
  $('#clientOrdersBadge')?.setAttribute('hidden', '');
  $('#bottomOrdersBadge')?.setAttribute('hidden', '');
}

// ============================================================
// ORDERS
// ============================================================

async function renderOrders() {

  markOrdersAsSeen();

  const box =
    $("#ordersList");

  const empty =
    $("#ordersEmpty");


  if (!box) {
    return;
  }


  box.innerHTML =
    "";


  empty.hidden =
    true;


  if (
    !orderIds.length
  ) {

    empty.hidden =
      false;

    return;

  }


  try {

    const response =
      await api(
        "/orders?ids=" +
        encodeURIComponent(
          orderIds.join(",")
        )
      );


    const orders =
      response.orders ||
      [];


    orders.sort(
      (a, b) =>
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
    );


    if (
      !orders.length
    ) {

      empty.hidden =
        false;

      return;

    }


    orders.forEach(
      order => {

        const row =
          el(
            "article",
            "order"
          );


        const items =
          order.items
            .map(
              item =>
                `${item.qty}× ${item.name}`
            )
            .join(", ");


        row.innerHTML = `

          <div class="o-top">

            <span class="o-id">
              ${esc(
                order.id
              )}
            </span>

            <span
              class="
                status
                ${esc(
                  order.status
                )}
              "
            >
              ${
                STATUS_LABEL[
                  order.status
                ] ||
                order.status
              }
            </span>

          </div>


          <div class="o-items">
            ${esc(
              items
            )}
          </div>


          <div class="o-total">

            ${fmt(
              order.total
            )}

            ${
              order.install
                ? ` · ${order.install}x`
                : ""
            }

          </div>


          <div class="o-pay">
            ${PAY_LABEL[order.method] || esc(order.method)}
            ${order.delivery ? ` · Entrega: ${fmt(order.delivery)}` : ""}
            ${order.paymentStatus && order.method !== 'cod' ? ` · ${order.paymentStatus === 'pago' ? 'Pago' : 'Pagamento pendente'}` : ''}
            ${order.deliveryHours ? ` · Prazo: ${order.deliveryHours}h` : ''}
          </div>


          <div class="o-meta">

            ${esc(
              order.name
            )}

            ·

            ${esc(
              order.phone
            )}

            ·

            ${esc(
              order.province
            )}

            ${
              order.municipality
                ? ` · ${esc(
                    order.municipality
                  )}`
                : ""
            }

          </div>


          <div class="o-deliv">

            <i class="ph ph-map-pin"></i>

            ${esc(
              order.address
            )}

          </div>

        `;


        box.appendChild(
          row
        );

      }
    );


  } catch (error) {

    console.error(error);

    empty.hidden =
      false;

    toast(
      "Não foi possível carregar as encomendas."
    );

  }

}


// ============================================================
// ADMIN
// ============================================================

function renderAdmin() {

  window.dispatchEvent(
    new CustomEvent(
      "admin:render"
    )
  );

}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

  const input =
    $("#searchInput");

  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    event => {

      state.search =
        event.target.value;

      renderCatalog();

    }
  );


  $("#searchClear")
    ?.addEventListener(
      "click",
      () => {

        input.value =
          "";

        state.search =
          "";

        renderCatalog();

        input.focus();

      }
    );

}


// ============================================================
// RESET FILTERS
// ============================================================

function resetFilters() {

  state.filterCat =
    "";

  state.filterGenre =
    "";

  state.search =
    "";


  const input =
    $("#searchInput");

  if (input) {
    input.value =
      "";
  }


  renderCatalog();

}


// ============================================================
// DRAWER
// ============================================================

function setupDrawer() {

  $("#menuBtn")
    ?.addEventListener(
      "click",
      () => {

        $("#drawer")
          .classList.add(
            "open"
          );

        $("#drawerOverlay")
          .classList.add(
            "open"
          );

      }
    );


  $("#drawerClose")
    ?.addEventListener(
      "click",
      closeDrawer
    );


  $("#drawerOverlay")
    ?.addEventListener(
      "click",
      closeDrawer
    );





  // Sobre Nós
  $("#drawerSobreBtn")
    ?.addEventListener(
      "click",
      () => {

        closeDrawer();

        window.location.href = "sobre.html";

      }
    );


  // WhatsApp
  $("#drawerContactBtn")
    ?.addEventListener(
      "click",
      () => {

        closeDrawer();

        window.open(
          "https://wa.me/244930806413",
          "_blank"
        );

      }
    );


  // Email
  $("#drawerEmailBtn")
    ?.addEventListener(
      "click",
      () => {

        closeDrawer();

        window.location.href = "mailto:isanomarstore@gmail.com";

      }
    );


  // Termos e condições
  $("#drawerTermsBtn")
    ?.addEventListener(
      "click",
      () => {

        closeDrawer();

        window.location.href = "termo.html";

      }
    );

}


// ============================================================
// NAV BUTTONS
// ============================================================

function setupNavigation() {

  $$("[data-view]")
    .forEach(
      element => {

        element.addEventListener(
          "click",
          () => {

            const view =
              element.dataset.view;


            if (!view) {
              return;
            }


            go(view);

          }
        );

      }
    );


  $("#cartBtn")
    ?.addEventListener(
      "click",
      () =>
        go("cart")
    );


  $("#checkoutBtn")
    ?.addEventListener(
      "click",
      () =>
        go("checkout")
    );


  $("#checkoutBack")
    ?.addEventListener(
      "click",
      () =>
        go("cart")
    );

}


// ============================================================
// CHECKOUT EVENTS
// ============================================================

function setupCheckout() {
  $("#provinceSelect")?.addEventListener("change", refreshDelivery);
  $("#munSelect")?.addEventListener("input", refreshDelivery);
  $("#checkoutForm")?.addEventListener("submit", submitOrder);
}


// ============================================================
// ADMIN PASSWORD
// ============================================================

function setupAdminPassword() {

  $("#toggleAdminPass")
    ?.addEventListener(
      "click",
      () => {

        const input =
          $("#adminPass");

        if (!input) {
          return;
        }


        const isPassword =
          input.type ===
          "password";


        input.type =
          isPassword
            ? "text"
            : "password";


        const icon =
          $("#toggleAdminPass")
            .querySelector(
              "i"
            );


        if (icon) {

          icon.className =
            isPassword
              ? "ph ph-eye-slash"
              : "ph ph-eye";

        }

      }
    );

}


// ============================================================
// ACESSO SECRETO AO PAINEL (5 toques rápidos no logo)
// ============================================================

function setupAdminSecret() {

  let tapCount = 0;
  let tapTimer = null;

  const secretTargets = [
    $(".brand"),
    $(".drawer-brand")
  ];

  secretTargets.forEach(target => {

    if (!target) {
      return;
    }

    target.addEventListener(
      "click",
      () => {

        tapCount++;

        clearTimeout(tapTimer);

        tapTimer = setTimeout(
          () => {
            tapCount = 0;
          },
          2000
        );

        if (tapCount >= 9) {

          tapCount = 0;
          clearTimeout(tapTimer);

          go("admin");

        }

      }
    );

  });

}


// ============================================================
// ADMIN SESSION
// ============================================================

function isAdmin() {

  return adminSession;

}


window.__isanomar = {

  isAdmin,

  setAdmin: (
    value,
    token
  ) => {

    adminSession =
      value;


    if (token) {

      localStorage.setItem(
        "isanomar_admin_token",
        token
      );

    }


    if (!value) {

      localStorage.removeItem(
        "isanomar_admin_token"
      );

    }

  },


  store: {

    get products() {
      return products;
    },

    set products(value) {
      products =
        value;
    },


    get categories() {
      return categories;
    },

    set categories(value) {
      categories =
        value;
    },


    get settings() {
      return settings;
    },

    set settings(value) {
      settings =
        value;
    },


    get orders() {
      return [];
    },

    set orders(value) {
      // Mantido para compatibilidade
    },


    saveProducts:
      async () => {
        products =
          products;
      },


    saveCategories:
      async () => {
        categories =
          categories;
      },


    saveSettings:
      async () => {
        settings =
          settings;
      },


    saveOrders:
      async () => {},


    fmt,

    go,

    // Compatibilidade: módulos antigos podem pedir refresh através de store.
    refresh:
      loadStore

  },


  refresh:
    loadStore

};


// ============================================================
// INITIALIZATION
// ============================================================

function setupTheme() {
  const saved = localStorage.getItem('isanomar_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  const btn = $("#themeToggle");
  const paint = () => { if(btn) btn.innerHTML = `<i class="ph ${document.documentElement.dataset.theme === 'dark' ? 'ph-sun' : 'ph-moon'}"></i>`; };
  paint();
  btn?.addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem('isanomar_theme', next); paint(); });
}

const HERO_SLIDES = [
  {eyebrow:'NOVA EXPERIÊNCIA',title:'Elegância que inspira.',sub:'Descubra acessórios e produtos selecionados para elevar o seu estilo.',icon:'ph-sparkle'},
  {eyebrow:'ENTREGA SIMPLES',title:'Escolha. Encomende. Receba.',sub:'A taxa de entrega é calculada automaticamente em 7% do valor dos produtos.',icon:'ph-truck'},
  {eyebrow:'PAGAMENTO FLEXÍVEL',title:'Pague como preferir.',sub:'Pagamento na entrega, transferência e prestações em 3 fases.',icon:'ph-wallet'}
];
let heroIndex = 0;
function rotateHero() { const hero=document.querySelector('.hero'); if(!hero) return; const slide=HERO_SLIDES[heroIndex%HERO_SLIDES.length]; const eyebrow=hero.querySelector('.hero-eyebrow'); const h1=hero.querySelector('h1'); const p=hero.querySelector('.hero-content p'); const icon=hero.querySelector('.hero-visual i'); if(eyebrow) eyebrow.innerHTML=`<i class="ph ${slide.icon}"></i> ${slide.eyebrow}`; if(h1) h1.innerHTML=`${slide.title}<span> Qualidade que encanta.</span>`; if(p) p.textContent=slide.sub; if(icon) icon.className=`ph ${slide.icon}`; heroIndex++; }

function setupAutoRefresh() {
  // Sincronização silenciosa: consulta os dados sem reconstruir a interface.
  // A interface só é actualizada quando o utilizador pede/volta à página e
  // não está a editar, a escrever ou com um modal aberto.
  const sync = () => loadStore({ render: false, silent: true });
  setInterval(sync, 20000);
  window.addEventListener('focus', () => loadStore({ render: true, silent: true }));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadStore({ render: true, silent: true });
  });
}

async function init() {

  setupTheme();
  setupAutoRefresh();
  setInterval(rotateHero, 6000);

  setupNavigation();

  setupDrawer();

  setupSearch();

  setupCheckout();

  setupAdminPassword();

  setupAdminSecret();

  setupTerms();

  setupCookies();


  $("#filterReset")
    ?.addEventListener(
      "click",
      resetFilters
    );


  $("#catalogEmptyReset")
    ?.addEventListener(
      "click",
      resetFilters
    );


  await loadStore();


  const token = localStorage.getItem("isanomar_admin_token");

  if (token) {

    try {

      await api(
        "/admin/me"
      );

      adminSession = true;

    } catch {

      adminSession = false;

      localStorage.removeItem(
        "isanomar_admin_token"
      );

    }

  }


  updateCartUI();

  await updateClientOrderBadge();

  go("home");

}


init();


// ============================================================
// TERMS ACCEPTANCE
// ============================================================

function setupTerms() {

  const accepted = localStorage.getItem("isanomar_terms_accepted");

  if (accepted) {
    return;
  }


  const overlay = $("#termsOverlay");

  if (!overlay) {
    return;
  }


  overlay.classList.add("open");

  document.body.style.overflow = "hidden";


  $("#termsAccept")
    ?.addEventListener(
      "click",
      () => {

        localStorage.setItem(
          "isanomar_terms_accepted",
          "true"
        );


        overlay.classList.remove("open");

        document.body.style.overflow = "";

      }
    );


  $("#termsDecline")
    ?.addEventListener(
      "click",
      () => {

        toast(
          "Precisa aceitar os termos para continuar."
        );

      }
    );

}


// ============================================================
// COOKIE CONSENT
// ============================================================

function setupCookies() {

  const consent = localStorage.getItem("isanomar_cookie_consent");

  if (consent) {
    return;
  }


  const banner = $("#cookieBanner");

  if (!banner) {
    return;
  }


  // Mostrar após 2 segundos
  setTimeout(
    () => {

      banner.classList.add("show");

    },
    2000
  );


  $("#cookieAccept")
    ?.addEventListener(
      "click",
      () => {

        localStorage.setItem(
          "isanomar_cookie_consent",
          "true"
        );


        banner.classList.remove("show");

      }
    );

}