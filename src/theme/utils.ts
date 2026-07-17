import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
const width = screenWidth > screenHeight ? screenHeight : screenWidth;
const height = screenWidth > screenHeight ? screenWidth : screenHeight;

export { width, height };

const initWidth: number = width;
const initHeight: number = height;

const maxHeight: number = height >= initHeight ? initHeight : height;

export const resizeHeight = (val: number): number =>
  val * (maxHeight / initHeight);
export const resizeWidth = (val: number): number => val * (width / initWidth);
