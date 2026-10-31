import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

export default function TextField({ label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
});