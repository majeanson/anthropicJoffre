// Historic theme configuration based on card emblem aesthetics
// Inspired by traditional, artisanal card game design

export const themeColors = {
  // Base parchment/beige tones (from emblem backgrounds)
  parchment: {
    50: '#FDFCFA',
    100: '#F9F7F3',
    200: '#F5F1E8',
    300: '#EBE4D7',
    400: '#DFD5C3',
    500: '#D1C4AE',
    600: '#B8A88E',
    700: '#9A8A73',
    800: '#7A6D5C',
    900: '#5C5349',
  },
  // Deep red tones (from red emblem)
  crimson: {
    50: '#FDF2F2',
    100: '#FBE4E4',
    200: '#F7C9C9',
    300: '#F19B9B',
    400: '#E76262',
    500: '#D63939',
    600: '#B82020',
    700: '#9A1818',
    800: '#7D1616',
    900: '#641616',
  },
  // Rich brown tones (from brown emblem)
  umber: {
    50: '#FBF8F5',
    100: '#F5EFE7',
    200: '#E8DBC9',
    300: '#D9C1A1',
    400: '#C79F6E',
    500: '#B8864D',
    600: '#A06730',
    700: '#85532A',
    800: '#6D4427',
    900: '#5A3922',
  },
  // Forest green tones (from green emblem)
  forest: {
    50: '#F4F8F5',
    100: '#E6F1E9',
    200: '#CCE3D2',
    300: '#A5CFAF',
    400: '#72B384',
    500: '#4A9760',
    600: '#357A49',
    700: '#2B633D',
    800: '#254F33',
    900: '#1F422B',
  },
  // Deep blue tones (from blue emblem)
  sapphire: {
    50: '#F2F6FB',
    100: '#E3EDF8',
    200: '#C1D9F0',
    300: '#8EBCE5',
    400: '#5499D6',
    500: '#2E79C2',
    600: '#1F5FA4',
    700: '#1A4C85',
    800: '#18406E',
    900: '#18365B',
  },
};

export type Theme = 'historic' | 'dark';

export interface ThemeConfig {
  name: Theme;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: {
      primary: string;
      secondary: string;
      inverse: string;
    };
    border: string;
    team1: string;
    team2: string;
  };
}

export const themes: Record<Theme, ThemeConfig> = {
  historic: {
    name: 'historic',
    colors: {
      background: themeColors.parchment[200], // Warm beige background
      surface: themeColors.parchment[50], // Light parchment for cards/modals
      primary: themeColors.crimson[600], // Deep red for primary actions
      secondary: themeColors.umber[600], // Rich brown for secondary actions
      accent: themeColors.sapphire[500], // Blue for accents
      text: {
        primary: themeColors.umber[900], // Dark brown for main text
        secondary: themeColors.umber[700], // Medium brown for secondary text
        inverse: themeColors.parchment[50], // Light text on dark backgrounds
      },
      border: themeColors.parchment[400], // Subtle borders
      team1: themeColors.crimson[600], // Team 1: Red
      team2: themeColors.sapphire[600], // Team 2: Blue
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: themeColors.umber[900], // Dark brown background
      surface: themeColors.umber[800], // Slightly lighter for surfaces
      primary: themeColors.crimson[500], // Brighter red for visibility
      secondary: themeColors.forest[500], // Green for contrast
      accent: themeColors.sapphire[400], // Lighter blue for visibility
      text: {
        primary: themeColors.parchment[100], // Light text
        secondary: themeColors.parchment[300], // Medium light text
        inverse: themeColors.umber[900], // Dark text on light backgrounds
      },
      border: themeColors.umber[700], // Subtle dark borders
      team1: themeColors.crimson[500], // Team 1: Brighter red
      team2: themeColors.sapphire[400], // Team 2: Brighter blue
    },
  },
};

export const defaultTheme: Theme = 'historic';
