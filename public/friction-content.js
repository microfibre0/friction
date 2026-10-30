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
      hideVideoPreviews: {
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
    timerListenerAttached: false,
    videoPlaybackProtectionAttached: false,
    imageOverlays: [],
    imageOverlayPositioningAttached: false,
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

  function getImageOverlayHost(image) {
    let ancestor = image.parentElement;

    while (ancestor && ancestor !== document.documentElement) {
      const styles = window.getComputedStyle(ancestor);
      if (
        styles.position !== "static" ||
        styles.transform !== "none" ||
        styles.perspective !== "none" ||
        styles.filter !== "none" ||
        /paint|layout|strict|content/.test(styles.contain)
      ) {
        return ancestor;
      }

      ancestor = ancestor.parentElement;
    }

    return document.body || document.documentElement;
  }

  function describeElement(element) {
    const classes =
      typeof element.className === "string"
        ? element.className.trim().split(/\s+/).slice(0, 3).join(".")
        : "";
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes ? `.${classes}` : ""}`;
  }

  function applyImageHiding() {
    const images = document.querySelectorAll("img");

    images.forEach((image) => {
      if (image.dataset.frictionOverlayApplied === "true") {
        state.imageOverlays
          .find((entry) => entry.image === image)
          ?.updateOverlay();
        return;
      }

      let host = getImageOverlayHost(image);

      const overlay = document.createElement("button");
      overlay.type = "button";
      overlay.setAttribute("aria-label", "Remove hidden image");
      overlay.dataset.frictionOverlayApplied = "true";
      overlay.dataset.frictionOverlayHost = describeElement(host);
      overlay.style.position = "absolute";
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

      const label = document.createElement("span");
      label.textContent = "Tap to remove";
      label.style.position = "absolute";
      label.style.left = "50%";
      label.style.top = "50%";
      label.style.transform = "translate(-50%, -50%)";
      label.style.width = "max-content";
      label.style.whiteSpace = "nowrap";
      overlay.appendChild(label);

      let resizeObserver;
      const updateOverlay = () => {
        if (!image.isConnected) {
          overlay.remove();
          delete image.dataset.frictionOverlayApplied;
          state.imageOverlays = state.imageOverlays.filter(
            (entry) => entry.image !== image,
          );
          return;
        }

        if (!host.isConnected || !host.contains(image)) {
          resizeObserver?.unobserve(host);
          host = getImageOverlayHost(image);
          host.appendChild(overlay);
          overlay.dataset.frictionOverlayHost = describeElement(host);
          resizeObserver?.observe(host);
        }

        const imageRect = image.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        const hostStyles = window.getComputedStyle(host);
        const isRootHost =
          host === document.documentElement ||
          (host === document.body &&
            hostStyles.position === "static" &&
            hostStyles.transform === "none" &&
            hostStyles.perspective === "none" &&
            hostStyles.filter === "none" &&
            !/paint|layout|strict|content/.test(hostStyles.contain));
        const top = isRootHost
          ? imageRect.top + window.scrollY
          : imageRect.top - hostRect.top - host.clientTop + host.scrollTop;
        const left = isRootHost
          ? imageRect.left + window.scrollX
          : imageRect.left - hostRect.left - host.clientLeft + host.scrollLeft;
        const styleValues = {
          top: `${top}px`,
          left: `${left}px`,
          width: `${imageRect.width}px`,
          height: `${imageRect.height}px`,
          display: imageRect.width > 0 && imageRect.height > 0 ? "grid" : "none",
        };
        Object.entries(styleValues).forEach(([property, value]) => {
          if (overlay.style[property] !== value) {
            overlay.style[property] = value;
          }
        });

        const labelRect = label.getBoundingClientRect();
        const overlayStyles = window.getComputedStyle(overlay);
        const horizontalPadding =
          Number.parseFloat(overlayStyles.paddingLeft) +
          Number.parseFloat(overlayStyles.paddingRight);
        const verticalPadding =
          Number.parseFloat(overlayStyles.paddingTop) +
          Number.parseFloat(overlayStyles.paddingBottom);
        const isTooSmall =
          imageRect.width < labelRect.width + horizontalPadding ||
          imageRect.height < labelRect.height + verticalPadding;

        if (isTooSmall) {
          if (overlay.title !== "Tap to remove") {
            overlay.title = "Tap to remove";
          }
          if (label.style.visibility !== "hidden") {
            label.style.visibility = "hidden";
          }
        } else {
          if (overlay.hasAttribute("title")) {
            overlay.removeAttribute("title");
          }
          if (label.style.visibility !== "visible") {
            label.style.visibility = "visible";
          }
        }
      };

      resizeObserver = new ResizeObserver(updateOverlay);
      resizeObserver.observe(image);
      resizeObserver.observe(host);

      overlay.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        resizeObserver.disconnect();
        overlay.remove();
        state.imageOverlays = state.imageOverlays.filter(
          (entry) => entry.image !== image,
        );
      });

      host.appendChild(overlay);
      state.imageOverlays.push({ image, overlay, updateOverlay });
      image.dataset.frictionOverlayApplied = "true";
      updateOverlay();
    });

    state.imageOverlays.forEach((entry) => entry.updateOverlay());

    if (!state.imageOverlayPositioningAttached) {
      const updateImageOverlays = () => {
        state.imageOverlays.forEach((entry) => entry.updateOverlay());
      };

      window.addEventListener("scroll", updateImageOverlays, {
        capture: true,
        passive: true,
      });
      window.addEventListener("resize", updateImageOverlays);
      state.imageOverlayPositioningAttached = true;
    }
  }

  function applyFacebookVideoPlayerHiding() {
    const videoPlayers = document.querySelectorAll("[data-video-id]");

    videoPlayers.forEach((videoPlayer) => {
      if (videoPlayer.dataset.frictionVideoOverlayApplied === "true") {
        return;
      }

      const parent = videoPlayer.parentNode;
      if (!parent) {
        return;
      }

      const originalPosition = videoPlayer.style.position;
      const needsPositioning =
        window.getComputedStyle(videoPlayer).position === "static";

      if (needsPositioning) {
        videoPlayer.style.position = "relative";
      }

      const overlay = document.createElement("button");
      overlay.type = "button";
      overlay.textContent = "Tap to remove";
      overlay.setAttribute("aria-label", "Remove hidden video");
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
      overlay.style.touchAction = "manipulation";

      overlay.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        overlay.remove();

        if (needsPositioning) {
          videoPlayer.style.position = originalPosition;
        }
      });

      videoPlayer.appendChild(overlay);
      videoPlayer.dataset.frictionVideoOverlayApplied = "true";
    });
  }

  function preventAutomaticVideoPlayback() {
    const stopAutomaticVideoPlayback = (event) => {
      const video = event.target;
      if (!(video instanceof HTMLVideoElement)) {
        return;
      }

      if (navigator.userActivation && !navigator.userActivation.isActive) {
        video.pause();
      }
    };

    const disableVideoAutoplay = (video) => {
      video.autoplay = false;
      video.removeAttribute("autoplay");
    };

    if (!state.videoPlaybackProtectionAttached) {
      window.addEventListener("play", stopAutomaticVideoPlayback, true);
      state.videoPlaybackProtectionAttached = true;
    }

    document.querySelectorAll("video").forEach(disableVideoAutoplay);
  }

  function applyButtonTimers(buttonTimerSeconds) {
    if (state.timerListenerAttached) {
      return;
    }

    const timerSeconds = Number(buttonTimerSeconds) || 5;

    document.addEventListener(
      "click",
      (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }

        const element = event.target.closest("button, a");
        if (
          !(element instanceof HTMLButtonElement) &&
          !(element instanceof HTMLAnchorElement)
        ) {
          return;
        }

        if (element.dataset.frictionOverlayApplied === "true") {
          return;
        }

        if (element.dataset.frictionBypassDelay === "true") {
          delete element.dataset.frictionBypassDelay;
          return;
        }

        if (element.dataset.frictionPendingSecondPress === "true") {
          delete element.dataset.frictionPendingSecondPress;
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (element.dataset.frictionTimerActive === "true") {
          return;
        }

        element.dataset.frictionTimerActive = "true";
        const originalStyles = {
          opacity: element.style.opacity,
          filter: element.style.filter,
          cursor: element.style.cursor,
          color: element.style.color,
          textDecoration: element.style.textDecoration,
          ariaDisabled: element.getAttribute("aria-disabled"),
        };
        const timerLabel = document.createElement("span");
        timerLabel.textContent = `${timerSeconds} seconds remaining`;
        timerLabel.style.marginInlineStart = "0.5em";
        timerLabel.style.fontSize = "0.85em";
        timerLabel.style.color = "#808080";
        timerLabel.dataset.frictionTimerLabel = "true";
        element.parentNode?.insertBefore(timerLabel, element.nextSibling);

        element.style.opacity = "0.5";
        element.style.filter = "grayscale(1)";
        element.style.cursor = "not-allowed";
        element.setAttribute("aria-disabled", "true");

        let remaining = timerSeconds;
        const intervalId = window.setInterval(() => {
          remaining -= 1;

          if (remaining > 0) {
            timerLabel.textContent = `${remaining} seconds remaining`;
            return;
          }

          window.clearInterval(intervalId);
          element.dataset.frictionTimerActive = "false";
          element.dataset.frictionPendingSecondPress = "true";
          timerLabel.remove();
          element.style.opacity = originalStyles.opacity;
          element.style.filter = originalStyles.filter;
          element.style.cursor = originalStyles.cursor;
          element.style.color = originalStyles.color;
          element.style.textDecoration = originalStyles.textDecoration;

          if (originalStyles.ariaDisabled === null) {
            element.removeAttribute("aria-disabled");
          } else {
            element.setAttribute("aria-disabled", originalStyles.ariaDisabled);
          }

        }, 1000);
      },
      true,
    );

    state.timerListenerAttached = true;
  }

  function getSiteSettings() {
    const currentOrigin = getCurrentOrigin();
    const customPlatformId = `custom:${currentOrigin}`;
    const matchedPlatformId = Object.entries(BUILT_IN_PLATFORM_IDS).find(
      ([, platformOrigin]) => platformOrigin === currentOrigin,
    )?.[0];

    const platformSettings = state.platformSettings[customPlatformId]
      ?? (matchedPlatformId
        ? state.platformSettings[matchedPlatformId]
        : undefined);

    if (platformSettings) {
      return {
        hideImages: Boolean(platformSettings.hideImages),
        buttonTimers: Boolean(platformSettings.buttonTimers),
        buttonTimerSeconds: Number(state.devSettings.buttonTimerSeconds) || 5,
      };
    }

    return {
      hideImages: Boolean(state.devSettings.hideImages),
      buttonTimers: Boolean(state.devSettings.buttonTimers),
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
    if (!siteSettings.hideImages) {
      return;
    }

    Object.values(BUILT_IN_SITE_BEHAVIORS[matchedPlatformId]).forEach(
      (behavior) => behavior.apply(),
    );
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

      if (
        getCurrentOrigin() === BUILT_IN_PLATFORM_IDS.facebook ||
        getCurrentOrigin() === BUILT_IN_PLATFORM_IDS.youtube
      ) {
        preventAutomaticVideoPlayback();
      }

      if (getCurrentOrigin() === BUILT_IN_PLATFORM_IDS.facebook) {
        applyFacebookVideoPlayerHiding();
      }
    }

    if (siteSettings.buttonTimers) {
      applyButtonTimers(siteSettings.buttonTimerSeconds);
    }

    if (siteSettings.hideImages) {
      runBuiltInSiteBehaviors();
    }
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
      attributeFilter: [
        "src",
        "href",
        "class",
        "style",
        "aria-label",
        "data-video-id",
        "autoplay",
      ],
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
