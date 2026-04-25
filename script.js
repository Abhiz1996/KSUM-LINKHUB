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
  const existing = localStorage.getItem(STORAGE_KEYS.visitorId);
  if (existing) {
    return existing;
  }

  const nextId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(STORAGE_KEYS.visitorId, nextId);
  return nextId;
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
    return "Date TBA";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function detectDeviceType() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
}

function getActiveEvents() {
  return getEvents()
    .filter((eventItem) => eventItem.status === "active")
    .sort((left, right) => {
      const priority = Number(right.sortOrder || 0) - Number(left.sortOrder || 0);
      if (priority !== 0) {
        return priority;
      }

      return new Date(left.date || 0) - new Date(right.date || 0);
    });
}

function matchesSearch(eventItem, term) {
  if (!term) {
    return true;
  }

  const haystack = [
    eventItem.title,
    eventItem.description,
    eventItem.tag,
    eventItem.venue
  ].join(" ").toLowerCase();

  return haystack.includes(term);
}

function getVisibleEvents() {
  const term = searchInput.value.trim().toLowerCase();

  return getActiveEvents().filter((eventItem) => {
    const matchesTag = activeTag === "all" || String(eventItem.tag || "").trim().toLowerCase() === activeTag;
    return matchesTag && matchesSearch(eventItem, term);
  });
}

function buildImageMarkup(eventItem) {
  const source = eventItem.imageDataUrl || eventItem.imageUrl;

  if (source) {
    return `<img src="${sanitizeText(source)}" alt="${sanitizeText(eventItem.title)} creative" class="event-image">`;
  }

  const initials = String(eventItem.title || "KS")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `<div class="event-image-fallback">${sanitizeText(initials)}</div>`;
}

function trackPageView() {
  const analytics = getAnalytics();
  analytics.pageViews.push({
    page: "frontend",
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

  const visitors = new Set([
    ...analytics.pageViews.map((entry) => entry.visitorId),
    ...analytics.clicks.map((entry) => entry.visitorId)
  ]);

  visitorCount.textContent = String(visitors.size);
}

function renderTagFilters() {
  const tags = Array.from(new Set(
    getActiveEvents()
      .map((eventItem) => String(eventItem.tag || "").trim())
      .filter(Boolean)
  )).sort((left, right) => left.localeCompare(right));

  const options = ["all", ...tags];

  tagFilters.innerHTML = options.map((tag) => {
    const normalized = tag.toLowerCase();
    const label = tag === "all" ? "All Events" : tag;
    const activeClass = normalized === activeTag ? " is-active" : "";
    return `<button type="button" class="filter-chip${activeClass}" data-tag="${sanitizeText(normalized)}">${sanitizeText(label)}</button>`;
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
      <article class="empty-state">
        <p class="kicker">No Live Events</p>
        <h3>There are no active programs to show right now.</h3>
        <p class="body-copy">The backend can publish new event cards whenever fresh programs are ready.</p>
      </article>
    `;
    return;
  }

  eventGrid.innerHTML = events.map((eventItem) => `
    <article class="event-tile">
      <div class="event-visual">
        ${buildImageMarkup(eventItem)}
      </div>
      <div class="event-copy">
        <div class="event-meta-row">
          ${eventItem.tag ? `<span class="tag-pill">${sanitizeText(eventItem.tag)}</span>` : ""}
          <span class="meta-note">${sanitizeText(formatDate(eventItem.date))}</span>
        </div>
        <h3>${sanitizeText(eventItem.title)}</h3>
        <p class="body-copy">${sanitizeText(eventItem.description || "Visit the event page for full information.")}</p>
        <div class="event-cta-row">
          <div class="detail-stack">
            <span class="meta-note">${sanitizeText(eventItem.venue || "Kerala Startup Mission")}</span>
            <span class="meta-note">Live public event card</span>
          </div>
          <button type="button" class="primary-button event-link-button" data-event-id="${sanitizeText(eventItem.id)}">
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
