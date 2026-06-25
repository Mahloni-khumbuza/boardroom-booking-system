export const colors = {
  // Primary brand — corporate blue
  primary: {
    50:  '#EBF2FA',
    100: '#C7DCEF',
    200: '#A3C5E4',
    300: '#7FAED9',
    400: '#5B97CE',
    500: '#1E3A5F', // main brand blue
    600: '#1A3356',
    700: '#162C4D',
    800: '#122544',
    900: '#0E1E3B',
  },
  // Neutral greys
  neutral: {
    0:   '#FFFFFF',
    50:  '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  // Semantic
  success: {
    light: '#D4EDDA',
    main:  '#28A745',
    dark:  '#1E7E34',
  },
  warning: {
    light: '#FFF3CD',
    main:  '#FFC107',
    dark:  '#D39E00',
  },
  danger: {
    light: '#F8D7DA',
    main:  '#DC3545',
    dark:  '#BD2130',
  },
  info: {
    light: '#D1ECF1',
    main:  '#17A2B8',
    dark:  '#117A8B',
  },
  // Surface
  background: '#F8F9FA',
  surface:    '#FFFFFF',
  border:     '#DEE2E6',
  overlay:    'rgba(0,0,0,0.5)',
  // Text
  text: {
    primary:   '#212529',
    secondary: '#6C757D',
    disabled:  '#ADB5BD',
    inverse:   '#FFFFFF',
    link:      '#1E3A5F',
  },
} as const;

export type ColorToken = typeof colors;
