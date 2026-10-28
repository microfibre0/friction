export const colors = {
  pageBackground: "#101010",
  surface: "#101010",
  textPrimary: "#f5f5f5",
  textSecondary: "#d0d0d0",
  statusBackground: "#191b1f",
  statusText: "#e3e3e3",
  statusDot: "#929292",
  switchEnabled: "#49bd69",
  switchDisabled: "#d5d5d5",
  switchKnob: "#f8f8f8",
  platforms: {
    facebook: {
      card: "#2863b8",
      header: "#10294d",
      option: "#214e8d",
      lower: "#0d2548",
    },
    youtube: {
      card: "#b32128",
      header: "#3f0d10",
      option: "#8f171b",
      lower: "#3f1013",
    },
  },
} as const;

export const platformColorHues = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
];

export function darkenColor(hexColor: string, factor: number): string {
  const channels = hexColor.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);

  if (!channels) {
    return hexColor;
  }

  return `#${channels
    .slice(1)
    .map((channel) =>
      Math.round(Number.parseInt(channel, 16) * factor)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const COLOR_DARKEN_FACTORS = {
  header: 0.48,
  option: 0.74,
  lower:0.34
};

export function getPlatformColorsFromCard(cardColor: string) {
  return {
    card: cardColor,
    header: darkenColor(cardColor, COLOR_DARKEN_FACTORS.header),
    option: darkenColor(cardColor,COLOR_DARKEN_FACTORS.option),
    lower: darkenColor(cardColor, COLOR_DARKEN_FACTORS.lower),
  };
}
