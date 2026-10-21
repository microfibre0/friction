import { useState, type FormEvent } from "react";
import { colors } from "../data/colors";
import type { Platform } from "../data/platforms";
import checkIcon from "../assets/green tick.svg";
import { PlatformEditInput } from "./PlatformEditInput";

type PlatformEditorProps = {
  onBack: () => void;
  onDismissError: () => void;
  onSave: (name: string, url: string) => Promise<boolean>;
  platform: Platform;
  storageError: string | null;
};

export function PlatformEditor({
  onBack,
  onDismissError,
  onSave,
  platform,
  storageError,
}: PlatformEditorProps) {
  const [name, setName] = useState(platform.name);
  const [url, setUrl] = useState(platform.url);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await onSave(name, url);
    setIsSaving(false);
  }

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <header
        className="relative flex h-[130px] shrink-0 flex-col items-center justify-center"
        style={{ backgroundColor: platform.colors.header }}
      >
        <button
          aria-label="Discard changes and go back"
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
        <h1 className="text-[28px] font-medium leading-tight">{platform.name}</h1>
        <button
          aria-label="Save website details"
          className="absolute right-4 top-5 flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          disabled={isSaving || !name.trim() || !url.trim()}
          style={{ outlineColor: colors.textPrimary }}
          type="submit"
        >
          <img alt="" className="size-6" src={checkIcon} />
        </button>
      </header>

      <div
        className="flex-1 space-y-5 p-5"
        style={{ backgroundColor: platform.colors.lower }}
      >
        {storageError && (
          <p className="text-[12px]" role="alert" style={{ color: colors.textPrimary }}>
            {storageError}
          </p>
        )}
        <PlatformEditInput
          autoFocus
          backgroundColor={platform.colors.option}
          id="website-title"
          label="Title"
          onChange={(value) => {
            setName(value);
            if (storageError) onDismissError();
          }}
          value={name}
        />
        <PlatformEditInput
          backgroundColor={platform.colors.option}
          id="website-url"
          label="URL"
          onChange={(value) => {
            setUrl(value);
            if (storageError) onDismissError();
          }}
          value={url}
        />
      </div>
    </form>
  );
}
