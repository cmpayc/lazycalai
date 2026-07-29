import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RNFSTurbo from 'react-native-fs-turbo';
import uuid from 'react-native-uuid';

import { MealData, MealItemData } from '@types';
import { mealPhotoUri, resolveMealPhotoPath } from '@utils/mealPhoto';
import type { MainStackParamList } from '@navigation/MainStack';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

type Nav = StackNavigationProp<MainStackParamList>;

interface Props {
  meal: MealData;
  onDelete: (id: string) => void;
}

export default function MealCard({ meal, onDelete }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [expanded, setExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const styles = useTheme(themeStyles);

  const handleRepeat = (item: MealItemData) => {
    let photoPath: string | undefined;
    const src = resolveMealPhotoPath(meal.photoPath);
    if (src && RNFSTurbo.exists(src)) {
      const dir = `${RNFSTurbo.CachesDirectoryPath}/meals`;
      if (!RNFSTurbo.exists(dir)) {
        RNFSTurbo.mkdir(dir);
      }
      photoPath = `${dir}/${uuid.v4()}.jpg`;
      RNFSTurbo.copyFile(src, photoPath);
    }
    navigation.navigate('AddMeal', {
      photoPath,
      prefill: {
        name: item.name,
        nutrition: {
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          grams: item.grams,
        },
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(t('common.deleteConfirm'), t('common.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => onDelete(meal.id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {meal.photoPath ? (
          <TouchableOpacity
            onPress={() => setImageViewerVisible(true)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: mealPhotoUri(meal.photoPath) }}
              style={styles.photo}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderIcon}>🍽</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.calories}>
            {meal.totalCalories} {t('common.kcal')}
          </Text>
          <Text style={styles.macros}>
            {t('common.proteinShort')}: {meal.totalProtein}
            {t('common.g')} · {t('common.fatShort')}: {meal.totalFat}
            {t('common.g')} · {t('common.carbsShort')}: {meal.totalCarbs}
            {t('common.g')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditMeal', { mealId: meal.id })}
          style={styles.editBtn}
        >
          <Text style={styles.editText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

      {expanded && meal.items.length > 0 && (
        <View style={styles.items}>
          {meal.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.itemFooter}>
                <Text style={styles.itemCal}>
                  {item.calories} {t('common.kcal')} | {item.protein}
                  {t('common.proteinShort')} | {item.fat}
                  {t('common.fatShort')} | {item.carbs}
                  {t('common.carbsShort')}| {item.grams}
                  {t('common.g')}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRepeat(item)}
                  style={styles.repeatBtn}
                >
                  <Text style={styles.repeatText}>{t('common.repeat')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {meal.photoPath && (
        <Modal
          visible={imageViewerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageViewerVisible(false)}
        >
          <TouchableOpacity
            style={styles.viewerBackdrop}
            activeOpacity={1}
            onPress={() => setImageViewerVisible(false)}
          >
            <Image
              source={{ uri: mealPhotoUri(meal.photoPath) }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.viewerClose}
              onPress={() => setImageViewerVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Text style={styles.viewerCloseText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </TouchableOpacity>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.color.white,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 6,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    photo: {
      width: 56,
      height: 56,
      borderRadius: 8,
    },
    photoPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: theme.color.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderIcon: {
      fontSize: 24,
    },
    headerInfo: {
      flex: 1,
      marginLeft: 12,
    },
    calories: {
      ...theme.fonts.bold3,
      color: theme.color.main,
    },
    macros: {
      ...theme.fonts.regular1,
      color: theme.color.placeholder,
      marginTop: 2,
    },
    editBtn: {
      padding: 8,
    },
    editText: {
      fontSize: 13,
      color: theme.color.primary,
    },
    deleteBtn: {
      padding: 8,
    },
    deleteText: {
      fontSize: 13,
      color: theme.color.errorColor,
    },
    items: {
      borderTopWidth: 1,
      borderTopColor: theme.color.gray100,
      padding: 12,
    },
    itemRow: {
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.color.tertiaryDarker,
    },
    itemName: {
      ...theme.fonts.medium2,
      color: theme.color.main,
      marginBottom: 2,
    },
    itemFooter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemCal: {
      flex: 1,
      fontSize: 13,
      color: theme.color.placeholder,
    },
    repeatBtn: {
      marginLeft: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    repeatText: {
      fontSize: 13,
      color: theme.color.primary,
    },
    viewerBackdrop: {
      flex: 1,
      backgroundColor: theme.color.black,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewerImage: {
      width: '100%',
      height: '100%',
    },
    viewerClose: {
      position: 'absolute',
      top: 48,
      right: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewerCloseText: {
      fontSize: 20,
      lineHeight: 24,
      color: theme.color.white,
    },
  });
  return styles;
};
