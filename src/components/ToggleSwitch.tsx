import { colors } from "../data/colors";

type ToggleSwitchProps = {
  enabled: boolean;
};

export function ToggleSwitch({ enabled }: ToggleSwitchProps) {
  return (
    <span
      aria-hidden="true"
      className="relative h-7 w-14 shrink-0 rounded-full transition-colors"
      style={{
        backgroundColor: enabled
          ? colors.switchEnabled
          : colors.switchDisabled,
      }}
    >
      <span
        className={`absolute left-1 top-1 size-5 rounded-full shadow-sm transition-transform ${
          enabled ? "translate-x-7" : "translate-x-0"
        }`}
        style={{ backgroundColor: colors.switchKnob }}
      />
    </span>
  );
}
