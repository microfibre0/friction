import { colors } from "../data/colors";
import type { Platform } from "../data/platforms";
import paletteIcon from "../assets/Color palette.svg";

type PlatformCardProps = {
  activeCount: number;
  onOpenColorPicker: (platform: Platform) => void;
  onRemove?: () => void;
  platform: Platform;
  onSelect: (platformId: string) => void;
};

export function PlatformCard({
  activeCount,
  onOpenColorPicker,
  onRemove,
  platform,
  onSelect,
}: PlatformCardProps) {
  return (
    <div className="relative">
      <button
        aria-label={`Open ${platform.name} settings`}
        className="relative flex h-[110px] w-full flex-col items-start justify-center px-5 pr-36 text-left transition-[filter] hover:brightness-110 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
        onClick={() => onSelect(platform.id)}
        style={{
          backgroundColor: platform.colors.card,
          outlineColor: colors.textPrimary,
        }}
        type="button"
      >
        <span className="text-[28px] font-normal leading-tight">
          {platform.name}
        </span>
        <span
          className="text-[14px] leading-tight"
          style={{ color: colors.textSecondary }}
        >
          {platform.description}
        </span>
        <span
          className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-full px-3 py-1 text-[12px]"
          style={{
            backgroundColor: colors.statusBackground,
            color: colors.statusText,
          }}
        >
          <span
            className="size-2 rounded-full"
            style={{
              backgroundColor:
                activeCount > 0 ? colors.switchEnabled : colors.statusDot,
            }}
          />
          {activeCount > 0 ? `${activeCount} active` : "inactive"}
        </span>
      </button>
      <button
        aria-label={`Change ${platform.name} card color`}
        className="absolute right-4 top-3 flex size-7 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => onOpenColorPicker(platform)}
        style={{ outlineColor: colors.textPrimary }}
        title={`Change ${platform.name} card color`}
        type="button"
      >
        <img alt="" className="size-6" src={paletteIcon} />
      </button>
      {onRemove && (
        <button
          aria-label={`Remove ${platform.name}`}
          className="absolute right-12 top-3 flex size-7 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={onRemove}
          style={{
            color: colors.textPrimary,
            outlineColor: colors.textPrimary,
          }}
          title={`Remove ${platform.name}`}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="block size-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m7 7 10 10M17 7 7 17"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
