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

const defaultLogo = "../src/pdf-thumbnail.png";

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
  const thumbnail = THUMB_BASE_URL + item.id + ".webp";

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
