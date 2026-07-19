/* PromptDeck — injects an AIPRM-style prompt dashboard natively into the
   ChatGPT / Claude new-chat screen, plus a tone/language/style bar above the
   composer. Auto-hides the dashboard once a conversation starts. */
(() => {
  "use strict";

  const LIB_ID = "promptdeck-library";
  const BAR_ID = "promptdeck-bar";
  const FAB_ID = "promptdeck-fab";
  const HOST = location.hostname;
  const PLATFORM = HOST.includes("claude") ? "claude" : "chatgpt";

  const LANGUAGES = [
    "English", "Bengali", "Hindi", "Spanish", "French", "German",
    "Portuguese", "Italian", "Arabic", "Chinese", "Japanese", "Russian",
  ];
  const TONES = [
    "Default", "Professional", "Friendly", "Casual", "Confident",
    "Persuasive", "Empathetic", "Witty", "Bold", "Formal",
  ];
  const STYLES = [
    "Default", "Descriptive", "Analytical", "Persuasive", "Narrative",
    "Technical", "Conversational", "Academic", "Creative",
  ];

  let PROMPTS = [];
  const state = {
    query: "", category: "All", model: "All", sort: "title",
    tab: "all", page: 1, perPage: 12,
    collapsed: false,
    favorites: new Set(),
    tone: "Default", language: "English", style: "Default",
    models: [], // real models detected from the page's model switcher
  };

  const MODEL_KEY = "models_" + PLATFORM;
  const MODEL_RE = /(gpt|o1|o3|o4|claude|sonnet|opus|haiku)/i;
  const CLAUDE_FAMILY_RE = /(claude|sonnet|opus|haiku)/i;

  // ---------- persistence ----------
  function loadPrefs() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(
          ["favorites", "tone", "language", "style", "collapsed", MODEL_KEY],
          (r) => {
            if (Array.isArray(r.favorites)) state.favorites = new Set(r.favorites);
            if (r.tone) state.tone = r.tone;
            if (r.language) state.language = r.language;
            if (r.style) state.style = r.style;
            if (typeof r.collapsed === "boolean") state.collapsed = r.collapsed;
            if (Array.isArray(r[MODEL_KEY])) state.models = r[MODEL_KEY];
            resolve();
          }
        );
      } catch (e) { resolve(); }
    });
  }
  function savePrefs() {
    try {
      chrome.storage.local.set({
        favorites: Array.from(state.favorites),
        tone: state.tone, language: state.language, style: state.style,
        collapsed: state.collapsed,
      });
    } catch (e) {}
  }

  // ---------- data ----------
  async function loadPrompts() {
    try {
      const res = await fetch(chrome.runtime.getURL("prompts.json"));
      PROMPTS = await res.json();
    } catch (e) { PROMPTS = []; }
    // Only hit a remote API if the user explicitly set one in the popup —
    // avoids a noisy localhost connection error when no server is running.
    try {
      const { apiUrl } = await chrome.storage.sync.get("apiUrl");
      if (apiUrl && /^https?:\/\//.test(apiUrl)) {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.prompts;
          if (Array.isArray(list) && list.length) { PROMPTS = list; render(); }
        }
      }
    } catch (e) { /* offline / bad URL — keep bundled prompts */ }
  }

  // ---------- environment detection ----------
  function findComposer() {
    return (
      document.querySelector("#prompt-textarea") ||
      document.querySelector('div[contenteditable="true"].ProseMirror') ||
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector("textarea")
    );
  }
  function findComposerForm() {
    const ta = findComposer();
    if (!ta) return null;
    return ta.closest("form") || ta.parentElement;
  }
  function inConversation() {
    return !!document.querySelector(
      '[data-message-author-role], [data-testid^="conversation-turn"], ' +
      '[data-testid="user-message"], .font-claude-message'
    );
  }
  function isDarkTheme() {
    try {
      const bg = getComputedStyle(document.body).backgroundColor;
      const m = bg && bg.match(/\d+/g);
      if (!m) return true;
      const [r, g, b] = m.map(Number);
      return 0.299 * r + 0.587 * g + 0.114 * b < 128;
    } catch (e) { return true; }
  }

  // ---------- insertion ----------
  function decorate(text) {
    const dir = [];
    if (state.language && state.language !== "English")
      dir.push(`write your ENTIRE response in ${state.language}`);
    if (state.tone && state.tone !== "Default")
      dir.push(`use a ${state.tone.toLowerCase()} tone`);
    if (state.style && state.style !== "Default")
      dir.push(`write in a ${state.style.toLowerCase()} writing style`);
    if (!dir.length) return text;
    // Put the directive FIRST as a high-priority instruction — trailing
    // directives after a long prompt are often ignored by the model.
    const head =
      `[INSTRUCTION — HIGHEST PRIORITY]: For your entire reply, ${dir.join(", ")}. ` +
      `This overrides any language or style implied by the task below.`;
    return `${head}\n\n---\n\n${text}`;
  }

  function insertPrompt(rawText) {
    const text = decorate(rawText);
    const el = findComposer();
    if (!el) {
      navigator.clipboard.writeText(text);
      toast("Composer not found — prompt copied to clipboard.");
      return;
    }
    // Hide the dashboard so the user sees the filled composer (AIPRM behaviour).
    state.collapsed = true; savePrefs(); render();
    el.focus();

    if (el.tagName === "TEXTAREA") {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, "value"
      ).set;
      setter.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      const sel = window.getSelection();
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.addRange(range);
      let ok = false;
      try { ok = document.execCommand("insertText", false, text); } catch (e) { ok = false; }
      if (!ok || el.innerText.trim() === "") {
        try {
          const dt = new DataTransfer();
          dt.setData("text/plain", text);
          el.dispatchEvent(new ClipboardEvent("paste", {
            clipboardData: dt, bubbles: true, cancelable: true,
          }));
          ok = true;
        } catch (e) { ok = false; }
      }
      if (!ok || el.innerText.trim() === "") {
        el.innerHTML = "";
        const p = document.createElement("p");
        p.textContent = text;
        el.appendChild(p);
        el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
      }
    }
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    toast("Prompt inserted ✨ — fill in the [BRACKETS] and send.");
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    let t = document.getElementById("promptdeck-toast");
    if (!t) { t = document.createElement("div"); t.id = "promptdeck-toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------- filtering ----------
  function categories() {
    return ["All", ...Array.from(new Set(PROMPTS.map((p) => p.category))).sort()];
  }
  // Read the model currently shown on the composer's model-switcher button.
  function currentModelFromButton() {
    const cands = document.querySelectorAll(
      'button[aria-haspopup], [data-testid*="model" i], button[aria-label*="model" i]'
    );
    for (const b of cands) {
      if (b.closest("#promptdeck-library, #promptdeck-bar")) continue;
      const t = (b.textContent || "").trim().split("\n")[0].trim();
      if (t && t.length <= 32 && MODEL_RE.test(t)) return t.replace(/\s+/g, " ");
    }
    return null;
  }

  // Persist and apply a detected model list.
  function saveModels(list) {
    const changed = JSON.stringify(list) !== JSON.stringify(state.models);
    state.models = list;
    try { chrome.storage.local.set({ [MODEL_KEY]: list }); } catch (e) {}
    if (changed && !state.collapsed) render();
  }

  // Scrape an open model menu (ChatGPT / Claude) for the real, plan-accurate
  // list of models. Runs opportunistically after clicks — no auto-clicking.
  // Extract just the model name from a menu item, ignoring any description
  // sub-label (e.g. "GPT-5.4" not "GPT-5.4 Leaving on July 23").
  function itemLabel(it) {
    for (const n of it.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent.trim();
        if (t && MODEL_RE.test(t)) return t.replace(/\s+/g, " ");
      }
    }
    let best = null;
    it.querySelectorAll("*").forEach((el) => {
      if (el.children.length === 0) {
        const t = (el.textContent || "").trim();
        if (t && MODEL_RE.test(t) && (!best || t.length < best.length)) best = t;
      }
    });
    if (best) return best.replace(/\s+/g, " ");
    return (it.textContent || "").trim().split("\n")[0].trim();
  }

  function scanForModelMenu() {
    const menus = document.querySelectorAll(
      '[role="menu"],[role="listbox"],[data-radix-menu-content]'
    );
    for (const menu of menus) {
      if (menu.closest("#promptdeck-library, #promptdeck-bar")) continue;
      const items = menu.querySelectorAll(
        '[role="menuitem"],[role="menuitemradio"],[role="option"],button,a,li'
      );
      const names = [];
      items.forEach((it) => {
        const t = itemLabel(it);
        if (t && t.length <= 24 && MODEL_RE.test(t)) names.push(t);
      });
      const uniq = [...new Set(names)];
      if (uniq.length >= 2) { saveModels(uniq); return uniq; }
    }
    return null;
  }

  function modelList() {
    if (state.models.length) return ["All", ...state.models];
    const cur = currentModelFromButton();
    return cur ? ["All", cur] : ["All"];
  }
  function filteredAll() {
    const q = state.query.trim().toLowerCase();
    let list = PROMPTS.filter((p) => {
      if (state.tab === "favorites" && !state.favorites.has(p.id)) return false;
      if (state.category !== "All" && p.category !== state.category) return false;
      if (state.model !== "All") {
        // Match by model family, since prompts are tagged generically
        // (GPT-4o / Claude / o3) rather than by exact chat model version.
        const wantClaude = CLAUDE_FAMILY_RE.test(state.model);
        const tags = (p.models || []).map((m) => m.toLowerCase());
        const ok = wantClaude
          ? tags.some((t) => CLAUDE_FAMILY_RE.test(t))
          : tags.some((t) => !CLAUDE_FAMILY_RE.test(t));
        if (!ok) return false;
      }
      if (!q) return true;
      return [p.title, p.description, p.subcategory, (p.tags || []).join(" ")]
        .join(" ").toLowerCase().includes(q);
    });
    list.sort((a, b) => {
      if (state.sort === "category") return (a.category + a.title).localeCompare(b.category + b.title);
      if (state.sort === "author") return a.author.localeCompare(b.author);
      return a.title.localeCompare(b.title);
    });
    return list;
  }

  // ---------- escaping ----------
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }
  function opt(v, sel, label) {
    return `<option value="${esc(v)}"${v === sel ? " selected" : ""}>${esc(label || v)}</option>`;
  }

  // ---------- mounting ----------
  function ensureFloat(id) {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("div"); el.id = id; document.body.appendChild(el); }
    return el;
  }

  function mount() {
    // Library → first child of <main> (native, in-flow). Fallback: body.
    let lib = document.getElementById(LIB_ID);
    if (!lib) { lib = document.createElement("div"); lib.id = LIB_ID; }
    const main = document.querySelector("main");
    if (main) {
      if (lib.parentElement !== main || main.firstElementChild !== lib)
        main.insertBefore(lib, main.firstChild);
    } else if (!lib.parentElement) {
      document.body.appendChild(lib);
    }

    // Tone/style bar → directly above the composer.
    let bar = document.getElementById(BAR_ID);
    if (!bar) { bar = document.createElement("div"); bar.id = BAR_ID; }
    const form = findComposerForm();
    if (form && form.parentElement && bar.nextElementSibling !== form) {
      form.parentElement.insertBefore(bar, form);
    } else if (!bar.parentElement) {
      document.body.appendChild(bar);
    }

    return { lib, bar, fab: ensureFloat(FAB_ID) };
  }

  // ---------- render ----------
  function render() {
    const { lib, bar, fab } = mount();
    const dark = isDarkTheme();
    const themeCls = dark ? "pd-dark" : "pd-light";
    const convo = inConversation();

    // Drop a stale model selection if the detected list no longer has it.
    if (state.model !== "All" && !modelList().includes(state.model))
      state.model = "All";

    // Floating toggle (always available)
    fab.className = themeCls;
    fab.innerHTML = `<button class="pd-fab-btn" data-act="toggle">
      <span class="pd-fab-dot"></span> ${state.collapsed ? "◈ Prompts" : "Hide Prompts"}
    </button>`;
    fab.querySelector("[data-act=toggle]").onclick = () => {
      state.collapsed = !state.collapsed; savePrefs(); render();
    };

    // Composer bar
    bar.className = themeCls;
    bar.innerHTML = `
      <div class="pd-bar-inner">
        <div class="pd-bar-field"><span>Output in</span>
          <select data-o="language">${LANGUAGES.map((l) => opt(l, state.language)).join("")}</select>
        </div>
        <div class="pd-bar-field"><span>Tone</span>
          <select data-o="tone">${TONES.map((t) => opt(t, state.tone)).join("")}</select>
        </div>
        <div class="pd-bar-field"><span>Writing Style</span>
          <select data-o="style">${STYLES.map((s) => opt(s, state.style)).join("")}</select>
        </div>
        <button class="pd-bar-open" data-act="open">${state.collapsed ? "◈ Browse Prompts" : "◈ Prompts"}</button>
      </div>`;
    ["language", "tone", "style"].forEach((key) =>
      bar.querySelectorAll(`[data-o=${key}]`).forEach((el) => (el.onchange = (e) => {
        state[key] = e.target.value; savePrefs();
      }))
    );
    bar.querySelector("[data-act=open]").onclick = () => {
      state.collapsed = false; savePrefs(); render();
    };

    // Library
    lib.className = `${themeCls} ${state.collapsed ? "pd-hidden" : convo ? "pd-float" : "pd-embed"}`;
    if (state.collapsed) { lib.innerHTML = ""; return; }

    const all = filteredAll();
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * state.perPage;
    const pageItems = all.slice(start, start + state.perPage);

    lib.innerHTML = `
      <div class="pd-inner">
        <div class="pd-head">
          <div class="pd-title"><span class="pd-logo">◈</span> PromptDeck
            <span class="pd-sub">for ${PLATFORM === "claude" ? "Claude" : "ChatGPT"}</span></div>
          <button class="pd-x" data-act="close" title="Hide">✕</button>
        </div>
        <div class="pd-tabs">
          <button class="pd-tab ${state.tab === "all" ? "active" : ""}" data-tab="all">✦ All Prompts</button>
          <button class="pd-tab ${state.tab === "favorites" ? "active" : ""}" data-tab="favorites">★ Favorites (${state.favorites.size})</button>
        </div>
        <div class="pd-filters">
          <label>Topic<select data-f="category">${categories().map((c) => opt(c, state.category)).join("")}</select></label>
          <label>Model<select data-f="model">${modelList().map((m) => opt(m, state.model)).join("")}${modelList().length <= 1 ? '<option value="All" disabled>— open your model menu to sync —</option>' : ""}</select></label>
          <label>Sort by<select data-f="sort">
            ${opt("title", state.sort, "Title A–Z")}${opt("category", state.sort, "Category")}${opt("author", state.sort, "Author")}
          </select></label>
          <label>Per page<select data-f="perPage">
            ${[12, 24, 48].map((n) => opt(String(n), String(state.perPage))).join("")}
          </select></label>
          <label class="pd-search-wrap">Search<input data-f="query" placeholder="Search ${PROMPTS.length} prompts…" value="${esc(state.query)}" /></label>
        </div>
        <div class="pd-meta">
          <span>Showing ${total ? start + 1 : 0}–${Math.min(start + state.perPage, total)} of ${total} prompts</span>
          <div class="pd-pager">
            <button class="pd-pg" data-pg="prev" ${state.page <= 1 ? "disabled" : ""}>Prev</button>
            <span>${state.page} / ${pages}</span>
            <button class="pd-pg" data-pg="next" ${state.page >= pages ? "disabled" : ""}>Next</button>
          </div>
        </div>
        <div class="pd-grid">
          ${pageItems.length ? pageItems.map(card).join("") : `<div class="pd-empty">No prompts match your filters.</div>`}
        </div>
      </div>`;
    wire(lib);
  }

  function card(p) {
    const fav = state.favorites.has(p.id);
    return `
      <div class="pd-card">
        <button class="pd-star ${fav ? "on" : ""}" data-fav="${esc(p.id)}" title="Favorite">${fav ? "★" : "☆"}</button>
        <div class="pd-card-cat">${esc(p.category)} / ${esc(p.subcategory || "")}</div>
        <div class="pd-card-title">${esc(p.title)}</div>
        <div class="pd-card-author">by ${esc(p.author)}</div>
        <div class="pd-card-desc">${esc(p.description || "")}</div>
        <div class="pd-card-models">${(p.models || []).map((m) => `<span>${esc(m)}</span>`).join("")}</div>
        <button class="pd-use" data-use="${esc(p.id)}">Use prompt →</button>
      </div>`;
  }

  function wire(lib) {
    const q = (s) => lib.querySelectorAll(s);
    q("[data-act=close]").forEach((b) => (b.onclick = () => { state.collapsed = true; savePrefs(); render(); }));
    q("[data-tab]").forEach((b) => (b.onclick = () => { state.tab = b.getAttribute("data-tab"); state.page = 1; render(); }));

    const bind = (key, isNum) =>
      q(`[data-f=${key}]`).forEach((el) => {
        const ev = el.tagName === "INPUT" ? "oninput" : "onchange";
        el[ev] = (e) => {
          state[key] = isNum ? parseInt(e.target.value, 10) : e.target.value;
          state.page = 1;
          if (key === "query") renderGridOnly(); else render();
        };
      });
    bind("category"); bind("model"); bind("sort"); bind("perPage", true); bind("query");

    q("[data-pg]").forEach((b) => (b.onclick = () => {
      state.page += b.getAttribute("data-pg") === "prev" ? -1 : 1; render();
    }));
    q("[data-fav]").forEach((b) => (b.onclick = () => toggleFav(b.getAttribute("data-fav"))));
    q("[data-use]").forEach((b) => (b.onclick = () => {
      const p = PROMPTS.find((x) => x.id === b.getAttribute("data-use"));
      if (p) insertPrompt(p.prompt);
    }));
  }

  function toggleFav(id) {
    if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    savePrefs(); render();
  }

  function renderGridOnly() {
    const lib = document.getElementById(LIB_ID);
    const grid = lib && lib.querySelector(".pd-grid");
    const meta = lib && lib.querySelector(".pd-meta span");
    if (!grid) return render();
    const all = filteredAll();
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * state.perPage;
    const pageItems = all.slice(start, start + state.perPage);
    grid.innerHTML = pageItems.length ? pageItems.map(card).join("") : `<div class="pd-empty">No prompts match your filters.</div>`;
    if (meta) meta.textContent = `Showing ${total ? start + 1 : 0}–${Math.min(start + state.perPage, total)} of ${total} prompts`;
    grid.querySelectorAll("[data-use]").forEach((b) => (b.onclick = () => {
      const p = PROMPTS.find((x) => x.id === b.getAttribute("data-use"));
      if (p) insertPrompt(p.prompt);
    }));
    grid.querySelectorAll("[data-fav]").forEach((b) => (b.onclick = () => toggleFav(b.getAttribute("data-fav"))));
  }

  // ---------- boot ----------
  let raf;
  function scheduleRender() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => render());
  }

  async function boot() {
    await loadPrefs();
    await loadPrompts();
    render();

    // Sync the real model list from the page's own model switcher. We never
    // auto-open menus; we just read whatever menu the user opens (reflecting
    // their exact plan — premium sees all models, free sees theirs).
    scanForModelMenu();
    document.addEventListener(
      "click",
      () => setTimeout(scanForModelMenu, 220),
      true
    );

    // ChatGPT/Claude are SPAs that re-render the main area and composer often.
    // Re-mount whenever our anchors go missing or the route changes.
    const obs = new MutationObserver(() => {
      if (
        !document.getElementById(LIB_ID) ||
        !document.getElementById(BAR_ID) ||
        !document.getElementById(FAB_ID) ||
        (document.querySelector("main") &&
          document.getElementById(LIB_ID) &&
          document.getElementById(LIB_ID).parentElement !== document.querySelector("main"))
      ) {
        scheduleRender();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) { lastPath = location.pathname; scheduleRender(); }
    }, 700);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
