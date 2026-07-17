import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFSTurbo from 'react-native-fs-turbo';

import type { MainStackParamList } from '@navigation/MainStack';
import { compressImage } from '@utils/compressImage';
import CameraView from '@components/CameraView';
import NutritionForm, { NutritionFormData } from '@components/NutritionForm';
import { useAnalyzeFood } from '@hooks/useAnalyzeFood';
import { useDB } from '@hooks/useDB';
import { useSettingsStore } from '@store/settingsStore';
import { useToastStore } from '@store/toastStore';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';

type Step = 'camera' | 'analyzing' | 'edit' | 'manual';

type AddMealRoute = RouteProp<MainStackParamList, 'AddMeal'>;

export default function AddMealScreen() {
  const styles = useTheme(themeStyles);
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<AddMealRoute>();
  const { createMeal } = useDB();
  const dailyCalorieGoal = useSettingsStore((s) => s.dailyCalorieGoal);
  const { analyze, result, error } = useAnalyzeFood();

  const initialPhoto = route.params?.photoPath;
  const prefill = route.params?.prefill;
  const analyzedRef = useRef(false);
  const photoPathRef = useRef('');

  const [step, setStep] = useState<Step>(
    prefill ? 'edit' : initialPhoto ? 'analyzing' : 'camera',
  );
  const [photoPath, setPhotoPath] = useState<string | null>(
    initialPhoto ?? null,
  );

  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    photoPathRef.current = photoPath ?? '';
  }, [photoPath]);

  useEffect(
    () => () => {
      if (photoPathRef.current) {
        RNFSTurbo.unlink(photoPathRef.current, false);
      }
    },
    [],
  );

  const handlePhotoTaken = useCallback(
    async (path: string) => {
      setPhotoPath(path);
      setStep('analyzing');
      const compressedPath = await compressImage(path);
      setPhotoPath(compressedPath);
      // Original file is no longer referenced by the UI — safe to delete
      RNFSTurbo.unlink(path);
      await analyze(compressedPath);
      setStep('edit');
    },
    [analyze],
  );

  useEffect(() => {
    if (initialPhoto && !prefill && !analyzedRef.current) {
      analyzedRef.current = true;
      handlePhotoTaken(initialPhoto);
    }
  }, [initialPhoto, prefill, handlePhotoTaken]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const handleErrorContinue = useCallback(() => {
    setStep('manual');
  }, []);

  const handleSave = useCallback(
    async (data: NutritionFormData) => {
      let newPhotoPath = '';
      if (photoPath) {
        const fileName = photoPath.split('/').pop();
        newPhotoPath = `${RNFSTurbo.DocumentDirectoryPath}/meals/${fileName}`;
        if (!RNFSTurbo.exists(`${RNFSTurbo.DocumentDirectoryPath}/meals`)) {
          RNFSTurbo.mkdir(`${RNFSTurbo.DocumentDirectoryPath}/meals`);
        }
        RNFSTurbo.moveFile(photoPath, newPhotoPath);
      }
      await createMeal(
        newPhotoPath,
        [{ name: data.name, nutrition: data.nutrition }],
        dailyCalorieGoal,
      );
      navigation.goBack();
    },
    [photoPath, createMeal, navigation, dailyCalorieGoal],
  );

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleGalleryPress = useCallback(async () => {
    try {
      const pickerResult = await launchImageLibrary({ mediaType: 'photo' });
      if (pickerResult.didCancel) return;
      const asset = pickerResult.assets?.[0];
      if (!asset?.uri) return;
      const galleryPath = asset.uri.replace('file://', '');
      handlePhotoTaken(galleryPath);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.unknownError'));
    }
  }, [handlePhotoTaken, t]);

  const handleManualPress = useCallback(() => {
    setPhotoPath(null);
    setStep('edit');
  }, []);

  if (step === 'camera') {
    return (
      <CameraView
        onPhotoTaken={handlePhotoTaken}
        onCancel={handleCancel}
        onGalleryPress={handleGalleryPress}
        onManualPress={handleManualPress}
      />
    );
  }

  if (step === 'analyzing') {
    return (
      <View style={styles.center}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleCancel}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        {photoPath && (
          <Image
            source={{ uri: `file://${photoPath}` }}
            style={styles.preview}
          />
        )}
        <ActivityIndicator size="large" color={theme.color.primary} />
        <Text style={styles.analyzing}>{t('addMeal.analyzing')}</Text>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryLink} onPress={handleErrorContinue}>
              {t('addMeal.manualEntry')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // edit or manual step
  return (
    <View style={styles.container}>
      {photoPath ? (
        <Image
          source={{ uri: `file://${photoPath}` }}
          style={styles.previewSmall}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🍽</Text>
        </View>
      )}
      <NutritionForm
        initialData={
          result
            ? {
                name: result.items[0]?.item ?? '',
                nutrition: result.items[0]?.nutrition ?? {
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  fiber: 0,
                  grams: 0,
                },
              }
            : prefill
        }
        offset={-100}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
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
    closeBtn: {
      position: 'absolute',
      top: 56,
      right: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    closeText: {
      fontSize: 32,
      color: theme.color.black,
      lineHeight: 36,
    },
    preview: {
      width: '100%',
      height: 280,
      borderRadius: 12,
      marginBottom: 24,
    },
    previewSmall: {
      width: '100%',
      height: 200,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    placeholder: {
      width: '100%',
      height: 200,
      backgroundColor: theme.color.tertiaryDarker,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderIcon: {
      fontSize: 48,
    },
    analyzing: {
      ...theme.fonts.regular3,
      color: theme.color.subText,
      marginTop: 16,
    },
    errorBox: {
      marginTop: 24,
      alignItems: 'center',
    },
    errorText: {
      color: theme.color.errorColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    retryLink: {
      ...theme.fonts.bold3,
      color: theme.color.primary,
    },
  });
  return styles;
};
