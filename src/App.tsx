import { useEffect, useState } from "react";
import { platforms, settingDefinitions } from "./data/platforms";
import type { Platform, PlatformSettingsState } from "./data/platforms";
import { colors } from "./data/colors";
import {
  loadCustomWebsites,
  loadPlatformCardColors,
  normalizeWebsiteUrl,
  saveCustomWebsites,
  savePlatformCardColors,
  saveWebsitePreferences,
} from "./data/websiteStorage";
import { PlatformList } from "./components/PlatformList";
import { PlatformSettings } from "./components/PlatformSettings";
import "./App.css";

function createSettingsForPlatform(): PlatformSettingsState[string] {
  return Object.fromEntries(
    settingDefinitions.map((setting) => [setting.id, setting.defaultEnabled]),
  );
}

function darkenColor(hexColor: string, factor: number): string {
  const channels = hexColor.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);

  if (!channels) {
    return hexColor;
  }

  return `#${channels
    .slice(1)
    .map((channel) =>
      Math.round(Number.parseInt(channel, 16) * factor)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function App() {
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    null,
  );
  const [customWebsites, setCustomWebsites] = useState<string[]>([]);
  const [platformCardColors, setPlatformCardColors] = useState<
    Record<string, string>
  >({});
  const [settings, setSettings] = useState<PlatformSettingsState>(() =>
    Object.fromEntries(
      platforms.map((platform) => [
        platform.id,
        createSettingsForPlatform(),
      ]),
    ),
  );
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([loadCustomWebsites(), loadPlatformCardColors()])
      .then(([websites, savedCardColors]) => {
        if (isMounted) {
          setCustomWebsites(websites);
          setPlatformCardColors(savedCardColors);
          setSettings((currentSettings) => ({
            ...currentSettings,
            ...Object.fromEntries(
              websites.map((website) => {
                const platformId = `custom:${website}`;
                return [
                  platformId,
                  currentSettings[platformId] ?? createSettingsForPlatform(),
                ];
              }),
            ),
          }));
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setStorageError(
            error instanceof Error ? error.message : "Websites could not be loaded.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const customPlatforms: Platform[] = customWebsites.map((website) => {
    const url = new URL(website);

    return {
      id: `custom:${website}`,
      name: url.hostname,
      website: url.host,
      description: "Custom website",
      colors: colors.platforms.facebook,
    };
  });
  const allPlatforms = [...platforms, ...customPlatforms].map((platform) => ({
    ...platform,
    colors: platformCardColors[platform.id]
      ? {
          card: platformCardColors[platform.id],
          header: darkenColor(platformCardColors[platform.id], 0.48),
          option: darkenColor(platformCardColors[platform.id], 0.74),
          lower: darkenColor(platformCardColors[platform.id], 0.34),
        }
      : platform.colors,
  }));

  const selectedPlatform = allPlatforms.find(
    (platform) => platform.id === selectedPlatformId,
  );

  async function addWebsite(value: string): Promise<boolean> {
    setStorageError(null);

    try {
      const website = normalizeWebsiteUrl(value);
      const existingWebsiteOrigins = [
        ...platforms.map((platform) =>
          normalizeWebsiteUrl(platform.website),
        ),
        ...customWebsites,
      ];

      if (existingWebsiteOrigins.includes(website)) {
        throw new Error("This website has already been added.");
      }

      const nextWebsites = [...customWebsites, website];
      await saveCustomWebsites(nextWebsites);
      setCustomWebsites(nextWebsites);
      setSettings((currentSettings) => ({
        ...currentSettings,
        [`custom:${website}`]: createSettingsForPlatform(),
      }));
      return true;
    } catch (error: unknown) {
      setStorageError(
        error instanceof Error ? error.message : "Website could not be saved.",
      );
      return false;
    }
  }

  async function removeWebsite(website: string): Promise<void> {
    setStorageError(null);

    try {
      const nextWebsites = customWebsites.filter((site) => site !== website);
      const nextCardColors = { ...platformCardColors };
      delete nextCardColors[`custom:${website}`];

      await saveWebsitePreferences(nextWebsites, nextCardColors);
      setCustomWebsites(nextWebsites);
      setPlatformCardColors(nextCardColors);
      setSettings((currentSettings) => {
        const nextSettings = { ...currentSettings };
        delete nextSettings[`custom:${website}`];
        return nextSettings;
      });
    } catch (error: unknown) {
      setStorageError(
        error instanceof Error ? error.message : "Website could not be removed.",
      );
    }
  }

  async function updatePlatformCardColor(
    platformId: string,
    color: string,
  ): Promise<void> {
    setStorageError(null);

    try {
      const nextCardColors = { ...platformCardColors, [platformId]: color };
      await savePlatformCardColors(nextCardColors);
      setPlatformCardColors(nextCardColors);
    } catch (error: unknown) {
      setStorageError(
        error instanceof Error ? error.message : "Platform color could not be saved.",
      );
    }
  }

  function toggleSetting(platformId: string, settingId: string) {
    setSettings((currentSettings) => {
      const platformSettings =
        currentSettings[platformId] ?? createSettingsForPlatform();

      return {
        ...currentSettings,
        [platformId]: {
          ...platformSettings,
          [settingId]: !platformSettings[settingId],
        },
      };
    });
  }

  return (
    <main
      className="flex min-h-dvh items-center justify-center p-0"
      style={{ backgroundColor: colors.pageBackground, color: colors.textPrimary }}
    >
      <section
        aria-label="Friction settings"
        className="h-[min(600px,100dvh)] w-[min(450px,100vw)] overflow-hidden"
        style={{ backgroundColor: colors.surface }}
      >
        {selectedPlatform ? (
          <PlatformSettings
            onBack={() => setSelectedPlatformId(null)}
            onToggleSetting={(settingId) =>
              toggleSetting(selectedPlatform.id, settingId)
            }
            platform={selectedPlatform}
            settings={
              settings[selectedPlatform.id] ?? createSettingsForPlatform()
            }
          />
        ) : (
          <PlatformList
            onAddWebsite={addWebsite}
            onChangeCardColor={updatePlatformCardColor}
            onDismissError={() => setStorageError(null)}
            onRemoveWebsite={removeWebsite}
            onSelectPlatform={setSelectedPlatformId}
            platforms={allPlatforms}
            settings={settings}
            storageError={storageError}
          />
        )}
      </section>
    </main>
  );
}

export default App;
