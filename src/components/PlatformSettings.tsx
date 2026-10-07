import { settingDefinitions } from "../data/platforms";
import type { Platform, PlatformSettingsState } from "../data/platforms";
import { colors } from "../data/colors";
import { SettingRow } from "./SettingRow";

type PlatformSettingsProps = {
  onBack: () => void;
  onToggleSetting: (settingId: string) => void;
  platform: Platform;
  settings: PlatformSettingsState[string];
};

export function PlatformSettings({
  onBack,
  onToggleSetting,
  platform,
  settings,
}: PlatformSettingsProps) {
  return (
    <div className="flex h-full flex-col">
      <header
        className="relative flex h-[130px] shrink-0 flex-col items-center justify-center"
        style={{ backgroundColor: platform.colors.header }}
      >
        <button
          aria-label="Back to websites"
          className="absolute left-4 top-5 flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={onBack}
          style={{
            color: colors.textPrimary,
            outlineColor: colors.textPrimary,
          }}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m15 18-6-6 6-6M9 12h12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
        <h1 className="text-[28px] font-medium leading-tight">
          {platform.name}
        </h1>
        <p className="text-[12px]" style={{ color: colors.textSecondary }}>
          {platform.website}
        </p>
      </header>

      <div className="shrink-0">
        {settingDefinitions.map((setting) => (
          <SettingRow
            key={setting.id}
            description={setting.description}
            enabled={settings[setting.id]}
            label={setting.label}
            onToggle={() => onToggleSetting(setting.id)}
            optionColor={platform.colors.option}
          />
        ))}
      </div>
      <div
        className="min-h-0 flex-1"
        style={{ backgroundColor: platform.colors.lower }}
      />
    </div>
  );
}
