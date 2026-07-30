import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

const TIP_KEYS = [
  'accuracy',
  'lighting',
  'averaging',
  'packaging',
  'scale',
  'freeTiers',
  'models',
] as const;

const TIP_EMOJI: Record<(typeof TIP_KEYS)[number], string> = {
  accuracy: '🔢',
  lighting: '💡',
  averaging: '📊',
  packaging: '📦',
  scale: '⚖️',
  freeTiers: '🎁',
  models: '🤖',
};

export default function HomeTips() {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);

  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(Dimensions.get('window').width);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setIndex(next);
  };

  const open = () => {
    setIndex(0);
    setVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={open}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel={t('home.tips.title')}
      >
        <Text style={styles.triggerIcon}>💡</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {t('home.tips.title')}
              </Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View
              style={styles.carousel}
              onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
              >
                {TIP_KEYS.map((key) => (
                  <View key={key} style={[styles.slide, { width: slideWidth }]}>
                    <Text style={styles.slideEmoji}>{TIP_EMOJI[key]}</Text>
                    <Text style={styles.slideTitle}>
                      {t(`home.tips.items.${key}.title`)}
                    </Text>
                    <Text style={styles.slideBody}>
                      {t(`home.tips.items.${key}.body`)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.dots}>
              {TIP_KEYS.map((key, i) => (
                <View
                  key={key}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    triggerIcon: {
      fontSize: 22,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.color.white,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.color.border,
    },
    modalTitle: {
      flex: 1,
      ...theme.fonts.bold5,
      color: theme.color.main,
      marginRight: 16,
    },
    modalClose: {
      ...theme.fonts.bold5,
      color: theme.color.subText,
    },
    carousel: {
      flex: 1,
    },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    slideEmoji: {
      fontSize: 64,
      marginBottom: 28,
    },
    slideTitle: {
      ...theme.fonts.bold6,
      color: theme.color.main,
      textAlign: 'center',
      marginBottom: 16,
    },
    slideBody: {
      ...theme.fonts.regular4,
      color: theme.color.subText,
      textAlign: 'center',
      lineHeight: 26,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 5,
      backgroundColor: theme.color.gray300,
    },
    dotActive: {
      backgroundColor: theme.color.primary,
      width: 20,
    },
  });
  return styles;
};
