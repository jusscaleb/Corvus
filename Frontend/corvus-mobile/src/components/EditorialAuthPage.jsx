import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';
import NewsroomHeader from './NewsroomHeader';

export default function EditorialAuthPage({
  mode,
  eyebrow,
  headline,
  description,
  noteLabel,
  noteTitle,
  noteText,
  formLabel,
  formTitle,
  formDescription,
  children,
}) {
  const { width } = useWindowDimensions();
  const narrow = width < 520;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <NewsroomHeader mode={mode} />

          <View style={[styles.main, narrow && styles.mainNarrow]}>
            <View style={styles.editorialColumn}>
              <View style={styles.kickerRow}>
                <View style={styles.redRule} />
                <Text style={styles.eyebrow}>{eyebrow}</Text>
              </View>
              <Text style={[styles.headline, narrow && styles.headlineNarrow]}>{headline}</Text>
              <View style={styles.titleRule} />
              <Text style={styles.description}>{description}</Text>

              <View style={styles.note}>
                <View style={styles.noteTopline}>
                  <Text style={styles.noteLabel}>{noteLabel}</Text>
                  <Text style={styles.noteNumber}>01 / 03</Text>
                </View>
                <Text style={styles.noteTitle}>{noteTitle}</Text>
                <View style={styles.noteRule} />
                <Text style={styles.noteText}>{noteText}</Text>
              </View>
            </View>

            <View style={styles.formColumn}>
              <View style={styles.formPanel}>
                <Text style={styles.formLabel}>{formLabel}</Text>
                <Text style={styles.formTitle}>{formTitle}</Text>
                <Text style={styles.formDescription}>{formDescription}</Text>
                {children}
              </View>
            </View>
          </View>

          <View style={[styles.footer, narrow && styles.footerNarrow]}>
            <Text style={styles.footerTitle}>CORVUS / EDITORIAL DESK</Text>
            <Text style={styles.footerCopy}>Independent reporting. Shared with care.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  page: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  main: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 44,
    paddingTop: 42,
    paddingBottom: 40,
  },
  mainNarrow: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 24,
  },
  editorialColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    paddingVertical: 12,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 15,
  },
  redRule: {
    width: 20,
    height: 2,
    backgroundColor: colors.orange,
  },
  eyebrow: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headline: {
    maxWidth: 500,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 48,
    lineHeight: 55,
  },
  headlineNarrow: {
    fontSize: 38,
    lineHeight: 44,
  },
  titleRule: {
    width: 112,
    height: 3,
    marginTop: 15,
    marginBottom: 18,
    backgroundColor: colors.orange,
  },
  description: {
    maxWidth: 430,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  note: {
    width: '100%',
    maxWidth: 360,
    marginTop: 28,
    padding: 17,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
    backgroundColor: colors.note,
  },
  noteTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteLabel: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  noteNumber: {
    color: colors.muted,
    fontFamily: 'monospace',
    fontSize: 9,
  },
  noteTitle: {
    marginTop: 10,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 21,
  },
  noteRule: {
    height: 1,
    marginTop: 11,
    backgroundColor: '#C7BFAD',
  },
  noteText: {
    marginTop: 9,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  formColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 350,
    alignItems: 'center',
  },
  formPanel: {
    width: '100%',
    maxWidth: 470,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  formLabel: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  formTitle: {
    marginTop: 8,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 30,
    lineHeight: 36,
  },
  formDescription: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 44,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerNarrow: {
    flexDirection: 'column',
    marginHorizontal: 20,
  },
  footerTitle: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerCopy: {
    color: colors.muted,
    fontSize: 11,
  },
});