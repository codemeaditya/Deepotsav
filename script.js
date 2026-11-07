(() => {
  "use strict";

  const slides = [...document.querySelectorAll(".slide")];
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const counter = document.getElementById("slideCounter");
  const progressFill = document.getElementById("progressFill");
  const progressTrack = document.getElementById("progressTrack");

  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");

  let currentSlide = 0;
  let particles = [];
  let animationFrame = null;
  let lastFireworkTime = 0;
  let fireworkEnabled = false;

  const totalSlides = slides.length;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // -----------------------------
  // SLIDE NAVIGATION
  // -----------------------------

  function showSlide(index) {
    if (index < 0 || index >= totalSlides) return;

    currentSlide = index;

    slides.forEach((slide, i) => {
      const isActive = i === currentSlide;

      slide.classList.toggle("active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));

      if (isActive) {
        slide.scrollTop = 0;
      }
    });

    const number = String(currentSlide + 1).padStart(2, "0");
    const total = String(totalSlides).padStart(2, "0");

    counter.textContent = `${number} / ${total}`;

    progressFill.style.width =
      `${((currentSlide + 1) / totalSlides) * 100}%`;

    progressTrack.setAttribute(
      "aria-valuenow",
      String(currentSlide + 1)
    );

    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;

    // Fireworks on opening and closing slides
    fireworkEnabled = currentSlide === 0 || currentSlide === totalSlides - 1;

    if (fireworkEnabled && !reducedMotion) {
      burstFireworks();
    }

    if (!fireworkEnabled) {
      particles = [];
    }
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      showSlide(currentSlide + 1);
    }
  }

  function previousSlide() {
    if (currentSlide > 0) {
      showSlide(currentSlide - 1);
    }
  }

  nextBtn.addEventListener("click", nextSlide);
  prevBtn.addEventListener("click", previousSlide);

  // Keyboard navigation
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      nextSlide();
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      previousSlide();
    }

    if (event.key === "Home") {
      showSlide(0);
    }

    if (event.key === "End") {
      showSlide(totalSlides - 1);
    }
  });

  // -----------------------------
  // MOBILE SWIPE NAVIGATION
  // -----------------------------

  let touchStartX = 0;
  let touchStartY = 0;

  const slideArea = document.getElementById("slides");

  slideArea.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
      touchStartY = event.changedTouches[0].screenY;
    },
    { passive: true }
  );

  slideArea.addEventListener(
    "touchend",
    (event) => {
      const touchEndX = event.changedTouches[0].screenX;
      const touchEndY = event.changedTouches[0].screenY;

      const differenceX = touchEndX - touchStartX;
      const differenceY = touchEndY - touchStartY;

      // Ignore vertical scrolling gestures
      if (Math.abs(differenceX) < 65) return;
      if (Math.abs(differenceX) < Math.abs(differenceY)) return;

      if (differenceX < 0) {
        nextSlide();
      } else {
        previousSlide();
      }
    },
    { passive: true }
  );

  // -----------------------------
  // FIREWORKS ENGINE
  // -----------------------------

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const colors = [
    "#D0B47F",
    "#E8C77E",
    "#F5E4B8",
    "#C79A55",
    "#FFFFFF",
    "#B8C8D8"
  ];

  function createBurst(x, y) {
    const count = 55 + Math.floor(Math.random() * 25);
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 1.2 + Math.random() * 3.2;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        radius: 1 + Math.random() * 1.8,
        gravity: 0.035 + Math.random() * 0.025,
        decay: 0.008 + Math.random() * 0.009,
        color
      });
    }
  }

  function burstFireworks() {
    if (!fireworkEnabled || reducedMotion) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    createBurst(
      width * (0.2 + Math.random() * 0.2),
      height * (0.2 + Math.random() * 0.35)
    );

    createBurst(
      width * (0.65 + Math.random() * 0.2),
      height * (0.15 + Math.random() * 0.35)
    );
  }

  function animateFireworks(timestamp) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    if (
      fireworkEnabled &&
      !reducedMotion &&
      timestamp - lastFireworkTime > 1800
    ) {
      createBurst(
        width * (0.12 + Math.random() * 0.76),
        height * (0.12 + Math.random() * 0.4)
      );

      lastFireworkTime = timestamp;
    }

    particles = particles.filter((particle) => particle.alpha > 0.02);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      particle.vy += particle.gravity;
      particle.vx *= 0.992;
      particle.alpha -= particle.decay;

      ctx.globalAlpha = Math.max(0, particle.alpha);
      ctx.fillStyle = particle.color;

      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    animationFrame = requestAnimationFrame(animateFireworks);
  }

  // Start the canvas animation
  if (!reducedMotion) {
    animationFrame = requestAnimationFrame(animateFireworks);
  }

  // -----------------------------
  // INITIALISE
  // -----------------------------

  showSlide(0);

})();