import Database from "./sql.js";

const { invoke } = window.__TAURI__.tauri;
const dialog = window.__TAURI__.dialog;

let db;
let globalRows = [];
let interval;
let total = 0;
let remaining = 0;
let latestProject = '';

async function startButtonHandler(projectName = null) {
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
    if (projectName === '') {
      h1.classList.add('hidden');
      h2.classList.add('hidden');
    } else if (projectName?.length > 0) {
      h2.textContent = projectName;
      latestProject = projectName;
    } else {
      const name = globalRows[Math.floor(Math.random() * globalRows.length)].name
      h2.textContent = name;
      latestProject = name;
    }
  } else {
    h1.classList.add('hidden');
    h2.classList.add('hidden');
  }

  total = (+seconds + (+minutes * 60) + (+hours * 60 * 60));
  remaining = total;
  interval = setInterval(async () => {
    if (remaining > 0) {
      remaining -= 1;
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining - (h * 3600)) / 60);
      const s = remaining - (h*3600) - (m * 60);
      p.textContent = `${h<10 ? '0' : ''}${h}:${m<10 ? '0' : ''}${m}:${s<10 ? '0' : ''}${s}`;
    } else {
      init.classList.remove('hidden');
      countdown.classList.add('hidden');
      clearInterval(interval);
      await db.execute(`INSERT INTO pt_finished_projects (name, duration) VALUES ($1, $2)`, [latestProject, total - remaining])
      const result = await db.select("SELECT * from pt_finished_projects");
      console.log(result);
    }
  }, 1000)
}

async function stopButtonHandler() {
  const init = document.querySelector('.init-section');
  const countdown = document.querySelector(".countdown");
  init.classList.remove('hidden');
  countdown.classList.add('hidden');
  clearInterval(interval);
  await db.execute(`INSERT INTO pt_finished_projects (name, duration) VALUES ($1, $2)`, [latestProject, total - remaining])
  const result = await db.select("SELECT * from pt_finished_projects");
  console.log(result);
}

async function addButtonHandler() {
  const project_name = document.querySelector("#project");
  await db.execute(`INSERT INTO pt_project_list (name) VALUES ($1)`, [project_name.value])
  await fetchProjectList();
  project_name.value = "";
}

async function removeButtonHandler(event) {
  // The await below has to be there because the confirm function in Tauri returns a Promise
  const result = await confirm(`Do you really want to delete ${event.target.dataset['name']}?`, 'Project Timer');
  if (result) {
    await db.execute(`DELETE FROM pt_project_list WHERE name = $1`, [event.target.dataset['name']])
    await fetchProjectList();
  }
}

async function startProjectButtonHandler(event) {
  await startButtonHandler(event.target.dataset['name']);
}

function renderTableRows(rows) {
  const trArr = [];
  for (const row of rows) {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = row.name;
    tr.appendChild(nameTd);
    const actionsTd = document.createElement('td');
    const startProjectButton = document.createElement('button')
    startProjectButton.setAttribute('data-name', row.name);
    startProjectButton.textContent = 'Start';
    startProjectButton.addEventListener('click', startProjectButtonHandler);
    startProjectButton.setAttribute('data-name', row.name);
    actionsTd.append(startProjectButton);
    const deleteButton = document.createElement('button')
    deleteButton.setAttribute('data-name', row.name);
    deleteButton.textContent = 'Remove';
    deleteButton.addEventListener('click', removeButtonHandler);
    deleteButton.classList.add('button--danger')
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
  document.querySelector("#startButton").addEventListener('click', () => startButtonHandler());
  document.querySelector("#startSimpleButton").addEventListener('click', () => startButtonHandler(''));
  document.querySelector("#stopButton").addEventListener('click', stopButtonHandler);
  document.querySelector("#addButton").addEventListener('click', addButtonHandler);
  const dbName = await invoke('get_environment_variable', { name: 'PT_DB' });
  db = await Database.load(`sqlite:${dbName ? dbName : 'project-timer.db'}`);
  await db.execute(`create table if not exists pt_project_list (name text primary key)`);
  await db.execute(`create table if not exists pt_finished_projects (
    id integer primary key,
    name text,
    duration integer not null,
    finished DATETIME DEFAULT CURRENT_TIMESTAMP
                                                )`);
  await fetchProjectList();
});
