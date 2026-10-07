import { colors } from "../data/colors";
import { platforms } from "../data/platforms";
import { BrandHeader } from "./BrandHeader";
import { PlatformCard } from "./PlatformCard";

type PlatformListProps = {
  onSelectPlatform: (platformId: string) => void;
};

export function PlatformList({ onSelectPlatform }: PlatformListProps) {
  return (
    <div className="flex h-full flex-col">
      <BrandHeader />
      <div className="shrink-0">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            onSelect={onSelectPlatform}
            platform={platform}
          />
        ))}
      </div>
      <div
        className="min-h-0 flex-1"
        style={{ backgroundColor: colors.surface }}
      />
    </div>
  );
}
