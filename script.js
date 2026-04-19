const introScreen = document.querySelector("#introScreen");
const invitation = document.querySelector("#invitation");
const openInvite = document.querySelector("#openInvite");
const flowerRain = document.querySelector(".flower-rain");
const pageLoader = document.querySelector("#pageLoader");
const heroImage = document.querySelector(".hero-photo img");
const countdownPanel = document.querySelector("#countdownPanel");
const countdownFireworks = document.querySelector("#countdownFireworks");
const countdownCards = {
  days: document.querySelector("#days").closest("div"),
  hours: document.querySelector("#hours").closest("div"),
  minutes: document.querySelector("#minutes").closest("div"),
  seconds: document.querySelector("#seconds").closest("div")
};
const countdownValues = {};
let hasPlayedCountdownCelebration = false;

const ceremonyStart = new Date("2026-05-25T11:56:00+05:30");
const ceremonyEnd = new Date("2026-05-25T12:46:00+05:30");
const receptionStart = new Date("2026-05-28T17:30:00+05:30");
const receptionEnd = new Date("2026-05-28T21:30:00+05:30");

const events = {
  ceremony: {
    title: "Wedding Ceremony - Ananthu & Anagha",
    description: "Join us for the wedding ceremony of Ananthu and Anagha. Muhurtham: 11:56 am - 12:46 pm",
    location: "Qatar Auditorium, Thirunavaya, Malappuram",
    start: ceremonyStart,
    end: ceremonyEnd,
    file: "wedding-ceremony.ics"
  },
  reception: {
    title: "Bride Groom Reception - Ananthu & Anagha",
    description: "Join us for the bride groom reception of Ananthu and Anagha.",
    location: "Comet Hall, Al-Saj, Kazhakkoottam, Thiruvananthapuram",
    start: receptionStart,
    end: receptionEnd,
    file: "wedding-reception.ics"
  }
};

function createFlowers() {
  for (let index = 0; index < 14; index += 1) {
    const flower = document.createElement("span");
    flower.className = index % 3 === 0 ? "falling-flower golden-flower" : "falling-flower jasmine-flower";
    flower.style.left = `${(index + 1) * 7}%`;
    flower.style.animationDuration = `${12 + index * 1.2}s`;
    flower.style.animationDelay = `${index * -1.4}s`;
    flower.style.setProperty("--flower-scale", `${0.78 + (index % 4) * 0.1}`);
    flowerRain.appendChild(flower);
  }
}

function hidePageLoader() {
  if (!pageLoader) {
    return;
  }

  pageLoader.classList.add("is-hidden");
  document.body.classList.remove("is-loading");

  window.setTimeout(() => {
    pageLoader.setAttribute("hidden", "");
  }, 450);
}

function waitForHeroImage() {
  if (!heroImage || heroImage.complete) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    heroImage.addEventListener("load", resolve, { once: true });
    heroImage.addEventListener("error", resolve, { once: true });
  });
}

function waitForFonts() {
  if (!document.fonts || typeof document.fonts.ready?.then !== "function") {
    return Promise.resolve();
  }

  return document.fonts.ready.catch(() => undefined);
}

function revealInvitation() {
  introScreen.classList.add("is-opening");
  introScreen.classList.add("is-open");
  invitation.classList.add("is-visible");
  invitation.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    introScreen.setAttribute("hidden", "");
  }, 900);
}

function formatGoogleCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function openGoogleCalendar(eventName) {
  const eventData = events[eventName];
  const url = new URL("https://calendar.google.com/calendar/render");

  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", eventData.title);
  url.searchParams.set("details", eventData.description);
  url.searchParams.set("location", eventData.location);
  url.searchParams.set(
    "dates",
    `${formatGoogleCalendarDate(eventData.start)}/${formatGoogleCalendarDate(eventData.end)}`
  );

  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

function openLocation(query) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function setCountdownValue(unit, value) {
  const paddedValue = String(value).padStart(2, "0");
  const element = document.querySelector(`#${unit}`);
  const card = countdownCards[unit];

  if (countdownValues[unit] === paddedValue) {
    return;
  }

  countdownValues[unit] = paddedValue;
  element.textContent = paddedValue;
  card.classList.remove("is-flipping");
  void card.offsetWidth;
  card.classList.add("is-flipping");
}

function updateCountdown() {
  const now = new Date();
  const remaining = Math.max(ceremonyStart.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setCountdownValue("days", days);
  setCountdownValue("hours", hours);
  setCountdownValue("minutes", minutes);
  setCountdownValue("seconds", seconds);
}

function triggerCountdownCelebration() {
  if (!countdownPanel || !countdownFireworks || hasPlayedCountdownCelebration) {
    return;
  }

  hasPlayedCountdownCelebration = true;
  countdownFireworks.replaceChildren();

  const bursts = [
    { x: "12%", y: "24%" },
    { x: "26%", y: "64%" },
    { x: "43%", y: "22%" },
    { x: "57%", y: "70%" },
    { x: "73%", y: "28%" },
    { x: "86%", y: "54%" }
  ];
  const sparkPalette = ["#ffd663", "#ff9a7c", "#f7e7a5", "#7fb8c8", "#f4b169", "#e87e6b"];

  bursts.forEach((position, index) => {
    const burst = document.createElement("span");
    burst.className = "firework-burst";
    burst.style.setProperty("--x", position.x);
    burst.style.setProperty("--y", position.y);

    for (let sparkIndex = 0; sparkIndex < 12; sparkIndex += 1) {
      const spark = document.createElement("i");
      spark.style.setProperty("--angle", `${sparkIndex * 30}deg`);
      spark.style.setProperty("--spark-color", sparkPalette[(index + sparkIndex) % sparkPalette.length]);
      spark.style.animationDelay = `${index * 160 + sparkIndex * 18}ms`;
      burst.appendChild(spark);
    }

    countdownFireworks.appendChild(burst);
  });

  countdownPanel.classList.remove("is-celebrating");
  void countdownPanel.offsetWidth;
  countdownPanel.classList.add("is-celebrating");
  countdownFireworks.classList.add("is-active");

  window.setTimeout(() => {
    countdownFireworks.classList.remove("is-active");
    countdownPanel.classList.remove("is-celebrating");
    countdownFireworks.replaceChildren();
  }, 2600);
}

function watchCountdownCelebration() {
  if (!countdownPanel) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    triggerCountdownCelebration();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (!entry?.isIntersecting || entry.intersectionRatio < 0.45) {
        return;
      }

      triggerCountdownCelebration();
      observer.disconnect();
    },
    {
      threshold: [0.45, 0.65]
    }
  );

  observer.observe(countdownPanel);
}

openInvite.addEventListener("click", revealInvitation);

document.querySelectorAll("[data-calendar]").forEach((button) => {
  button.addEventListener("click", () => openGoogleCalendar(button.dataset.calendar));
});

document.querySelectorAll("[data-location]").forEach((button) => {
  button.addEventListener("click", () => openLocation(button.dataset.location));
});

createFlowers();
updateCountdown();
window.setInterval(updateCountdown, 1000);
watchCountdownCelebration();

window.addEventListener("load", async () => {
  await Promise.all([waitForFonts(), waitForHeroImage()]);
  hidePageLoader();
});
