export interface IColorTheme {
  primary: string;
  primaryDarker: string;
  primaryDark: string;
  primaryDisabled: string;
  secondary: string;
  secondaryDark: string;
  tertiaryDarker: string;
  white: string;
  whiteDisabled: string;
  inputFocused: string;
  black: string;
  main: string;
  subText: string;
  placeholder: string;
  gray900: string;
  gray800: string;
  gray700: string;
  gray600: string;
  gray500: string;
  gray400: string;
  gray300: string;
  gray200: string;
  gray100: string;
  transparent: string;
  validColor: string;
  successColor: string;
  errorColor: string;
  errorDark: string;
  warningColor: string;
  info: string;
  border: string;
  background: string;
  bgInfo: string;
  bgSuccess: string;
  bgError: string;
  bgErrorHover: string;
  bgWarning: string;
  bgPrimary: string;
}

export interface IFontStyle {
  fontFamily: string;
  fontWeight:
    | 'bold'
    | 'normal'
    | '500'
    | '400'
    | '100'
    | '200'
    | '300'
    | '600'
    | '700'
    | '800'
    | '900'
    | undefined;
  fontSize: number;
  lineHeight: number;
}

export interface IFontTheme {
  bold9: IFontStyle;
  bold8: IFontStyle;
  bold7: IFontStyle;
  bold6: IFontStyle;
  bold5: IFontStyle;
  bold4: IFontStyle;
  bold3: IFontStyle;
  bold2: IFontStyle;
  bold1: IFontStyle;
  medium9: IFontStyle;
  medium8: IFontStyle;
  medium7: IFontStyle;
  medium6: IFontStyle;
  medium5: IFontStyle;
  medium4: IFontStyle;
  medium3: IFontStyle;
  medium2: IFontStyle;
  medium1: IFontStyle;
  regular9: IFontStyle;
  regular8: IFontStyle;
  regular7: IFontStyle;
  regular6: IFontStyle;
  regular5: IFontStyle;
  regular4: IFontStyle;
  regular3: IFontStyle;
  regular2: IFontStyle;
  regular1: IFontStyle;
  light9: IFontStyle;
  light8: IFontStyle;
  light7: IFontStyle;
  light6: IFontStyle;
  light5: IFontStyle;
  light4: IFontStyle;
  light3: IFontStyle;
  light2: IFontStyle;
  light1: IFontStyle;
}

export interface ISpacingTheme {
  xSmall: number;
  small: number;
  medium: number;
  large: number;
  xLarge: number;
  xxLarge: number;
}

export interface ITheme {
  id: string;
  color: IColorTheme;
  spacing: ISpacingTheme;
  fonts: IFontTheme;
  shouldResize: boolean;
  resizeWidth: (value: number) => number;
  resizeHeight: (value: number) => number;
}
