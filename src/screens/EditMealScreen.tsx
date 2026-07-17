import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import type { MainStackParamList } from '@navigation/MainStack';
import { MealData } from '@types';
import { getMealById } from '@db/operations';
import { useDB } from '@hooks/useDB';
import { useToastStore } from '@store/toastStore';
import { useSettingsStore } from '@store/settingsStore';
import NutritionForm, { NutritionFormData } from '@components/NutritionForm';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';

type EditMealRoute = RouteProp<MainStackParamList, 'EditMeal'>;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Parse "YYYY-MM-DD" into a Date at midnight local time. */
function parseDate(val: string): Date {
  const y = parseInt(val.slice(0, 4), 10);
  const m = parseInt(val.slice(5, 7), 10) - 1;
  const d = parseInt(val.slice(8, 10), 10);
  return new Date(y, m, d);
}

/** Format a Date as "YYYY-MM-DD". */
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Format a Date as "HH:MM". */
function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditMealScreen() {
  const styles = useTheme(themeStyles);
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<EditMealRoute>();
  const { mealId } = route.params;
  const { editMeal } = useDB();
  const showToast = useToastStore((s) => s.show);
  const themeMode = useSettingsStore((s) => s.themeMode);

  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<MealData | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Mutable Date objects the pickers bind to while open, so the user can
  // adjust before confirming. Reset to the current value each time we open.
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerTime, setPickerTime] = useState(new Date());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await getMealById(mealId);
      if (cancelled) return;
      if (!loaded) {
        showToast(t('common.error'), 'error');
        navigation.goBack();
        return;
      }
      setMeal(loaded);
      setDate(loaded.date);
      const d = new Date(loaded.createdAt);
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mealId, navigation, showToast, t]);

  const handleDatePress = useCallback(() => {
    setPickerDate(parseDate(date));
    setShowDatePicker(true);
  }, [date]);

  const handleTimePress = useCallback(() => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
    setPickerTime(d);
    setShowTimePicker(true);
  }, [time]);

  const handleDateChange = useCallback(
    (event: DateTimePickerChangeEvent, selectedDate?: Date) => {
      // On Android the dialog fires twice: once with the pick (type=set) and
      // once when dismissed (type=dismissed). Only commit on the set event.
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
        if (selectedDate) {
          setDate(formatDate(selectedDate));
        }
      } else {
        // iOS: picker renders inline; update on every change
        if (selectedDate) {
          setPickerDate(selectedDate);
          setDate(formatDate(selectedDate));
        }
      }
    },
    [],
  );

  const handleTimeChange = useCallback(
    (event: DateTimePickerChangeEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
        if (selectedDate) {
          setTime(formatTime(selectedDate));
        }
      } else {
        if (selectedDate) {
          setPickerTime(selectedDate);
          setTime(formatTime(selectedDate));
        }
      }
    },
    [],
  );

  const handleSave = useCallback(
    async (data: NutritionFormData) => {
      if (!meal) return;

      // Combine date + time into a timestamp
      const [h, m] = time.split(':').map(Number);
      const combined = new Date(
        parseInt(date.slice(0, 4), 10),
        parseInt(date.slice(5, 7), 10) - 1,
        parseInt(date.slice(8, 10), 10),
        Number.isNaN(h) ? 0 : h,
        Number.isNaN(m) ? 0 : m,
      );

      await editMeal(mealId, {
        date,
        createdAt: combined.getTime(),
        items: [
          {
            name: data.name,
            ...data.nutrition,
          },
        ],
      });
      navigation.goBack();
    },
    [meal, mealId, date, time, editMeal, navigation],
  );

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const displayDate = useMemo(() => {
    // Show a localised short date for the display, but keep the raw
    // YYYY-MM-DD underneath so the save path stays consistent.
    try {
      const d = parseDate(date);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  }, [date]);

  if (loading || !meal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.primary} />
      </View>
    );
  }

  const firstItem = meal.items[0];

  return (
    <View style={styles.container}>
      {meal.photoPath ? (
        <Image
          source={{ uri: `file://${meal.photoPath}` }}
          style={styles.photo}
        />
      ) : null}

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.fieldLabel}>{t('editMeal.date')}</Text>
          <View style={styles.pickerButtonBlock}>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                themeMode === 'dark' ? styles.pickerButtonDark : {},
              ]}
              onPress={handleDatePress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  themeMode === 'dark' ? styles.pickerButtonTextDark : {},
                ]}
              >
                {displayDate}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.timeField}>
          <Text
            style={
              Platform.OS === 'ios'
                ? styles.fieldLabeliOSTime
                : styles.fieldLabel
            }
          >
            {t('editMeal.time')}
          </Text>
          {Platform.OS === 'ios' ? (
            <View style={styles.alignCenter}>
              <DateTimePicker
                value={pickerTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onValueChange={handleTimeChange}
                themeVariant={themeMode}
              />
            </View>
          ) : (
            <View style={styles.pickerButtonBlock}>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  themeMode === 'dark' ? styles.pickerButtonDark : {},
                ]}
                onPress={handleTimePress}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    themeMode === 'dark' ? styles.pickerButtonTextDark : {},
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {showDatePicker && (
        <Modal transparent>
          <Pressable
            style={styles.pickerModal}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerBody}>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onValueChange={handleDateChange}
                maximumDate={new Date()}
                themeVariant={themeMode}
                onDismiss={() => setShowDatePicker(false)}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {showTimePicker && (
        <DateTimePicker
          value={pickerTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={handleTimeChange}
          onDismiss={() => setShowTimePicker(false)}
        />
      )}

      <NutritionForm
        initialData={
          firstItem
            ? {
                name: firstItem.name,
                nutrition: {
                  calories: firstItem.calories,
                  protein: firstItem.protein,
                  carbs: firstItem.carbs,
                  fat: firstItem.fat,
                  fiber: firstItem.fiber,
                  grams: firstItem.grams,
                },
              }
            : undefined
        }
        offset={-20}
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel={t('editMeal.save')}
      />
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: theme.color.white,
    },
    center: {
      flex: 1,
      backgroundColor: theme.color.white,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    title: {
      ...theme.fonts.bold5,
      color: theme.color.main,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
    photo: {
      width: '100%',
      height: 200,
      marginBottom: 16,
    },
    dateRow: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    dateField: {
      flex: 1,
    },
    timeField: {
      flex: 1,
    },
    fieldLabel: {
      ...theme.fonts.regular1,
      color: theme.color.subText,
      marginBottom: 4,
    },
    fieldLabeliOSTime: {
      ...theme.fonts.regular1,
      color: theme.color.subText,
    },
    pickerButtonBlock: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    pickerButton: {
      marginTop: 3,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#EEEEEf',
      alignItems: 'center',
    },
    pickerButtonDark: {
      backgroundColor: '#333341',
    },
    pickerButtonText: {
      ...theme.fonts.regular3,
      color: '#000',
    },
    pickerButtonTextDark: {
      color: '#FFF',
    },
    pickerContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    pickerModal: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerBody: {
      backgroundColor: theme.color.white,
      borderRadius: 16,
      padding: 8,
    },
    alignCenter: {
      alignItems: 'center',
    },
  });
  return styles;
};
