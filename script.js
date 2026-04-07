const STORAGE_KEY = "jobInterviewTracker.v1";
const NOTIFICATION_KEY = "jobInterviewTracker.notifications.lastDate";

const STATUS_ORDER = {
  Applied: 1,
  "Interview Scheduled": 2,
  Offer: 3,
  Rejected: 4,
  Archived: 5,
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
  location: document.getElementById("location"),
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
}

function onSubmit(event) {
  event.preventDefault();

  const entry = {
    id: els.jobId.value || crypto.randomUUID(),
    company: els.company.value.trim(),
    position: els.position.value.trim(),
    status: els.status.value,
    applicationDate: els.applicationDate.value,
    interviewDate: els.interviewDate.value,
    location: els.location.value.trim(),
    notes: els.notes.value.trim(),
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
    const ok = confirm("Delete this job entry?");
    if (!ok) return;
    state.jobs = state.jobs.filter((job) => job.id !== id);
    persistJobs();
    if (els.jobId.value === id) {
      resetForm();
    }
    render();
  }
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
  els.location.value = job.location;
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
      row.querySelector('[data-field="status"]').textContent = job.status;
      row.querySelector('[data-field="applicationDate"]').textContent = formatDate(job.applicationDate);
      row.querySelector('[data-field="interviewDate"]').textContent = formatDate(job.interviewDate);
      row.querySelector('[data-field="location"]').textContent = job.location || "—";
      row.querySelector('[data-field="notes"]').textContent = job.notes || "—";

      els.tbody.appendChild(fragment);
    });
  }

  const scheduled = state.jobs.filter((job) => job.interviewDate).length;
  els.summary.textContent = `${visible.length} shown / ${state.jobs.length} total jobs • ${scheduled} with interview dates`;
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
  return {
    id: String(job.id || crypto.randomUUID()),
    company: String(job.company || ""),
    position: String(job.position || ""),
    status: String(job.status || "Applied"),
    applicationDate: String(job.applicationDate || ""),
    interviewDate: String(job.interviewDate || ""),
    location: String(job.location || ""),
    notes: String(job.notes || ""),
    updatedAt: String(job.updatedAt || ""),
  };
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
        .map((row) => ({
          id: row.id || crypto.randomUUID(),
          company: row.company || "",
          position: row.position || "",
          status: row.status || "Applied",
          applicationDate: row.applicationDate || "",
          interviewDate: row.interviewDate || "",
          location: row.location || "",
          notes: row.notes || "",
          updatedAt: row.updatedAt || new Date().toISOString(),
        }))
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
