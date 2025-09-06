/* ========================
   Micronation of Conri – app.js
   ======================== */

/* ---------- Citizens (localStorage) ---------- */
const STORAGE_KEY = "conri_citizens_v1";

function loadCitizens() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveCitizens(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let citizens = loadCitizens();

// Seed Sovereign om tomt
if (citizens.length === 0) {
  citizens = [{ name: "Conri", role: "Sovereign", since: new Date().toISOString() }];
  saveCitizens(citizens);
}

function addCitizen(name, role = "Citizen") {
  if (!name || !name.trim()) return;
  const clean = name.trim();

  // undvik dubbletter (case-insensitive)
  if (citizens.some(c => c.name.toLowerCase() === clean.toLowerCase())) {
    alert("That citizen already exists.");
    return;
  }
  citizens.push({ name: clean, role, since: new Date().toISOString() });
  saveCitizens(citizens);
  renderCitizens();
}

function removeCitizen(index) {
  citizens.splice(index, 1);
  saveCitizens(citizens);
  renderCitizens();
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
    li.textContent = `${c.name} — ${c.role} (since ${since})`;

    // Remove-knapp
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.title = "Remove";
    btn.style.float = "right";
    btn.style.background = "#333";
    btn.style.color = "#eee";
    btn.style.border = "0";
    btn.style.borderRadius = "6px";
    btn.style.padding = "0 .5rem";
    btn.onclick = () => removeCitizen(i);

    li.appendChild(btn);
    list.appendChild(li);
  });
}

/* Stöder både form i HTML och prompt-fallback */
(function wireCitizenInputs(){
  const form = document.getElementById("citizen-form");
  const nameInput = document.getElementById("citizen-name");
  const roleSelect = document.getElementById("citizen-role");

  if (form && nameInput) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = nameInput.value;
      const role = roleSelect ? roleSelect.value : "Citizen";
      addCitizen(name, role);
      if (nameInput) nameInput.value = "";
      if (roleSelect) roleSelect.value = "Citizen";
    });
  } else {
    // fallback: global funktion för ev. knapp onclick="addCitizenPrompt()"
    window.addCitizenPrompt = function () {
      const name = prompt("Enter your citizen name:");
      if (name) addCitizen(name, "Citizen");
    };
  }
})();

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
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // tyst fail – sw är valfri
    });
  });
}
