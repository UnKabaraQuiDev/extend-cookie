const list = document.getElementById("list");
const addButton = document.getElementById("add");

function createRow(domain = "", enabled = true, duration = 604800) {
  const row = document.createElement("div");
  row.className = "row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = enabled;

  const domainInput = document.createElement("input");
  domainInput.type = "text";
  domainInput.value = domain;
  domainInput.placeholder = "example.com";

  const durationInput = createDurationPicker(row);
  setDurationFromSeconds(durationInput, duration);

  row.append(checkbox, domainInput, durationInput);
  list.appendChild(row);

  const save = async () => {
    const rows = [...list.children];
    const domains = {};

    for (const r of rows) {
      const [cb, d, dur] = r.children;
      if (!d.value) {
        continue;
      }
      domains[d.value] = {
        enabled: cb.checked,
        duration: Number(durationToSeconds(dur))
      };
    }

    await browser.storage.local.set({ domains });
  };

  checkbox.addEventListener("change", save);
  domainInput.addEventListener("input", save);
  durationInput.addEventListener("input", save);
}

function durationToSeconds(pickerDiv) {
  const d = Number(pickerDiv.querySelector(".days").value);
  const h = Number(pickerDiv.querySelector(".hours").value);
  const m = Number(pickerDiv.querySelector(".minutes").value);
  const s = Number(pickerDiv.querySelector(".seconds").value);

  return d * 86400 + h * 3600 + m * 60 + s;
}

function setDurationFromSeconds(pickerDiv, totalSeconds) {
  let remaining = Number(totalSeconds);

  const days = Math.floor(remaining / 86400);
  remaining -= days * 86400;

  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;

  const minutes = Math.floor(remaining / 60);
  remaining -= minutes * 60;

  const seconds = remaining;

  pickerDiv.querySelector(".days").value = days;
  pickerDiv.querySelector(".hours").value = hours;
  pickerDiv.querySelector(".minutes").value = minutes;
  pickerDiv.querySelector(".seconds").value = seconds;
}

function createDurationPicker(parent) {
  const tmpl = document.getElementById("duration-template");
  const clone = tmpl.content.cloneNode(true);
  const container = document.createElement("div");
  container.className = "time-picker";
  container.appendChild(clone);
  parent.appendChild(container);
  return container;
}

async function init() {
  const { domains = {} } = await browser.storage.local.get("domains");

  for (const [domain, cfg] of Object.entries(domains)) {
    createRow(domain, cfg.enabled, cfg.duration);
  }
}

addButton.addEventListener("click", () => createRow());
init();

async function showLogs() {
  const { logs = [] } = await browser.storage.local.get("logs");
  const container = document.getElementById("logs");
  container.innerHTML = "";

  logs.slice().reverse().forEach(entry => {
    const div = document.createElement("div");
    div.textContent = `[${entry.timestamp}] ${entry.domain}>${entry.cookie}: ${formatDuration(entry.previousDuration)} -> ${formatDuration(entry.overwrittenDuration)}`;
    container.appendChild(div);
  });
}

function formatDuration(seconds) {
  let remaining = Number(seconds);
  const d = Math.floor(remaining / 86400);
  remaining -= d * 86400;
  const h = Math.floor(remaining / 3600);
  remaining -= h * 3600;
  const m = Math.floor(remaining / 60);
  remaining -= m * 60;
  const s = remaining;
  return `${d}D ${h}H ${m}M ${s}S`;
}

showLogs();

