import { Platform } from 'react-native';

const createShadow = (elevation: number, opacity: number) =>
  Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: opacity,
      shadowRadius: elevation,
    },
    android: { elevation },
    default: {},
  });

export const shadows = {
  none: {},
  sm:   createShadow(2,  0.08),
  md:   createShadow(4,  0.12),
  lg:   createShadow(8,  0.16),
  xl:   createShadow(16, 0.20),
} as const;
