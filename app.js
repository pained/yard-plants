(function () {
  "use strict";

  const cfg = window.YARD_CONFIG;
  const app = document.getElementById("app");
  const state = { plants: [], source: "", query: "", yard: "all", year: "all" };

  // ---------- data ----------

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function liveUrl(tab) {
    return "https://docs.google.com/spreadsheets/d/" + cfg.sheetId +
      "/gviz/tq?tqx=out:csv&headers=1&sheet=" + encodeURIComponent(tab);
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + url);
    const text = await res.text();
    // A sheet that isn't shared returns a Google sign-in page instead of CSV.
    if (/^\s*</.test(text)) throw new Error("not CSV: " + url);
    return text;
  }

  function cleanNumber(v) {
    return String(v).trim().replace(/\.0+$/, "");
  }

  function toPlants(rows, yard) {
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (re) => header.findIndex((h) => re.test(h));
    const iNum = col(/number|^#|^no/);
    const iName = col(/name/);
    const iYear = col(/year|planted/);
    const iDetails = col(/detail|info|note/);
    return rows.slice(1)
      .map((r) => ({
        yard: yard.key,
        yardLabel: yard.label,
        number: cleanNumber(r[iNum] || ""),
        name: (r[iName] || "").trim(),
        year: cleanNumber(r[iYear] || ""),
        details: (r[iDetails] || "").trim(),
      }))
      .filter((p) => p.number && (p.name || p.year || p.details));
  }

  async function loadYard(yard) {
    try {
      return { rows: parseCSV(await fetchText(liveUrl(yard.tab))), live: true };
    } catch (err) {
      console.warn("Live sheet unavailable, using snapshot:", err.message);
      return { rows: parseCSV(await fetchText(yard.snapshot)), live: false };
    }
  }

  async function load() {
    const results = await Promise.all(cfg.yards.map(loadYard));
    state.plants = results.flatMap((r, i) => toPlants(r.rows, cfg.yards[i]));
    state.source = results.every((r) => r.live) ? "live" : "snapshot";
  }

  // ---------- helpers ----------

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const displayName = (p) => p.name || "Unnamed plant";
  const detailParts = (p) => p.details.split(";").map((s) => s.trim()).filter(Boolean);
  const sunOf = (p) => detailParts(p).find((s) => /sun|shade/i.test(s) && s.length <= 40) || "";
  const yardOf = (key) => cfg.yards.find((y) => y.key === key);
  const plantHref = (p) => "#/plant/" + p.yard + "/" + encodeURIComponent(p.number);
  const sheetUrl = "https://docs.google.com/spreadsheets/d/" + cfg.sheetId + "/edit";

  function years() {
    const set = new Set(state.plants.map((p) => p.year).filter(Boolean));
    return [...set].sort((a, b) => (isNaN(a) ? -1 : isNaN(b) ? 1 : b - a));
  }

  function filtered() {
    const q = state.query.toLowerCase();
    return state.plants.filter((p) =>
      (state.yard === "all" || p.yard === state.yard) &&
      (state.year === "all" || p.year === state.year) &&
      (!q || (p.name + " " + p.details + " " + p.number).toLowerCase().includes(q)));
  }

  function setNav(which) {
    document.querySelectorAll("[data-nav]").forEach((a) =>
      a.classList.toggle("active", a.dataset.nav === which));
  }

  // ---------- views ----------

  function renderList() {
    setNav("list");
    const count = (key) => state.plants.filter((p) => p.yard === key).length;
    const newest = years().find((y) => !isNaN(y));
    const chip = (val, label) =>
      `<button class="chip" data-yard="${val}" aria-pressed="${state.yard === val}">${esc(label)}</button>`;

    app.innerHTML = `
      <section class="stats">
        <div class="stat"><b>${state.plants.length}</b><span>plants</span></div>
        ${cfg.yards.map((y) => `<div class="stat"><b>${count(y.key)}</b><span>${esc(y.label)}</span></div>`).join("")}
        ${newest ? `<div class="stat"><b>${state.plants.filter((p) => p.year === newest).length}</b><span>planted in ${esc(newest)}</span></div>` : ""}
      </section>
      <div class="toolbar">
        <input id="q" type="search" placeholder="Search name, species, notes…" value="${esc(state.query)}" aria-label="Search plants">
        <select id="year" aria-label="Year planted">
          <option value="all">All years</option>
          ${years().map((y) => `<option ${state.year === y ? "selected" : ""}>${esc(y)}</option>`).join("")}
        </select>
        <div class="chips">${chip("all", "All")}${cfg.yards.map((y) => chip(y.key, y.key === "front" ? "Front" : "Back")).join("")}</div>
      </div>
      <div id="results"></div>
      <p class="footer muted">
        ${state.source === "live" ? "Live from the Google Sheet." : "Showing the saved snapshot (the live sheet couldn't be reached)."}
        <a href="${sheetUrl}" target="_blank" rel="noopener">Add or edit plants in the sheet</a>
      </p>`;

    const results = document.getElementById("results");
    const draw = () => {
      const list = filtered();
      if (!list.length) { results.innerHTML = `<p class="muted">No plants match.</p>`; return; }
      results.innerHTML = cfg.yards.map((y) => {
        const group = list.filter((p) => p.yard === y.key);
        if (!group.length) return "";
        return `<h2 class="group">${esc(y.label)} <span class="muted">${group.length}</span></h2>
          <div class="grid">${group.map(card).join("")}</div>`;
      }).join("");
    };
    draw();

    document.getElementById("q").addEventListener("input", (e) => { state.query = e.target.value; draw(); });
    document.getElementById("year").addEventListener("change", (e) => { state.year = e.target.value; draw(); });
    app.querySelectorAll("[data-yard]").forEach((b) => b.addEventListener("click", () => {
      state.yard = b.dataset.yard;
      app.querySelectorAll("[data-yard]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      draw();
    }));
  }

  function card(p) {
    const meta = [p.year && (isNaN(p.year) ? p.year : "Planted " + p.year), sunOf(p)].filter(Boolean).join(" · ");
    return `<a class="card" href="${plantHref(p)}">
      <span class="num ${p.yard}">${esc(p.number)}</span>
      <div><h3>${esc(displayName(p))}</h3><p>${esc(meta)}</p></div>
    </a>`;
  }

  function renderPlant(yardKey, number) {
    setNav("list");
    const group = state.plants.filter((p) => p.yard === yardKey);
    const i = group.findIndex((p) => p.number === number);
    const p = group[i];
    if (!p) { app.innerHTML = `<p>Plant not found. <a href="#/">Back to all plants</a></p>`; return; }
    const prev = group[i - 1], next = group[i + 1];
    const yard = yardOf(yardKey);
    const parts = detailParts(p);

    app.innerHTML = `
      <p><a href="#/">← All plants</a></p>
      <article class="detail">
        <div class="detail-head">
          <span class="num ${p.yard}">${esc(p.number)}</span>
          <div><h1>${esc(displayName(p))}</h1><span class="tag ${p.yard}">${esc(p.yardLabel)}</span></div>
        </div>
        <dl class="fields">
          <dt>Map number</dt><dd>${esc(p.number)}</dd>
          <dt>Year planted</dt><dd>${esc(p.year || "—")}</dd>
          <dt>Details</dt><dd>${parts.length ? `<ul class="details">${parts.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : "—"}</dd>
        </dl>
        ${yard && yard.map ? `<p><a href="#/map/${yard.key}/${encodeURIComponent(p.number)}">Find #${esc(p.number)} on the map</a></p>` : ""}
      </article>
      <nav class="pager">
        ${prev ? `<a href="${plantHref(prev)}">← #${esc(prev.number)} ${esc(displayName(prev))}</a>` : "<span></span>"}
        ${next ? `<a href="${plantHref(next)}">#${esc(next.number)} ${esc(displayName(next))} →</a>` : "<span></span>"}
      </nav>`;
    window.scrollTo(0, 0);
  }

  function renderMap(focusYard, focusNumber) {
    setNav("map");
    app.innerHTML = cfg.yards.map((y) => {
      const group = state.plants.filter((p) => p.yard === y.key);
      return `<section class="map-section">
        <h2>${esc(y.label)}</h2>
        ${!y.map ? `<p class="muted">No map image yet.</p>` : `
        ${focusYard === y.key && focusNumber ? `<p class="callout">Look for <b>${esc(focusNumber)}</b> on the map below.</p>` : ""}
        <div class="map-wrap"><a href="${y.map}" target="_blank" rel="noopener"><img src="${y.map}" alt="${esc(y.label)} map with numbered plants"></a></div>`}
        <div class="legend">${group.map((p) =>
          `<a class="legend-item${p.number === focusNumber && y.key === focusYard ? " focus" : ""}" href="${plantHref(p)}"><span class="num ${p.yard}">${esc(p.number)}</span>${esc(displayName(p))}</a>`).join("")}</div>
      </section>`;
    }).join("");
    if (focusNumber) {
      const el = app.querySelector(".legend-item.focus");
      if (el) el.scrollIntoView({ block: "center" });
    } else window.scrollTo(0, 0);
  }

  // ---------- routing ----------

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    if (parts[0] === "plant") renderPlant(parts[1], parts[2]);
    else if (parts[0] === "map") renderMap(parts[1], parts[2]);
    else renderList();
  }

  load()
    .then(() => { window.addEventListener("hashchange", route); route(); })
    .catch((err) => {
      console.error(err);
      app.innerHTML = `<p>Couldn't load plant data. <a href="${sheetUrl}">Open the sheet</a></p>`;
    });
})();
