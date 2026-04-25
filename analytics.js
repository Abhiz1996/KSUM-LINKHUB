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
const overviewBoard = document.querySelector("#overviewBoard");
const topEvents = document.querySelector("#topEvents");
const sourceBreakdown = document.querySelector("#sourceBreakdown");
const dailyTrend = document.querySelector("#dailyTrend");
const recentClicks = document.querySelector("#recentClicks");
const eventAnalyticsGrid = document.querySelector("#eventAnalyticsGrid");
const exportAnalyticsButton = document.querySelector("#exportAnalyticsButton");

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
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
  const uniqueVisitors = new Set([
    ...analytics.pageViews.map((entry) => entry.visitorId),
    ...analytics.clicks.map((entry) => entry.visitorId)
  ]);
  const activeCount = events.filter((eventItem) => eventItem.status === "active").length;
  const ctr = analytics.pageViews.length ? Math.round((analytics.clicks.length / analytics.pageViews.length) * 100) : 0;

  metricsGrid.innerHTML = `
    <article class="metric-block">
      <p class="kicker">Events</p>
      <strong>${events.length}</strong>
      <span class="helper-copy">${activeCount} active on frontend</span>
    </article>
    <article class="metric-block">
      <p class="kicker">Views</p>
      <strong>${analytics.pageViews.length}</strong>
      <span class="helper-copy">Tracked public visits</span>
    </article>
    <article class="metric-block">
      <p class="kicker">Clicks</p>
      <strong>${analytics.clicks.length}</strong>
      <span class="helper-copy">Outbound event link clicks</span>
    </article>
    <article class="metric-block">
      <p class="kicker">CTR</p>
      <strong>${ctr}%</strong>
      <span class="helper-copy">${uniqueVisitors.size} unique visitors</span>
    </article>
  `;
}

function buildEventPerformanceRows() {
  const events = getEvents();
  const analytics = getAnalytics();
  const clicksByEvent = analytics.clicks.reduce((accumulator, click) => {
    accumulator[click.eventId] = accumulator[click.eventId] || [];
    accumulator[click.eventId].push(click);
    return accumulator;
  }, {});

  return events.map((eventItem) => {
    const clicks = clicksByEvent[eventItem.id] || [];
    const uniqueVisitors = new Set(clicks.map((entry) => entry.visitorId)).size;
    const latestClick = clicks.length
      ? clicks.slice().sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))[0].timestamp
      : "";

    return {
      id: eventItem.id,
      title: eventItem.title,
      status: eventItem.status,
      tag: eventItem.tag,
      venue: eventItem.venue,
      clicks: clicks.length,
      uniqueVisitors,
      latestClick,
      url: eventItem.url
    };
  }).sort((left, right) => right.clicks - left.clicks || left.title.localeCompare(right.title));
}

function renderOverviewBoard() {
  const analytics = getAnalytics();
  const eventRows = buildEventPerformanceRows();
  const topEvent = eventRows[0];
  const sourceCounts = analytics.pageViews.reduce((accumulator, entry) => {
    const label = getSourceLabel(entry.source);
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});
  const topSource = Object.entries(sourceCounts).sort((left, right) => right[1] - left[1])[0];
  const activePerforming = eventRows.filter((row) => row.status === "active" && row.clicks > 0).length;

  overviewBoard.innerHTML = `
    <article class="overview-card">
      <strong>${topEvent ? sanitizeText(topEvent.title) : "No data yet"}</strong>
      <span>Top performing event</span>
      <small>${topEvent ? `${topEvent.clicks} clicks` : "No click activity yet"}</small>
    </article>
    <article class="overview-card">
      <strong>${topSource ? sanitizeText(topSource[0]) : "Direct"}</strong>
      <span>Top traffic source</span>
      <small>${topSource ? `${topSource[1]} visits` : "No source data yet"}</small>
    </article>
    <article class="overview-card">
      <strong>${activePerforming}</strong>
      <span>Active events with clicks</span>
      <small>Events generating measurable engagement</small>
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
    topEvents.innerHTML = '<article class="empty-state"><p class="body-copy">No event data available yet.</p></article>';
    return;
  }

  topEvents.innerHTML = rows.map((row) => `
    <article class="analytic-row">
      <div>
        <strong>${sanitizeText(row.title)}</strong>
        <span>${sanitizeText(row.status)}</span>
      </div>
      <strong>${row.clicks}</strong>
    </article>
  `).join("");
}

function renderSourceBreakdown() {
  const grouped = getAnalytics().pageViews.reduce((accumulator, entry) => {
    const label = getSourceLabel(entry.source);
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});

  const rows = Object.entries(grouped).sort((left, right) => right[1] - left[1]);

  if (!rows.length) {
    sourceBreakdown.innerHTML = '<article class="empty-state"><p class="body-copy">Traffic sources will appear after visits land on the public frontend.</p></article>';
    return;
  }

  sourceBreakdown.innerHTML = rows.map(([label, count]) => `
    <article class="analytic-row">
      <div>
        <strong>${sanitizeText(label)}</strong>
        <span>Frontend visits</span>
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
    const iso = day.toISOString().slice(0, 10);
    return {
      label: new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(day),
      views: analytics.pageViews.filter((entry) => entry.timestamp.slice(0, 10) === iso).length,
      clicks: analytics.clicks.filter((entry) => entry.timestamp.slice(0, 10) === iso).length
    };
  });

  dailyTrend.innerHTML = rows.map((row) => `
    <article class="analytic-row">
      <div>
        <strong>${sanitizeText(row.label)}</strong>
        <span>${row.views} views</span>
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
    recentClicks.innerHTML = '<article class="empty-state"><p class="body-copy">No clicks have been recorded yet.</p></article>';
    return;
  }

  recentClicks.innerHTML = clicks.map((click) => `
    <article class="analytic-row">
      <div>
        <strong>${sanitizeText(click.eventTitle || "Untitled event")}</strong>
        <span>${sanitizeText(getSourceLabel(click.source))} · ${sanitizeText(click.device)}</span>
      </div>
      <strong>${sanitizeText(formatDateTime(click.timestamp))}</strong>
    </article>
  `).join("");
}

function renderEventAnalyticsGrid() {
  const rows = buildEventPerformanceRows();

  if (!rows.length) {
    eventAnalyticsGrid.innerHTML = '<article class="empty-state"><p class="body-copy">Create events to unlock per-event analytics.</p></article>';
    return;
  }

  eventAnalyticsGrid.innerHTML = rows.map((row) => `
    <article class="event-analytics-card">
      <div class="event-analytics-head">
        <div>
          <strong>${sanitizeText(row.title)}</strong>
          <span>${sanitizeText(row.status)}${row.tag ? ` · ${sanitizeText(row.tag)}` : ""}</span>
        </div>
        <span class="status-pill">${row.clicks} clicks</span>
      </div>
      <div class="event-analytics-stats">
        <div>
          <strong>${row.uniqueVisitors}</strong>
          <span>Unique visitors</span>
        </div>
        <div>
          <strong>${sanitizeText(row.venue || "KSUM")}</strong>
          <span>Venue</span>
        </div>
        <div>
          <strong>${row.latestClick ? sanitizeText(formatDateTime(row.latestClick)) : "No clicks yet"}</strong>
          <span>Latest click</span>
        </div>
      </div>
      <a class="meta-note" href="${sanitizeText(row.url)}" target="_blank" rel="noopener noreferrer">${sanitizeText(row.url)}</a>
    </article>
  `).join("");
}

function renderAnalytics() {
  renderMetrics();
  renderOverviewBoard();
  renderTopEvents();
  renderSourceBreakdown();
  renderDailyTrend();
  renderRecentClicks();
  renderEventAnalyticsGrid();
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
  link.download = "ksum-linkhub-clicks.csv";
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
