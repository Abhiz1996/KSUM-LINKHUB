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
const adminSearchInput = document.querySelector("#adminSearchInput");
const eventList = document.querySelector("#eventList");

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
  writeJsonStorage(STORAGE_KEYS.events, events);
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

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function renderCreativePreview() {
  const imageUrl = eventForm.elements.imageUrl.value.trim();
  const previewSource = uploadedCreativeDataUrl || imageUrl;

  if (!previewSource) {
    creativePreview.innerHTML = `
      <div class="creative-empty">
        <strong>No creative selected</strong>
        <span>Upload an image or paste an image URL to preview it here.</span>
      </div>
    `;
    return;
  }

  creativePreview.innerHTML = `<img src="${sanitizeText(previewSource)}" alt="Event creative preview" class="creative-image">`;
}

function resetFormState() {
  eventForm.reset();
  eventForm.elements.eventId.value = "";
  uploadedCreativeDataUrl = "";
  creativeUpload.value = "";
  formHeading.textContent = "Create event";
  renderCreativePreview();
}

function getFilteredEvents() {
  const term = adminSearchInput.value.trim().toLowerCase();

  return getEvents()
    .slice()
    .sort((left, right) => {
      const statusScore = (value) => (value === "active" ? 3 : value === "paused" ? 2 : 1);
      const statusDifference = statusScore(right.status) - statusScore(left.status);
      if (statusDifference !== 0) {
        return statusDifference;
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

function renderEventList() {
  const events = getFilteredEvents();

  if (!events.length) {
    eventList.innerHTML = `
      <article class="empty-card">
        <p class="eyebrow">No Events Yet</p>
        <h3>Your event inventory is empty.</h3>
        <p class="body-copy">Create the first event to publish it on the public hub.</p>
      </article>
    `;
    return;
  }

  eventList.innerHTML = events.map((eventItem) => {
    const imageSource = eventItem.imageDataUrl || eventItem.imageUrl;
    return `
      <article class="admin-card">
        <div class="admin-card-main">
          <div class="admin-thumb">
            ${imageSource
              ? `<img src="${sanitizeText(imageSource)}" alt="${sanitizeText(eventItem.title)} creative" class="admin-thumb-image">`
              : `<div class="admin-thumb-fallback">${sanitizeText((eventItem.title || "KS").slice(0, 2).toUpperCase())}</div>`
            }
          </div>

          <div class="admin-copy">
            <div class="admin-meta-row">
              <span class="meta-pill">${sanitizeText(eventItem.status)}</span>
              ${eventItem.tag ? `<span class="meta-copy">${sanitizeText(eventItem.tag)}</span>` : ""}
              ${eventItem.date ? `<span class="meta-copy">${sanitizeText(formatDate(eventItem.date))}</span>` : ""}
            </div>
            <h3>${sanitizeText(eventItem.title)}</h3>
            <p class="body-copy">${sanitizeText(eventItem.description || "No description added.")}</p>
            <div class="meta-stack">
              <span>${sanitizeText(eventItem.venue || "Kerala Startup Mission")}</span>
              <a href="${sanitizeText(eventItem.url)}" target="_blank" rel="noopener noreferrer">${sanitizeText(eventItem.url)}</a>
            </div>
          </div>
        </div>

        <div class="button-row">
          <button type="button" class="ghost-button" data-edit-id="${sanitizeText(eventItem.id)}">Edit</button>
          <button type="button" class="ghost-button" data-toggle-id="${sanitizeText(eventItem.id)}">
            ${eventItem.status === "active" ? "Pause" : "Activate"}
          </button>
          <button type="button" class="danger-button" data-delete-id="${sanitizeText(eventItem.id)}">Delete</button>
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
      eventForm.elements.venue.value = eventItem.venue || "";
      eventForm.elements.tag.value = eventItem.tag || "";
      eventForm.elements.sortOrder.value = eventItem.sortOrder || "";
      eventForm.elements.description.value = eventItem.description || "";
      eventForm.elements.imageUrl.value = eventItem.imageUrl || "";
      uploadedCreativeDataUrl = eventItem.imageDataUrl || "";
      creativeUpload.value = "";
      formHeading.textContent = "Edit event";
      formStatus.textContent = "Editing existing event.";
      formStatus.classList.remove("is-error");
      renderCreativePreview();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  eventList.querySelectorAll("[data-toggle-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventsCollection = getEvents().map((eventItem) => (
        eventItem.id === button.dataset.toggleId
          ? {
              ...eventItem,
              status: eventItem.status === "active" ? "paused" : "active",
              updatedAt: new Date().toISOString()
            }
          : eventItem
      ));

      saveEvents(eventsCollection);
      renderEventList();
    });
  });

  eventList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventItem = getEvents().find((entry) => entry.id === button.dataset.deleteId);
      if (!eventItem || !window.confirm(`Delete "${eventItem.title}"?`)) {
        return;
      }

      saveEvents(getEvents().filter((entry) => entry.id !== button.dataset.deleteId));
      renderEventList();

      if (eventForm.elements.eventId.value === button.dataset.deleteId) {
        resetFormState();
      }
    });
  });
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
    renderEventList();
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
    uploadedCreativeDataUrl = await fileToDataUrl(file);
    formStatus.textContent = "Creative uploaded successfully.";
    formStatus.classList.remove("is-error");
    renderCreativePreview();
  } catch (error) {
    formStatus.textContent = error.message;
    formStatus.classList.add("is-error");
  }
});

eventForm.elements.imageUrl.addEventListener("input", renderCreativePreview);
clearCreativeButton.addEventListener("click", () => {
  uploadedCreativeDataUrl = "";
  creativeUpload.value = "";
  eventForm.elements.imageUrl.value = "";
  renderCreativePreview();
});

resetFormButton.addEventListener("click", resetFormState);
adminSearchInput.addEventListener("input", renderEventList);

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(eventForm);
  const existingId = String(formData.get("eventId") || "").trim();
  const now = new Date().toISOString();

  const record = {
    id: existingId || `event-${Date.now()}`,
    title: String(formData.get("title") || "").trim(),
    status: String(formData.get("status") || "active").trim(),
    url: String(formData.get("url") || "").trim(),
    buttonLabel: String(formData.get("buttonLabel") || "").trim() || "Open Event",
    date: String(formData.get("date") || "").trim(),
    venue: String(formData.get("venue") || "").trim(),
    tag: String(formData.get("tag") || "").trim(),
    sortOrder: Number(formData.get("sortOrder") || 0),
    description: String(formData.get("description") || "").trim(),
    imageUrl: String(formData.get("imageUrl") || "").trim(),
    imageDataUrl: uploadedCreativeDataUrl,
    createdAt: now,
    updatedAt: now
  };

  const eventsCollection = getEvents();
  const existingRecord = eventsCollection.find((entry) => entry.id === record.id);

  if (existingRecord) {
    record.createdAt = existingRecord.createdAt || now;
  }

  const nextEvents = existingRecord
    ? eventsCollection.map((entry) => (entry.id === record.id ? record : entry))
    : [record, ...eventsCollection];

  saveEvents(nextEvents);
  formStatus.textContent = existingRecord ? "Event updated." : "Event created.";
  formStatus.classList.remove("is-error");
  renderEventList();
  resetFormState();
});

if (hasSession()) {
  loginShell.classList.add("hidden");
  dashboardApp.classList.remove("hidden");
  renderEventList();
}

renderCreativePreview();
