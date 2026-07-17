import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { NutritionInfo } from '@types';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';

export interface NutritionFormData {
  name: string;
  nutrition: NutritionInfo;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  rightElement,
}: FieldProps) {
  const { theme } = useThemeContext();
  const styles = useTheme(themeStyles);
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {rightElement}
      </View>
      <TextInput
        style={[styles.fieldInput, disabled && styles.fieldInputDisabled]}
        value={value}
        onChangeText={onChange}
        keyboardType={
          Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
        }
        returnKeyType="done"
        placeholder="0"
        placeholderTextColor={theme.color.placeholder}
        editable={!disabled}
      />
    </View>
  );
}

interface Props {
  initialData?: NutritionFormData;
  onSave: (data: NutritionFormData) => void;
  onCancel: () => void;
  saveLabel?: string;
  offset?: number;
}

export default function NutritionForm({
  initialData,
  onSave,
  onCancel,
  saveLabel,
  offset,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const styles = useTheme(themeStyles);
  const [name, setName] = useState(initialData?.name ?? '');
  const [grams, setGrams] = useState(
    String(initialData?.nutrition.grams ?? ''),
  );
  const [calories, setCalories] = useState(
    String(initialData?.nutrition.calories ?? ''),
  );
  const [protein, setProtein] = useState(
    String(initialData?.nutrition.protein ?? ''),
  );
  const [carbs, setCarbs] = useState(
    String(initialData?.nutrition.carbs ?? ''),
  );
  const [fat, setFat] = useState(String(initialData?.nutrition.fat ?? ''));
  const [fiber, setFiber] = useState(
    String(initialData?.nutrition.fiber ?? ''),
  );

  const [gramsLocked, setGramsLocked] = useState(false);
  const [caloriesLocked, setCaloriesLocked] = useState(false);
  const originalRef = useRef<NutritionInfo | null>(null);

  const captureOriginals = () => {
    originalRef.current = {
      grams: parseFloat(grams) || 0,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
    };
  };

  const toggleGramsLock = () => {
    if (gramsLocked) {
      setGramsLocked(false);
      originalRef.current = null;
    } else {
      captureOriginals();
      setGramsLocked(true);
      setCaloriesLocked(false);
    }
  };

  const toggleCaloriesLock = () => {
    if (caloriesLocked) {
      setCaloriesLocked(false);
      originalRef.current = null;
    } else {
      captureOriginals();
      setCaloriesLocked(true);
      setGramsLocked(false);
    }
  };

  const handleGramsChange = (v: string) => {
    setGrams(v);
    if (gramsLocked && originalRef.current) {
      const newGrams = parseFloat(v) || 0;
      const oldGrams = originalRef.current.grams;
      if (oldGrams > 0) {
        const ratio = newGrams / oldGrams;
        setCalories(String(Math.round(originalRef.current.calories * ratio)));
        setProtein(String(round1(originalRef.current.protein * ratio)));
        setCarbs(String(round1(originalRef.current.carbs * ratio)));
        setFat(String(round1(originalRef.current.fat * ratio)));
        setFiber(String(round1(originalRef.current.fiber * ratio)));
      }
    }
  };

  const handleCaloriesChange = (v: string) => {
    setCalories(v);
    if (caloriesLocked && originalRef.current) {
      const newCalories = parseFloat(v) || 0;
      const oldCalories = originalRef.current.calories;
      if (oldCalories > 0) {
        const ratio = newCalories / oldCalories;
        setProtein(String(round1(originalRef.current.protein * ratio)));
        setCarbs(String(round1(originalRef.current.carbs * ratio)));
        setFat(String(round1(originalRef.current.fat * ratio)));
        setFiber(String(round1(originalRef.current.fiber * ratio)));
      }
    }
  };

  const handleSave = () => {
    onSave({
      name,
      nutrition: {
        grams: parseFloat(grams) || 0,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        fiber: parseFloat(fiber) || 0,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? offset : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('addMeal.editNutrition')}</Text>

        <Text style={styles.label}>{t('addMeal.itemName')}</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder={t('addMeal.itemNamePlaceholder')}
          placeholderTextColor={theme.color.placeholder}
        />

        <View style={styles.grid}>
          <View style={styles.row}>
            <Field
              label={t('addMeal.grams')}
              value={grams}
              onChange={handleGramsChange}
              rightElement={
                <LockButton active={gramsLocked} onPress={toggleGramsLock} />
              }
            />
            <Field
              label={t('addMeal.calories')}
              value={calories}
              onChange={handleCaloriesChange}
              disabled={gramsLocked}
              rightElement={
                <LockButton
                  active={caloriesLocked}
                  onPress={toggleCaloriesLock}
                />
              }
            />
          </View>
          <View style={styles.row}>
            <Field
              label={t('addMeal.protein')}
              value={protein}
              onChange={setProtein}
              disabled={gramsLocked || caloriesLocked}
            />
            <Field
              label={t('addMeal.carbs')}
              value={carbs}
              onChange={setCarbs}
              disabled={gramsLocked || caloriesLocked}
            />
          </View>
          <View style={styles.row}>
            <Field
              label={t('addMeal.fat')}
              value={fat}
              onChange={setFat}
              disabled={gramsLocked || caloriesLocked}
            />
            <Field
              label={t('addMeal.fiber')}
              value={fiber}
              onChange={setFiber}
              disabled={gramsLocked || caloriesLocked}
            />
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{t('addMeal.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>
              {saveLabel ?? t('addMeal.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function LockButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const styles = useTheme(themeStyles);
  return (
    <TouchableOpacity onPress={onPress} style={styles.lockBtn}>
      <Text style={styles.lockIcon}>{active ? '\u{1F513}' : '\u{1F512}'}</Text>
    </TouchableOpacity>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.color.white,
    },
    flex: {
      flex: 1,
    },
    title: {
      ...theme.fonts.bold5,
      color: theme.color.main,
      marginBottom: 16,
    },
    label: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      marginBottom: 6,
    },
    nameInput: {
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.color.main,
      marginBottom: 16,
    },
    grid: {
      flexDirection: 'column',
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    field: {
      flex: 1,
    },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    fieldLabel: {
      fontSize: 13,
      color: theme.color.subText,
    },
    lockBtn: {
      marginLeft: 6,
      padding: 2,
    },
    lockIcon: {
      fontSize: 14,
    },
    fieldInput: {
      borderWidth: 1,
      borderColor: theme.color.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: theme.color.main,
    },
    fieldInputDisabled: {
      backgroundColor: theme.color.gray100,
      color: theme.color.placeholder,
      borderColor: theme.color.gray200,
    },
    buttons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 24,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.color.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontSize: 16,
      color: theme.color.subText,
      textAlign: 'center',
    },
    saveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: theme.color.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      ...theme.fonts.bold3,
      color: theme.color.white,
      textAlign: 'center',
    },
    padding: {
      paddingBottom: 200,
    },
  });
  return styles;
};
