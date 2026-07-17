import React, { useCallback } from 'react';
import { SectionList, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MealData } from '@types';
import {
  groupMealsByPeriod,
  PERIOD_TIME_RANGES,
  formatTimeRange,
  MealPeriod,
} from '@utils/date';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import MealCard from './MealCard';

interface Props {
  meals: MealData[];
  onDelete: (id: string) => void;
  ListEmptyComponent?: React.ReactElement;
}

export default function MealSectionList({
  meals,
  onDelete,
  ListEmptyComponent,
}: Props) {
  const { t, i18n } = useTranslation();
  const styles = useTheme(themeStyles);

  const sections = groupMealsByPeriod(meals);

  const sectionTitle = useCallback(
    (period: MealPeriod) => {
      const key = `mealPeriods.${period}`;
      const translated = t(key);
      const name = translated === key ? period : translated;
      const range = formatTimeRange(PERIOD_TIME_RANGES[period], i18n.language);
      return `${name}: ${range}`;
    },
    [t, i18n.language],
  );

  const renderSectionHeader = useCallback(
    ({ section }: any) => (
      <Text style={styles.sectionHeader}>{sectionTitle(section.period)}</Text>
    ),
    [sectionTitle, styles],
  );

  const renderItem = useCallback(
    (info: { item: MealData }) => (
      <MealCard meal={info.item} onDelete={onDelete} />
    ),
    [onDelete],
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={styles.list}
      ListEmptyComponent={ListEmptyComponent}
      stickySectionHeadersEnabled={false}
    />
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    list: {
      flexGrow: 1,
      paddingBottom: 80,
    },
    sectionHeader: {
      ...theme.fonts.medium1,
      color: theme.color.placeholder,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 4,
    },
  });
  return styles;
};
