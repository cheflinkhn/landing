// Landing page behaviour: tab groups and nav tone.

// Tabs: any [data-tabs] container holds [role=tab] buttons whose aria-controls
// point at panels. Styling comes from aria-selected, so no class juggling here.
document.querySelectorAll("[data-tabs]").forEach((group) => {
  const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      select(next);
      next.focus();
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
