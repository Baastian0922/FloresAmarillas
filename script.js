(() => {
  "use strict";

  const TOTAL_WATERINGS = 11;
  const WATER_DELAY = 760;
  const COOLDOWN = 900;
  const LIGHTWEIGHT_MODE = window.matchMedia("(max-width: 600px), (pointer: coarse)").matches;

  const stages = [
    { word: "", message: "Hay cosas bonitas que necesitan un poquito de tiempo..." },
    { word: "Especial ✨", message: "A veces, un pequeño gesto es suficiente para empezar." },
    { word: "Dulce 💛", message: "Mira... ya está creciendo un poquito." },
    { word: "Auténtica", message: "Todo lo bonito encuentra su propia forma." },
    { word: "Encantadora", message: "Una hoja nueva, un motivo más para sonreír." },
    { word: "Única", message: "No hay otra flor que vaya a crecer exactamente así." },
    { word: "Bonita", message: "Tu cariño le está sentando muy bien." },
    { word: "Radiante ✨", message: "Creo que ya está pasando algo... 🌻" },
    { word: "Admirable", message: "Hay un poquito de luz queriendo salir." },
    { word: "Maravillosa", message: "Un poquito más..." },
    { word: "Luminosa", message: "Ya casi están listas 🌼" },
    { word: "Preciosa", message: "Unas flores amarillas para ti 💛" }
  ];

  const experience = document.querySelector("#experience");
  const plant = document.querySelector("#plant");
  const soil = document.querySelector(".soil");
  const flowerHead = document.querySelector(".flower-head");
  const stageMessage = document.querySelector("#stageMessage");
  const touchHint = document.querySelector("#touchHint");
  const progressText = document.querySelector("#progressText");
  const progressBar = document.querySelector("#progressBar");
  const finalMessage = document.querySelector("#finalMessage");
  const flowerHitArea = document.querySelector("#flowerHitArea");
  const secretOverlay = document.querySelector("#secretOverlay");
  const closeSecret = document.querySelector("#closeSecret");
  const secretBackdrop = document.querySelector(".secret-backdrop");

  ["flower-head-2", "flower-head-3", "flower-head-4", "flower-head-5", "flower-head-6"].forEach((className) => {
    const companion = flowerHead.cloneNode(true);
    companion.classList.add(className);
    plant.insertBefore(companion, soil);
  });

  const flowerHeads = [...document.querySelectorAll(".flower-head")];

  let growthStage = 0;
  let locked = false;
  let bloomed = false;
  let firstInteraction = false;
  let lastWateredAt = 0;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createAmbientParticles() {
    const ambient = document.querySelector("#ambient");
    const amount = LIGHTWEIGHT_MODE ? 8 : 25;

    for (let index = 0; index < amount; index += 1) {
      const particle = document.createElement("i");
      particle.className = "ambient-particle";
      particle.style.left = `${random(2, 98)}%`;
      particle.style.setProperty("--size", `${random(2, 6)}px`);
      particle.style.setProperty("--duration", `${random(12, 24)}s`);
      particle.style.setProperty("--delay", `${random(-24, 0)}s`);
      particle.style.setProperty("--drift", `${random(-55, 55)}px`);
      ambient.appendChild(particle);
    }
  }

  function getSoilTarget() {
    const rect = soil.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  function makeWaterDrops(originX, originY, target) {
    const fragment = document.createDocumentFragment();
    const amount = LIGHTWEIGHT_MODE ? 6 : 11;

    for (let index = 0; index < amount; index += 1) {
      const drop = document.createElement("i");
      const startX = originX + random(-25, 25);
      const startY = originY + random(-15, 15);
      const endX = target.x + random(-30, 30);
      const endY = target.y + random(-4, 5);
      const duration = random(560, 760);
      const wait = index * 26 + random(0, 80);

      drop.className = "water-drop";
      drop.style.setProperty("--x", `${startX}px`);
      drop.style.setProperty("--y", `${startY}px`);
      drop.style.setProperty("--dx", `${endX - startX}px`);
      drop.style.setProperty("--dy", `${endY - startY}px`);
      drop.style.setProperty("--w", `${random(4, 8)}px`);
      drop.style.setProperty("--time", `${duration}ms`);
      drop.style.setProperty("--wait", `${wait}ms`);
      fragment.appendChild(drop);
      window.setTimeout(() => drop.remove(), duration + wait + 100);
    }

    document.body.appendChild(fragment);
  }

  function makeImpact(target) {
    const ripple = document.createElement("i");
    ripple.className = "soil-ripple";
    ripple.style.setProperty("--x", `${target.x}px`);
    ripple.style.setProperty("--y", `${target.y}px`);
    document.body.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 850);

    const amount = LIGHTWEIGHT_MODE ? 4 : 9;
    for (let index = 0; index < amount; index += 1) {
      const drop = document.createElement("i");
      drop.className = "impact-drop";
      drop.style.setProperty("--x", `${target.x + random(-9, 9)}px`);
      drop.style.setProperty("--y", `${target.y}px`);
      drop.style.setProperty("--dx", `${random(-38, 38)}px`);
      drop.style.setProperty("--dy", `${random(-34, -10)}px`);
      document.body.appendChild(drop);
      window.setTimeout(() => drop.remove(), 850);
    }

    plant.classList.remove("watered");
    void plant.offsetWidth;
    plant.classList.add("watered");
    window.setTimeout(() => plant.classList.remove("watered"), 750);
  }

  function showFloatingWord(word) {
    const plantRect = plant.getBoundingClientRect();
    const label = document.createElement("span");
    const narrowScreen = window.innerWidth < 600;
    const slots = narrowScreen
      ? [
          { side: -1, height: .1 },
          { side: 1, height: .14 },
          { side: -1, height: .86 },
          { side: 1, height: .88 },
          { side: -1, height: .88 },
          { side: 1, height: .86 }
        ]
      : [
          { side: -1, height: .18 },
          { side: 1, height: .27 },
          { side: -1, height: .39 },
          { side: 1, height: .5 },
          { side: -1, height: .62 },
          { side: 1, height: .72 }
        ];
    const slot = slots[(growthStage - 1) % slots.length];

    label.className = "floating-word";
    label.textContent = word;
    label.classList.add(slot.side < 0 ? "floating-word-left" : "floating-word-right");
    document.body.appendChild(label);

    const labelRect = label.getBoundingClientRect();
    const plantCenter = plantRect.left + plantRect.width / 2;
    const bouquetHalfWidth = Math.min(plantRect.width * (narrowScreen ? .39 : .5), narrowScreen ? 112 : 165);
    const clearance = narrowScreen ? 6 : 30;
    const edgePadding = narrowScreen ? 8 : 18;
    const idealX = slot.side < 0
      ? plantCenter - bouquetHalfWidth - clearance - labelRect.width / 2
      : plantCenter + bouquetHalfWidth + clearance + labelRect.width / 2;
    const x = Math.min(
      window.innerWidth - labelRect.width / 2 - edgePadding,
      Math.max(labelRect.width / 2 + edgePadding, idealX)
    );
    const idealY = plantRect.top + plantRect.height * slot.height + random(-7, 7);
    const y = Math.min(window.innerHeight - labelRect.height - 24, Math.max(18, idealY));

    label.style.setProperty("--x", `${x}px`);
    label.style.setProperty("--y", `${y}px`);
    window.setTimeout(() => label.remove(), 1750);
  }

  function setStageMessage(message) {
    stageMessage.classList.add("changing");
    window.setTimeout(() => {
      stageMessage.textContent = message;
      stageMessage.classList.remove("changing");
    }, 240);
  }

  function updateGrowthStage() {
    growthStage += 1;
    experience.className = `experience ${growthStage === TOTAL_WATERINGS ? "stage-final" : `stage-${growthStage}`}`;
    progressBar.style.setProperty("--progress", String(growthStage / TOTAL_WATERINGS));
    showFloatingWord(stages[growthStage].word);
    setStageMessage(stages[growthStage].message);

    if (growthStage >= 8 && growthStage < TOTAL_WATERINGS) {
      progressText.textContent = "🌻 Está a punto de florecer...";
    }

    if (growthStage === TOTAL_WATERINGS) {
      beginFinale();
    }
  }

  function makeSpark(x, y, delay = 0) {
    const spark = document.createElement("i");
    spark.className = "spark";
    spark.style.setProperty("--x", `${x}px`);
    spark.style.setProperty("--y", `${y}px`);
    spark.style.setProperty("--size", `${random(5, 11)}px`);
    spark.style.setProperty("--dx", `${random(-100, 100)}px`);
    spark.style.setProperty("--dy", `${random(-115, 40)}px`);
    spark.style.setProperty("--wait", `${delay}ms`);
    document.body.appendChild(spark);
    window.setTimeout(() => spark.remove(), delay + 1350);
  }

  function makeCelebration(x, y, amount = 12) {
    const symbols = ["♥", "✦", "•", "❋"];
    const particleAmount = LIGHTWEIGHT_MODE ? Math.max(5, Math.ceil(amount * .5)) : amount;

    for (let index = 0; index < particleAmount; index += 1) {
      const bit = document.createElement("i");
      bit.className = "celebration-bit";
      bit.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      bit.style.setProperty("--x", `${x + random(-16, 16)}px`);
      bit.style.setProperty("--y", `${y + random(-10, 10)}px`);
      bit.style.setProperty("--size", `${random(8, 18)}px`);
      bit.style.setProperty("--dx", `${random(-130, 130)}px`);
      bit.style.setProperty("--dy", `${random(-150, -35)}px`);
      bit.style.setProperty("--rotate", `${random(-100, 100)}deg`);
      bit.style.setProperty("--wait", `${index * 35}ms`);
      document.body.appendChild(bit);
      window.setTimeout(() => bit.remove(), 2200);
    }
  }

  function beginFinale() {
    locked = true;
    progressText.textContent = "🌻 Floreciendo...";

    window.setTimeout(() => {
      flowerHeads.forEach((head, flowerIndex) => {
        const rect = head.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const sparkAmount = LIGHTWEIGHT_MODE ? 4 : 9;
        for (let index = 0; index < sparkAmount; index += 1) {
          makeSpark(centerX, centerY, flowerIndex * 120 + index * 55);
        }
      });
    }, 260);

    window.setTimeout(() => {
      const rect = plant.getBoundingClientRect();
      makeCelebration(rect.left + rect.width / 2, rect.top + rect.height * .38, 20);
    }, 1200);
    window.setTimeout(() => {
      finalMessage.classList.add("visible");
    }, 1750);
    window.setTimeout(() => {
      bloomed = true;
      locked = false;
    }, 4600);
  }

  function waterPlant(x, y) {
    const now = Date.now();
    if (locked || bloomed || now - lastWateredAt < COOLDOWN) return;

    lastWateredAt = now;
    locked = true;
    const target = getSoilTarget();

    if (!firstInteraction) {
      firstInteraction = true;
      touchHint.classList.add("started");
    }

    makeWaterDrops(x, y, target);

    window.setTimeout(() => {
      makeImpact(target);
      updateGrowthStage();
      window.setTimeout(() => {
        if (growthStage < TOTAL_WATERINGS) locked = false;
      }, COOLDOWN - WATER_DELAY);
    }, WATER_DELAY);
  }

  function handleExperiencePointer(event) {
    if (!event.isPrimary || event.button > 0) return;
    if (event.target.closest("button, .secret-overlay")) return;

    if (bloomed) {
      makeCelebration(event.clientX, event.clientY, 10);
      plant.classList.remove("celebrate-sway");
      void plant.offsetWidth;
      plant.classList.add("celebrate-sway");
      window.setTimeout(() => plant.classList.remove("celebrate-sway"), 750);
      return;
    }

    waterPlant(event.clientX, event.clientY);
  }

  function openSecret(event) {
    event.stopPropagation();
    if (!bloomed) return;
    secretOverlay.hidden = false;
    document.body.style.cursor = "default";
    closeSecret.focus({ preventScroll: true });
    const rect = flowerHead.getBoundingClientRect();
    makeCelebration(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
  }

  function hideSecret() {
    secretOverlay.hidden = true;
    document.body.style.cursor = "";
    flowerHitArea.focus({ preventScroll: true });
  }

  experience.addEventListener("pointerdown", handleExperiencePointer);
  flowerHitArea.addEventListener("pointerdown", openSecret);
  flowerHitArea.addEventListener("click", (event) => {
    if (event.detail === 0) openSecret(event);
  });
  closeSecret.addEventListener("click", hideSecret);
  secretBackdrop.addEventListener("click", hideSecret);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !secretOverlay.hidden) {
      hideSecret();
    }
  });

  createAmbientParticles();
})();
