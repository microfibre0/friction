import { colors } from "./colors";

export type Platform = {
  id: string;
  name: string;
  website: string;
  url: string;
  description: string;
  colors: {
    card: string;
    header: string;
    option: string;
    lower: string;
  };
};

export type SettingDefinition = {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  builtInOnly?: boolean;
};

export type PlatformSettingsState = Record<
  string,
  Record<string, boolean>
>;

export const platforms: Platform[] = [
  {
    id: "facebook",
    name: "Facebook",
    website: "www.facebook.com",
    url: "https://www.facebook.com",
    description: "description text",
    colors: colors.platforms.facebook,
  },
  {
    id: "youtube",
    name: "YouTube",
    website: "www.youtube.com",
    url: "https://www.youtube.com",
    description: "description text",
    colors: colors.platforms.youtube,
  },
];

export const settingDefinitions: SettingDefinition[] = [
  {
    id: "hideImages",
    label: "Hide images",
    description: "hides images, click on them to get them back.",
    defaultEnabled: false,
  },
  {
    id: "buttonTimers",
    label: "button timers",
    description: "delays action after button presses",
    defaultEnabled: false,
  },
  {
    id: "youtubePauseAutoplayOnHover",
    label: "Disable hover previews",
    description: "removes YouTube's video preview wrapper while preserving its children.",
    defaultEnabled: false,
    builtInOnly: true,
  },
];
