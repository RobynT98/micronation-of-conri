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

// Kör render direkt när sidan laddas
renderCitizens();
// Custom splash: visa bara första besöket per device
const SPLASH_KEY = "conri_seen_splash_v1";

function hideSplash() {
  const el = document.getElementById("splash");
  if (!el) return;
  el.classList.add("hide");
  // ta bort från DOM efter transition (lite städning)
  el.addEventListener("transitionend", () => el.remove(), { once: true });
}

(function initSplash(){
  const seen = localStorage.getItem(SPLASH_KEY) === "1";
  // visa alltid om man INTE sett den tidigare
  if (!seen) {
    // minstid så det hinner kännas avsiktligt
    const minTime = new Promise(res => setTimeout(res, 900));
    // vänta på att DOM laddats klart
    const domReady = new Promise(res => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", res, { once: true });
    });
    Promise.all([minTime, domReady]).then(() => {
      hideSplash();
      localStorage.setItem(SPLASH_KEY, "1");
    });
  } else {
    // om användaren redan sett splash → göm direkt
    window.addEventListener("load", hideSplash, { once: true });
  }
})();
