import { colors } from "../data/colors";

export function BrandHeader() {
  return (
    <header
      className="flex h-[120px] shrink-0 items-center justify-center"
      style={{ backgroundColor: colors.surface }}
    >
      <h1 className="text-[36px] font-semibold leading-none">friction</h1>
    </header>
  );
}
