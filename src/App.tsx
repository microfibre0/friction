import { useState } from "react";
import { platforms, settingDefinitions } from "./data/platforms";
import type { PlatformSettingsState } from "./data/platforms";
import { colors } from "./data/colors";
import { PlatformList } from "./components/PlatformList";
import { PlatformSettings } from "./components/PlatformSettings";
import "./App.css";

function createInitialSettings(): PlatformSettingsState {
  return Object.fromEntries(
    platforms.map((platform) => [
      platform.id,
      Object.fromEntries(
        settingDefinitions.map((setting) => [
          setting.id,
          setting.defaultEnabled,
        ]),
      ),
    ]),
  );
}

function App() {
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    null,
  );
  const [settings, setSettings] =
    useState<PlatformSettingsState>(createInitialSettings);

  const selectedPlatform = platforms.find(
    (platform) => platform.id === selectedPlatformId,
  );

  function toggleSetting(platformId: string, settingId: string) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [platformId]: {
        ...currentSettings[platformId],
        [settingId]: !currentSettings[platformId][settingId],
      },
    }));
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
            settings={settings[selectedPlatform.id]}
          />
        ) : (
          <PlatformList onSelectPlatform={setSelectedPlatformId} />
        )}
      </section>
    </main>
  );
}

export default App;
