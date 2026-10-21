import { ToggleSwitch } from "./ToggleSwitch";
import { colors } from "../data/colors";

type SettingRowProps = {
  description: string;
  enabled: boolean;
  label: string;
  onToggle: () => void;
  optionColor: string;
};

export function SettingRow({
  description,
  enabled,
  label,
  onToggle,
  optionColor,
}: SettingRowProps) {
  return (
    <button
      aria-checked={enabled}
      aria-label={`${label}: ${enabled ? "on" : "off"}`}
      className="flex h-[110px] w-full items-center justify-between gap-4 px-5 text-left transition-[filter] hover:brightness-110 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
      onClick={onToggle}
      role="switch"
      style={{
        backgroundColor: optionColor,
        outlineColor: colors.textPrimary,
      }}
      type="button"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-[26px] font-normal leading-tight">{label}</span>
        <span
          className="max-w-[300px] text-[14px] leading-tight"
          style={{ color: colors.textSecondary }}
        >
          {description}
        </span>
      </span>
      <ToggleSwitch enabled={enabled} />
    </button>
  );
}
