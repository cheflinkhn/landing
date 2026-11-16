// Landing page behaviour: tab groups and nav tone.

// Tabs: any [data-tabs] container holds [role=tab] buttons whose aria-controls
// point at panels. Styling comes from aria-selected, so no class juggling here.
document.querySelectorAll("[data-tabs]").forEach((group) => {
  const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
  const list = group.querySelector('[role="tablist"]');
  const prev = group.querySelector("[data-tabs-prev]");
  const next = group.querySelector("[data-tabs-next]");

  // The strip scrolls sideways when the tabs don't fit. Keep the chosen tab
  // clear of the edge arrows, which cover the first and last EDGE pixels.
  const EDGE = 72;
  const reveal = (tab) => {
    const l = list.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    if (t.left < l.left + EDGE) list.scrollBy({ left: t.left - l.left - EDGE });
    else if (t.right > l.right - EDGE) list.scrollBy({ left: t.right - l.right + EDGE });
  };
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    reveal(tab);
  };

  // Each arrow shows only while there are tabs hidden on its side.
  if (prev && next) {
    const sync = () => {
      const max = list.scrollWidth - list.clientWidth;
      prev.hidden = list.scrollLeft <= 1;
      next.hidden = list.scrollLeft >= max - 1;
    };
    const page = (dir) => list.scrollBy({ left: dir * list.clientWidth * 0.6 });
    prev.addEventListener("click", () => page(-1));
    next.addEventListener("click", () => page(1));
    list.addEventListener("scroll", sync, { passive: true });
    const sizes = new ResizeObserver(sync);
    [list, ...tabs].forEach((el) => sizes.observe(el));
    sync();
  }

  // On a narrow screen the default tab can start out of sight: bring it in, unanimated.
  const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
  if (current) {
    list.style.scrollBehavior = "auto";
    reveal(current);
    list.style.scrollBehavior = "";
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault(); // or the browser also nudges the strip sideways and cancels reveal()
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      select(next);
      next.focus({ preventScroll: true }); // reveal() already scrolled the strip
    });
  });
});

// The header takes the tone (cream/ink) of the section under it.
(function () {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  const sections = Array.from(document.querySelectorAll("main [data-tone]"));
  if (!sections.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const h = nav.offsetHeight + 1;
    let tone = "cream";
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= h) tone = s.dataset.tone; });
    if (nav.dataset.tone !== tone) nav.dataset.tone = tone;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
