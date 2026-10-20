import { colors } from "../data/colors";

type PlatformEditInputProps = {
  autoFocus?: boolean;
  backgroundColor: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export function PlatformEditInput({
  autoFocus,
  backgroundColor,
  id,
  label,
  onChange,
  value,
}: PlatformEditInputProps) {
  return (
    <label className="flex flex-col gap-2 text-[14px]" htmlFor={id}>
      {label}
      <input
        autoFocus={autoFocus}
        className="h-10 rounded px-3 text-[14px] outline-none focus-visible:ring-2"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        style={{
          backgroundColor,
          color: colors.textPrimary,
        }}
        type="text"
        value={value}
      />
    </label>
  );
}
