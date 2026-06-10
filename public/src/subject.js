(function () {
  const STORAGE_KEY = "userThemePreference";
  const THEME_COLORS = {
    light: "#ffffff",
    dark:  "#1a1a2e"
  };
  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || getSystemTheme();
  }
  function updateMetaThemeColor(theme) {
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "theme-color";
      document.head.appendChild(metaTag);
    }
    metaTag.content = THEME_COLORS[theme];
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    updateMetaThemeColor(theme);
    const checkbox = document.getElementById("themeCheckbox");
    if (checkbox) {
      checkbox.checked = theme === "dark";
    }
  }
  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }
  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "light" : "dark");
  }
  function watchSystemTheme() {
    window.matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
  }
  function watchStorageChanges() {
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        applyTheme(e.newValue);
      }
    });
  }
  if (document.head) {
    applyTheme(getSavedTheme());
  }
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getSavedTheme());
    const checkbox = document.getElementById("themeCheckbox");
    if (checkbox) {
      checkbox.addEventListener("change", toggleTheme);
    }
  });
} else {
  applyTheme(getSavedTheme());
  const checkbox = document.getElementById("themeCheckbox");
  if (checkbox) {
    checkbox.addEventListener("change", toggleTheme);
  }
}
  watchSystemTheme();
  watchStorageChanges();
})();


function openMenu(){
    document.getElementById("sideMenu").classList.add("active");
    document.getElementById("headOverlay").classList.add("show");
}
function closeMenu(){
    document.getElementById("sideMenu").classList.remove("active");
    document.getElementById("headOverlay").classList.remove("show");
}
function toggleUploads(){
    document.getElementById("uploadsMenu").classList.toggle("show");
}
function toggleAbout(){
    document.getElementById("aboutMenu").classList.toggle("show");
}
document.querySelectorAll('.side-menu a').forEach(link => {
    link.addEventListener('click', () => {
        closeMenu();
    });
});
window.addEventListener('pageshow', () => {
    closeMenu();
});


document.getElementById("shareBtn")?.addEventListener(
  "click",
  async (event) => {
    event.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: " ",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err.message);
      }
    } else {
      alert("Sharing not supported in this browser.");
    }
  }
);


/* ===== CONFIGURATION ===== */
const SUPABASE_JSON_URL = "https://ryrnyvzlmjdgqulqusxo.supabase.co/storage/v1/object/public/uploads/wp-contents/material.json";

const THUMB_BASE_URL = "https://ryrnyvzlmjdgqulqusxo.supabase.co/storage/v1/object/public/uploads/wp-contents/pdf-thumbnails/";

const defaultLogo = "data:image/png;base64,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";

/* ===== CATEGORY CONFIG: order, keys, display names ===== */
const CATEGORY_ORDER = [
  "content",
  "reference",
  "class-notes",
  "notes",
  "shared",
  "model",
  "paper",
  "assignment",
  "yt-wrapper"
];

const CATEGORY_LABELS = {
  "content":     "Content Syllabus",
  "reference":   "Reference Books",
  "class-notes": "Class Notes (college)",
  "notes":       "Study Notes E-Books",
  "shared":      "Shared Notes",
  "model":       "Model Question Answers",
  "paper":       "Old Question Papers",
  "assignment":  "College Assignments",
  "yt-wrapper":  "YouTube Tutorials"
};

/* ===== STATE ===== */
let subjectsData = null;       // full parsed JSON
let jsonLoadFailed = false;    // true if fetch/parse failed
let currentSubjectName = null; // read from HTML
let pendingHash = null;        // hash present on load before data ready

/* ===== READ SUBJECT NAME FROM HTML ===== */
// HTML sets: <meta name="subject" content="Data Structure Algorithms (BCA)">
// OR:        <span id="subject-name" style="display:none">Data Structure Algorithms (BCA)</span>
// OR:        data-subject attribute on <main>
function readSubjectName() {
  // 1. <meta name="subject">
  const meta = document.querySelector('meta[name="subject"]');
  if (meta && meta.content && meta.content.trim()) return meta.content.trim();

  // 2. <span id="subject-name"> or any element with that id
  const el = document.getElementById("subject-name");
  if (el && el.textContent && el.textContent.trim()) return el.textContent.trim();

  // 3. data-subject on <main> or <body>
  const main = document.getElementById("main") || document.querySelector("main");
  if (main && main.dataset.subject && main.dataset.subject.trim()) return main.dataset.subject.trim();

  const body = document.body;
  if (body && body.dataset.subject && body.dataset.subject.trim()) return body.dataset.subject.trim();

  return null;
}

/* ===== MAIN CONTAINER ===== */
function getMainContainer() {
  return document.getElementById("subject-content")
      || document.getElementById("main")
      || document.body;
}

/* ===== SHOW LOADING / ERROR MESSAGES IN MAIN ===== */
function showMainMessage(msg, id) {
  const container = getMainContainer();
  let el = id ? document.getElementById(id) : null;
  if (!el) {
    el = document.createElement("p");
    el.className = "subject-status-msg";
    if (id) el.id = id;
    container.appendChild(el);
  }
  el.textContent = msg;
  return el;
}

function removeMainMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/* ===== FETCH subjects.json ===== */
async function fetchSubjectsJson() {
  try {
    const res = await fetch(SUPABASE_JSON_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch material.json:", e);
    return null;
  }
}

/* ===== FIND SUBJECT IN JSON ===== */
// subjects.json structure: { "sem2": { "Subject Name": { ... } }, ... }
function findSubjectData(json, subjectName) {
  if (!json || typeof json !== "object") return undefined;
  for (const semKey of Object.keys(json)) {
    const sem = json[semKey];
    if (sem && typeof sem === "object" && sem[subjectName] !== undefined) {
      return sem[subjectName]; // could be {} or { cat: {...}, ... }
    }
  }
  return undefined; // not found
}

/* ===== BUILD GOOGLE DRIVE FILE URL ===== */

function triggerView(id) {
  const url = `https://drive.google.com/file/d/${id}/view`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function triggerDownload(id) {
  const url = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
  window.open(url, "_blank", "noopener,noreferrer");
}



/* ===== CREATE A PDF BOX ELEMENT ===== */
function createPdfBox(item) {
  const title     = item.title    || "Document";
  const fileId    = item.id       || "";
  const size      = item.size     || "";
  const pages     = item.pages    != null ? item.pages : "";
  const createdAt = item.created_at || "";
  const thumbnail = THUMB_BASE_URL + item.id + ".jpg";

  const box = document.createElement("div");
  box.className = "pdf-box";

  box.innerHTML = `
    <div class="box-left">
      <img src="${thumbnail}" alt="Thumbnail" loading="lazy" onerror="this.onerror=null;this.src='${defaultLogo}'">
    </div>
    <div class="box-right">
      <div class="card-actions button-row" role="group" aria-label="Actions">
        <button class="view-btn" type="button">View</button>
        <button class="download-btn" type="button">Download</button>
      </div>
      <div class="file-title">${title}</div>
      <div class="file-labels">
        ${size      ? `<span class="label">${size}</span>`       : ""}
        ${pages !== "" ? `<span class="label">${pages} pages</span>` : ""}
        ${createdAt ? `<span class="label">${createdAt}</span>`  : ""}
      </div>
    </div>
  `;

  const viewBtn     = box.querySelector(".view-btn");
  const downloadBtn = box.querySelector(".download-btn");

  const img = box.querySelector("img");
  img.onerror = function () {
    this.onerror = null;
    this.src = defaultLogo;
  };

  // View: reserved for future PDF viewer implementation
  viewBtn.addEventListener("click", () => {
       if (!fileId) return;
       triggerView(fileId);
  });

  // Download: open Google Drive direct download in new tab
  downloadBtn.addEventListener("click", () => {
    if (!fileId) return;
    triggerDownload(fileId);
  });

  return box;
}

function addNote() {
  const container = getMainContainer();

  const note = document.createElement("p");
  note.className = "lead";

  note.innerHTML = `
    Note: The above information has been gathered from multiple sources,
    including user submissions and AI-generated content.
    If you see any mistakes or wrong information, please provide a
    <a href="../feedback.html">feedback</a>.
  `;

  container.appendChild(note);
}

/* ===== YOUTUBE PARSING & RENDERING ===== */
function ytParseUrl(url) {
  try {
    const u = new URL(url);
    const listId = u.searchParams.get("list");
    if (listId) return { type: "playlist", id: listId };
    const v = u.searchParams.get("v");
    if (v) return { type: "video", id: v };
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      if (id) return { type: "video", id };
    }
    const parts = u.pathname.split("/");
    const embedIndex = parts.indexOf("embed");
    if (embedIndex >= 0 && parts[embedIndex + 1]) return { type: "video", id: parts[embedIndex + 1] };
    return null;
  } catch (e) {
    return null;
  }
}

async function ytFetchOEmbed(url) {
  try {
    const ep = "https://www.youtube.com/oembed?url=" + encodeURIComponent(url) + "&format=json";
    const res = await fetch(ep);
    if (!res.ok) throw new Error("oEmbed failed: " + res.status);
    return await res.json();
  } catch (err) {
    console.warn("ytFetchOEmbed error for", url, err);
    return null;
  }
}

function ytFallbackThumb(url, type) {
  try {
    if (type === "video") {
      const u = new URL(url);
      const v = u.searchParams.get("v") || (u.hostname.includes("youtu.be") ? u.pathname.slice(1) : "");
      return v ? `https://i.ytimg.com/vi/${v}/hqdefault.jpg` : "";
    } else {
      return "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270">
           <rect width="100%" height="100%" fill="#11131a"/>
           <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f7c2d9" font-size="30">Playlist</text>
         </svg>`
      );
    }
  } catch (e) {
    return "";
  }
}

function ytCreateRow(url, data) {
  const parsed = ytParseUrl(url);
  const type = parsed?.type || "video";

  const item = document.createElement("div");
  item.className = "yt-item";

  const a = document.createElement("a");
  a.className = "yt-card-link";
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const thumb = document.createElement("div");
  thumb.className = "yt-thumb";
  const img = document.createElement("img");
  img.src = data?.thumbnail_url || ytFallbackThumb(url, type);
  img.alt = data?.title ? `Thumbnail for ${data.title}` : "YouTube thumbnail";
  img.loading = "lazy";
  thumb.appendChild(img);

  if (type === "playlist") {
    const badge = document.createElement("div");
    badge.className = "yt-badge";
    badge.textContent = "Playlist";
    thumb.appendChild(badge);
  }

  const meta = document.createElement("div");
  meta.className = "yt-meta";

  const title = document.createElement("h3");
  title.className = "yt-title";
  title.textContent = data?.title || "Failed to fetch data";

  const sub = document.createElement("p");
  sub.className = "yt-sub";
  sub.textContent = data?.author_name
    ? `By ${data.author_name}`
    : type === "playlist" ? "Playlist" : "YouTube";

  meta.appendChild(title);
  meta.appendChild(sub);
  a.appendChild(thumb);
  a.appendChild(meta);
  item.appendChild(a);
  return item;
}

async function ytRenderList(containerEl, urls) {
  if (!containerEl || !Array.isArray(urls)) return;
  containerEl.innerHTML = "";

  if (urls.length === 0) {
    const msg = document.createElement("p");
    msg.className = "drawer-empty-msg";
    msg.textContent = "Data not available.";
    containerEl.appendChild(msg);
    return;
  }

  for (const url of urls) {
    // Placeholder while loading
    const placeholder = document.createElement("div");
    placeholder.className = "yt-item";
    placeholder.innerHTML = `
      <div class="yt-thumb" style="background:#111"></div>
      <div class="yt-meta">
        <h3 class="yt-title">Loading…</h3>
        <p class="yt-sub"></p>
      </div>
    `;
    containerEl.appendChild(placeholder);

    const data = await ytFetchOEmbed(url);
    const row = ytCreateRow(url, data);
    containerEl.replaceChild(row, placeholder);
  }
}

/* ===== DRAWER ANIMATION UTILITIES ===== */
function animateOpenDrawer(drawer, toggleBtn) {
  if (!drawer || drawer._isAnimating) return Promise.resolve();
  drawer._isAnimating = true;

  return new Promise((resolve) => {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.classList.add("active");
      toggleBtn.style.borderRadius = "14px 14px 0 0";
    }

    drawer.style.height = "auto";
    const measured = drawer.scrollHeight;
    drawer.style.height = "0px";
    void drawer.offsetHeight;
    drawer.style.height = measured + "px";

    function onEnd(e) {
      if (e.propertyName !== "height") return;
      drawer.style.height = "auto";
      drawer._isAnimating = false;
      drawer.removeEventListener("transitionend", onEnd);
      resolve();
    }
    drawer.addEventListener("transitionend", onEnd);

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
    const cur = drawer.scrollHeight;
    drawer.style.height = cur + "px";
    void drawer.offsetHeight;
    drawer.style.height = "0px";
    drawer.setAttribute("aria-hidden", "true");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.classList.remove("active");
      toggleBtn.style.borderRadius = "14px";
    }

    function onEnd(e) {
      if (e.propertyName !== "height") return;
      drawer.classList.remove("open");
      drawer._isAnimating = false;
      drawer.removeEventListener("transitionend", onEnd);
      resolve();
    }
    drawer.addEventListener("transitionend", onEnd);

    setTimeout(() => {
      if (drawer._isAnimating) {
        drawer.classList.remove("open");
        drawer._isAnimating = false;
        resolve();
      }
    }, 1200);
  });
}

/* ===== CLOSE ALL OTHER DRAWERS ===== */
function closeOtherDrawers(exceptDrawer) {
  document.querySelectorAll(".section-drawer").forEach(d => {
    if (d === exceptDrawer) return;
    if (d.getAttribute("aria-hidden") === "false") {
      const btn = document.querySelector(`.section-toggle[aria-controls="${d.id}"]`);
      animateCloseDrawer(d, btn).catch(() => {});
    }
  });
}

/* ===== SCROLL TO TOGGLE BUTTON ===== */
function scrollToToggle(btn) {
  const offset = 80;
  const top = btn.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

/* ===== BUILD ALL DRAWERS FROM SUBJECT DATA ===== */
// drawerMap: id -> { toggleBtn, drawerEl, category, ytRendered? }
const drawerMap = new Map();

function buildDrawers(subjectCategoryData) {
  const container = getMainContainer();

  // Remove any status messages
  removeMainMessage("status-loading");
  removeMainMessage("status-error");

  // Get ordered categories present in data
  const presentCategories = CATEGORY_ORDER.filter(cat => subjectCategoryData[cat] !== undefined);

  if (presentCategories.length === 0) {
    showMainMessage("No data available for this subject.", "status-error");
    return;
  }

  presentCategories.forEach((cat, index) => {
    const catData = subjectCategoryData[cat];
    const label = CATEGORY_LABELS[cat] || cat;
    const drawerId = `drawer-${cat}`;
    const btnId = `toggle-${cat}`;

    /* --- Toggle Button --- */
    const btn = document.createElement("button");
    btn.className = "section-toggle" + (cat === "yt-wrapper" ? " yt-toggle-btn" : "");
    btn.id = btnId;
    btn.type = "button";
    btn.setAttribute("aria-controls", drawerId);
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = label;
    container.appendChild(btn);

    /* --- Drawer --- */
    const drawer = document.createElement("div");
    drawer.id = drawerId;
    drawer.className = "section-drawer" + (cat === "yt-wrapper" ? " yt-drawer" : "");
    drawer.setAttribute("aria-hidden", "true");
    drawer.style.height = "0px";

    /* --- Drawer Content --- */
    const content = document.createElement("div");
    content.className = "section-content";

    if (cat === "yt-wrapper") {
      // YouTube list container
      const ytList = document.createElement("div");
      ytList.className = "yt-list";
      ytList.id = "yt-list-" + index;
      content.appendChild(ytList);
      drawer.appendChild(content);
    } else {
      // PDF files
      const files = (catData && Array.isArray(catData.files)) ? catData.files : [];
      if (files.length === 0) {
        const msg = document.createElement("p");
        msg.className = "drawer-empty-msg";
        msg.textContent = "Data not available.";
        content.appendChild(msg);
      } else {
        files.forEach(item => {
          const box = createPdfBox(item);
          content.appendChild(box);
        });
      }
      drawer.appendChild(content);
    }

    container.appendChild(drawer);

    // Store in map
    drawerMap.set(drawerId, {
      toggleBtn: btn,
      drawerEl: drawer,
      category: cat,
      ytRendered: false,
      ytUrls: cat === "yt-wrapper"
        ? ((catData && Array.isArray(catData.files)) ? catData.files : [])
        : null,
      ytListEl: cat === "yt-wrapper" ? content.querySelector(".yt-list") : null
    });

    /* --- Toggle click handler --- */
    btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const isOpen = drawer.getAttribute("aria-hidden") === "false";
      if (isOpen) {
        await animateCloseDrawer(drawer, btn);
        return;
      }

      // If YouTube drawer, render list first
      if (cat === "yt-wrapper") {
        const entry = drawerMap.get(drawerId);
        if (!entry.ytRendered) {
          await ytRenderList(entry.ytListEl, entry.ytUrls);
          entry.ytRendered = true;
        }
      }

      closeOtherDrawers(drawer);
      await animateOpenDrawer(drawer, btn);
    });

    // Keyboard support
    btn.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        btn.click();
      }
    });
  });
}

/* ===== HASH HANDLING ===== */
async function openDrawerForHash(hash) {
  if (!hash) return;
  const id = hash.replace(/^#/, "");

  // Try direct drawer id match (e.g. #drawer-paper)
  let entry = drawerMap.get(id) || drawerMap.get("drawer-" + id);

  // Also support category key directly (e.g. #paper or #yt-wrapper)
  if (!entry) {
    entry = drawerMap.get("drawer-" + id);
  }

  // Support legacy #yt-wrapper hash
  if (!entry && id === "yt-wrapper") {
    entry = drawerMap.get("drawer-yt-wrapper");
  }

  if (!entry) {
    // Try scrolling to element with that id
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
    return;
  }

  const { toggleBtn, drawerEl, category } = entry;

  // Close others
  closeOtherDrawers(drawerEl);

  // If YouTube, render first
  if (category === "yt-wrapper" && !entry.ytRendered) {
    await ytRenderList(entry.ytListEl, entry.ytUrls);
    entry.ytRendered = true;
  }

  await animateOpenDrawer(drawerEl, toggleBtn);
  scrollToToggle(toggleBtn);
  try { toggleBtn.focus({ preventScroll: true }); } catch (e) {}
}

/* ===== ESCAPE KEY: close open drawers ===== */
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    drawerMap.forEach(({ drawerEl, toggleBtn }) => {
      if (drawerEl.getAttribute("aria-hidden") === "false") {
        animateCloseDrawer(drawerEl, toggleBtn).catch(() => {});
      }
    });
  }
});

/* ===== HASH CHANGE LISTENER ===== */
window.addEventListener("hashchange", () => {
  openDrawerForHash(location.hash).catch(() => {});
});

/* ===== POPSTATE LISTENER ===== */
window.addEventListener("popstate", () => {
  // Close all drawers on back navigation if needed
  drawerMap.forEach(({ drawerEl, toggleBtn }) => {
    if (drawerEl.getAttribute("aria-hidden") === "false") {
      animateCloseDrawer(drawerEl, toggleBtn).catch(() => {});
    }
  });
});

/* ===== MAIN INIT ===== */
(async function init() {
  currentSubjectName = readSubjectName();

  // Show loading message immediately
  showMainMessage("Loading…", "status-loading");

  // Capture hash before async operations
  pendingHash = location.hash || "";

  // Fetch JSON
  const json = await fetchSubjectsJson();

  if (!json) {
    // Fetch failed
    removeMainMessage("status-loading");
    showMainMessage("Failed to load data for this subject.", "status-error");
    return;
  }

  if (!currentSubjectName) {
    removeMainMessage("status-loading");
    showMainMessage("Failed to load data for this subject.", "status-error");
    return;
  }

  const subjectData = findSubjectData(json, currentSubjectName);

  if (subjectData === undefined) {
    // Subject not found in JSON
    removeMainMessage("status-loading");
    showMainMessage("Failed to load data for this subject.", "status-error");
    return;
  }

  if (subjectData === null || typeof subjectData !== "object" || Object.keys(subjectData).length === 0) {
    // Subject found but empty
    removeMainMessage("status-loading");
    showMainMessage("No data available for this subject.", "status-error");
    return;
  }

  // Remove loading message and build drawers
  removeMainMessage("status-loading");
  buildDrawers(subjectData);
  addNote();

  // Open drawer if hash was present on load
  if (pendingHash) {
    await openDrawerForHash(pendingHash).catch(() => {});
  }
})();
