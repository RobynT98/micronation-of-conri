/* ========================
   Micronation of Conri – app.js (coins edition)
   ======================== */

/* ---------- Citizens (localStorage) ---------- */
const STORAGE_KEY = "conri_citizens_v2";

function loadCitizens() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveCitizens(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let citizens = loadCitizens();

// migrate gamla poster utan coins/role/since
citizens = citizens.map(c => ({
  name: c.name || c,
  role: c.role || "Citizen",
  since: c.since || new Date().toISOString(),
  coins: typeof c.coins === "number" ? c.coins : 0
}));

// Seed Sovereign om tomt
if (citizens.length === 0) {
  citizens = [{
    name: "Conri",
    role: "Sovereign",
    since: new Date().toISOString(),
    coins: 0
  }];
  saveCitizens(citizens);
}

/* Helpers */
function addCitizen(name, role = "Citizen") {
  if (!name || !name.trim()) return;
  const clean = name.trim();

  if (citizens.some(c => c.name.toLowerCase() === clean.toLowerCase())) {
    alert("That citizen already exists.");
    return;
  }
  citizens.push({ name: clean, role, since: new Date().toISOString(), coins: 0 });
  saveCitizens(citizens);
  renderCitizens();
}
function removeCitizen(index) {
  citizens.splice(index, 1);
  saveCitizens(citizens);
  renderCitizens();
}

/* --- Currency logic --- */
function earnCoin(index, amount = 1) {
  citizens[index].coins += amount;
  if (citizens[index].coins < 0) citizens[index].coins = 0;
  saveCitizens(citizens);
  renderCitizens();
}

/* --- UI wiring --- */
(function wireCitizenInputs(){
  const form = document.getElementById("citizen-form");
  const nameInput = document.getElementById("citizen-name");
  const roleSelect = document.getElementById("citizen-role");

  if (form && nameInput) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      addCitizen(nameInput.value, roleSelect ? roleSelect.value : "Citizen");
      nameInput.value = "";
      if (roleSelect) roleSelect.value = "Citizen";
    });
  } else {
    // fallback om man vill anropa via knapp: onclick="addCitizenPrompt()"
    window.addCitizenPrompt = function () {
      const name = prompt("Enter your citizen name:");
      if (name) addCitizen(name, "Citizen");
    };
  }
})();

function roleIcon(role) {
  switch ((role || "").toLowerCase()) {
    case "sovereign": return "👑";
    case "advisor":   return "📜";
    case "vassal":    return "⚔️";
    default:          return "👤";
  }
}

function renderCitizens() {
  const list = document.getElementById("citizens");
  if (!list) return;
  list.innerHTML = "";

  if (citizens.length === 0) {
    list.innerHTML = `<li>No citizens yet.</li>`;
    return;
  }

  citizens.forEach((c, i) => {
    const li = document.createElement("li");

    const since = new Date(c.since).toLocaleDateString();
    li.innerHTML = `
      <span>${roleIcon(c.role)} <strong>${c.name}</strong> — ${c.role} • ${c.coins} coins <small>(since ${since})</small></span>
    `;

    // Btns container
    const actions = document.createElement("div");
    actions.style.float = "right";
    actions.style.display = "flex";
    actions.style.gap = "6px";

    // Earn +1 (arbete)
    const earnBtn = document.createElement("button");
    earnBtn.textContent = "Earn +1";
    earnBtn.title = "Work to earn 1 coin";
    earnBtn.onclick = () => earnCoin(i, 1);

    // Ceremoniell +1 / -1
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+1";
    plusBtn.title = "Grant 1 coin";
    plusBtn.onclick = () => earnCoin(i, 1);

    const minusBtn = document.createElement("button");
    minusBtn.textContent = "−1";
    minusBtn.title = "Deduct 1 coin";
    minusBtn.onclick = () => earnCoin(i, -1);

    // Remove
    const rmBtn = document.createElement("button");
    rmBtn.textContent = "×";
    rmBtn.title = "Remove citizen";
    rmBtn.onclick = () => removeCitizen(i);

    actions.appendChild(earnBtn);
    actions.appendChild(plusBtn);
    actions.appendChild(minusBtn);
    actions.appendChild(rmBtn);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

renderCitizens();

/* ---------- First-run Splash (tap or auto-hide) ---------- */
(function initSplash(){
  const el = document.getElementById("splash");
  if (!el) return;

  const KEY = "conri_seen_splash_v1";
  const seen = localStorage.getItem(KEY) === "1";

  if (seen) { el.remove(); return; }

  document.body.classList.add("splashing");

  function closeSplash() {
    document.body.classList.remove("splashing");
    el.classList.add("hide");
    el.addEventListener("transitionend", () => el.remove(), { once:true });
    localStorage.setItem(KEY, "1");
  }

  el.addEventListener("click", closeSplash);

  const minTime = new Promise(r => setTimeout(r, 800));
  const domReady = new Promise(r => {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r, { once:true });
  });
  Promise.all([minTime, domReady]).then(closeSplash);
})();

/* ---------- Service Worker (offline) ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
/* ---------- Decree system (toy admin) ---------- */
const DECREE_KEY = "conri_decrees_v1";
const ADMIN_FLAG = "conri_admin_v1";
const ADMIN_PASSPHRASE = "BLACK-SIGIL-2025"; // byt till något eget

function loadDecrees(){ try { return JSON.parse(localStorage.getItem(DECREE_KEY)) || []; } catch { return []; } }
function saveDecrees(list){ localStorage.setItem(DECREE_KEY, JSON.stringify(list)); }

let decrees = loadDecrees();

function renderDecrees(){
  const ul = document.getElementById("decrees");
  if (!ul) return;
  ul.innerHTML = "";
  if (decrees.length === 0) { ul.innerHTML = "<li>No decrees yet.</li>"; return; }
  decrees.slice().reverse().forEach(d => {
    const li = document.createElement("li");
    li.innerHTML = `${d.text.replace(/\n/g,"<br>")}<time>${new Date(d.ts).toLocaleString()}</time>`;
    ul.appendChild(li);
  });
}

function setAdminUI(enabled){
  const loginBtn = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");
  if (!loginBtn || !panel) return;
  loginBtn.style.display = enabled ? "none" : "inline-block";
  panel.style.display = enabled ? "grid" : "none";
}

function enableAdmin(){
  const pass = prompt("Council passphrase:");
  if (pass && pass === ADMIN_PASSPHRASE){
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
  const ta = document.getElementById("decree-text");
  if (!ta || !ta.value.trim()) return;
  decrees.push({ text: ta.value.trim(), ts: Date.now() });
  saveDecrees(decrees);
  ta.value = "";
  renderDecrees();
}

(function wireDecrees(){
  const loginBtn = document.getElementById("admin-login");
  const postBtn  = document.getElementById("decree-post");
  const logoutBtn= document.getElementById("admin-logout");

  if (loginBtn)  loginBtn.onclick = enableAdmin;
  if (postBtn)   postBtn.onclick  = postDecree;
  if (logoutBtn) logoutBtn.onclick= disableAdmin;

  setAdminUI(localStorage.getItem(ADMIN_FLAG) === "1");
  renderDecrees();
})();

