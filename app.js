/* ========================
   Micronation of Conri — app.js (refined)
   ======================== */

/* ---------- Utils ---------- */
const jsonGet = (k, d) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; }
  catch { return d; }
};
const jsonSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const fmtDate = (iso) => new Date(iso).toLocaleDateString();
const by = (sel) => document.querySelector(sel);

/* ---------- Constants ---------- */
const STORAGE_KEY   = "conri_citizens_v2";
const DECREE_KEY    = "conri_decrees_v1";
const ADMIN_FLAG    = "conri_admin_v1";
const ADMIN_SECRETK = "conri_admin_secret_v1"; // (valfritt) lagra egen lösenfras här

const ROLES = /** sorteringsvikt & ikon */ {
  Sovereign: { w: 100, icon: "👑" },
  Advisor:   { w: 80,  icon: "📜" },
  Vassal:    { w: 60,  icon: "⚔️" },
  Citizen:   { w: 10,  icon: "👤" }
};
const roleInfo = (r) => ROLES[r] || ROLES.Citizen;

/* ---------- Citizens (state + persistence) ---------- */
let citizens = jsonGet(STORAGE_KEY, []).map(c => ({
  name:  c.name || String(c || "").trim(),
  role:  c.role || "Citizen",
  since: c.since || new Date().toISOString(),
  coins: Number.isFinite(c.coins) ? c.coins : 0
}));

// seed om tomt
if (citizens.length === 0) {
  citizens = [{ name: "Conri", role: "Sovereign", since: new Date().toISOString(), coins: 0 }];
  jsonSet(STORAGE_KEY, citizens);
}

const saveCitizens = () => jsonSet(STORAGE_KEY, citizens);
const sortCitizens = () => citizens.sort((a,b) => {
  const rw = roleInfo(b.role).w - roleInfo(a.role).w;
  if (rw) return rw;
  return a.name.localeCompare(b.name, undefined, { sensitivity:"base" });
});

/* ---------- Citizen CRUD ---------- */
function addCitizen(name, role = "Citizen") {
  const clean = (name || "").trim();
  if (!clean) return;

  if (citizens.some(c => c.name.toLowerCase() === clean.toLowerCase())) {
    alert("That citizen already exists.");
    return;
  }
  citizens.push({ name: clean, role, since: new Date().toISOString(), coins: 0 });
  saveCitizens(); renderCitizens();
}
function removeCitizen(index) {
  citizens.splice(index, 1);
  saveCitizens(); renderCitizens();
}
function earnCoin(index, amount = 1) {
  citizens[index].coins = Math.max(0, (citizens[index].coins || 0) + amount);
  saveCitizens(); renderCitizens();
}

/* ---------- Citizen UI ---------- */
(function wireCitizenForm(){
  const form  = by("#citizen-form");
  const nameI = by("#citizen-name");
  const roleS = by("#citizen-role");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addCitizen(nameI.value, roleS ? roleS.value : "Citizen");
    nameI.value = "";
    if (roleS) roleS.value = "Citizen";
  });
})();

function renderCitizens() {
  const list = by("#citizens");
  if (!list) return;

  sortCitizens();
  list.innerHTML = "";

  if (citizens.length === 0) {
    list.innerHTML = `<li class="card">No citizens yet.</li>`;
    return;
  }

  citizens.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = "card";
    li.innerHTML = `
      <div style="display:flex; gap:.6rem; align-items:center; justify-content:space-between; flex-wrap:wrap">
        <span>
          ${roleInfo(c.role).icon}
          <strong>${c.name}</strong>
          — ${c.role}
          <span class="badge" title="Realm coins">${c.coins} coins</span>
          <small class="meta">since ${fmtDate(c.since)}</small>
        </span>
        <div class="actions" role="group" aria-label="coin actions" style="display:flex; gap:6px;">
          <button data-act="earn"  data-i="${i}" title="Work to earn 1 coin">Earn +1</button>
          <button data-act="plus"  data-i="${i}" title="Grant 1 coin">+1</button>
          <button data-act="minus" data-i="${i}" title="Deduct 1 coin">−1</button>
          <button data-act="rm"    data-i="${i}" title="Remove citizen">×</button>
        </div>
      </div>
    `;
    list.appendChild(li);
  });
}

/* event delegation för knapparna */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const i = Number(btn.dataset.i);
  switch (btn.dataset.act) {
    case "earn":  earnCoin(i, 1);  break;
    case "plus":  earnCoin(i, 1);  break;
    case "minus": earnCoin(i, -1); break;
    case "rm":    removeCitizen(i); break;
  }
});

renderCitizens();

/* ---------- First-run Splash ---------- */
(function initSplash(){
  const el = by("#splash"); if (!el) return;
  const KEY = "conri_seen_splash_v1";
  if (localStorage.getItem(KEY) === "1") { el.remove(); return; }

  document.body.classList.add("splashing");

  const close = () => {
    document.body.classList.remove("splashing");
    el.classList.add("hide");
    el.addEventListener("transitionend", () => el.remove(), { once:true });
    localStorage.setItem(KEY, "1");
  };

  el.addEventListener("click", close);
  Promise.all([
    new Promise(r => setTimeout(r, 800)),
    new Promise(r => (document.readyState === "complete") ? r() : window.addEventListener("load", r, { once:true }))
  ]).then(close);
})();

/* ---------- Service Worker (offline) ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

/* ---------- Decrees (toy admin) ---------- */
let decrees = jsonGet(DECREE_KEY, []);

const getPassphrase = () =>
  localStorage.getItem(ADMIN_SECRETK) || "BLACK-SIGIL-2025"; // byt/lagra egen via console: localStorage.setItem('conri_admin_secret_v1','DIN-FRAS')

function renderDecrees(){
  const ul = by("#decrees"); if (!ul) return;
  ul.innerHTML = "";
  if (decrees.length === 0) {
    ul.innerHTML = `<li class="card">No decrees yet.</li>`;
    return;
  }
  decrees.slice().reverse().forEach(d => {
    const li = document.createElement("li");
    li.innerHTML = `${d.text.replace(/\n/g,"<br>")}<time>${new Date(d.ts).toLocaleString()}</time>`;
    ul.appendChild(li);
  });
}

function setAdminUI(enabled){
  const loginBtn = by("#admin-login");
  const panel    = by("#admin-panel");
  if (loginBtn) loginBtn.style.display = enabled ? "none" : "inline-block";
  if (panel)    panel.style.display    = enabled ? "grid" : "none";
}

function enableAdmin(){
  const pass = prompt("Council passphrase:");
  if (pass && pass === getPassphrase()){
    localStorage.setItem(ADMIN_FLAG, "1");
    setAdminUI(true);
  } else {
    alert("The sigil rejects you.");
  }
}
function disableAdmin(){
  localStorage.removeItem(ADMIN_FLAG);
  setAdminUI(false);
}
function postDecree(){
  const ta = by("#decree-text");
  if (!ta || !ta.value.trim()) return;
  decrees.push({ text: ta.value.trim(), ts: Date.now() });
  jsonSet(DECREE_KEY, decrees);
  ta.value = "";
  renderDecrees();
}

(function wireDecrees(){
  const loginBtn  = by("#admin-login");
  const postBtn   = by("#decree-post");
  const logoutBtn = by("#admin-logout");

  if (loginBtn)  loginBtn.addEventListener("click", enableAdmin);
  if (postBtn)   postBtn.addEventListener("click",  postDecree);
  if (logoutBtn) logoutBtn.addEventListener("click",disableAdmin);

  setAdminUI(localStorage.getItem(ADMIN_FLAG) === "1");
  renderDecrees();
})();
if (navigator.serviceWorker?.controller) {
  navigator.serviceWorker.controller.postMessage("SKIP_WAITING");
}
