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
