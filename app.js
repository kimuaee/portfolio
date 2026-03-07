/* global WORKS */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  activeWorkId: null,
  activeWorkImages: null,
  activeImgIdx: 0,
  coverScrollLocked: false,
  lastFocusedEl: null,
};

function categoryLabel(category) {
  switch (category) {
    case "branding":
      return "Branding";
    case "poster":
      return "Poster";
    case "editorial":
      return "Editorial";
    case "digital":
      return "Digital";
    default:
      return category ?? "";
  }
}

function renderGrid() {
  const grid = $("#worksGrid");
  if (!grid) return;

  grid.innerHTML = WORKS
    .map((w) => {
      const containClass = w.coverFit === "contain" ? " card--cover-contain" : "";
      const isVideo = isVideoUrl(w.cover);
      const posterTime = w.coverVideoTime ?? 5;
      const mediaHtml = isVideo
        ? `<video class="card__video" src="${escapeAttr(w.cover)}" preload="metadata" muted playsinline data-cover-time="${posterTime}"></video>`
        : `<img class="card__img" src="${escapeAttr(w.cover)}" alt="" loading="lazy" />`;
      return `
        <article class="card${containClass}" tabindex="0" role="button" aria-label="${escapeHtml(
          w.title
        )} 상세 보기" data-work-id="${escapeHtml(w.id)}">
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

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(s) {
  return String(s ?? "").replaceAll('"', "%22");
}

function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm");
}

function openWork(workId, { pushHash = true } = {}) {
  const work = WORKS.find((w) => w.id === workId);
  if (!work) return;

  const displayImages = [work.cover, ...(work.images ?? [])];
  state.activeWorkId = workId;
  state.activeWorkImages = displayImages;
  state.activeImgIdx = 0;
  state.lastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const modal = $("#workModal");
  const mainImg = $("#mainImg");
  const mainVideo = $("#mainVideo");
  const thumbs = $("#thumbs");
  const modalTitle = $("#modalTitle");
  const modalKicker = $("#modalKicker");
  const modalMeta = $("#modalMeta");
  const modalDesc = $("#modalDesc");

  if (!modal || !mainImg || !thumbs || !modalTitle || !modalKicker || !modalMeta || !modalDesc) {
    return;
  }

  modalTitle.textContent = work.title;
  modalKicker.textContent = categoryLabel(work.category);

  const yearHtml = work.year ? `<span class="meta-pill is-accent">${escapeHtml(work.year)}</span>` : "";
  const roleHtml = work.role ? `<span class="meta-pill">${escapeHtml(work.role)}</span>` : "";
  modalMeta.innerHTML = `
    <div class="meta-row">
      ${yearHtml}
      ${roleHtml}
    </div>
    <div class="meta-row">
      ${(work.tags ?? [])
        .map((t) => `<span class="meta-pill">${escapeHtml(t)}</span>`)
        .join("")}
    </div>
  `;

  modalDesc.textContent = work.description ?? "";

  const posterTime = work.coverVideoTime ?? 5;
  thumbs.innerHTML = displayImages
    .map((src, idx) => {
      const isActive = idx === 0 ? "is-active" : "";
      const isVideo = isVideoUrl(src);
      const inner = isVideo
        ? `<video src="${escapeAttr(src)}" preload="metadata" muted playsinline data-poster-time="${posterTime}"></video>`
        : `<img src="${escapeAttr(src)}" alt="" loading="lazy" />`;
      return `
        <button class="thumb ${isActive}" type="button" data-idx="${idx}" aria-label="${isVideo ? "영상" : "이미지"} ${
          idx + 1
        } 보기">
          ${inner}
        </button>
      `;
    })
    .join("");

  $$("video", thumbs).forEach((video) => {
    const t = parseFloat(video.dataset.posterTime) || 5;
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = t;
      video.pause();
    });
  });

  if (mainVideo) {
    mainVideo.style.display = "none";
    mainVideo.pause();
    mainVideo.removeAttribute("src");
  }
  setActiveImage(0);
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  const closeBtn = $('[data-close][aria-label="닫기"]', modal);
  if (closeBtn) closeBtn.focus();

  if (pushHash) {
    const url = new URL(window.location.href);
    url.hash = `work=${encodeURIComponent(workId)}`;
    history.pushState(null, "", url);
  }
}

function closeWork({ popHash = true } = {}) {
  const modal = $("#workModal");
  if (!modal) return;

  const mainVideo = $("#mainVideo");
  if (mainVideo) {
    mainVideo.pause();
    mainVideo.removeAttribute("src");
    mainVideo.style.display = "none";
  }
  modal.hidden = true;
  document.body.style.overflow = "";
  state.activeWorkId = null;
  state.activeWorkImages = null;
  state.activeImgIdx = 0;

  if (state.lastFocusedEl) state.lastFocusedEl.focus();

  if (popHash) {
    const url = new URL(window.location.href);
    url.hash = "";
    history.pushState(null, "", url);
  }
}

function setActiveImage(idx) {
  const work = WORKS.find((w) => w.id === state.activeWorkId);
  if (!work) return;

  const images = state.activeWorkImages ?? work.images ?? [];
  if (!images.length) return;

  const nextIdx = (idx + images.length) % images.length;
  state.activeImgIdx = nextIdx;

  const mainImg = $("#mainImg");
  const mainVideo = $("#mainVideo");
  if (!mainImg) return;

  const url = images[nextIdx];
  const isVideo = isVideoUrl(url);

  if (isVideo && mainVideo) {
    mainVideo.src = url;
    mainVideo.style.display = "block";
    mainImg.style.display = "none";
    mainImg.removeAttribute("src");
    mainVideo.play().catch(() => {});
  } else {
    if (mainVideo) {
      mainVideo.pause();
      mainVideo.removeAttribute("src");
      mainVideo.style.display = "none";
    }
    mainImg.src = url;
    mainImg.style.display = "block";
    mainImg.alt = `${work.title} ${nextIdx + 1}`;
  }

  const thumbsRoot = $("#thumbs");
  if (thumbsRoot) {
    $$(".thumb", thumbsRoot).forEach((t) => {
      const tIdx = Number(t.dataset.idx);
      t.classList.toggle("is-active", tIdx === nextIdx);
    });
  }
}

function handleHashOnLoad() {
  const hash = String(window.location.hash ?? "").replace(/^#/, "");
  if (!hash) return;
  const [k, v] = hash.split("=");
  if (k !== "work" || !v) return;
  const id = decodeURIComponent(v);
  if (WORKS.some((w) => w.id === id)) openWork(id, { pushHash: false });
}

function bindEvents() {
  $("#year").textContent = String(new Date().getFullYear());

  // card click / enter
  $("#worksGrid").addEventListener("click", (e) => {
    const card = e.target instanceof Element ? e.target.closest(".card") : null;
    if (!card) return;
    const id = card.getAttribute("data-work-id");
    if (id) openWork(id);
  });

  $("#worksGrid").addEventListener("keydown", (e) => {
    if (!(e.target instanceof Element)) return;
    const card = e.target.closest(".card");
    if (!card) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const id = card.getAttribute("data-work-id");
      if (id) openWork(id);
    }
  });

  // modal close handlers
  const modal = $("#workModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (el.closest("[data-close]")) closeWork();
    });
  }

  document.addEventListener("keydown", (e) => {
    if ($("#workModal")?.hidden) return;
    if (e.key === "Escape") closeWork();
    if (e.key === "ArrowLeft") setActiveImage(state.activeImgIdx - 1);
    if (e.key === "ArrowRight") setActiveImage(state.activeImgIdx + 1);
  });

  // thumbs + nav
  const thumbs = $("#thumbs");
  if (thumbs) {
    thumbs.addEventListener("click", (e) => {
      const btn = e.target instanceof Element ? e.target.closest(".thumb") : null;
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      if (Number.isFinite(idx)) setActiveImage(idx);
    });
  }

  const prevImg = $("#prevImg");
  const nextImg = $("#nextImg");
  if (prevImg) prevImg.addEventListener("click", () => setActiveImage(state.activeImgIdx - 1));
  if (nextImg) nextImg.addEventListener("click", () => setActiveImage(state.activeImgIdx + 1));

  // cover: "scroll once" to works
  const cover = $(".cover");
  const works = $("#works");
  if (cover && works) {
    const scrollToWorksOnce = (e) => {
      if (state.coverScrollLocked) return;
      const coverRect = cover.getBoundingClientRect();
      if (coverRect.top > -40 && coverRect.top < 40) {
        const isDown = "deltaY" in e ? e.deltaY > 0 : true;
        if (isDown) {
          state.coverScrollLocked = true;
          works.scrollIntoView({ behavior: "smooth", block: "start" });
          window.setTimeout(() => (state.coverScrollLocked = false), 650);
        }
      }
    };
    cover.addEventListener("wheel", scrollToWorksOnce, { passive: true });
    cover.addEventListener("touchmove", () => {}, { passive: true });
  }

  // keep modal state in sync with hash (back button)
  window.addEventListener("popstate", () => {
    const hash = String(window.location.hash ?? "").replace(/^#/, "");
    const [k, v] = hash.split("=");
    if (k === "work" && v) {
      const id = decodeURIComponent(v);
      if (WORKS.some((w) => w.id === id)) openWork(id, { pushHash: false });
      return;
    }
    if (!$("#workModal")?.hidden) closeWork({ popHash: false });
  });
}

function init() {
  renderGrid();
  bindEvents();
  handleHashOnLoad();
}

document.addEventListener("DOMContentLoaded", init);

