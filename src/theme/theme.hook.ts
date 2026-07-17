import { useMemo } from 'react';

import { ITheme } from './theme.interface';
import { useThemeContext } from './theme.context';

type Generator<T extends {}> = (theme: ITheme) => T;

const useTheme = <T extends {}>(fn: Generator<T>) => {
  const { theme } = useThemeContext();
  const themeAwareObject = useMemo(() => fn(theme), [fn, theme]);

  return themeAwareObject;
};
export { useTheme };
