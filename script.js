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

// App store URLs
const storeUrls = {
  ios: "https://apps.apple.com/app/id123456789",
  android: "https://play.google.com/store/apps/details?id=com.myapp",
};

// Deep link URL
const deepLinkUrl = "trainhub://user/2YDCfnyziBdnKME2LM7uDrZqfbI2";

// Open app function
function openApp() {
  const platform = getPlatform();
  const loading = document.getElementById("loading");

  // Show loading state
  loading.classList.add("show");

  // Open deep link immediately
  window.location.href = deepLinkUrl;

  // Set timeout for fallback to app store after 2500ms
  setTimeout(() => {
    loading.classList.remove("show");

    if (platform === "ios" || platform === "android") {
      window.location.href = storeUrls[platform];
    } else {
      // For unknown platforms, try the deep link anyway
      window.location.href = storeUrls.ios;
    }
  }, 2500);
}

// Download from specific store function
function downloadFromStore(platform) {
  if (platform === "ios" || platform === "android") {
    window.location.href = storeUrls[platform];
  } else {
    // Fallback to iOS if unknown platform
    window.location.href = storeUrls.ios;
  }
}

// Add some interactive effects
document.addEventListener("DOMContentLoaded", function () {
  // Add hover effects to buttons
  const buttons = document.querySelectorAll(".btn, .store-btn");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Add click animation
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      this.style.transform = "translateY(0) scale(0.98)";
      setTimeout(() => {
        this.style.transform = "translateY(-2px) scale(1)";
      }, 100);
    });
  });
});
