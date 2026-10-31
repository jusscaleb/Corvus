import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export default function PrimaryButton({ title, onPress, variant = 'primary' }) {
  const secondary = variant === 'secondary';
  const accent = variant === 'accent';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : accent ? styles.accent : styles.primary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  primary: {
    backgroundColor: colors.forest,
  },
  accent: {
    backgroundColor: '#c84b31',
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryLabel: {
    color: colors.ink,
  },
});