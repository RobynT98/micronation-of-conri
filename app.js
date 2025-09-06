const citizens = [];

function addCitizen() {
  const name = prompt("Enter your citizen name:");
  if (name) {
    citizens.push(name);
    renderCitizens();
  }
}

function renderCitizens() {
  const list = document.getElementById("citizens");
  list.innerHTML = "";
  citizens.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    list.appendChild(li);
  });
}
