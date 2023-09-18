import Database from "./sql.js";

const { invoke } = window.__TAURI__.tauri;

let db;
let globalRows = [];
let interval;

async function startButtonHandler() {
  const hours = document.querySelector("#hours").value;
  const minutes = document.querySelector("#minutes").value;
  const seconds = document.querySelector("#seconds").value;
  const countdown = document.querySelector(".countdown");
  countdown.classList.remove('hidden');
  const p = document.querySelector(".countdown p");
  const h2 = document.querySelector(".countdown h2");
  const h1 = document.querySelector(".countdown h1");
  const init = document.querySelector('.init-section');
  init.classList.add('hidden');

  if (globalRows.length > 0) {
    h1.classList.remove('hidden');
    h2.classList.remove('hidden');
    h2.textContent = globalRows[Math.floor(Math.random() * globalRows.length)].name;
  } else {
    h1.classList.add('hidden');
    h2.classList.add('hidden');
  }

  let total = (+seconds + (+minutes * 60) + (+hours * 60 * 60));
  interval = setInterval(() => {
    if (total > 0) {
      total -= 1;
      const h = Math.floor(total / 3600);
      const m = Math.floor((total - (h * 3600)) / 60);
      const s = total - (h*3600) - (m * 60);
      p.textContent = `${h}:${m}:${s}`;
    } else {
      init.classList.remove('hidden');
      countdown.classList.add('hidden');
      clearInterval(interval);
    }
  }, 1000)
}

async function stopButtonHandler() {
  const init = document.querySelector('.init-section');
  const countdown = document.querySelector(".countdown");
  init.classList.remove('hidden');
  countdown.classList.add('hidden');
  clearInterval(interval);
}

async function addButtonHandler() {
  const project_name = document.querySelector("#project");
  await db.execute(`INSERT INTO pt_project_list (name) VALUES ($1)`, [project_name.value])
  await fetchProjectList();
  project_name.value = "";
}

async function removeButtonHandler(event) {
  await db.execute(`DELETE FROM pt_project_list WHERE name = $1`, [event.target.dataset['name']])
  await fetchProjectList();
}

function renderTableRows(rows) {
  const trArr = [];
  for (const row of rows) {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = row.name;
    tr.appendChild(nameTd);
    const actionsTd = document.createElement('td');
    const deleteButton = document.createElement('button')
    deleteButton.setAttribute('data-name', row.name);
    deleteButton.textContent = 'Remove';
    deleteButton.addEventListener('click', removeButtonHandler);
    actionsTd.append(deleteButton);
    tr.appendChild(actionsTd);

    trArr.push(tr);
  }
  const table = document.querySelector("table tbody");
    while (table.lastChild) {
      table.removeChild(table.lastChild);
    }
  table.append(...trArr);
}

async function fetchProjectList() {
  const result = await db.select("SELECT * from pt_project_list");
  console.log(result);
  if (result.length > 0) {
    renderTableRows(result);
    globalRows = result;
  } else {
    const table = document.querySelector("table tbody");
    while (table.lastChild) {
      table.removeChild(table.lastChild);
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#startButton").addEventListener('click', startButtonHandler);
  document.querySelector("#stopButton").addEventListener('click', stopButtonHandler);
  document.querySelector("#addButton").addEventListener('click', addButtonHandler);
  db = await Database.load("sqlite:project-timer.db");
  await db.execute(`create table if not exists pt_project_list (name text primary key)`);
  await fetchProjectList();
});