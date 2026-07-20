import { Platform } from 'react-native';

export const palette = {
  canvas: '#F5F3EC',
  surface: '#FFFFFF',
  ink: '#17231D',
  muted: '#68736C',
  line: '#E5E5DC',
  primary: '#285943',
  primarySoft: '#DDEBE3',
  accent: '#F47B52',
  accentSoft: '#FCE5DC',
  yellow: '#F4C85B',
  danger: '#C74B50',
};

export const typography = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'system-ui' }),
  rounded: Platform.select({
    ios: 'Arial Rounded MT Bold',
    android: 'sans-serif-medium',
    default: 'system-ui',
  }),
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#1A2D24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  android: { elevation: 3 },
  default: {},
});
