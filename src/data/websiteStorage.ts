const customWebsitesStorageKey = "customWebsites";
const platformCardColorsStorageKey = "platformCardColors";

export type PlatformCardColors = Record<string, string>;

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
): Promise<void> {
  await getSyncStorage().set({
    [customWebsitesStorageKey]: websites,
    [platformCardColorsStorageKey]: cardColors,
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
