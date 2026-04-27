const invitationButton = document.querySelector("#openInvitationButton");
const invitationCardButton = document.querySelector("#invitationCardButton");
const countdownGrid = document.querySelector("#countdownGrid");
const revealTargets = document.querySelectorAll(".reveal");
const petalLayer = document.querySelector("#petalLayer");

const receptionDate = new Date("2026-06-17T18:00:00+05:30");

document.body.classList.add("motion-ready");

function updateCountdown() {
  if (!countdownGrid) {
    return;
  }

  const now = new Date();
  const distance = Math.max(receptionDate.getTime() - now.getTime(), 0);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  const values = [days, hours, minutes, seconds];
  countdownGrid.querySelectorAll("strong").forEach((node, index) => {
    node.textContent = String(values[index]).padStart(2, "0");
  });
}

function openInvitation() {
  document.body.classList.add("invitation-opened");
  document.querySelector("#weddingCard")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function toggleCard() {
  if (!invitationCardButton) {
    return;
  }

  const isOpen = invitationCardButton.classList.toggle("is-open");
  invitationCardButton.setAttribute("aria-expanded", String(isOpen));
}

function setupRevealObserver() {
  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  revealTargets.forEach((target) => observer.observe(target));
}

function createPetals() {
  if (!petalLayer) {
    return;
  }

  for (let index = 0; index < 16; index += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDelay = `${Math.random() * 8}s`;
    petal.style.animationDuration = `${10 + Math.random() * 8}s`;
    petal.style.opacity = `${0.18 + Math.random() * 0.4}`;
    petal.style.transform = `scale(${0.7 + Math.random() * 0.8}) rotate(${Math.random() * 360}deg)`;
    petalLayer.append(petal);
  }
}

function trackCardGlow(event) {
  if (!invitationCardButton) {
    return;
  }

  const bounds = invitationCardButton.getBoundingClientRect();
  const offsetX = ((event.clientX - bounds.left) / bounds.width) * 100;
  const offsetY = ((event.clientY - bounds.top) / bounds.height) * 100;

  invitationCardButton.style.setProperty("--glow-x", `${offsetX}%`);
  invitationCardButton.style.setProperty("--glow-y", `${offsetY}%`);
}

invitationButton?.addEventListener("click", openInvitation);
invitationCardButton?.addEventListener("click", toggleCard);
invitationCardButton?.addEventListener("pointermove", trackCardGlow);

updateCountdown();
setInterval(updateCountdown, 1000);
setupRevealObserver();
createPetals();
