import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useToastStore } from '@store/toastStore';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

const SLIDE_OFFSET = -300;

export default function Toast() {
  const { visible, message, type, hide } = useToastStore();
  const translateY = useRef(new Animated.Value(SLIDE_OFFSET)).current;
  const styles = useTheme(themeStyles);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(translateY, {
        toValue: SLIDE_OFFSET,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        type === 'success' ? styles.success : styles.error,
        { transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity style={styles.touchable} onPress={hide}>
        <Text style={styles.text}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60,
      left: 16,
      right: 16,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
      zIndex: 9999,
      elevation: 10,
      shadowColor: theme.color.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      opacity: 0.9,
    },
    success: {
      backgroundColor: theme.color.primary,
    },
    error: {
      backgroundColor: theme.color.errorColor,
    },
    touchable: {
      flex: 1,
    },
    text: {
      color: theme.color.white,
      ...theme.fonts.medium3,
      textAlign: 'center',
    },
  });
  return styles;
};
