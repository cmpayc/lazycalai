import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import i18n from '@i18n';

interface InnerProps {
  children: ReactNode;
  styles: ReturnType<typeof themeStyles>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends Component<InnerProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, styles } = this.props;

    if (hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.t('common.error')}</Text>
          <Text style={styles.message}>
            {error?.message ?? i18n.t('common.unknownError')}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>{i18n.t('common.tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return children;
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const styles = useTheme(themeStyles);
  return <ErrorBoundaryInner styles={styles}>{children}</ErrorBoundaryInner>;
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: theme.color.white,
    },
    title: {
      ...theme.fonts.bold5,
      color: theme.color.main,
      marginBottom: 8,
    },
    message: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      textAlign: 'center',
      marginBottom: 24,
    },
    button: {
      backgroundColor: theme.color.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 10,
    },
    buttonText: {
      color: theme.color.white,
      ...theme.fonts.bold3,
    },
  });
  return styles;
};
