import { colors } from "../data/colors";
import type { Platform } from "../data/platforms";

type PlatformCardProps = {
  platform: Platform;
  onSelect: (platformId: string) => void;
};

export function PlatformCard({ platform, onSelect }: PlatformCardProps) {
  return (
    <button
      aria-label={`Open ${platform.name} settings`}
      className="relative flex h-[110px] w-full flex-col items-start justify-center px-5 text-left transition-[filter] hover:brightness-110 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
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
          style={{ backgroundColor: colors.statusDot }}
        />
        inactive
      </span>
    </button>
  );
}
