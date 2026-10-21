import { colors } from "../data/colors";
import type { Platform } from "../data/platforms";

type PlatformCardProps = {
  activeCount: number;
  onChangeColor: (color: string) => void;
  onRemove?: () => void;
  platform: Platform;
  onSelect: (platformId: string) => void;
};

export function PlatformCard({
  activeCount,
  onChangeColor,
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
      <label
        className="absolute right-4 top-3 flex h-7 w-9 cursor-pointer items-center justify-center"
        title={`Change ${platform.name} card color`}
      >
        <span className="sr-only">Change {platform.name} card color</span>
        <input
          aria-label={`Change ${platform.name} card color`}
          className="platform-color-picker h-6 w-8 cursor-pointer"
          onChange={(event) => onChangeColor(event.target.value)}
          type="color"
          value={platform.colors.card}
        />
      </label>
      {onRemove && (
        <button
          aria-label={`Remove ${platform.name}`}
          className="absolute right-14 top-3 flex size-7 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2"
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
