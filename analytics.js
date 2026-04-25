const STORAGE_KEYS = {
  events: "ksumEventLinks",
  analytics: "ksumEventAnalytics",
  session: "ksumEventAdminSession"
};

const loginShell = document.querySelector("#loginShell");
const analyticsApp = document.querySelector("#analyticsApp");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const logoutButton = document.querySelector("#logoutButton");
const metricsGrid = document.querySelector("#metricsGrid");
const topEvents = document.querySelector("#topEvents");
const sourceBreakdown = document.querySelector("#sourceBreakdown");
const dailyTrend = document.querySelector("#dailyTrend");
const recentClicks = document.querySelector("#recentClicks");
const exportAnalyticsButton = document.querySelector("#exportAnalyticsButton");

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
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

function getEvents() {
  return readJsonStorage(STORAGE_KEYS.events, []);
}

function getAnalytics() {
  return readJsonStorage(STORAGE_KEYS.analytics, {
    pageViews: [],
    clicks: []
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "Unknown";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
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

function renderMetrics() {
  const events = getEvents();
  const analytics = getAnalytics();
  const activeEvents = events.filter((eventItem) => eventItem.status === "active").length;
  const uniqueVisitors = new Set([
    ...analytics.pageViews.map((entry) => entry.visitorId),
    ...analytics.clicks.map((entry) => entry.visitorId)
  ]);
  const clickThroughRate = analytics.pageViews.length
    ? Math.round((analytics.clicks.length / analytics.pageViews.length) * 100)
    : 0;

  metricsGrid.innerHTML = `
    <article class="metric-card">
      <p>Total Events</p>
      <strong>${events.length}</strong>
      <span>All stored event cards</span>
    </article>
    <article class="metric-card">
      <p>Active Events</p>
      <strong>${activeEvents}</strong>
      <span>Visible on the public hub</span>
    </article>
    <article class="metric-card">
      <p>Page Views</p>
      <strong>${analytics.pageViews.length}</strong>
      <span>Tracked public hub visits</span>
    </article>
    <article class="metric-card">
      <p>Link Clicks</p>
      <strong>${analytics.clicks.length}</strong>
      <span>Outbound event clicks</span>
    </article>
    <article class="metric-card">
      <p>Unique Visitors</p>
      <strong>${uniqueVisitors.size}</strong>
      <span>Estimated by browser storage</span>
    </article>
    <article class="metric-card">
      <p>CTR</p>
      <strong>${clickThroughRate}%</strong>
      <span>Clicks divided by page views</span>
    </article>
  `;
}

function renderTopEvents() {
  const events = getEvents();
  const clicks = getAnalytics().clicks;
  const counts = clicks.reduce((accumulator, click) => {
    accumulator[click.eventId] = (accumulator[click.eventId] || 0) + 1;
    return accumulator;
  }, {});

  const rows = events
    .map((eventItem) => ({
      title: eventItem.title,
      status: eventItem.status,
      clicks: counts[eventItem.id] || 0
    }))
    .sort((left, right) => right.clicks - left.clicks || left.title.localeCompare(right.title));

  if (!rows.length) {
    topEvents.innerHTML = '<p class="body-copy">No events available yet.</p>';
    return;
  }

  topEvents.innerHTML = rows.map((row) => `
    <article class="analytics-row">
      <div>
        <strong>${sanitizeText(row.title)}</strong>
        <span>${sanitizeText(row.status)}</span>
      </div>
      <strong>${row.clicks} clicks</strong>
    </article>
  `).join("");
}

function renderSourceBreakdown() {
  const pageViews = getAnalytics().pageViews;
  const grouped = pageViews.reduce((accumulator, entry) => {
    const label = getSourceLabel(entry.source);
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});

  const rows = Object.entries(grouped).sort((left, right) => right[1] - left[1]);

  if (!rows.length) {
    sourceBreakdown.innerHTML = '<p class="body-copy">Traffic sources will appear after the public page is visited.</p>';
    return;
  }

  sourceBreakdown.innerHTML = rows.map(([source, count]) => `
    <article class="analytics-row">
      <div>
        <strong>${sanitizeText(source)}</strong>
        <span>Hub visits</span>
      </div>
      <strong>${count}</strong>
    </article>
  `).join("");
}

function renderDailyTrend() {
  const analytics = getAnalytics();
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - index);
    days.push(day);
  }

  const rows = days.map((day) => {
    const isoDate = day.toISOString().slice(0, 10);
    const pageViews = analytics.pageViews.filter((entry) => entry.timestamp.slice(0, 10) === isoDate).length;
    const clicks = analytics.clicks.filter((entry) => entry.timestamp.slice(0, 10) === isoDate).length;

    return {
      label: new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(day),
      pageViews,
      clicks
    };
  });

  dailyTrend.innerHTML = rows.map((row) => `
    <article class="analytics-row">
      <div>
        <strong>${sanitizeText(row.label)}</strong>
        <span>${row.pageViews} views</span>
      </div>
      <strong>${row.clicks} clicks</strong>
    </article>
  `).join("");
}

function renderRecentClicks() {
  const clicks = getAnalytics().clicks
    .slice()
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 10);

  if (!clicks.length) {
    recentClicks.innerHTML = '<p class="body-copy">No clicks tracked yet.</p>';
    return;
  }

  recentClicks.innerHTML = clicks.map((click) => `
    <article class="analytics-row">
      <div>
        <strong>${sanitizeText(click.eventTitle || "Untitled event")}</strong>
        <span>${sanitizeText(getSourceLabel(click.source))} · ${sanitizeText(click.device)}</span>
      </div>
      <strong>${sanitizeText(formatDateTime(click.timestamp))}</strong>
    </article>
  `).join("");
}

function renderAnalytics() {
  renderMetrics();
  renderTopEvents();
  renderSourceBreakdown();
  renderDailyTrend();
  renderRecentClicks();
}

function exportAnalytics() {
  const clicks = getAnalytics().clicks;
  const rows = [
    ["Event Title", "Event ID", "URL", "Timestamp", "Visitor ID", "Source", "Device"],
    ...clicks.map((click) => [
      click.eventTitle || "",
      click.eventId || "",
      click.url || "",
      click.timestamp || "",
      click.visitorId || "",
      getSourceLabel(click.source || ""),
      click.device || ""
    ])
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ksum-event-clicks.csv";
  link.click();
  URL.revokeObjectURL(url);
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
    analyticsApp.classList.remove("hidden");
    renderAnalytics();
    return;
  }

  loginStatus.textContent = "Incorrect login. Use the demo credentials shown below the form.";
  loginStatus.classList.add("is-error");
});

logoutButton.addEventListener("click", () => {
  setSession(false);
  analyticsApp.classList.add("hidden");
  loginShell.classList.remove("hidden");
  loginStatus.textContent = "";
  loginStatus.classList.remove("is-error");
});

exportAnalyticsButton.addEventListener("click", exportAnalytics);

if (hasSession()) {
  loginShell.classList.add("hidden");
  analyticsApp.classList.remove("hidden");
  renderAnalytics();
}
