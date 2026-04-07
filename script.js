const STORAGE_KEY = "jobInterviewTracker.v1";
const NOTIFICATION_KEY = "jobInterviewTracker.notifications.lastDate";

const STATUS_ORDER = {
  Applied: 1,
  "Interview Scheduled": 2,
  Offer: 3,
  Rejected: 4,
  Archived: 5,
};

const STATE_CITIES = {
  AL: ["Birmingham", "Montgomery", "Mobile", "Huntsville"],
  AK: ["Anchorage", "Fairbanks", "Juneau", "Sitka"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Scottsdale"],
  AR: ["Little Rock", "Fayetteville", "Fort Smith", "Jonesboro"],
  CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco"],
  CO: ["Denver", "Colorado Springs", "Aurora", "Boulder"],
  CT: ["Bridgeport", "New Haven", "Stamford", "Hartford"],
  DE: ["Wilmington", "Dover", "Newark", "Middletown"],
  FL: ["Jacksonville", "Miami", "Tampa", "Orlando"],
  GA: ["Atlanta", "Augusta", "Savannah", "Athens"],
  HI: ["Honolulu", "Hilo", "Kailua", "Pearl City"],
  ID: ["Boise", "Meridian", "Nampa", "Idaho Falls"],
  IL: ["Chicago", "Aurora", "Naperville", "Springfield"],
  IN: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City"],
  KS: ["Wichita", "Overland Park", "Kansas City", "Topeka"],
  KY: ["Louisville", "Lexington", "Bowling Green", "Owensboro"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  ME: ["Portland", "Lewiston", "Bangor", "South Portland"],
  MD: ["Baltimore", "Frederick", "Rockville", "Gaithersburg"],
  MA: ["Boston", "Worcester", "Springfield", "Cambridge"],
  MI: ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"],
  MN: ["Minneapolis", "Saint Paul", "Rochester", "Duluth"],
  MS: ["Jackson", "Gulfport", "Southaven", "Hattiesburg"],
  MO: ["Kansas City", "St. Louis", "Springfield", "Columbia"],
  MT: ["Billings", "Missoula", "Great Falls", "Bozeman"],
  NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island"],
  NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas"],
  NH: ["Manchester", "Nashua", "Concord", "Dover"],
  NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth"],
  NM: ["Albuquerque", "Las Cruces", "Santa Fe", "Rio Rancho"],
  NY: ["New York", "Buffalo", "Rochester", "Albany"],
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham"],
  ND: ["Fargo", "Bismarck", "Grand Forks", "Minot"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow"],
  OR: ["Portland", "Eugene", "Salem", "Gresham"],
  PA: ["Philadelphia", "Pittsburgh", "Allentown", "Harrisburg"],
  RI: ["Providence", "Warwick", "Cranston", "Pawtucket"],
  SC: ["Charleston", "Columbia", "North Charleston", "Greenville"],
  SD: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  TX: ["Houston", "San Antonio", "Dallas", "Austin"],
  UT: ["Salt Lake City", "West Valley City", "Provo", "Ogden"],
  VT: ["Burlington", "South Burlington", "Rutland", "Barre"],
  VA: ["Virginia Beach", "Norfolk", "Richmond", "Alexandria"],
  WA: ["Seattle", "Spokane", "Tacoma", "Vancouver"],
  WV: ["Charleston", "Huntington", "Morgantown", "Parkersburg"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
  WY: ["Cheyenne", "Casper", "Laramie", "Gillette"],
};

const state = {
  jobs: [],
  filterStatus: "All",
  sortBy: "applicationDate",
  sortDirection: "desc",
};

const els = {
  form: document.getElementById("job-form"),
  jobId: document.getElementById("job-id"),
  company: document.getElementById("company"),
  position: document.getElementById("position"),
  status: document.getElementById("status"),
  applicationDate: document.getElementById("applicationDate"),
  interviewDate: document.getElementById("interviewDate"),
  state: document.getElementById("state"),
  city: document.getElementById("city"),
  notes: document.getElementById("notes"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  clearFormBtn: document.getElementById("clear-form-btn"),
  filterStatus: document.getElementById("filter-status"),
  sortBy: document.getElementById("sort-by"),
  sortDirection: document.getElementById("sort-direction"),
  exportCsvBtn: document.getElementById("export-csv-btn"),
  csvImportInput: document.getElementById("csv-import-input"),
  tbody: document.getElementById("jobs-tbody"),
  rowTemplate: document.getElementById("row-template"),
  summary: document.getElementById("summary"),
};

init();

function init() {
  state.jobs = loadJobs();
  populateStateOptions();
  bindEvents();
  render();
  maybeTriggerInterviewNotifications();
}

function bindEvents() {
  els.form.addEventListener("submit", onSubmit);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.clearFormBtn.addEventListener("click", () => {
    setTimeout(resetEditState, 0);
  });

  els.filterStatus.addEventListener("change", () => {
    state.filterStatus = els.filterStatus.value;
    render();
  });

  els.sortBy.addEventListener("change", () => {
    state.sortBy = els.sortBy.value;
    render();
  });

  els.sortDirection.addEventListener("change", () => {
    state.sortDirection = els.sortDirection.value;
    render();
  });

  els.tbody.addEventListener("click", handleTableAction);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.csvImportInput.addEventListener("change", importCsv);
  els.state.addEventListener("change", handleStateChange);
}

function onSubmit(event) {
  event.preventDefault();

  const entry = {
    id: els.jobId.value || crypto.randomUUID(),
    company: sanitizeText(els.company.value, 120),
    position: sanitizeText(els.position.value, 120),
    status: sanitizeStatus(els.status.value),
    applicationDate: sanitizeDate(els.applicationDate.value),
    interviewDate: sanitizeDate(els.interviewDate.value),
    location: sanitizeText(formatLocation(els.city.value, els.state.value), 120),
    notes: sanitizeText(els.notes.value, 800),
    updatedAt: new Date().toISOString(),
  };

  if (!entry.company || !entry.position || !entry.applicationDate) {
    alert("Company, position, and application date are required.");
    return;
  }

  const existingIndex = state.jobs.findIndex((job) => job.id === entry.id);
  if (existingIndex >= 0) {
    state.jobs[existingIndex] = entry;
  } else {
    state.jobs.push(entry);
  }

  persistJobs();
  resetForm();
  render();
}

function handleTableAction(event) {
  const actionBtn = event.target.closest("button[data-action]");
  if (!actionBtn) return;

  const row = actionBtn.closest("tr[data-id]");
  if (!row) return;

  const id = row.dataset.id;

  if (actionBtn.dataset.action === "edit") {
    startEdit(id);
    return;
  }

  if (actionBtn.dataset.action === "delete") {
    deleteWithUndo(id);
  }
}

function deleteWithUndo(id) {
  const deleted = state.jobs.find((job) => job.id === id);
  if (!deleted) return;

  const confirmed = window.confirm(`Delete ${deleted.company} — ${deleted.position}?`);
  if (!confirmed) return;

  state.jobs = state.jobs.filter((job) => job.id !== id);
  if (els.jobId.value === id) {
    resetForm();
  }
  persistJobs();
  render();
}

function populateStateOptions() {
  const options = Object.keys(STATE_CITIES)
    .sort()
    .map((stateCode) => `<option value="${stateCode}">${stateCode}</option>`)
    .join("");
  els.state.insertAdjacentHTML("beforeend", options);
  populateCityOptions("");
}

function populateCityOptions(stateCode, selectedCity = "") {
  const cities = STATE_CITIES[stateCode] || [];
  els.city.innerHTML = `<option value="">Select a city</option>`;
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    els.city.appendChild(option);
  });
  els.city.disabled = !cities.length;
  if (selectedCity && cities.includes(selectedCity)) {
    els.city.value = selectedCity;
  }
}

function handleStateChange() {
  populateCityOptions(els.state.value);
}

function formatLocation(city, stateCode) {
  if (!city || !stateCode) return "";
  return `${city}, ${stateCode}`;
}

function parseLocation(location) {
  const value = sanitizeText(location, 120);
  const match = value.match(/^(.+),\s*([A-Z]{2})$/);
  if (!match) return { city: "", state: "" };
  const city = match[1];
  const stateCode = match[2];
  if (!STATE_CITIES[stateCode] || !STATE_CITIES[stateCode].includes(city)) {
    return { city: "", state: "" };
  }
  return { city, state: stateCode };
}

function startEdit(id) {
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return;

  els.jobId.value = job.id;
  els.company.value = job.company;
  els.position.value = job.position;
  els.status.value = job.status;
  els.applicationDate.value = job.applicationDate;
  els.interviewDate.value = job.interviewDate;
  const parsed = parseLocation(job.location);
  els.state.value = parsed.state;
  populateCityOptions(parsed.state, parsed.city);
  els.notes.value = job.notes;

  els.cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetEditState() {
  els.jobId.value = "";
  els.cancelEditBtn.hidden = true;
}

function resetForm() {
  els.form.reset();
  populateCityOptions("");
  resetEditState();
}

function getVisibleJobs() {
  let list = [...state.jobs];

  if (state.filterStatus !== "All") {
    list = list.filter((job) => job.status === state.filterStatus);
  }

  list.sort((a, b) => {
    let result = 0;

    if (state.sortBy === "applicationDate") {
      result = (a.applicationDate || "").localeCompare(b.applicationDate || "");
    } else if (state.sortBy === "interviewDate") {
      result = (a.interviewDate || "9999-99-99").localeCompare(b.interviewDate || "9999-99-99");
    } else if (state.sortBy === "company") {
      result = a.company.localeCompare(b.company);
    } else if (state.sortBy === "status") {
      result = (STATUS_ORDER[a.status] || 999) - (STATUS_ORDER[b.status] || 999);
    }

    return state.sortDirection === "asc" ? result : -result;
  });

  return list;
}

function render() {
  const visible = getVisibleJobs();
  els.tbody.innerHTML = "";

  if (visible.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8">No jobs found for current filter.</td>`;
    els.tbody.appendChild(tr);
  } else {
    visible.forEach((job) => {
      const fragment = els.rowTemplate.content.cloneNode(true);
      const row = fragment.querySelector("tr");
      row.dataset.id = job.id;

      row.querySelector('[data-field="company"]').textContent = job.company;
      row.querySelector('[data-field="position"]').textContent = job.position;
      const statusCell = row.querySelector('[data-field="status"]');
      const pill = document.createElement("span");
      pill.className = `status-pill ${statusClass(job.status)}`;
      pill.setAttribute("role", "status");
      pill.setAttribute("aria-label", `Application status: ${job.status}`);
      pill.textContent = job.status;
      statusCell.appendChild(pill);
      row.querySelector('[data-field="applicationDate"]').textContent = formatDate(job.applicationDate);
      row.querySelector('[data-field="interviewDate"]').textContent = formatDate(job.interviewDate);
      row.querySelector('[data-field="location"]').textContent = job.location || "—";
      renderNotes(row.querySelector('[data-field="notes"]'), job.notes);

      els.tbody.appendChild(fragment);
    });
  }

  const scheduled = state.jobs.filter((job) => job.interviewDate).length;
  const offers = state.jobs.filter((job) => job.status === "Offer").length;
  els.summary.textContent = `${visible.length} shown / ${state.jobs.length} total jobs • ${scheduled} interviews set • ${offers} offers`;
}

function statusClass(status) {
  return `status-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeStatus(value) {
  const cleaned = sanitizeText(value, 40);
  return STATUS_ORDER[cleaned] ? cleaned : "Applied";
}

function sanitizeDate(value) {
  const dateValue = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : "";
}

function sanitizeJob(job) {
  return {
    id: sanitizeText(job.id || crypto.randomUUID(), 60),
    company: sanitizeText(job.company, 120),
    position: sanitizeText(job.position, 120),
    status: sanitizeStatus(job.status),
    applicationDate: sanitizeDate(job.applicationDate),
    interviewDate: sanitizeDate(job.interviewDate),
    location: sanitizeText(job.location, 120),
    notes: sanitizeText(job.notes, 800),
    updatedAt: String(job.updatedAt || new Date().toISOString()),
  };
}

function renderNotes(cell, notes) {
  const text = notes || "—";
  const wrap = document.createElement("div");
  wrap.className = "notes-wrap";
  const content = document.createElement("span");
  content.className = "notes-text";
  content.textContent = text;
  content.title = notes || "";
  wrap.appendChild(content);

  if (notes && notes.length > 110) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn small ghost notes-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "More";
    toggle.addEventListener("click", () => {
      const expanded = wrap.classList.toggle("expanded");
      toggle.textContent = expanded ? "Less" : "More";
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
    wrap.appendChild(toggle);
  }

  cell.appendChild(wrap);
}

function loadJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidJob).map(normalizeJob);
  } catch (error) {
    console.warn("Unable to parse saved jobs:", error);
    return [];
  }
}

function persistJobs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.jobs));
}

function isValidJob(value) {
  return value && typeof value === "object";
}

function normalizeJob(job) {
  return sanitizeJob(job);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString();
}

function exportCsv() {
  const header = [
    "id",
    "company",
    "position",
    "status",
    "applicationDate",
    "interviewDate",
    "location",
    "notes",
    "updatedAt",
  ];

  const rows = state.jobs.map((job) =>
    header
      .map((key) => csvEscape(job[key] || ""))
      .join(",")
  );

  const csvContent = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `job-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function importCsv(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const importedRows = parseCsv(text);
      if (!importedRows.length) {
        alert("The CSV appears to be empty.");
        return;
      }

      const normalized = importedRows
        .map(sanitizeJob)
        .filter((row) => row.company && row.position && row.applicationDate);

      if (!normalized.length) {
        alert("No valid rows found. Ensure company, position, and applicationDate are provided.");
        return;
      }

      const byId = new Map(state.jobs.map((job) => [job.id, job]));
      normalized.forEach((row) => byId.set(row.id, row));
      state.jobs = Array.from(byId.values());
      persistJobs();
      render();
      alert(`Imported ${normalized.length} valid row(s).`);
    } catch (error) {
      console.error(error);
      alert("Unable to import CSV. Please check the file format.");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

function csvEscape(value) {
  const input = String(value);
  if (/[",\n]/.test(input)) {
    return `"${input.replace(/"/g, '""')}"`;
  }
  return input;
}

function parseCsv(text) {
  const lines = splitCsvLines(text.trim());
  if (!lines.length) return [];

  const headers = lines[0].map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = (line[idx] || "").trim();
    });
    return obj;
  });
}

function splitCsvLines(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

async function maybeTriggerInterviewNotifications() {
  if (!("Notification" in window)) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const alreadyNotifiedForToday = localStorage.getItem(NOTIFICATION_KEY) === today;
  if (alreadyNotifiedForToday) {
    return;
  }

  const todayInterviews = state.jobs.filter((job) => job.interviewDate === today);
  if (!todayInterviews.length) {
    return;
  }

  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.warn("Notification permission request failed", error);
      return;
    }
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const body = todayInterviews
    .slice(0, 3)
    .map((job) => `${job.company} — ${job.position}`)
    .join("\n");

  new Notification(`You have ${todayInterviews.length} interview(s) today`, { body });
  localStorage.setItem(NOTIFICATION_KEY, today);
}
