import { useState, type FormEvent } from "react";
import { colors } from "../data/colors";
import type { Platform, PlatformSettingsState } from "../data/platforms";
import { BrandHeader } from "./BrandHeader";
import { PlatformCard } from "./PlatformCard";

type PlatformListProps = {
  onAddWebsite: (website: string) => Promise<boolean>;
  onChangeCardColor: (platformId: string, color: string) => Promise<void>;
  onDismissError: () => void;
  onRemoveWebsite: (website: string) => Promise<void>;
  onSelectPlatform: (platformId: string) => void;
  platforms: Platform[];
  settings: PlatformSettingsState;
  storageError: string | null;
};

export function PlatformList({
  onAddWebsite,
  onChangeCardColor,
  onDismissError,
  onRemoveWebsite,
  onSelectPlatform,
  platforms,
  settings,
  storageError,
}: PlatformListProps) {
  const [isAddingWebsite, setIsAddingWebsite] = useState(false);
  const [websiteInput, setWebsiteInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const wasAdded = await onAddWebsite(websiteInput);
    setIsSaving(false);

    if (wasAdded) {
      setWebsiteInput("");
      setIsAddingWebsite(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <BrandHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {platforms.map((platform) => (
          <PlatformCard
            activeCount={
              Object.values(settings[platform.id] ?? {}).filter(Boolean).length
            }
            key={platform.id}
            onChangeColor={(color) =>
              onChangeCardColor(platform.id, color)
            }
            onRemove={
              platform.id.startsWith("custom:")
                ? () =>
                    onRemoveWebsite(
                      platform.id.slice("custom:".length),
                    )
                : undefined
            }
            onSelect={onSelectPlatform}
            platform={platform}
          />
        ))}
      </div>
      <footer
        className="shrink-0 p-3"
        style={{ backgroundColor: colors.surface }}
      >
        {storageError && (
          <p
            className="mb-2 text-[12px]"
            role="alert"
            style={{ color: colors.textPrimary }}
          >
            {storageError}
          </p>
        )}
        {isAddingWebsite ? (
          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <label className="text-[13px]" htmlFor="website-address">
              Website address
            </label>
            <input
              autoFocus
              className="h-10 rounded px-3 text-[14px] outline-none focus-visible:ring-2"
              id="website-address"
              onChange={(event) => {
                setWebsiteInput(event.target.value);
                if (storageError) {
                  onDismissError();
                }
              }}
              placeholder="example.com"
              style={{
                backgroundColor: colors.statusBackground,
                color: colors.textPrimary,
              }}
              type="text"
              value={websiteInput}
            />
            <div className="flex gap-2">
              <button
                className="h-9 flex-1 rounded text-[14px] font-medium"
                disabled={isSaving}
                style={{
                  backgroundColor: colors.statusBackground,
                  color: colors.textPrimary,
                }}
                type="button"
                onClick={() => {
                  setIsAddingWebsite(false);
                  setWebsiteInput("");
                  onDismissError();
                }}
              >
                Cancel
              </button>
              <button
                className="h-9 flex-1 rounded text-[14px] font-medium disabled:opacity-60"
                disabled={isSaving || !websiteInput.trim()}
                style={{
                  backgroundColor: colors.switchEnabled,
                  color: colors.pageBackground,
                }}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save website"}
              </button>
            </div>
          </form>
        ) : (
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded text-[15px] font-medium transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => setIsAddingWebsite(true)}
            style={{
              backgroundColor: colors.statusBackground,
              color: colors.textPrimary,
              outlineColor: colors.textPrimary,
            }}
            type="button"
          >
            <span aria-hidden="true" className="text-[20px] leading-none">
              +
            </span>
            Add website
          </button>
        )}
      </footer>
    </div>
  );
}
