/* global WORKS, WORKS_UX */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return String(s ?? "").replaceAll('"', "%22");
}
function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm");
}

function renderGridTo(grid, worksList) {
  if (!grid || !Array.isArray(worksList)) return;
  grid.innerHTML = worksList
    .map((w) => {
      const containClass = w.coverFit === "contain" ? " card--cover-contain" : "";
      const isVideo = isVideoUrl(w.cover);
      const posterTime = w.coverVideoTime ?? 5;
      const mediaHtml = isVideo
        ? `<video class="card__video" src="${escapeAttr(w.cover)}" preload="metadata" muted playsinline data-cover-time="${posterTime}"></video>`
        : `<img class="card__img" src="${escapeAttr(w.cover)}" alt="" loading="lazy" />`;
      return `
        <article class="card${containClass}" tabindex="0" role="button" aria-label="${escapeHtml(w.title)} 상세 보기" data-work-id="${escapeHtml(w.id)}">
          ${mediaHtml}
        </article>
      `;
    })
    .join("");

  $$(".card__video", grid).forEach((video) => {
    const t = parseFloat(video.dataset.coverTime) || 5;
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = t;
      video.pause();
    });
  });
}

function renderGrid() {
  renderGridTo($("#worksGrid"), WORKS);
  renderGridTo($("#worksGridUx"), typeof WORKS_UX !== "undefined" ? WORKS_UX : []);
}

function bindEvents() {
  function bindGridClick(gridEl) {
    if (!gridEl) return;
    gridEl.addEventListener("click", (e) => {
      const card = e.target instanceof Element ? e.target.closest(".card") : null;
      if (!card) return;
      const id = card.getAttribute("data-work-id");
      if (id) window.location.href = "work-detail.html?work=" + encodeURIComponent(id);
    });
    gridEl.addEventListener("keydown", (e) => {
      if (!(e.target instanceof Element)) return;
      const card = e.target.closest(".card");
      if (!card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const id = card.getAttribute("data-work-id");
        if (id) window.location.href = "work-detail.html?work=" + encodeURIComponent(id);
      }
    });
  }
  bindGridClick($("#worksGrid"));
  bindGridClick($("#worksGridUx"));

  const cover = $(".cover");
  const works = $("#works");
  if (cover && works) {
    let coverScrollLocked = false;
    cover.addEventListener("wheel", (e) => {
      if (coverScrollLocked) return;
      const coverRect = cover.getBoundingClientRect();
      if (coverRect.top > -40 && coverRect.top < 40 && e.deltaY > 0) {
        coverScrollLocked = true;
        works.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => (coverScrollLocked = false), 650);
      }
    }, { passive: true });
  }
}

function init() {
  renderGrid();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", init);
