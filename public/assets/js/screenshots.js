// Screenshot tabs
const tabs = document.querySelectorAll(".screenshot-tab");
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    tabs.forEach((t) => {
      const active = t.dataset.tab === target;
      t.setAttribute("aria-selected", active);
      t.className = active
        ? "screenshot-tab rounded-full border border-clay-500 bg-clay-500 px-4 py-1.5 text-sm font-medium text-white transition-colors"
        : "screenshot-tab rounded-full border border-sand-200 bg-white px-4 py-1.5 text-sm font-medium text-sand-600 transition-colors hover:border-sand-300 hover:text-ink";
      document.getElementById("tab-panel-" + t.dataset.tab).classList.toggle("hidden", !active);
    });
  });
});

// Phone carousel — labels are read from data-labels on #phone-carousel
(function () {
  const track = document.getElementById("carousel-track");
  const dotsContainer = document.getElementById("carousel-dots");
  const label = document.getElementById("carousel-label");
  if (!track) return;

  const carousel = document.getElementById("phone-carousel");
  const labels = JSON.parse(carousel?.dataset.labels || "[]");

  const slides = Array.from(track.children);
  let current = 0;

  const dotClass = {
    active: "h-2 w-6 rounded-full bg-clay-500 transition-all duration-300",
    inactive: "h-2 w-2 rounded-full bg-sand-300 transition-all duration-300 cursor-pointer hover:bg-sand-400",
  };

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", labels[i] || String(i + 1));
    dot.className = i === 0 ? dotClass.active : dotClass.inactive;
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    if (label) label.textContent = labels[current] || "";
    Array.from(dotsContainer.children).forEach((dot, i) => {
      dot.className = i === current ? dotClass.active : dotClass.inactive;
      dot.setAttribute("aria-selected", i === current);
    });
  }

  goTo(0);

  document.getElementById("carousel-prev").addEventListener("click", () => goTo(current - 1));
  document.getElementById("carousel-next").addEventListener("click", () => goTo(current + 1));

  let startX = 0;
  track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });
}());
