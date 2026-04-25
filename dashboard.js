const STORAGE_KEYS = {
  events: "ksumEventLinks",
  analytics: "ksumEventAnalytics",
  session: "ksumEventAdminSession"
};

const loginShell = document.querySelector("#loginShell");
const dashboardApp = document.querySelector("#dashboardApp");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const logoutButton = document.querySelector("#logoutButton");
const eventForm = document.querySelector("#eventForm");
const formHeading = document.querySelector("#formHeading");
const formStatus = document.querySelector("#formStatus");
const resetFormButton = document.querySelector("#resetFormButton");
const creativeUpload = document.querySelector("#creativeUpload");
const creativePreview = document.querySelector("#creativePreview");
const clearCreativeButton = document.querySelector("#clearCreativeButton");
const deleteCurrentEventButton = document.querySelector("#deleteCurrentEventButton");
const adminSearchInput = document.querySelector("#adminSearchInput");
const eventList = document.querySelector("#eventList");
const backendMetrics = document.querySelector("#backendMetrics");

let uploadedCreativeDataUrl = "";

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getEvents() {
  return readJsonStorage(STORAGE_KEYS.events, []);
}

function saveEvents(events) {
  try {
    writeJsonStorage(STORAGE_KEYS.events, events);
    return true;
  } catch (error) {
    return false;
  }
}

function getAnalytics() {
  return readJsonStorage(STORAGE_KEYS.analytics, {
    pageViews: [],
    clicks: []
  });
}

function sanitizeText(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setSession(isActive) {
  localStorage.setItem(STORAGE_KEYS.session, isActive ? "active" : "");
}

function hasSession() {
  return localStorage.getItem(STORAGE_KEYS.session) === "active";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(dataUrl, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    image.onerror = () => reject(new Error("Could not process the selected image."));
    image.src = dataUrl;
  });
}

async function fileToOptimizedDataUrl(file) {
  const rawDataUrl = await fileToDataUrl(file);

  if (file.size < 350 * 1024) {
    return rawDataUrl;
  }

  return compressImageDataUrl(rawDataUrl);
}

function formatDate(value) {
  if (!value) {
    return "Date TBA";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function formatTime(value) {
  if (!value) {
    return "Time TBA";
  }

  const [hours, minutes] = String(value).split(":");
  if (hours === undefined || minutes === undefined) {
    return value;
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function renderBackendMetrics() {
  const events = getEvents();
  const analytics = getAnalytics();
  const activeCount = events.filter((entry) => entry.status === "active").length;
  const pausedCount = events.filter((entry) => entry.status === "paused").length;
  const archivedCount = events.filter((entry) => entry.status === "archived").length;
  const topClicks = analytics.clicks.length;

  backendMetrics.innerHTML = `
    <article class="metric-block">
      <p class="kicker">Events</p>
      <strong>${events.length}</strong>
      <span class="helper-copy">Total saved entries</span>
    </article>
    <article class="metric-block">
      <p class="kicker">Live</p>
      <strong>${activeCount}</strong>
      <span class="helper-copy">Visible on frontend</span>
    </article>
    <article class="metric-block">
      <p class="kicker">Paused</p>
      <strong>${pausedCount}</strong>
      <span class="helper-copy">Hidden but available</span>
    </article>
    <article class="metric-block">
      <p class="kicker">Clicks</p>
      <strong>${topClicks}</strong>
      <span class="helper-copy">${archivedCount} archived entries</span>
    </article>
  `;
}

function renderCreativePreview() {
  const imageUrl = eventForm.elements.imageUrl.value.trim();
  const source = uploadedCreativeDataUrl || imageUrl;
  const title = eventForm.elements.title.value.trim() || "Event title preview";
  const description = eventForm.elements.description.value.trim() || "Your public-facing event description will appear here.";
  const tag = eventForm.elements.tag.value.trim();
  const date = eventForm.elements.date.value.trim();
  const time = eventForm.elements.time.value.trim();
  const venue = eventForm.elements.venue.value.trim() || "Kerala Startup Mission";
  const buttonLabel = eventForm.elements.buttonLabel.value.trim() || "Open Event";

  const visual = source
    ? `<img src="${sanitizeText(source)}" alt="Creative preview" class="preview-image">`
    : `<div class="preview-empty"><strong>No creative selected</strong><span>Upload an image or paste a valid image URL.</span></div>`;

  creativePreview.innerHTML = `
    <article class="event-tile">
      <div class="event-visual">${visual}</div>
      <div class="event-copy">
        <div class="event-meta-row">
          ${tag ? `<span class="tag-pill">${sanitizeText(tag)}</span>` : ""}
          <span class="meta-chip">${sanitizeText(formatDate(date))}</span>
          <span class="meta-chip">${sanitizeText(formatTime(time))}</span>
          <span class="meta-chip">${sanitizeText(venue)}</span>
        </div>
        <h3>${sanitizeText(title)}</h3>
        <p class="body-copy">${sanitizeText(description)}</p>
        <div class="event-cta-row">
          <div class="detail-stack"></div>
          <span class="pill-link">${sanitizeText(buttonLabel)}</span>
        </div>
      </div>
    </article>
  `;
}

function resetFormState() {
  eventForm.reset();
  eventForm.elements.eventId.value = "";
  uploadedCreativeDataUrl = "";
  creativeUpload.value = "";
  formHeading.textContent = "Create event entry";
  deleteCurrentEventButton.classList.add("hidden");
  formStatus.textContent = "";
  formStatus.classList.remove("is-error");
  renderCreativePreview();
}

function getFilteredEvents() {
  const term = adminSearchInput.value.trim().toLowerCase();

  return getEvents()
    .slice()
    .sort((left, right) => {
      const statusScore = (value) => (value === "active" ? 3 : value === "paused" ? 2 : 1);
      const statusDiff = statusScore(right.status) - statusScore(left.status);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    })
    .filter((eventItem) => {
      if (!term) {
        return true;
      }

      return [
        eventItem.title,
        eventItem.description,
        eventItem.tag,
        eventItem.venue
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
}

function renderInventory() {
  const events = getFilteredEvents();

  if (!events.length) {
    eventList.innerHTML = `
      <article class="empty-state">
        <p class="kicker">No Entries</p>
        <h3>The backend has no event uploads yet.</h3>
        <p class="body-copy">Create the first event to populate the public frontend.</p>
      </article>
    `;
    return;
  }

  eventList.innerHTML = events.map((eventItem) => {
    const imageSource = eventItem.imageDataUrl || eventItem.imageUrl;
    return `
      <article class="inventory-card">
        <div class="inventory-card-main">
          <div class="inventory-thumb">
            ${imageSource
              ? `<img src="${sanitizeText(imageSource)}" alt="${sanitizeText(eventItem.title)} creative" class="inventory-image">`
              : `<div class="inventory-fallback">${sanitizeText((eventItem.title || "KS").slice(0, 2).toUpperCase())}</div>`
            }
          </div>
          <div class="inventory-copy">
            <div class="inventory-meta">
              <span class="status-pill">${sanitizeText(eventItem.status)}</span>
              ${eventItem.tag ? `<span class="meta-note">${sanitizeText(eventItem.tag)}</span>` : ""}
              <span class="meta-note">${sanitizeText(formatDate(eventItem.date))}</span>
            </div>
            <h3>${sanitizeText(eventItem.title)}</h3>
            <p>${sanitizeText(eventItem.description || "No description added.")}</p>
            <div class="detail-stack">
              <span class="meta-note">${sanitizeText(eventItem.venue || "Kerala Startup Mission")}</span>
              <a class="meta-note" href="${sanitizeText(eventItem.url)}" target="_blank" rel="noopener noreferrer">${sanitizeText(eventItem.url)}</a>
            </div>
          </div>
        </div>
        <div class="inventory-actions">
          <button type="button" data-edit-id="${sanitizeText(eventItem.id)}">Edit</button>
          <button type="button" data-toggle-id="${sanitizeText(eventItem.id)}">${eventItem.status === "active" ? "Pause" : "Activate"}</button>
          <button type="button" class="danger-action" data-delete-id="${sanitizeText(eventItem.id)}">Delete</button>
        </div>
      </article>
    `;
  }).join("");

  eventList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventItem = getEvents().find((entry) => entry.id === button.dataset.editId);
      if (!eventItem) {
        return;
      }

      eventForm.elements.eventId.value = eventItem.id;
      eventForm.elements.title.value = eventItem.title || "";
      eventForm.elements.status.value = eventItem.status || "active";
      eventForm.elements.url.value = eventItem.url || "";
      eventForm.elements.buttonLabel.value = eventItem.buttonLabel || "";
      eventForm.elements.date.value = eventItem.date || "";
      eventForm.elements.time.value = eventItem.time || "";
      eventForm.elements.venue.value = eventItem.venue || "";
      eventForm.elements.tag.value = eventItem.tag || "";
      eventForm.elements.sortOrder.value = eventItem.sortOrder || "";
      eventForm.elements.description.value = eventItem.description || "";
      eventForm.elements.imageUrl.value = eventItem.imageUrl || "";
      uploadedCreativeDataUrl = eventItem.imageDataUrl || "";
      creativeUpload.value = "";
      formHeading.textContent = "Edit event entry";
      deleteCurrentEventButton.classList.remove("hidden");
      formStatus.textContent = "Editing saved event.";
      formStatus.classList.remove("is-error");
      renderCreativePreview();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  eventList.querySelectorAll("[data-toggle-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextEvents = getEvents().map((eventItem) => (
        eventItem.id === button.dataset.toggleId
          ? {
              ...eventItem,
              status: eventItem.status === "active" ? "paused" : "active",
              updatedAt: new Date().toISOString()
            }
          : eventItem
      ));

      saveEvents(nextEvents);
      renderBackendMetrics();
      renderInventory();
    });
  });

  eventList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventItem = getEvents().find((entry) => entry.id === button.dataset.deleteId);
      if (!eventItem || !window.confirm(`Delete "${eventItem.title}"?`)) {
        return;
      }

      saveEvents(getEvents().filter((entry) => entry.id !== button.dataset.deleteId));
      if (eventForm.elements.eventId.value === button.dataset.deleteId) {
        resetFormState();
      }
      renderBackendMetrics();
      renderInventory();
    });
  });
}

function refreshBackend() {
  renderBackendMetrics();
  renderInventory();
}

function trySaveEventsWithFallback(record, events, existing) {
  const nextEvents = existing
    ? events.map((entry) => (entry.id === record.id ? record : entry))
    : [record, ...events];

  if (saveEvents(nextEvents)) {
    return { ok: true, imageDropped: false };
  }

  if (!record.imageDataUrl) {
    return { ok: false, imageDropped: false };
  }

  const fallbackRecord = {
    ...record,
    imageDataUrl: ""
  };

  const fallbackEvents = existing
    ? events.map((entry) => (entry.id === fallbackRecord.id ? fallbackRecord : entry))
    : [fallbackRecord, ...events];

  if (saveEvents(fallbackEvents)) {
    return { ok: true, imageDropped: true };
  }

  return { ok: false, imageDropped: false };
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (username === "admin" && password === "ksumevents") {
    setSession(true);
    loginStatus.textContent = "";
    loginStatus.classList.remove("is-error");
    loginShell.classList.add("hidden");
    dashboardApp.classList.remove("hidden");
    refreshBackend();
    return;
  }

  loginStatus.textContent = "Incorrect login. Use the demo credentials shown below the form.";
  loginStatus.classList.add("is-error");
});

logoutButton.addEventListener("click", () => {
  setSession(false);
  dashboardApp.classList.add("hidden");
  loginShell.classList.remove("hidden");
  loginStatus.textContent = "";
  loginStatus.classList.remove("is-error");
});

creativeUpload.addEventListener("change", async () => {
  const file = creativeUpload.files?.[0];
  if (!file) {
    uploadedCreativeDataUrl = "";
    renderCreativePreview();
    return;
  }

  try {
    uploadedCreativeDataUrl = await fileToOptimizedDataUrl(file);
    formStatus.textContent = "Creative uploaded successfully.";
    formStatus.classList.remove("is-error");
    renderCreativePreview();
  } catch (error) {
    formStatus.textContent = error.message;
    formStatus.classList.add("is-error");
  }
});

[
  eventForm.elements.title,
  eventForm.elements.buttonLabel,
  eventForm.elements.date,
  eventForm.elements.time,
  eventForm.elements.venue,
  eventForm.elements.tag,
  eventForm.elements.description,
  eventForm.elements.imageUrl
].forEach((field) => {
  field.addEventListener("input", renderCreativePreview);
  field.addEventListener("change", renderCreativePreview);
});

clearCreativeButton.addEventListener("click", () => {
  uploadedCreativeDataUrl = "";
  creativeUpload.value = "";
  eventForm.elements.imageUrl.value = "";
  renderCreativePreview();
});

deleteCurrentEventButton.addEventListener("click", () => {
  const currentId = String(eventForm.elements.eventId.value || "").trim();
  if (!currentId) {
    return;
  }

  const eventItem = getEvents().find((entry) => entry.id === currentId);
  if (!eventItem || !window.confirm(`Delete "${eventItem.title}"?`)) {
    return;
  }

  saveEvents(getEvents().filter((entry) => entry.id !== currentId));
  resetFormState();
  renderBackendMetrics();
  renderInventory();
  formStatus.textContent = "Event deleted.";
  formStatus.classList.remove("is-error");
});

resetFormButton.addEventListener("click", resetFormState);
adminSearchInput.addEventListener("input", renderInventory);

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(eventForm);
  const existingId = String(formData.get("eventId") || "").trim();
  const now = new Date().toISOString();
  const events = getEvents();
  const existing = events.find((entry) => entry.id === existingId);

  const record = {
    id: existingId || `event-${Date.now()}`,
    title: String(formData.get("title") || "").trim(),
    status: String(formData.get("status") || "active").trim(),
    url: String(formData.get("url") || "").trim(),
    buttonLabel: String(formData.get("buttonLabel") || "").trim() || "Open Event",
    date: String(formData.get("date") || "").trim(),
    time: String(formData.get("time") || "").trim(),
    venue: String(formData.get("venue") || "").trim(),
    tag: String(formData.get("tag") || "").trim(),
    sortOrder: Number(formData.get("sortOrder") || 0),
    description: String(formData.get("description") || "").trim(),
    imageUrl: String(formData.get("imageUrl") || "").trim(),
    imageDataUrl: uploadedCreativeDataUrl,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  const saveResult = trySaveEventsWithFallback(record, events, existing);

  if (!saveResult.ok) {
    formStatus.textContent = "Could not save this event. Please use a smaller creative or try an image URL instead.";
    formStatus.classList.add("is-error");
    return;
  }

  refreshBackend();
  resetFormState();
  formStatus.textContent = saveResult.imageDropped
    ? "Event saved, but the uploaded creative was too large for browser storage. Use a smaller image or image URL for the visual."
    : existing
      ? "Event updated."
      : "Event created.";
  formStatus.classList.toggle("is-error", saveResult.imageDropped);
});

if (hasSession()) {
  loginShell.classList.add("hidden");
  dashboardApp.classList.remove("hidden");
  refreshBackend();
}

renderCreativePreview();
