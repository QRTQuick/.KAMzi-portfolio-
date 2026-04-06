const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsPointerEffects = window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion;

window.requestAnimationFrame(() => {
  document.body.classList.add("is-ready");
});

const revealElements = document.querySelectorAll("[data-reveal]");
const metricValues = document.querySelectorAll("[data-count]");
const navLinks = document.querySelectorAll(".site-nav a");
const yearNodes = document.querySelectorAll("[data-year]");
const scrollRoot = document.documentElement;

yearNodes.forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const currentPage = window.location.pathname.split("/").pop() || "index.html";
navLinks.forEach((link) => {
  const target = (link.getAttribute("href") || "").split("#")[0] || "index.html";
  const isCurrent = target === currentPage;
  link.classList.toggle("is-active", isCurrent);

  if (isCurrent) {
    link.setAttribute("aria-current", "page");
  } else {
    link.removeAttribute("aria-current");
  }
});

revealElements.forEach((element) => {
  element.style.setProperty("--delay", `${element.dataset.delay || 0}ms`);
});

if (prefersReducedMotion) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

if (metricValues.length) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.counted === "true") {
          return;
        }

        animateCount(entry.target);
        entry.target.dataset.counted = "true";
        counterObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.5,
    }
  );

  metricValues.forEach((metric) => counterObserver.observe(metric));
}

function animateCount(element) {
  const target = Number(element.dataset.count || 0);
  const suffix = target === 100 ? "%" : "";
  const duration = 1400;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = `${value}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function updateScrollProgress() {
  const scrollableHeight = scrollRoot.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  scrollRoot.style.setProperty("--scroll-progress", progress.toFixed(4));
}

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

const form = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const project = String(formData.get("project") || "General project").trim();
    const message = String(formData.get("message") || "").trim();

    const subject = encodeURIComponent(`Portfolio enquiry from ${name || "a visitor"}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        `Project type: ${project}`,
        "",
        "Message:",
        message,
      ].join("\n")
    );

    if (formNote) {
      formNote.textContent = "Opening your email app with the prepared message...";
    }

    window.location.href = `mailto:owengilead@gmail.com?subject=${subject}&body=${body}`;
  });
}

if (supportsPointerEffects) {
  const cursorGlow = document.querySelector(".cursor-glow");
  const tiltCards = document.querySelectorAll(".card-tilt");
  const magneticItems = document.querySelectorAll(".magnetic");

  window.addEventListener("pointermove", (event) => {
    if (!cursorGlow) {
      return;
    }

    cursorGlow.style.opacity = "1";
    cursorGlow.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  });

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
      const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;

      card.classList.add("is-tilting");
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.transform = "";
    });
  });

  magneticItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const bounds = item.getBoundingClientRect();
      const moveX = (event.clientX - (bounds.left + bounds.width / 2)) * 0.14;
      const moveY = (event.clientY - (bounds.top + bounds.height / 2)) * 0.14;

      item.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

const canvas = document.querySelector(".nebula-canvas");
if (canvas) {
  initNebulaCanvas(canvas);
}

function initNebulaCanvas(canvasElement) {
  const context = canvasElement.getContext("2d");
  if (!context) {
    return;
  }

  let width = 0;
  let height = 0;
  let dpr = 1;
  let time = 0;
  let animationId = 0;
  let particles = [];

  const palette = getPalette();

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasElement.width = Math.floor(width * dpr);
    canvasElement.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles = Array.from({ length: 56 }, () => createParticle());
    drawFrame(false);
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.7,
      speed: Math.random() * 0.45 + 0.08,
      wave: Math.random() * 24 + 8,
      phase: Math.random() * Math.PI * 2,
      color: palette[Math.floor(Math.random() * palette.length)],
    };
  }

  function drawBackdrop() {
    context.clearRect(0, 0, width, height);

    const glow = context.createRadialGradient(width * 0.7, height * 0.14, 0, width * 0.7, height * 0.14, width * 0.75);
    glow.addColorStop(0, hexToRgba(palette[0], 0.13));
    glow.addColorStop(1, "rgba(3, 5, 13, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    const warm = context.createRadialGradient(width * 0.2, height * 0.72, 0, width * 0.2, height * 0.72, width * 0.6);
    warm.addColorStop(0, hexToRgba(palette[1], 0.12));
    warm.addColorStop(1, "rgba(3, 5, 13, 0)");
    context.fillStyle = warm;
    context.fillRect(0, 0, width, height);
  }

  function drawWave(baseY, amplitude, speed, color, lineWidth) {
    context.beginPath();

    for (let x = -40; x <= width + 40; x += 16) {
      const y = baseY
        + Math.sin(x * 0.008 + time * speed) * amplitude
        + Math.cos(x * 0.003 - time * speed * 0.6) * amplitude * 0.55;

      if (x === -40) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.shadowBlur = 18;
    context.shadowColor = color;
    context.stroke();
    context.shadowBlur = 0;
  }

  function drawParticles(shouldMove) {
    particles.forEach((particle) => {
      const driftY = Math.sin(time * 1.4 + particle.phase) * particle.wave;
      const drawY = particle.y + driftY;

      context.beginPath();
      context.fillStyle = hexToRgba(particle.color, 0.72);
      context.arc(particle.x, drawY, particle.radius, 0, Math.PI * 2);
      context.fill();

      if (!shouldMove) {
        return;
      }

      particle.x += particle.speed;
      if (particle.x > width + 20) {
        particle.x = -20;
        particle.y = Math.random() * height;
      }
    });
  }

  function drawFrame(shouldMove) {
    drawBackdrop();
    drawWave(height * 0.26, 18, 1.1, hexToRgba(palette[0], 0.24), 1.4);
    drawWave(height * 0.52, 26, 0.84, hexToRgba(palette[1], 0.18), 1.8);
    drawWave(height * 0.72, 22, 1.28, hexToRgba(palette[2], 0.16), 1.2);
    drawParticles(shouldMove);
  }

  function animate() {
    time += 0.015;
    drawFrame(true);
    animationId = window.requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);

  if (!prefersReducedMotion) {
    animationId = window.requestAnimationFrame(animate);
  }

  window.addEventListener("beforeunload", () => {
    if (animationId) {
      window.cancelAnimationFrame(animationId);
    }
  });
}

function getPalette() {
  const styles = getComputedStyle(document.body);
  return [
    styles.getPropertyValue("--accent").trim() || "#72e7ff",
    styles.getPropertyValue("--accent-strong").trim() || "#ff915d",
    styles.getPropertyValue("--accent-alt").trim() || "#ccff70",
  ];
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((part) => part + part).join("")
    : normalized;

  const numeric = Number.parseInt(value, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
