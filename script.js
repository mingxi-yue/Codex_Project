const STORAGE_KEY = "couple-journal-entries";
const ANNIVERSARY_MONTH = 3;
const ANNIVERSARY_DAY = 26;

const form = document.querySelector("#entryForm");
const titleInput = document.querySelector("#titleInput");
const dateInput = document.querySelector("#dateInput");
const moodInput = document.querySelector("#moodInput");
const placeInput = document.querySelector("#placeInput");
const contentInput = document.querySelector("#contentInput");
const clearButton = document.querySelector("#clearButton");
const entriesList = document.querySelector("#entriesList");
const entryTemplate = document.querySelector("#entryTemplate");
const entryCount = document.querySelector("#entryCount");
const todayChip = document.querySelector("#todayChip");
const anniversaryChip = document.querySelector("#anniversaryChip");
const dailyLine = document.querySelector("#dailyLine");
const filters = [...document.querySelectorAll(".filter")];

const lines = [
  "把普通的一天，写成只属于我们的章节。",
  "今天也认真收藏了一点点喜欢。",
  "有些瞬间很轻，却会在心里住很久。",
  "一起走过的路，都在这里慢慢发光。"
];

let entries = loadEntries();
let activeFilter = "全部";
let editingId = null;

function getTodayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${dateValue}T00:00:00`));
}

function resetForm() {
  editingId = null;
  form.reset();
  dateInput.value = getTodayValue();
  form.querySelector(".primary-button").textContent = "保存日记";
}

function renderEntries() {
  entriesList.innerHTML = "";
  const filteredEntries = entries
    .filter((entry) => activeFilter === "全部" || entry.mood === activeFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  entryCount.textContent = entries.length;

  if (!filteredEntries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = activeFilter === "全部" ? "第一篇日记正在等你写下。" : "这个心情还没有记录。";
    entriesList.append(empty);
    return;
  }

  filteredEntries.forEach((entry) => {
    const node = entryTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = entry.id;
    node.querySelector(".entry-date").textContent = formatDate(entry.date);
    node.querySelector(".entry-mood").textContent = entry.mood;
    node.querySelector("h3").textContent = entry.title;
    node.querySelector(".entry-place").textContent = entry.place ? `在 ${entry.place}` : "";
    node.querySelector(".entry-content").textContent = entry.content;
    entriesList.append(node);
  });
}

function handleSubmit(event) {
  event.preventDefault();
  const payload = {
    title: titleInput.value.trim(),
    date: dateInput.value,
    mood: moodInput.value,
    place: placeInput.value.trim(),
    content: contentInput.value.trim()
  };

  if (editingId) {
    entries = entries.map((entry) => entry.id === editingId ? { ...entry, ...payload } : entry);
  } else {
    entries = [{ id: crypto.randomUUID(), createdAt: Date.now(), ...payload }, ...entries];
  }

  saveEntries();
  resetForm();
  renderEntries();
}

function handleEntryClick(event) {
  const card = event.target.closest(".entry-card");
  if (!card) return;

  const id = card.dataset.id;
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  if (event.target.matches(".delete-entry")) {
    entries = entries.filter((item) => item.id !== id);
    if (editingId === id) resetForm();
    saveEntries();
    renderEntries();
  }

  if (event.target.matches(".edit-entry")) {
    editingId = id;
    titleInput.value = entry.title;
    dateInput.value = entry.date;
    moodInput.value = entry.mood;
    placeInput.value = entry.place;
    contentInput.value = entry.content;
    form.querySelector(".primary-button").textContent = "更新日记";
    titleInput.focus();
  }
}

function handleFilterClick(event) {
  const button = event.target.closest(".filter");
  if (!button) return;

  activeFilter = button.dataset.filter;
  filters.forEach((filter) => filter.classList.toggle("active", filter === button));
  renderEntries();
}

function getAnniversaryText() {
  const now = new Date();
  const year = now.getFullYear();
  const thisYearAnniversary = new Date(year, ANNIVERSARY_MONTH - 1, ANNIVERSARY_DAY);
  const nextAnniversary = now <= thisYearAnniversary ? thisYearAnniversary : new Date(year + 1, ANNIVERSARY_MONTH - 1, ANNIVERSARY_DAY);
  const daysLeft = Math.ceil((nextAnniversary - now) / (1000 * 60 * 60 * 24));
  return daysLeft === 0
    ? "结婚纪念日 · 今天 ❤️"
    : `结婚纪念日 · ${ANNIVERSARY_MONTH}月${ANNIVERSARY_DAY}日（还有 ${daysLeft} 天）`;
}

function initialize() {
  const today = getTodayValue();
  dateInput.value = today;
  todayChip.textContent = formatDate(today);
  anniversaryChip.textContent = getAnniversaryText();
  dailyLine.textContent = lines[new Date().getDate() % lines.length];
  form.addEventListener("submit", handleSubmit);
  clearButton.addEventListener("click", resetForm);
  entriesList.addEventListener("click", handleEntryClick);
  document.querySelector(".filters").addEventListener("click", handleFilterClick);
  renderEntries();
}

initialize();
