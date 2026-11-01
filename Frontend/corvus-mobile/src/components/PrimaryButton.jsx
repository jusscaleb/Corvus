import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  compact = false,
  loading = false,
  disabled = false,
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const secondary = variant === 'secondary';
  const accent = variant === 'accent';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        secondary ? styles.secondary : accent ? styles.accent : styles.primary,
        (pressed || disabled || loading) && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.forest : colors.white} size="small" />
      ) : (
        <Text style={[styles.label, secondary && styles.secondaryLabel]}>{title}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    button: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      borderRadius: 6,
    },
    compactButton: {
      minHeight: 46,
    },
    primary: {
      backgroundColor: colors.forest,
    },
    accent: {
      backgroundColor: colors.orange,
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.82,
    },
    label: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    secondaryLabel: {
      color: colors.forest,
    },
  });
}
