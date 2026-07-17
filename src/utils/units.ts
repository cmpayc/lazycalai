import { usesMetricSystem } from 'react-native-localize';

import { Units } from '@types';

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export function getDeviceUnits(): Units {
  try {
    return usesMetricSystem() ? 'metric' : 'imperial';
  } catch {
    return 'metric';
  }
}

export const kgToLbs = (kg: number): number => kg / KG_PER_LB;
export const lbsToKg = (lbs: number): number => lbs * KG_PER_LB;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

// Body weight rounded to the nearest whole unit for display.
export function displayWeight(kg: number, units: Units): number {
  return Math.round(units === 'imperial' ? kgToLbs(kg) : kg);
}

// Weight pace (kg or lbs per month), rounded to one decimal.
export function displayPace(kgPerMonth: number, units: Units): number {
  const value = units === 'imperial' ? kgToLbs(kgPerMonth) : kgPerMonth;
  return Math.round(value * 10) / 10;
}
