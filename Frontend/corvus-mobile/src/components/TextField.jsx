import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function TextField({ label, compact = false, ...inputProps }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={[styles.label, compact && styles.compactLabel]}>{label}</Text>
      <TextInput
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        style={[styles.input, compact && styles.compactInput]}
        {...inputProps}
      />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    field: {
      gap: 8,
    },
    compactField: {
      gap: 4,
    },
    label: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: '600',
    },
    compactLabel: {
      fontSize: 12,
    },
    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      backgroundColor: colors.inputBg,
      paddingHorizontal: 14,
      color: colors.ink,
      fontSize: 16,
    },
    compactInput: {
      minHeight: 44,
      paddingVertical: 8,
      fontSize: 15,
    },
  });
}
