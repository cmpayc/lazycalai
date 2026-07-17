import React, { useMemo, useContext, createContext, memo } from 'react';

import type { ThemeMode } from '@types';
import { DEFAULT_THEME } from './default.theme';
import { IFontTheme, ITheme, ISpacingTheme } from './theme.interface';
import { resizeWidth, resizeHeight } from './utils';

interface ProvidedValue {
  theme: ITheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const Context = createContext<ProvidedValue>({
  theme: DEFAULT_THEME,
  setThemeMode: () => {
    // eslint-disable-next-line no-console
    console.error('ThemeProvider is not rendered!');
  },
});

interface Props {
  theme: ITheme;
  setThemeMode: (mode: ThemeMode) => void;
  children?: React.ReactNode;
}

const applyUpdateTheme = (theme: ITheme): ITheme => {
  if (theme.shouldResize) {
    const fonts = { ...theme.fonts };
    const fontsKeys = Object.keys(theme.fonts) as (keyof IFontTheme)[];
    fontsKeys.forEach((key) => {
      fonts[key] = { ...theme.fonts[key] };
      fonts[key].fontSize = resizeHeight(fonts[key].fontSize);
      fonts[key].lineHeight = resizeHeight(fonts[key].lineHeight);
    });
    const spacing = { ...theme.spacing };
    const spacingKeys = Object.keys(theme.fonts) as (keyof ISpacingTheme)[];
    spacingKeys.forEach((key) => {
      spacing[key] = resizeHeight(spacing[key]);
    });

    return { ...theme, fonts, spacing, resizeWidth, resizeHeight };
  }
  return {
    ...theme,
    resizeWidth: (value: number) => value,
    resizeHeight: (value: number) => value,
  };
};

export const ThemeProvider = memo(
  ({ theme, setThemeMode, children }: Props) => {
    const resolved = useMemo(() => applyUpdateTheme(theme), [theme]);

    const value = useMemo<ProvidedValue>(
      () => ({ theme: resolved, setThemeMode }),
      [resolved, setThemeMode],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  },
);
ThemeProvider.displayName = 'ThemeProvider';

export const useThemeContext = () => useContext(Context);
