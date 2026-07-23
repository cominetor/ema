/* ============================================================
   RetroScaffale — app logic (vanilla JS, no framework)
   State lives in localStorage; the UI is a two-view SPA driven
   by the URL hash so the phone/desktop back button works.
   ============================================================ */
(() => {
  "use strict";

  const STORE_KEY = "retroscaffale.v1";
  const STATES = ["missing", "owned", "wishlist"]; // tap cycle order
  const STATE_LABEL = {
    missing: "mancante",
    owned: "posseduto",
    wishlist: "wishlist",
  };

  // ---- persistence -------------------------------------------------------
  let data = load();
  // Persist the seed on first ever run so the collection exists on disk
  // immediately (before the user's first tap).
  try {
    if (!localStorage.getItem(STORE_KEY)) save();
  } catch (e) { /* storage unavailable — app still works in-memory */ }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted / unavailable — fall through to seed */ }
    return seed();
  }

  function seed() {
    return {
      consoles: SEED_CONSOLES.map((c) => ({
        id: uid(),
        name: c.name,
        color: c.color,
        games: c.games.map((t) => ({ id: uid(), title: t, status: "missing" })),
      })),
    };
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
      toast("Impossibile salvare: memoria del browser piena o disabilitata.");
    }
  }

  // ---- tiny helpers ------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const esc = (s) => s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  const view = $("#view");
  const backBtn = $("#backBtn");
  const topActions = $("#topActions");
  const contextBar = $("#contextBar");

  let editMode = false;
  let filter = "all"; // all | missing | wishlist

  // ---- SVG bits ----------------------------------------------------------
  const ICON = {
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4 10-11"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    all: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    missing: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  };

  function statusIndicator(status) {
    if (status === "owned") {
      return '<span class="status" aria-hidden="true"><svg viewBox="0 0 30 30">'
        + '<circle cx="15" cy="15" r="13" fill="var(--owned)"/>'
        + '<path d="M9 15.5l4 4 8-8.5" fill="none" stroke="#06251a" '
        + 'stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    }
    if (status === "wishlist") {
      return '<span class="status" aria-hidden="true"><svg viewBox="0 0 30 30">'
        + '<path d="M15 2.5l2.94 8.45 8.96.15-7.14 5.45 2.61 8.55L15 20l-7.33 5.1 '
        + '2.61-8.55-7.14-5.45 8.96-.15z" fill="var(--amber)" stroke="#3a2600" '
        + 'stroke-width="1" stroke-linejoin="round"/></svg></span>';
    }
    // missing — hollow, ghosted
    return '<span class="status" aria-hidden="true"><svg viewBox="0 0 30 30">'
      + '<circle cx="15" cy="15" r="12" fill="rgba(255,255,255,.03)" '
      + 'stroke="var(--ink-dim)" stroke-width="2.2"/></svg></span>';
  }

  // ---- progress ring -----------------------------------------------------
  function ring(color, owned, total, complete) {
    const R = 42;
    const C = 2 * Math.PI * R;
    const frac = total ? owned / total : 0;
    const offset = C * (1 - frac);
    const core = complete
      ? `<span class="dot">${ICON.check}</span>`
      : '<span class="dot"></span>';
    return `<div class="ring">
      <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle class="track" cx="50" cy="50" r="${R}" fill="none" stroke-width="9"/>
        <circle class="fill" cx="50" cy="50" r="${R}" fill="none" stroke-width="9"
          stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
      </svg>
      <div class="ring-core">${core}</div>
    </div>`;
  }

  const stat = (c) => {
    const owned = c.games.filter((g) => g.status === "owned").length;
    const wish = c.games.filter((g) => g.status === "wishlist").length;
    return { owned, wish, total: c.games.length };
  };

  // ---- routing -----------------------------------------------------------
  function route() {
    const m = location.hash.match(/^#\/c\/([^/]+)/);
    if (m) {
      const c = data.consoles.find((x) => x.id === m[1]);
      if (c) return renderConsole(c);
    }
    renderHome();
  }

  function go(hash) { location.hash = hash; }

  // ---- HOME --------------------------------------------------------------
  function renderHome() {
    editMode = false;
    backBtn.hidden = true;
    contextBar.hidden = true;
    contextBar.innerHTML = "";
    topActions.innerHTML = "";

    const editBtn = el(`<button class="icon-btn" aria-label="Modifica scaffale (aggiungi o rimuovi console)">${ICON.edit}</button>`);
    editBtn.addEventListener("click", () => {
      editMode = !editMode;
      editBtn.classList.toggle("active", editMode);
      editBtn.setAttribute("aria-pressed", String(editMode));
      renderShelf();
    });
    topActions.appendChild(editBtn);

    view.innerHTML = `<div class="wrap">
      <p class="page-title">Il tuo scaffale · ${data.consoles.length} console</p>
      <div class="shelf-grid" id="shelf"></div>
    </div>`;
    renderShelf();
    focusView();
  }

  function renderShelf() {
    const shelf = $("#shelf");
    shelf.innerHTML = "";

    data.consoles.forEach((c) => {
      const s = stat(c);
      const complete = s.total > 0 && s.owned === s.total;
      // No foreground counts on the cards — the ring is the at-a-glance
      // indicator. Numbers live only in the aria-label for screen readers.
      const sub = s.total === 0
        ? '<span class="cart-sub">vuota</span>'
        : (complete ? '<span class="cart-sub">completa</span>' : "");
      const card = el(`<button class="cart${complete ? " complete" : ""}${s.total === 0 ? " empty-console" : ""}"
        style="--c:${c.color}" aria-label="${esc(c.name)} — ${s.owned} di ${s.total} posseduti, ${s.wish} in wishlist. Apri la lista.">
        <div class="cart-label" style="background:${c.color}">
          <span class="cart-name">${esc(c.name)}</span>
          ${sub}
        </div>
        <div class="cart-body">${ring(c.color, s.owned, s.total, complete)}</div>
      </button>`);
      card.addEventListener("click", () => go("#/c/" + c.id));

      if (editMode) {
        const del = el(`<span class="del-badge" role="button" tabindex="0"
          aria-label="Rimuovi console ${esc(c.name)}">${ICON.close}</span>`);
        const remove = (ev) => {
          ev.stopPropagation();
          if (confirm(`Rimuovere la console "${c.name}" e tutti i suoi giochi?`)) {
            data.consoles = data.consoles.filter((x) => x.id !== c.id);
            save();
            renderHome();
          }
        };
        del.addEventListener("click", remove);
        del.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); remove(e); }
        });
        card.appendChild(del);
      }
      shelf.appendChild(card);
    });

    // add-console tile
    const add = el(`<button class="cart add-tile" aria-label="Aggiungi una console">
      <span class="plus" aria-hidden="true">+</span>
      <span class="lbl">Nuova console</span>
    </button>`);
    add.addEventListener("click", addConsole);
    shelf.appendChild(add);
  }

  function addConsole() {
    const name = (prompt("Nome della nuova console?") || "").trim();
    if (!name) return;
    const hue = Math.floor(Math.random() * 360);
    data.consoles.push({
      id: uid(), name, color: `hsl(${hue} 62% 58%)`, games: [],
    });
    save();
    renderShelf();
    toast(`Console "${name}" aggiunta.`);
  }

  // ---- CONSOLE DETAIL ----------------------------------------------------
  function renderConsole(c) {
    editMode = false;
    backBtn.hidden = false;
    backBtn.onclick = () => go("#/");

    topActions.innerHTML = "";
    const editBtn = el(`<button class="icon-btn" aria-label="Modifica giochi (rimuovi titoli)">${ICON.edit}</button>`);
    editBtn.addEventListener("click", () => {
      editMode = !editMode;
      editBtn.classList.toggle("active", editMode);
      editBtn.setAttribute("aria-pressed", String(editMode));
      drawList(c);
    });
    topActions.appendChild(editBtn);

    // filter segmented control lives in the context bar
    contextBar.hidden = false;
    contextBar.innerHTML = "";
    const s = stat(c);
    const head = el(`<span class="chip"><span class="swatch" style="background:${c.color}"></span>${esc(c.name)}</span>`);
    contextBar.appendChild(head);

    view.innerHTML = `<div class="wrap">
      <div class="toolbar" id="toolbar"></div>
      <ul class="game-list" id="list"></ul>
      <div class="add-row">
        <input id="newGame" type="text" placeholder="Aggiungi un gioco…"
          autocomplete="off" aria-label="Titolo del nuovo gioco">
        <button class="btn-primary" id="addGame">Aggiungi</button>
      </div>
      <div class="legend" aria-hidden="false">
        <span>${statusIndicator("missing")} Mancante</span>
        <span>${statusIndicator("owned")} Posseduto</span>
        <span>${statusIndicator("wishlist")} Wishlist</span>
      </div>
    </div>`;

    // filter toggles (icons only)
    const seg = el(`<div class="seg" role="group" aria-label="Filtra i giochi">
      <button data-f="all" aria-label="Mostra tutti" title="Tutti">${ICON.all}</button>
      <button data-f="missing" aria-label="Solo mancanti" title="Solo mancanti">${ICON.missing}</button>
      <button data-f="wishlist" aria-label="Solo wishlist" title="Solo wishlist">${ICON.star}</button>
    </div>`);
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-f]");
      if (!b) return;
      filter = b.dataset.f;
      updateSeg(seg);
      drawList(c);
    });
    const toolbar = $("#toolbar");
    toolbar.appendChild(seg);
    toolbar.appendChild(el('<span class="spacer"></span>'));
    toolbar.appendChild(el(`<span class="count-hint" id="hint"></span>`));
    updateSeg(seg);

    // add game handlers
    const input = $("#newGame");
    const addGame = () => {
      const title = input.value.trim();
      if (!title) return;
      c.games.push({ id: uid(), title, status: "missing" });
      input.value = "";
      save();
      drawList(c);
      input.focus();
    };
    $("#addGame").addEventListener("click", addGame);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") addGame(); });

    drawList(c);
    focusView();
  }

  function updateSeg(seg) {
    seg.querySelectorAll("button[data-f]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.f === filter));
    });
  }

  function drawList(c) {
    const list = $("#list");
    if (!list) return;
    list.innerHTML = "";

    const games = c.games.filter((g) => {
      if (filter === "missing") return g.status === "missing";
      if (filter === "wishlist") return g.status === "wishlist";
      return true;
    });

    const s = stat(c);
    const hint = $("#hint");
    if (hint) hint.textContent = `${s.owned}/${s.total}`;

    if (games.length === 0) {
      const msg = c.games.length === 0
        ? "Nessun gioco qui. Aggiungine uno qui sotto."
        : "Nessun gioco con questo filtro.";
      list.appendChild(el(`<li><div class="empty-state">
        <div class="big" aria-hidden="true">🕹️</div><p>${msg}</p></div></li>`));
      return;
    }

    games.forEach((g) => {
      const li = document.createElement("li");
      const btn = el(`<button class="game" data-status="${g.status}"
        aria-label="${esc(g.title)} — ${STATE_LABEL[g.status]}. Tocca per cambiare stato.">
        <span class="title">${esc(g.title)}</span>
        ${statusIndicator(g.status)}
      </button>`);
      btn.addEventListener("click", () => {
        const i = STATES.indexOf(g.status);
        g.status = STATES[(i + 1) % STATES.length];
        save();
        // update this row in place (keeps scroll position; respects filter)
        if (filter !== "all" && g.status !== filter && !(filter === "missing" && g.status === "missing")) {
          drawList(c);
        } else {
          btn.dataset.status = g.status;
          btn.setAttribute("aria-label",
            `${g.title} — ${STATE_LABEL[g.status]}. Tocca per cambiare stato.`);
          btn.querySelector(".status").outerHTML = statusIndicator(g.status);
          const h = $("#hint");
          const ns = stat(c);
          if (h) h.textContent = `${ns.owned}/${ns.total}`;
        }
      });
      li.appendChild(btn);

      if (editMode) {
        const del = el(`<button class="game-del" aria-label="Rimuovi ${esc(g.title)}">${ICON.trash}</button>`);
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          c.games = c.games.filter((x) => x.id !== g.id);
          save();
          drawList(c);
        });
        btn.after(del);
        // wrap row + delete in a flex line
        li.style.display = "flex";
        li.style.gap = "8px";
        li.style.alignItems = "stretch";
        btn.style.flex = "1 1 auto";
      }
      list.appendChild(li);
    });
  }

  // ---- misc UI -----------------------------------------------------------
  function focusView() {
    view.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---- PWA: install prompt ----------------------------------------------
  let deferredPrompt = null;
  const installBtn = $("#installBtn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener("appinstalled", () => { installBtn.hidden = true; });

  // ---- PWA: service worker ----------------------------------------------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* offline still ok on 2nd load */ });
    });
  }

  // ---- boot --------------------------------------------------------------
  window.addEventListener("hashchange", route);
  route();
})();
