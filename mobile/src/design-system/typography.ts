import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios:     'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  fontFamily,
  fontSize: {
    xs:   10,
    sm:   12,
    md:   14,
    base: 16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
  lineHeight: {
    tight:  1.25,
    normal: 1.5,
    loose:  1.75,
  },
  letterSpacing: {
    tight:  -0.5,
    normal:  0,
    wide:    0.5,
    wider:   1,
  },
} as const;
