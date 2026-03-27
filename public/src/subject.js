
document.getElementById("shareBtn").addEventListener("click", async (event) => {
  event.preventDefault(); // stop the link from reloading page
  if (navigator.share) {
    try {
      await navigator.share({
        title: document.title,
        text: " ",
        url: window.location.href,
      });
      console.log("Page shared successfully!");
    } catch (err) {
      console.error("Share failed:", err.message);
    }
  } else {
    alert("Sharing not supported in this browser.");
  }
});


/* ===== DEFAULT LOGO (SVG data URI) ===== */
const defaultLogo = "data:image/png;base64,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";

const ytListEl = document.getElementById('yt-list');
const ytItems = ytListEl?.dataset?.yt
  ? JSON.parse(ytListEl.dataset.yt)
  : [];

/* ====== INSTANT "NO-LEGAL" POPUP ====== */
function showNoLegalPopup(message = "This file is not available due to copyright issue") {
  if (document.querySelector(".legal-popup-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "legal-popup-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const popup = document.createElement("div");
  popup.className = "legal-popup";

  popup.innerHTML = `
    <button class="legal-popup-close" aria-label="Close">&times;</button>
    <div class="legal-popup-body">
      <h3>Notice</h3>
      <p>${message}</p>
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  overlay.querySelector(".legal-popup-close").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

function addPdfBox(title, filePath, logo = "default", parent = document.body, options = {}, label1 = "", label2 = "") {
  // compatibility: if parent is actually an options object
  if (parent && typeof parent === "object" && parent.nodeType !== 1) {
    options = parent;
    parent = document.body;
  }
  if (!parent || !(parent instanceof Element)) parent = document.body;

  options = options || {};
  const noLegal = options.noLegal === true || options.noLegal === "no-legal" || options === "no-legal";

  const logoSrc = (logo === "default") ? defaultLogo : logo;

  const box = document.createElement("div");
  box.className = "pdf-box";
  box.innerHTML = `
    <div class="box-left">
      <img src="${logoSrc}" alt="Thumbnail">
    </div>
    <div class="box-right">
      <div class="card-actions button-row" role="group" aria-label="Actions" data-file="${filePath}">
        <button class="view-btn" type="button">View</button>
        <button class="download-btn" type="button">Download</button>
      </div>
      <div class="file-title">${title}</div>


<div class="file-labels">
  ${label1 ? `<span class="label">${label1}</span>` : ""}
  ${label2 ? `<span class="label">${label2}</span>` : ""}
</div>


    </div>
  `;

  parent.appendChild(box);

  const viewBtn = box.querySelector(".view-btn");
  const downloadBtn = box.querySelector(".download-btn");

  viewBtn.addEventListener("click", (e) => {
    if (noLegal) {
      showNoLegalPopup();
      return;
    }
    openPDF(filePath);
  });

  downloadBtn.addEventListener("click", (e) => {
    if (noLegal) {
      showNoLegalPopup();
      return;
    }
    const a = document.createElement("a");
    a.href = filePath || "#";
    if (!filePath) {
      showNoLegalPopup("This file cannot be downloaded.");
      return;
    }
    a.setAttribute("download", (title || "file") + ".pdf");
    // some browsers require anchor to be in DOM
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}

/* ====== PDF overlay viewer + history/back handling ====== */
let pdfViewerOpen = false;
let fakeStatePushed = false;

function openPDF(pdfFile) {
  if (pdfViewerOpen) return;

  const overlay = document.getElementById("overlay");
  const pdfFrame = document.getElementById("pdfFrame");

  if (!overlay || !pdfFrame) {
    console.error("Overlay or PDF frame not found.");
    return;
  }

  // Use pdf.js viewer with encoded file URL
  pdfFrame.src = "https://mozilla.github.io/pdf.js/legacy/web/viewer.html?file=" + encodeURIComponent(pdfFile);
  overlay.style.display = "block";

  pdfViewerOpen = true;

  if (!fakeStatePushed) {
    try {
      history.pushState({ pdfOpen: true }, "", location.href);
      fakeStatePushed = true;
    } catch (e) {
      // ignore browsers that block pushState
    }
  }
}

function closePDF() {
  if (!pdfViewerOpen) return;

  // If we pushed fake state, going back will trigger popstate to close
  if (fakeStatePushed) {
    try {
      history.back();
      return;
    } catch (e) {
      // fallback to manual close
    }
  }

  // fallback manual close (in case history.back didn't run)
  const overlay = document.getElementById("overlay");
  const pdfFrame = document.getElementById("pdfFrame");
  if (overlay) overlay.style.display = "none";
  if (pdfFrame) pdfFrame.src = "";
  pdfViewerOpen = false;
  fakeStatePushed = false;
}

/* popstate: if PDF open then close it on back */
window.addEventListener("popstate", (event) => {
  if (pdfViewerOpen) {
    const overlay = document.getElementById("overlay");
    const pdfFrame = document.getElementById("pdfFrame");
    if (overlay) overlay.style.display = "none";
    if (pdfFrame) pdfFrame.src = "";
    pdfViewerOpen = false;
    fakeStatePushed = false;
    return;
  }
  // otherwise, hashchange handler will open/close sections
});

/* Close overlay close button */
document.body.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("close-btn")) {
    closePDF();
  }
});

/* ====== GENERIC DRAWER OPEN/CLOSE UTILITIES ====== */
function animateOpenDrawer(drawer, toggleBtn) {
  if (!drawer || drawer._isAnimating) return Promise.resolve();
  drawer._isAnimating = true;

  return new Promise((resolve) => {
    // Make sure aria and classes reflect opening
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");

    // allow content to render and then measure
    // set height auto to measure scrollHeight
    drawer.style.height = "auto";
    const measured = drawer.scrollHeight;

    // animate from 0 to measured
    drawer.style.height = "0px";
    // force reflow
    void drawer.offsetHeight;
    drawer.style.height = measured + "px";

    if (toggleBtn) toggleBtn.style.borderRadius = "14px 14px 0 0";

    function onEnd(e) {
      if (e.propertyName !== "height") return;
      // set height to auto after transition so it can reflow on resize
      drawer.style.height = "auto";
      drawer._isAnimating = false;
      drawer.removeEventListener("transitionend", onEnd);
      resolve();
    }
    drawer.addEventListener("transitionend", onEnd);

    // Safety fallback: if transition doesn't end (some edge cases), clear flag after timeout
    setTimeout(() => {
      if (drawer._isAnimating) {
        drawer.style.height = "auto";
        drawer._isAnimating = false;
        resolve();
      }
    }, 1200);
  });
}

function animateCloseDrawer(drawer, toggleBtn) {
  if (!drawer || drawer._isAnimating) return Promise.resolve();
  drawer._isAnimating = true;

  return new Promise((resolve) => {
    // measure current full height
    const cur = drawer.scrollHeight;
    drawer.style.height = cur + "px";
    // force reflow
    void drawer.offsetHeight;
    // animate to 0
    drawer.style.height = "0px";
    drawer.setAttribute("aria-hidden", "true");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");

    if (toggleBtn) toggleBtn.style.borderRadius = "14px";

    function onEnd(e) {
      if (e.propertyName !== "height") return;
      // cleanup
      drawer.classList.remove("open");
      drawer._isAnimating = false;
      drawer.removeEventListener("transitionend", onEnd);
      resolve();
    }
    drawer.addEventListener("transitionend", onEnd);

    // Safety fallback
    setTimeout(() => {
      if (drawer._isAnimating) {
        drawer.classList.remove("open");
        drawer._isAnimating = false;
        resolve();
      }
    }, 1200);
  });
}

/* ====== INIT SECTIONS: attach handlers to section-toggle buttons */
(function initSections() {
  const toggles = Array.from(document.querySelectorAll(".section-toggle"));
  // Map of drawerId -> {toggleBtn, drawerEl}
  const drawerMap = new Map();

  toggles.forEach(btn => {
    const controlId = btn.getAttribute("aria-controls");
    if (!controlId) return;
    const drawer = document.getElementById(controlId);
    if (!drawer) return;
    drawerMap.set(controlId, { toggleBtn: btn, drawerEl: drawer });

    // initialize closed state
    drawer.style.height = "0px";
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");

    // If this button is the YouTube toggle, skip attaching the generic handler.
    // We'll wire YouTube separately so there is a single, correct handler.
    if (btn.classList.contains("yt-toggle-btn")) {
      return;
    }

    // Attach toggle behavior (generic)
    btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      // If drawer currently open, close. Otherwise open.
      const isOpen = drawer.getAttribute("aria-hidden") === "false";
      if (isOpen) {
        await animateCloseDrawer(drawer, btn);
      } else {
        // Before opening, close any other open drawers (optional behavior: keep only one open)
        // If you prefer multiple open simultaneously, comment out this forEach block.
        document.querySelectorAll(".section-drawer").forEach(d => {
          if (d === drawer) return;
          if (d.getAttribute("aria-hidden") === "false") {
            const otherBtn = document.querySelector(`.section-toggle[aria-controls="${d.id}"]`);
            // close without waiting to keep click snappy; it's okay to await too
            animateCloseDrawer(d, otherBtn).catch(()=>{});
          }
        });

        await animateOpenDrawer(drawer, btn);
      }
    });

    // keyboard support Enter/Space
    btn.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        btn.click();
      }
    });
  });


  // ===== Hash handling: open drawer on load or when hash changes =====
  async function openDrawerForHash(hash) {
    if (!hash) return;
    const id = hash.replace(/^#/, '');

    // Special-case YouTube wrapper id 'yt-wrapper'
    if (id === 'yt-wrapper') {
      // prefer explicit drawer id 'drawer-yt', fall back to generic '.yt-drawer'
      const ytDrawer = document.getElementById('drawer-yt') || document.querySelector('.yt-drawer');
      const ytBtn = document.querySelector('.yt-toggle-btn');
      if (ytDrawer && ytBtn) {
        // close other drawers first
        document.querySelectorAll('.section-drawer').forEach(d => {
          if (d === ytDrawer) return;
          const otherBtn = document.querySelector(`.section-toggle[aria-controls="${d.id}"]`);
          if (d.getAttribute('aria-hidden') === 'false') animateCloseDrawer(d, otherBtn).catch(()=>{});
        });
        // ensure YT list is rendered (if your ytEnsureRendered exists)
        if (typeof ytEnsureRendered === 'function') {
          try { await ytEnsureRendered(); } catch(e) { /* ignore */ }
        }
        await animateOpenDrawer(ytDrawer, ytBtn);
        // scroll & focus

const offset = 80;
const top = ytBtn.getBoundingClientRect().top + window.pageYOffset - offset;
window.scrollTo({
  top: top,
  behavior: 'smooth'
});

        try { ytBtn.focus({ preventScroll: true }); } catch(e) {}
        return;
      }
    }

    // Normal sections: look for drawer with id `drawer-<id>`
    const drawerId = 'drawer-' + id;
    const entry = drawerMap.get(drawerId); // drawerMap created earlier in initSections
    if (entry) {
      // close other drawers
      document.querySelectorAll('.section-drawer').forEach(d => {
        if (d === entry.drawerEl) return;
        const otherBtn = document.querySelector(`.section-toggle[aria-controls="${d.id}"]`);
        if (d.getAttribute('aria-hidden') === 'false') animateCloseDrawer(d, otherBtn).catch(()=>{});
      });
      await animateOpenDrawer(entry.drawerEl, entry.toggleBtn);

const offset = 80;
const top = entry.toggleBtn.getBoundingClientRect().top + window.pageYOffset - offset;
window.scrollTo({
  top: top,
  behavior: 'smooth'
});

      try { entry.toggleBtn.focus({ preventScroll: true }); } catch(e) {}
    } else {
      // if there is a section element with that id, try to focus it
      const sectionEl = document.getElementById(id);
      if (sectionEl) sectionEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  // On initial load open if hash present
  window.addEventListener('load', () => {
    const initialHash = (location.hash || '').replace(/^#/, '');
    if (!initialHash) return;
    // call the helper (no await needed)
    openDrawerForHash('#' + initialHash).catch(()=>{});
  });

  // When hash changes (user clicks anchors) open the new drawer
  window.addEventListener('hashchange', () => {
    const newHash = location.hash;
    openDrawerForHash(newHash).catch(()=>{});
  });

})();

/* ====== PARSE <script class="pdf-data"> blocks and inject content ====== */
(function injectPdfData() {
  const blocks = Array.from(document.querySelectorAll(".section-content > script.pdf-data[type='application/json']"));
  blocks.forEach(block => {
    let arr = [];
    try {
      arr = JSON.parse(block.textContent || "[]");
      if (!Array.isArray(arr)) arr = [];
    } catch (e) {
      console.warn("Invalid JSON in .pdf-data", e);
      arr = [];
    }

    const parent = block.parentElement; // .section-content
    if (!parent) return;

    arr.forEach(item => {
      const title = item.title || "Document";
      const file = item.file || "";
      const logo = item.logo || "default";
      const options = item.options || {};
      const label1 = item.label1 || "";
      const label2 = item.label2 || "";


 //    addPdfBox(title, file, logo, parent, options);   Replace this part to display pdf at top

const uploadNotes = parent.querySelector(".upload-notes");

if (uploadNotes) {
  // Temporarily add at the bottom (because addPdfBox uses appendChild)
  addPdfBox(title, file, logo, parent, options, label1, label2);
  // Move the newly-added pdf-box just above upload-notes
  const lastBox = parent.querySelector(".pdf-box:last-of-type");
  if (lastBox) {
    parent.insertBefore(lastBox, uploadNotes);
  }
} else {
  addPdfBox(title, file, logo, parent, options, label1, label2);
}


    });
    // remove script block to avoid re-parsing
    try { block.remove(); } catch (e) {}
  });
})();

/* ====== YOUTUBE RENDERING LOGIC (oEmbed) ====== */

function ytParseUrl(url) {
  try {
    const u = new URL(url);
    const listId = u.searchParams.get('list');
    if (listId) return { type: 'playlist', id: listId };
    const v = u.searchParams.get('v');
    if (v) return { type: 'video', id: v };
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1);
      if (id) return { type: 'video', id: id };
    }
    const parts = u.pathname.split('/');
    const embedIndex = parts.indexOf('embed');
    if (embedIndex >= 0 && parts[embedIndex+1]) return { type: 'video', id: parts[embedIndex+1] };
    return null;
  } catch (e) {
    return null;
  }
}

async function ytFetchOEmbed(url) {
  try {
    const ep = 'https://www.youtube.com/oembed?url=' + encodeURIComponent(url) + '&format=json';
    const res = await fetch(ep);
    if (!res.ok) throw new Error('oEmbed failed: ' + res.status);
    return await res.json();
  } catch (err) {
    console.warn('ytFetchOEmbed error for', url, err);
    return null;
  }
}

function ytFallbackThumb(url, type) {
  try {
    if (type === 'video') {
      const u = new URL(url);
      const v = u.searchParams.get('v') || (u.hostname.includes('youtu.be') ? u.pathname.slice(1) : '');
      return v ? `https://i.ytimg.com/vi/${v}/hqdefault.jpg` : '';
    } else {
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270">
           <rect width="100%" height="100%" fill="#11131a"/>
           <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f7c2d9" font-size="20">Playlist</text>
         </svg>`
      );
    }
  } catch (e) {
    return '';
  }
}

function ytCreateRow(url, data) {
  const parsed = ytParseUrl(url);
  const type = parsed?.type || 'video';

  const item = document.createElement('div');
  item.className = 'yt-item';

  const a = document.createElement('a');
  a.className = 'yt-card-link';
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const thumb = document.createElement('div');
  thumb.className = 'yt-thumb';
  const img = document.createElement('img');
  img.src = data?.thumbnail_url || ytFallbackThumb(url, type);
  img.alt = data?.title ? `Thumbnail for ${data.title}` : 'YouTube thumbnail';
  thumb.appendChild(img);

  if (type === 'playlist') {
    const badge = document.createElement('div');
    badge.className = 'yt-badge';
    badge.textContent = 'Playlist';
    thumb.appendChild(badge);
  }

  const meta = document.createElement('div');
  meta.className = 'yt-meta';
  const title = document.createElement('h3');
  title.className = 'yt-title';
  title.textContent = data?.title || '(No title)';
  const sub = document.createElement('p');
  sub.className = 'yt-sub';
  sub.textContent = data?.author_name ? `By ${data.author_name}` : (type === 'playlist' ? 'Playlist' : 'YouTube');

  meta.appendChild(title);
  meta.appendChild(sub);

  a.appendChild(thumb);
  a.appendChild(meta);
  item.appendChild(a);
  return item;
}

let ytHasRendered = false;
async function ytRenderList(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  for (const url of ytItems) {
    const placeholder = document.createElement('div');
    placeholder.className = 'yt-item';
    placeholder.innerHTML = `
      <div class="yt-thumb" style="background:#111"></div>
      <div class="yt-meta">
        <h3 class="yt-title">Loading…</h3>
        <p class="yt-sub">Fetching info…</p>
      </div>
    `;
    containerEl.appendChild(placeholder);

    const data = await ytFetchOEmbed(url);
    const row = ytCreateRow(url, data);
    containerEl.replaceChild(row, placeholder);
  }
  ytHasRendered = true;
  return containerEl;
}

async function ytEnsureRendered() {
  if (ytHasRendered) return;
  const list = document.getElementById("yt-list");
  if (!list) return;
  await ytRenderList(list);
}

/* ====== Wire YouTube toggle only once ====== */
(function wireYouTubeToggle() {
  const ytBtn = document.querySelector(".yt-toggle-btn");
  // There are two possible drawer elements: one with id "drawer-yt" (per HTML) or a generic ".yt-drawer"
  const ytDrawerById = document.getElementById("drawer-yt");
  const ytDrawerGeneric = document.querySelector(".yt-drawer");
  const ytDrawer = ytDrawerById || ytDrawerGeneric;
  if (!ytBtn || !ytDrawer) return;

  // ensure initial closed state
  ytDrawer.style.height = "0px";
  ytDrawer.setAttribute("aria-hidden", "true");
  ytBtn.setAttribute("aria-expanded", "false");

  ytBtn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    // if open, close
    const isOpen = ytDrawer.getAttribute("aria-hidden") === "false";
    if (isOpen) {
      await animateCloseDrawer(ytDrawer, ytBtn);
      return;
    }

    // before opening, render list once
    try { await ytEnsureRendered(); } catch (e) { /* ignore */ }

    // optionally close other open drawers (to keep single open at a time)
    document.querySelectorAll(".section-drawer").forEach(d => {
      if (d === ytDrawer) return;
      if (d.getAttribute("aria-hidden") === "false") {
        const btn = document.querySelector(`.section-toggle[aria-controls="${d.id}"]`);
        animateCloseDrawer(d, btn).catch(()=>{});
      }
    });

    await animateOpenDrawer(ytDrawer, ytBtn);
  });

  // Esc key closes YouTube drawer if open
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      const isOpen = ytDrawer.getAttribute("aria-hidden") === "false";
      if (isOpen) {
        // reuse animateCloseDrawer to close
        animateCloseDrawer(ytDrawer, ytBtn).catch(()=>{});
      }
      // also close any legal popup
      const lp = document.querySelector(".legal-popup-overlay");
      if (lp) lp.remove();
    }
  });
})();

/* ====== Small utilities and safeguards ====== */
/* Remove any displayed legal popup on Escape */
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    const lp = document.querySelector(".legal-popup-overlay");
    if (lp) lp.remove();
  }
});

/* Accessibility: if someone clicks a link with a hash for a section, the hashchange listener will handle open */
document.addEventListener("click", (ev) => {
  // if clicked element is anchor linking to same-page section (href begins with #)
  const target = ev.target.closest && ev.target.closest('a[href^="#"]');
  if (!target) return;
  const href = target.getAttribute('href') || '';
  if (!href.startsWith('#')) return;
  // Let browser update hash; the hashchange listener will open the drawer.
});

/* End of scripts.js */

