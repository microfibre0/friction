import { useEffect } from "react";
import { colors, platformColorHues } from "../data/colors";
import type { Platform } from "../data/platforms";
import greenTickIcon from "../assets/big green tick.svg";

const brightnessLevels = Array.from(
  { length: 12 },
  (_, index) => 30 + (index * 60) / 11,
);

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const chroma =
    (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const hueSection = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const matchValue = normalizedLightness - chroma / 2;
  let channels: [number, number, number];

  if (hueSection < 1) {
    channels = [chroma, secondary, 0];
  } else if (hueSection < 2) {
    channels = [secondary, chroma, 0];
  } else if (hueSection < 3) {
    channels = [0, chroma, secondary];
  } else if (hueSection < 4) {
    channels = [0, secondary, chroma];
  } else if (hueSection < 5) {
    channels = [secondary, 0, chroma];
  } else {
    channels = [chroma, 0, secondary];
  }

  return `#${channels
    .map((channel) =>
      Math.round((channel + matchValue) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const paletteColors = brightnessLevels.flatMap((brightness) =>
  platformColorHues.map((hue) => hslToHex(hue, 78, brightness)),
);

type PlatformColorPickerProps = {
  activeCount: number;
  color: string;
  error: string | null;
  onDiscard: () => void;
  onKeep: () => void;
  onSelectColor: (color: string) => void;
  platform: Platform;
};

export function PlatformColorPicker({
  activeCount,
  color,
  error,
  onDiscard,
  onKeep,
  onSelectColor,
  platform,
}: PlatformColorPickerProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDiscard();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDiscard]);

  return (
    <aside
      aria-label="Choose platform color"
      aria-modal="true"
      className="flex h-full w-full flex-col"
      role="dialog"
      style={{ backgroundColor: colors.surface }}
    >
      <header className="flex h-16 shrink-0 items-center justify-between px-3">
        <button
          aria-label="Discard color changes and go back"
          className="flex size-9 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={onDiscard}
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
        <h2 className="text-[16px] font-medium">colour</h2>
        <button
          aria-label="Keep selected color"
          className="flex size-9 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={onKeep}
          type="button"
        >
          <img alt="" className="w-9" src={greenTickIcon} />
        </button>
      </header>
      <div className="shrink-0">
        <div
          className="flex h-16 flex-col justify-center px-2"
          style={{ backgroundColor: color }}
        >
          <span className="text-[14px] font-medium leading-tight">
            {platform.name}
          </span>
          <span className="flex items-center justify-between text-[10px] leading-tight">
            {platform.description}
            <span
              className="rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: colors.statusBackground,
                color: colors.statusText,
              }}
            >
              {activeCount > 0 ? `${activeCount} active` : "inactive"}
            </span>
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          aria-label="Color palette"
          className="grid grid-cols-12"
          role="group"
        >
          {paletteColors.map((paletteColor) => (
            <button
              aria-label={`Select color ${paletteColor}`}
              aria-pressed={paletteColor === color}
              className="h-8 min-w-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
              key={paletteColor}
              onClick={() => onSelectColor(paletteColor)}
              style={{
                backgroundColor: paletteColor,
                boxShadow:
                  paletteColor === color ? "inset 0 0 0 2px white" : undefined,
              }}
              title={paletteColor}
              type="button"
            />
          ))}
        </div>
        {error && (
          <p className="mt-3 text-[12px] text-white" role="alert">
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}
