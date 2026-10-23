// Platform detection
function getPlatform() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  } else if (/android/.test(userAgent)) {
    return "android";
  }
  return "unknown";
}

// App store URLs. Android is null until the Play listing (com.vboiko.trainhub) is live.
const storeUrls = {
  ios: "https://apple.co/3LEplAn",
  android: null,
};

// Get URL parameters
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    userId: urlParams.get("u"),
  };
}

// Build deep link URL
function buildDeepLink() {
  const params = getUrlParams();
  let deepLink = "trainhub://";

  if (params.userId) {
    deepLink += `user/${encodeURIComponent(params.userId)}`;
  }

  return deepLink;
}

// Open app function
function openApp() {
  const loading = document.getElementById("loading");
  if (loading) {
    loading.classList.add("show");
  }
  window.location.href = buildDeepLink();
}

// Download from specific store function
function downloadFromStore(platform) {
  window.location.href = storeUrls[platform] || storeUrls.ios;
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Storage can be blocked; the banner just shows again next time.
  }
}

// Shared profile links (?u=<userId>) show the invite card at the top of the page.
function setupInvite() {
  const card = document.getElementById("invite-card");
  if (!card || !getUrlParams().userId) {
    return;
  }
  card.hidden = false;
  document.getElementById("open-app").addEventListener("click", openApp);
}

// Suggest the visitor's browser language once; never redirect automatically.
function setupLanguageSuggestion() {
  const dataEl = document.getElementById("lang-data");
  const banner = document.getElementById("lang-suggest");
  if (!dataEl || !banner) {
    return;
  }

  const data = JSON.parse(dataEl.textContent);
  const storageKey = "th-lang-choice";

  document.querySelectorAll("a[data-lang]").forEach((link) => {
    link.addEventListener("click", () => writeStorage(storageKey, link.dataset.lang));
  });

  if (readStorage(storageKey)) {
    return;
  }

  const preferred = (navigator.languages || [navigator.language])
    .map((lang) => (lang || "").slice(0, 2).toLowerCase())
    .find((lang) => data.langs[lang]);
  if (!preferred || preferred === data.current) {
    return;
  }

  const target = data.langs[preferred];
  const link = document.getElementById("lang-suggest-link");
  document.getElementById("lang-suggest-text").textContent = target.text;
  link.textContent = target.action;
  link.href = target.href + window.location.search;
  link.hreflang = preferred;
  link.lang = preferred;
  link.addEventListener("click", () => writeStorage(storageKey, preferred));

  const close = document.getElementById("lang-suggest-close");
  close.setAttribute("aria-label", target.dismiss);
  close.addEventListener("click", () => {
    banner.hidden = true;
    writeStorage(storageKey, data.current);
  });

  banner.lang = preferred;
  banner.hidden = false;
}

// Keep ?u= when switching language, so a shared link survives the switch.
function keepQueryOnLanguageLinks() {
  if (!window.location.search) {
    return;
  }
  document.querySelectorAll("a[data-lang]").forEach((link) => {
    link.href = link.getAttribute("href") + window.location.search;
  });
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", function () {
  const year = document.getElementById("current-year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  setupInvite();
  keepQueryOnLanguageLinks();
  setupLanguageSuggestion();
  setupReveal();
});
