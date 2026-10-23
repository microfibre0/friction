import { useEffect, useState } from "react";
import { platforms, settingDefinitions } from "./data/platforms";
import type { Platform, PlatformSettingsState } from "./data/platforms";
import { colors, getPlatformColorsFromCard } from "./data/colors";
import {
  loadCustomWebsites,
  loadPlatformCardColors,
  loadPlatformOverrides,
  normalizeWebsiteUrl,
  saveCustomWebsites,
  savePlatformCardColors,
  saveWebsitePreferences,
  type PlatformOverrides,
} from "./data/websiteStorage";
import { PlatformList } from "./components/PlatformList";
import { PlatformSettings } from "./components/PlatformSettings";
import { PlatformEditor } from "./components/PlatformEditor";
import "./App.css";

function createSettingsForPlatform(): PlatformSettingsState[string] {
  return Object.fromEntries(
    settingDefinitions.map((setting) => [setting.id, setting.defaultEnabled]),
  );
}

function App() {
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    null,
  );
  const [customWebsites, setCustomWebsites] = useState<string[]>([]);
  const [platformCardColors, setPlatformCardColors] = useState<
    Record<string, string>
  >({});
  const [platformOverrides, setPlatformOverrides] =
    useState<PlatformOverrides>({});
  const [settings, setSettings] = useState<PlatformSettingsState>(() =>
    Object.fromEntries(
      platforms.map((platform) => [
        platform.id,
        createSettingsForPlatform(),
      ]),
    ),
  );
  const [isEditingPlatform, setIsEditingPlatform] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      loadCustomWebsites(),
      loadPlatformCardColors(),
      loadPlatformOverrides(),
    ])
      .then(([websites, savedCardColors, savedOverrides]) => {
        if (isMounted) {
          setCustomWebsites(websites);
          setPlatformCardColors(savedCardColors);
          setPlatformOverrides(savedOverrides);
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
    const id = `custom:${website}`;
    const override = platformOverrides[id];

    return {
      id,
      name: override?.name ?? url.hostname,
      website: url.host,
      url: override?.url ?? website,
      description: "Custom website",
      colors: colors.platforms.facebook,
    };
  });
  const allPlatforms = [...platforms, ...customPlatforms].map((platform) => {
    const override = platformOverrides[platform.id];
    const cardColor = platformCardColors[platform.id];

    return {
      ...platform,
      name: override?.name ?? platform.name,
      website: override ? new URL(override.url).host : platform.website,
      url: override?.url ?? platform.url,
      colors: cardColor ? getPlatformColorsFromCard(cardColor) : platform.colors,
    };
  });

  const selectedPlatform = allPlatforms.find(
    (platform) => platform.id === selectedPlatformId,
  );

  async function addWebsite(value: string): Promise<boolean> {
    setStorageError(null);

    try {
      const website = normalizeWebsiteUrl(value);
      const existingWebsiteOrigins = allPlatforms.map((platform) =>
        normalizeWebsiteUrl(platform.url),
      );

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
      const platformId = `custom:${website}`;
      const nextOverrides = { ...platformOverrides };
      delete nextCardColors[platformId];
      delete nextOverrides[platformId];

      await saveWebsitePreferences(nextWebsites, nextCardColors, nextOverrides);
      setCustomWebsites(nextWebsites);
      setPlatformCardColors(nextCardColors);
      setPlatformOverrides(nextOverrides);
      setSettings((currentSettings) => {
        const nextSettings = { ...currentSettings };
        delete nextSettings[platformId];
        return nextSettings;
      });
    } catch (error: unknown) {
      setStorageError(
        error instanceof Error ? error.message : "Website could not be removed.",
      );
    }
  }

  async function savePlatformDetails(
    platformId: string,
    name: string,
    value: string,
  ): Promise<boolean> {
    setStorageError(null);

    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Enter a title.");
      }

      const url = normalizeWebsiteUrl(value);
      const existingUrls = allPlatforms
        .filter((platform) => platform.id !== platformId)
        .map((platform) => normalizeWebsiteUrl(platform.url));

      if (existingUrls.includes(url)) {
        throw new Error("This website address is already in use.");
      }

      const oldWebsite = platformId.startsWith("custom:")
        ? platformId.slice("custom:".length)
        : null;
      const nextPlatformId = oldWebsite ? `custom:${url}` : platformId;
      const nextWebsites = oldWebsite
        ? customWebsites.map((website) =>
            website === oldWebsite ? url : website,
          )
        : customWebsites;
      const nextCardColors = { ...platformCardColors };
      if (oldWebsite && oldWebsite !== url) {
        const oldCardColor = nextCardColors[platformId];
        delete nextCardColors[platformId];
        if (oldCardColor) {
          nextCardColors[nextPlatformId] = oldCardColor;
        }
      }

      const nextOverrides = { ...platformOverrides };
      if (nextPlatformId !== platformId) {
        delete nextOverrides[platformId];
      }
      nextOverrides[nextPlatformId] = { name: trimmedName, url };

      await saveWebsitePreferences(
        nextWebsites,
        nextCardColors,
        nextOverrides,
      );

      setCustomWebsites(nextWebsites);
      setPlatformCardColors(nextCardColors);
      setPlatformOverrides(nextOverrides);
      if (nextPlatformId !== platformId) {
        setSettings((currentSettings) => {
          const nextSettings = { ...currentSettings };
          if (nextSettings[platformId]) {
            nextSettings[nextPlatformId] = nextSettings[platformId];
            delete nextSettings[platformId];
          }
          return nextSettings;
        });
      }
      setSelectedPlatformId(nextPlatformId);
      setIsEditingPlatform(false);
      return true;
    } catch (error: unknown) {
      setStorageError(
        error instanceof Error ? error.message : "Website details could not be saved.",
      );
      return false;
    }
  }

  async function updatePlatformCardColor(
    platformId: string,
    color: string,
  ): Promise<boolean> {
    setStorageError(null);

    try {
      const nextCardColors = { ...platformCardColors, [platformId]: color };
      await savePlatformCardColors(nextCardColors);
      setPlatformCardColors(nextCardColors);
      return true;
    } catch (error: unknown) {
      setStorageError(
        error instanceof Error ? error.message : "Platform color could not be saved.",
      );
      return false;
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
        {selectedPlatform && isEditingPlatform ? (
          <PlatformEditor
            onBack={() => {
              setIsEditingPlatform(false);
              setStorageError(null);
            }}
            onDismissError={() => setStorageError(null)}
            onSave={(name, url) =>
              savePlatformDetails(selectedPlatform.id, name, url)
            }
            platform={selectedPlatform}
            storageError={storageError}
          />
        ) : selectedPlatform ? (
          <PlatformSettings
            onBack={() => {
              setSelectedPlatformId(null);
              setIsEditingPlatform(false);
            }}
            onEdit={() => {
              setStorageError(null);
              setIsEditingPlatform(true);
            }}
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
