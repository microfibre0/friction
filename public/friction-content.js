(function () {
  const STORAGE_KEYS = {
    websites: "customWebsites",
    platformSettings: "platformSettings",
    devSettings: "frictionDevSettings",
  };

  const DEFAULT_DEV_SETTINGS = {
    enabled: true,
    hideImages: true,
    buttonTimers: true,
    buttonTimerSeconds: 5,
  };

  const BUILT_IN_PLATFORM_IDS = {
    youtube: "https://www.youtube.com",
    facebook: "https://www.facebook.com",
  };

  const BUILT_IN_SITE_BEHAVIORS = {
    youtube: {
      youtubePauseAutoplayOnHover: {
        label: "Disable YouTube hover previews",
        apply() {
          document.querySelectorAll("ytd-video-preview").forEach((preview) => {
            preview.replaceWith(...preview.childNodes);
          });
        },
      },
    },
  };

  const state = {
    configuredWebsites: [],
    platformSettings: {},
    devSettings: { ...DEFAULT_DEV_SETTINGS },
    observer: null,
    scheduledMutationRun: false,
  };

  function readStorage(keys) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.sync) {
        resolve({});
        return;
      }

      chrome.storage.sync.get(keys, (result) => {
        resolve(result || {});
      });
    });
  }

  function normalizeOrigin(url) {
    try {
      return new URL(url).origin;
    } catch {
      return "";
    }
  }

  function getCurrentOrigin() {
    return normalizeOrigin(window.location.href);
  }

  function shouldApplyToCurrentSite(websites, platformSettings) {
    const currentOrigin = getCurrentOrigin();

    if (!currentOrigin) {
      return false;
    }

    if (websites.some((site) => site === currentOrigin)) {
      return true;
    }

    const matchedPlatformId = Object.entries(BUILT_IN_PLATFORM_IDS).find(
      ([, platformOrigin]) => platformOrigin === currentOrigin,
    )?.[0];

    if (!matchedPlatformId) {
      return false;
    }

    return Boolean(platformSettings[matchedPlatformId]);
  }

  function applyImageHiding() {
    const images = document.querySelectorAll("img");

    images.forEach((image) => {
      if (image.dataset.frictionOverlayApplied === "true") {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.style.maxWidth = "100%";
      wrapper.style.verticalAlign = "middle";
      wrapper.style.overflow = "hidden";

      const parent = image.parentNode;
      if (!parent) {
        return;
      }

      parent.insertBefore(wrapper, image);
      wrapper.appendChild(image);

      const overlay = document.createElement("button");
      overlay.type = "button";
      overlay.textContent = "Tap to remove";
      overlay.setAttribute("aria-label", "Remove hidden image");
      overlay.dataset.frictionOverlayApplied = "true";
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.zIndex = "10";
      overlay.style.display = "grid";
      overlay.style.placeItems = "center";
      overlay.style.border = "none";
      overlay.style.borderRadius = "0";
      overlay.style.background = "rgb(0, 0, 0)";
      overlay.style.color = "#ffffff";
      overlay.style.fontWeight = "600";
      overlay.style.fontSize = "14px";
      overlay.style.cursor = "pointer";
      overlay.style.padding = "12px";
      overlay.style.boxSizing = "border-box";
      overlay.style.textAlign = "center";
      overlay.style.lineHeight = "1.2";
      overlay.style.whiteSpace = "normal";
      overlay.style.touchAction = "manipulation";

      overlay.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        overlay.remove();
      });

      wrapper.appendChild(overlay);
      image.dataset.frictionOverlayApplied = "true";
    });
  }

  function hasOnlyIconContent(element) {
    if (!element) {
      return false;
    }

    const text = (element.textContent || "").trim();

    if (!text) {
      return true;
    }

    return Boolean(element.querySelector("svg, img, i, .icon"));
  }

  function applyButtonTimers(buttonTimerSeconds) {
    const candidates = document.querySelectorAll("button, a");

    candidates.forEach((element) => {
      if (element.dataset.frictionTimerBound === "true") {
        return;
      }

      const timerSeconds = Number(buttonTimerSeconds) || 5;
      const originalText = element.textContent?.trim() || "";

      element.dataset.frictionTimerBound = "true";

      const restoreButtonState = () => {
        element.style.opacity = "";
        element.style.filter = "";
        element.style.pointerEvents = "";
        element.style.cursor = "";

        if (element instanceof HTMLButtonElement) {
          element.disabled = false;
        }

        if (element instanceof HTMLAnchorElement) {
          element.removeAttribute("aria-disabled");
          element.style.color = "";
          element.style.textDecoration = "";
        }

        if (
          element.dataset.frictionOriginalText &&
          (!hasOnlyIconContent(element) || originalText)
        ) {
          const previousText = element.dataset.frictionOriginalText;
          element.textContent = previousText;
          delete element.dataset.frictionOriginalText;
        }
      };

      const setTimerState = (remainingSeconds) => {
        if (element instanceof HTMLButtonElement) {
          element.disabled = true;
        }

        if (element instanceof HTMLAnchorElement) {
          element.setAttribute("aria-disabled", "true");
          element.style.pointerEvents = "none";
          element.style.color = "#7a7a7a";
          element.style.textDecoration = "none";
        }

        element.style.opacity = "0.5";
        element.style.filter = "grayscale(1)";
        element.style.cursor = "not-allowed";

        if (!hasOnlyIconContent(element) && element.textContent) {
          const text = `${remainingSeconds} seconds remaining`;
          element.dataset.frictionOriginalText =
            element.dataset.frictionOriginalText || originalText;
          element.textContent = text;
        }
      };

      element.addEventListener("click", (event) => {
        if (element.dataset.frictionBypassDelay === "true") {
          element.dataset.frictionBypassDelay = "false";
          return;
        }

        if (element.dataset.frictionPendingSecondPress === "true") {
          element.dataset.frictionPendingSecondPress = "false";
          restoreButtonState();
          element.dataset.frictionBypassDelay = "true";
          element.click();
          return;
        }

        if (element.dataset.frictionTimerActive === "true") {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        element.dataset.frictionTimerActive = "true";
        let remaining = timerSeconds;
        setTimerState(remaining);

        const intervalId = window.setInterval(() => {
          remaining -= 1;

          if (remaining <= 0) {
            window.clearInterval(intervalId);
            element.dataset.frictionTimerActive = "false";
            element.dataset.frictionPendingSecondPress = "true";
            restoreButtonState();
            return;
          }

          if (!hasOnlyIconContent(element) && element.textContent) {
            element.textContent = `${remaining} seconds remaining`;
          }
        }, 1000);
      });
    });
  }

  function getSiteSettings() {
    const currentOrigin = getCurrentOrigin();
    const customPlatformId = `custom:${currentOrigin}`;

    const platformSettings = state.platformSettings[customPlatformId]
      ?? state.platformSettings.youtube
      ?? state.platformSettings.facebook;

    if (platformSettings) {
      return {
        hideImages: Boolean(platformSettings.hideImages),
        buttonTimers: Boolean(platformSettings.buttonTimers),
        youtubePauseAutoplayOnHover: Boolean(
          platformSettings.youtubePauseAutoplayOnHover,
        ),
        buttonTimerSeconds: Number(state.devSettings.buttonTimerSeconds) || 5,
      };
    }

    return {
      hideImages: Boolean(state.devSettings.hideImages),
      buttonTimers: Boolean(state.devSettings.buttonTimers),
      youtubePauseAutoplayOnHover: false,
      buttonTimerSeconds: Number(state.devSettings.buttonTimerSeconds) || 5,
    };
  }

  function runBuiltInSiteBehaviors() {
    const currentOrigin = getCurrentOrigin();
    const matchedPlatformId = Object.entries(BUILT_IN_PLATFORM_IDS).find(
      ([, platformOrigin]) => platformOrigin === currentOrigin,
    )?.[0];

    if (!matchedPlatformId || !BUILT_IN_SITE_BEHAVIORS[matchedPlatformId]) {
      return;
    }

    const siteSettings = getSiteSettings();
    const behaviorConfig = BUILT_IN_SITE_BEHAVIORS[matchedPlatformId];

    Object.entries(behaviorConfig).forEach(([settingId, behavior]) => {
      if (siteSettings[settingId]) {
        behavior.apply();
      }
    });
  }

  function runSiteMutations() {
    if (
      !state.devSettings.enabled ||
      !shouldApplyToCurrentSite(state.configuredWebsites, state.platformSettings)
    ) {
      return;
    }

    const siteSettings = getSiteSettings();

    if (siteSettings.hideImages) {
      applyImageHiding();
    }

    if (siteSettings.buttonTimers) {
      applyButtonTimers(siteSettings.buttonTimerSeconds);
    }

    runBuiltInSiteBehaviors();
  }

  function scheduleMutationRun() {
    if (state.scheduledMutationRun) {
      return;
    }

    state.scheduledMutationRun = true;

    window.requestAnimationFrame(() => {
      state.scheduledMutationRun = false;
      runSiteMutations();
    });
  }

  function attachMutationObserver() {
    if (state.observer) {
      return;
    }

    state.observer = new MutationObserver(() => {
      scheduleMutationRun();
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "href", "class", "style"],
    });
  }

  async function initialize() {
    if (!document.body) {
      return;
    }

    const storage = await readStorage([
      STORAGE_KEYS.websites,
      STORAGE_KEYS.platformSettings,
      STORAGE_KEYS.devSettings,
    ]);

    state.configuredWebsites = Array.isArray(storage[STORAGE_KEYS.websites])
      ? storage[STORAGE_KEYS.websites]
          .map((site) => normalizeOrigin(site))
          .filter(Boolean)
      : [];

    state.platformSettings =
      storage[STORAGE_KEYS.platformSettings] &&
      typeof storage[STORAGE_KEYS.platformSettings] === "object"
        ? storage[STORAGE_KEYS.platformSettings]
        : {};

    state.devSettings = {
      ...DEFAULT_DEV_SETTINGS,
      ...(storage[STORAGE_KEYS.devSettings] || {}),
    };

    if (
      !state.devSettings.enabled ||
      !shouldApplyToCurrentSite(state.configuredWebsites, state.platformSettings)
    ) {
      return;
    }

    attachMutationObserver();
    runSiteMutations();
  }

  initialize();
})();
