// Nyckel för localStorage
const STORAGE_KEY = "conri_citizens";

// Ladda befintliga medborgare (eller tom array)
let citizens = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Funktion för att spara
function saveCitizens() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(citizens));
}

// Lägg till ny medborgare via prompt
function addCitizen() {
  const name = prompt("Enter your citizen name:");
  if (name && name.trim()) {
    citizens.push(name.trim());
    saveCitizens();
    renderCitizens();
  }
}

// Rendera listan
function renderCitizens() {
  const list = document.getElementById("citizens");
  list.innerHTML = "";
  citizens.forEach((c, i) => {
    const li = document.createElement("li");
    li.textContent = c;

    // Ta bort-knapp
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.style.float = "right";
    btn.onclick = () => {
      citizens.splice(i, 1);
      saveCitizens();
      renderCitizens();
    };

    li.appendChild(btn);
    list.appendChild(li);
  });
}

// One-time splash with tap-to-dismiss
(function initSplash(){
  const el = document.getElementById("splash");
  if (!el) return;

  const KEY = "conri_seen_splash_v1";
  const seen = localStorage.getItem(KEY) === "1";

  // om den redan setts, ta bort direkt
  if (seen) { el.remove(); return; }

  // lås scroll medan splashen syns
  document.body.classList.add("splashing");

  // auto-stäng efter ~800 ms (och när sidan är redo)
  function closeSplash() {
    document.body.classList.remove("splashing");
    el.classList.add("hide");
    el.addEventListener("transitionend", () => el.remove(), { once:true });
    localStorage.setItem(KEY, "1");
  }

  // stäng vid klick/touch
  el.addEventListener("click", closeSplash);

  // säkerställ att den försvinner även utan klick
  const minTime = new Promise(r => setTimeout(r, 800));
  const domReady = new Promise(r => {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r, { once:true });
  });
  Promise.all([minTime, domReady]).then(closeSplash);
})();
