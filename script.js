const STORAGE_KEYS = {
  events: "ksumEventLinks",
  analytics: "ksumEventAnalytics",
  visitorId: "ksumEventVisitorId"
};

const eventGrid = document.querySelector("#eventGrid");
const tagFilters = document.querySelector("#tagFilters");
const searchInput = document.querySelector("#searchInput");
const activeEventCount = document.querySelector("#activeEventCount");
const trackedClickCount = document.querySelector("#trackedClickCount");
const visitorCount = document.querySelector("#visitorCount");

let activeTag = "all";

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

function ensureVisitorId() {
  const existingId = localStorage.getItem(STORAGE_KEYS.visitorId);
  if (existingId) {
    return existingId;
  }

  const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(STORAGE_KEYS.visitorId, visitorId);
  return visitorId;
}

function getVisitorId() {
  return ensureVisitorId();
}

function getEvents() {
  return readJsonStorage(STORAGE_KEYS.events, []);
}

function getAnalytics() {
  return readJsonStorage(STORAGE_KEYS.analytics, {
    pageViews: [],
    clicks: []
  });
}

function saveAnalytics(analytics) {
  writeJsonStorage(STORAGE_KEYS.analytics, analytics);
}

function sanitizeText(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(date);
}

function getSourceLabel(rawSource) {
  if (!rawSource) {
    return "Direct";
  }

  try {
    return new URL(rawSource).hostname.replace(/^www\./, "");
  } catch (error) {
    return rawSource;
  }
}

function detectDeviceType() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
}

function getActiveEvents() {
  return getEvents()
    .filter((event) => event.status === "active")
    .sort((left, right) => {
      const orderDifference = Number(right.sortOrder || 0) - Number(left.sortOrder || 0);
      if (orderDifference !== 0) {
        return orderDifference;
      }

      return new Date(left.date || 0) - new Date(right.date || 0);
    });
}

function matchesSearch(event, term) {
  if (!term) {
    return true;
  }

  const haystack = [
    event.title,
    event.description,
    event.tag,
    event.venue
  ].join(" ").toLowerCase();

  return haystack.includes(term);
}

function getVisibleEvents() {
  const term = searchInput.value.trim().toLowerCase();

  return getActiveEvents().filter((event) => {
    const matchesTag = activeTag === "all" || String(event.tag || "").trim().toLowerCase() === activeTag;
    return matchesTag && matchesSearch(event, term);
  });
}

function buildImageMarkup(event) {
  const imageSource = event.imageDataUrl || event.imageUrl;

  if (imageSource) {
    return `<img src="${sanitizeText(imageSource)}" alt="${sanitizeText(event.title)} creative" class="event-image">`;
  }

  const initials = String(event.title || "KS")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `<div class="event-image event-image-fallback">${sanitizeText(initials)}</div>`;
}

function trackPageView() {
  const analytics = getAnalytics();
  analytics.pageViews.push({
    page: "hub",
    timestamp: new Date().toISOString(),
    visitorId: getVisitorId(),
    source: document.referrer || "",
    device: detectDeviceType()
  });
  saveAnalytics(analytics);
}

function trackClick(eventItem) {
  const analytics = getAnalytics();
  analytics.clicks.push({
    eventId: eventItem.id,
    eventTitle: eventItem.title,
    url: eventItem.url,
    timestamp: new Date().toISOString(),
    visitorId: getVisitorId(),
    source: document.referrer || "",
    device: detectDeviceType()
  });
  saveAnalytics(analytics);
}

function renderHeroMetrics() {
  const analytics = getAnalytics();
  activeEventCount.textContent = String(getActiveEvents().length);
  trackedClickCount.textContent = String(analytics.clicks.length);

  const uniqueVisitors = new Set([
    ...analytics.pageViews.map((entry) => entry.visitorId),
    ...analytics.clicks.map((entry) => entry.visitorId)
  ]);

  visitorCount.textContent = String(uniqueVisitors.size);
}

function renderTagFilters() {
  const tags = Array.from(new Set(
    getActiveEvents()
      .map((event) => String(event.tag || "").trim())
      .filter(Boolean)
  )).sort((left, right) => left.localeCompare(right));

  const allTags = ["all", ...tags];

  tagFilters.innerHTML = allTags.map((tag) => {
    const normalizedTag = tag.toLowerCase();
    const label = tag === "all" ? "All" : tag;
    const activeClass = normalizedTag === activeTag ? " is-active" : "";
    return `<button type="button" class="tag-chip${activeClass}" data-tag="${sanitizeText(normalizedTag)}">${sanitizeText(label)}</button>`;
  }).join("");

  tagFilters.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTag = button.dataset.tag || "all";
      renderTagFilters();
      renderEvents();
    });
  });
}

function renderEvents() {
  const events = getVisibleEvents();

  if (!events.length) {
    eventGrid.innerHTML = `
      <article class="empty-card">
        <p class="eyebrow">No Active Events</p>
        <h3>Nothing is live right now.</h3>
        <p class="body-copy">
          Add or activate events from the admin dashboard to make them appear here.
        </p>
      </article>
    `;
    return;
  }

  eventGrid.innerHTML = events.map((eventItem) => `
    <article class="event-card">
      <div class="event-visual">
        ${buildImageMarkup(eventItem)}
      </div>
      <div class="event-content">
        <div class="event-meta">
          ${eventItem.tag ? `<span class="meta-pill">${sanitizeText(eventItem.tag)}</span>` : ""}
          ${eventItem.date ? `<span class="meta-copy">${sanitizeText(formatDate(eventItem.date))}</span>` : ""}
        </div>
        <h3>${sanitizeText(eventItem.title)}</h3>
        <p class="body-copy">${sanitizeText(eventItem.description || "Visit the event link for full details.")}</p>
        <div class="event-footer">
          <div class="meta-stack">
            ${eventItem.venue ? `<span>${sanitizeText(eventItem.venue)}</span>` : "<span>Kerala Startup Mission</span>"}
          </div>
          <button
            type="button"
            class="primary-button event-link-button"
            data-event-id="${sanitizeText(eventItem.id)}"
          >
            ${sanitizeText(eventItem.buttonLabel || "Open Event")}
          </button>
        </div>
      </div>
    </article>
  `).join("");

  eventGrid.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventItem = getEvents().find((entry) => entry.id === button.dataset.eventId);
      if (!eventItem) {
        return;
      }

      trackClick(eventItem);
      renderHeroMetrics();
      window.open(eventItem.url, "_blank", "noopener,noreferrer");
    });
  });
}

searchInput.addEventListener("input", renderEvents);

trackPageView();
renderHeroMetrics();
renderTagFilters();
renderEvents();
