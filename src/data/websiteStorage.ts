import { settingDefinitions } from "./platforms";

const customWebsitesStorageKey = "customWebsites";
const platformCardColorsStorageKey = "platformCardColors";
const platformOverridesStorageKey = "platformOverrides";
const platformSettingsStorageKey = "platformSettings";
const legacyFacebookVideoSettingId = "facebookPreventVideoHover";
const legacyYouTubePreviewSettingId = "youtubePauseAutoplayOnHover";

export type PlatformCardColors = Record<string, string>;
export type PlatformOverride = {
  name: string;
  url: string;
};
export type PlatformOverrides = Record<string, PlatformOverride>;
export type PlatformSettingsState = Record<string, Record<string, boolean>>;

export function normalizeWebsiteUrl(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Enter a website address.");
  }

  let url: URL;

  try {
    url = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)
        ? trimmedValue
        : `https://${trimmedValue}`,
    );
  } catch {
    throw new Error("Enter a valid website address.");
  }

  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    !url.hostname ||
    url.username ||
    url.password
  ) {
    throw new Error("Enter a valid website address.");
  }

  return url.origin;
}

function getSyncStorage(): chrome.storage.StorageArea {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) {
    throw new Error("Chrome sync storage is unavailable.");
  }

  return chrome.storage.sync;
}

export async function loadCustomWebsites(): Promise<string[]> {
  const storedValues = await getSyncStorage().get(customWebsitesStorageKey);
  const websites: unknown = storedValues[customWebsitesStorageKey] ?? [];

  if (!Array.isArray(websites) || !websites.every((site) => typeof site === "string")) {
    throw new Error("Saved websites could not be read.");
  }

  return websites.map(normalizeWebsiteUrl);
}

export async function saveCustomWebsites(websites: string[]): Promise<void> {
  await getSyncStorage().set({ [customWebsitesStorageKey]: websites });
}

export async function saveWebsitePreferences(
  websites: string[],
  cardColors: PlatformCardColors,
  platformOverrides: PlatformOverrides,
): Promise<void> {
  await getSyncStorage().set({
    [customWebsitesStorageKey]: websites,
    [platformCardColorsStorageKey]: cardColors,
    [platformOverridesStorageKey]: platformOverrides,
  });
}

export async function loadPlatformSettings(): Promise<PlatformSettingsState> {
  const storedValues = await getSyncStorage().get(platformSettingsStorageKey);
  const settings: unknown = storedValues[platformSettingsStorageKey] ?? {};

  if (
    typeof settings !== "object" ||
    settings === null ||
    Array.isArray(settings)
  ) {
    throw new Error("Saved platform settings could not be read.");
  }

  const validatedSettings: PlatformSettingsState = {};
  let hasInapplicableSettings = false;
  let hasLegacyFacebookVideoSetting = false;
  let hasLegacyYouTubePreviewSetting = false;

  for (const [platformId, platformSettingValues] of Object.entries(settings)) {
    if (
      typeof platformSettingValues !== "object" ||
      platformSettingValues === null ||
      Array.isArray(platformSettingValues)
    ) {
      throw new Error("Saved platform settings could not be read.");
    }

    const normalizedSettings: Record<string, boolean> = {};
    let shouldEnableHideImages = false;

    for (const [settingId, enabledValue] of Object.entries(platformSettingValues)) {
      if (typeof enabledValue !== "boolean") {
        throw new Error("Saved platform settings could not be read.");
      }

      if (platformId === "facebook" && settingId === legacyFacebookVideoSettingId) {
        hasLegacyFacebookVideoSetting = true;
        shouldEnableHideImages = shouldEnableHideImages || enabledValue;
        continue;
      }

      if (platformId === "youtube" && settingId === legacyYouTubePreviewSettingId) {
        hasLegacyYouTubePreviewSetting = true;
        shouldEnableHideImages = shouldEnableHideImages || enabledValue;
        continue;
      }

      const definition = settingDefinitions.find(
        (setting) => setting.id === settingId,
      );
      if (
        definition?.platformIds &&
        !definition.platformIds.includes(platformId)
      ) {
        hasInapplicableSettings = true;
        continue;
      }

      normalizedSettings[settingId] = enabledValue;
    }

    if (shouldEnableHideImages) {
      normalizedSettings.hideImages = true;
    }

    validatedSettings[platformId] = normalizedSettings;
  }

  if (
    hasInapplicableSettings ||
    hasLegacyFacebookVideoSetting ||
    hasLegacyYouTubePreviewSetting
  ) {
    await savePlatformSettings(validatedSettings);
  }

  return validatedSettings;
}

export async function savePlatformSettings(
  settings: PlatformSettingsState,
): Promise<void> {
  await getSyncStorage().set({
    [platformSettingsStorageKey]: settings,
  });
}

export async function loadPlatformCardColors(): Promise<PlatformCardColors> {
  const storedValues = await getSyncStorage().get(platformCardColorsStorageKey);
  const cardColors: unknown = storedValues[platformCardColorsStorageKey] ?? {};

  if (
    typeof cardColors !== "object" ||
    cardColors === null ||
    Array.isArray(cardColors)
  ) {
    throw new Error("Saved platform colors could not be read.");
  }

  const validatedColors: PlatformCardColors = {};

  for (const [platformId, color] of Object.entries(cardColors)) {
    if (typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color)) {
      throw new Error("Saved platform colors could not be read.");
    }

    validatedColors[platformId] = color;
  }

  return validatedColors;
}

export async function savePlatformCardColors(
  cardColors: PlatformCardColors,
): Promise<void> {
  await getSyncStorage().set({
    [platformCardColorsStorageKey]: cardColors,
  });
}

export async function loadPlatformOverrides(): Promise<PlatformOverrides> {
  const storedValues = await getSyncStorage().get(platformOverridesStorageKey);
  const overrides: unknown = storedValues[platformOverridesStorageKey] ?? {};

  if (
    typeof overrides !== "object" ||
    overrides === null ||
    Array.isArray(overrides)
  ) {
    throw new Error("Saved website details could not be read.");
  }

  const validatedOverrides: PlatformOverrides = {};

  for (const [platformId, override] of Object.entries(overrides)) {
    if (
      typeof override !== "object" ||
      override === null ||
      !("name" in override) ||
      typeof override.name !== "string" ||
      !override.name.trim() ||
      !("url" in override) ||
      typeof override.url !== "string"
    ) {
      throw new Error("Saved website details could not be read.");
    }

    try {
      validatedOverrides[platformId] = {
        name: override.name.trim(),
        url: normalizeWebsiteUrl(override.url),
      };
    } catch {
      throw new Error("Saved website details could not be read.");
    }
  }

  return validatedOverrides;
}
