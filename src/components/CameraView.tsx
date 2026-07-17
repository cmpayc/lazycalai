import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

interface Props {
  onPhotoTaken: (path: string) => void;
  onCancel: () => void;
  onGalleryPress: () => void;
  onManualPress: () => void;
}

export default function CameraView({
  onPhotoTaken,
  onCancel,
  onGalleryPress,
  onManualPress,
}: Props) {
  const { t } = useTranslation();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const styles = useTheme(themeStyles);

  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('camera.permissionRequired')}</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>
            {t('camera.grantPermission')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('camera.noDevice')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideBtn} onPress={onGalleryPress}>
            <Text style={styles.sideBtnText}>🖼</Text>
          </TouchableOpacity>
          <View style={styles.flex} />
          <TouchableOpacity style={styles.sideBtn} onPress={onManualPress}>
            <Text style={styles.sideBtnText}>✎</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!camera.current) return;
    setButtonDisabled(true);
    const photo = await camera.current.takePhoto();
    onPhotoTaken(photo.path);
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        device={device}
        isActive
        photo
      />
      <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.sideBtn} onPress={onGalleryPress}>
          <Text style={styles.sideBtnText}>🖼</Text>
        </TouchableOpacity>
        <View style={styles.captureBtnBlock}>
          <TouchableOpacity
            style={[
              styles.captureBtn,
              buttonDisabled ? styles.captureBtnDisabled : {},
            ]}
            onPress={takePhoto}
            disabled={buttonDisabled}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.sideBtn} onPress={onManualPress}>
          <Text style={styles.sideBtnText}>✎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.color.black,
      justifyContent: 'center',
      alignItems: 'center',
    },
    flex: {
      flex: 1,
    },
    message: {
      color: theme.color.white,
      ...theme.fonts.regular3,
      marginBottom: 20,
      textAlign: 'center',
    },
    permissionBtn: {
      backgroundColor: theme.color.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    permissionBtnText: {
      color: theme.color.white,
      ...theme.fonts.bold3,
    },
    backBtn: {
      paddingVertical: 8,
    },
    backBtnText: {
      color: theme.color.placeholder,
      ...theme.fonts.regular3,
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
      color: '#FFF',
      lineHeight: 36,
    },
    controls: {
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    captureBtnBlock: {
      flex: 1,
      alignItems: 'center',
    },
    sideBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideBtnText: {
      fontSize: 22,
      color: '#FFF',
    },
    captureBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: '#FFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureBtnDisabled: {
      opacity: 0.5,
    },
    captureInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFF',
    },
  });
  return styles;
};
