import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  const { width, height } = useWindowDimensions();
  const narrow = width < 520;
  const webEditorial = Platform.OS === 'web' && !narrow;
  const webCompact = webEditorial && height < 820;
  const shortScreen = webCompact || (!webEditorial && height < 700);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <NewsroomHeader mode={mode} />

          <View
            style={[
              styles.main,
              webEditorial && styles.mainWeb,
              narrow && styles.mainNarrow,
              shortScreen && styles.mainShort,
            ]}
          >
            {webEditorial && (
              <View style={styles.editorialColumn}>
                <View style={styles.kickerRow}>
                  <View style={styles.redRule} />
                  <Text style={styles.eyebrow}>{eyebrow}</Text>
                </View>
                <Text style={styles.headline}>{headline}</Text>
                <View style={styles.titleRule} />
                <Text style={styles.description}>{description}</Text>
                <View style={[styles.note, webCompact && styles.noteCompact]}>
                  <View style={styles.noteTopline}>
                    <Text style={styles.noteLabel}>{noteLabel}</Text>
                    <Text style={styles.noteNumber}>01 / 03</Text>
                  </View>
                  <Text style={[styles.noteTitle, webCompact && styles.noteTitleCompact]}>{noteTitle}</Text>
                  <View style={[styles.noteRule, webCompact && styles.noteRuleCompact]} />
                  <Text style={[styles.noteText, webCompact && styles.noteTextCompact]}>{noteText}</Text>
                </View>
              </View>

            )}

            <View style={[styles.contentColumn, webEditorial && styles.contentColumnWeb]}>
              {!webEditorial && (
                <View style={[styles.intro, shortScreen && styles.introShort]}>
                  <View style={styles.kickerRow}>
                    <View style={styles.redRule} />
                    <Text style={styles.eyebrow}>{eyebrow}</Text>
                    <View style={styles.redRule} />
                  </View>
                  <Text style={[styles.headline, narrow && styles.headlineNarrow]}>{headline}</Text>
                  <View style={styles.titleRule} />
                  <Text style={styles.description}>{description}</Text>
                </View>
              )}

              <View style={[styles.formPanel, narrow && styles.formPanelNarrow, shortScreen && styles.formPanelShort]}>
                <Text style={styles.formLabel}>{formLabel}</Text>
                <Text style={[styles.formTitle, narrow && styles.formTitleNarrow]}>{formTitle}</Text>
                <Text style={[styles.formDescription, narrow && styles.formDescriptionNarrow]}>{formDescription}</Text>
                {children}
              </View>
            </View>
          </View>

          <View style={[styles.footer, webEditorial && styles.footerWeb, webCompact && styles.footerWebCompact]}>
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
    flexGrow: 1,
    alignSelf: 'center',
  },
  main: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  mainWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 44,
    paddingVertical: 42,
  },
  mainNarrow: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  mainShort: {
    paddingVertical: 8,
  },
  contentColumn: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  editorialColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  contentColumnWeb: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 350,
  },
  intro: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  introShort: {
    display: 'none',
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
  noteCompact: {
    marginTop: 16,
    padding: 12,
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
  noteTitleCompact: {
    marginTop: 7,
    fontSize: 17,
  },
  noteRule: {
    height: 1,
    marginTop: 11,
    backgroundColor: '#C7BFAD',
  },
  noteRuleCompact: {
    marginTop: 8,
  },
  noteText: {
    marginTop: 9,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  noteTextCompact: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 15,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 11,
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
    maxWidth: 480,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 40,
    lineHeight: 47,
    textAlign: 'center',
  },
  headlineNarrow: {
    fontSize: 29,
    lineHeight: 34,
  },
  titleRule: {
    width: 56,
    height: 2,
    marginTop: 11,
    marginBottom: 10,
    backgroundColor: colors.orange,
  },
  description: {
    maxWidth: 420,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  formColumnNarrow: {
    width: '100%',
    flexBasis: 'auto',
    alignItems: 'stretch',
  },
  formPanel: {
    width: '100%',
    maxWidth: 480,
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
  formPanelNarrow: {
    maxWidth: 420,
    padding: 20,
    shadowOpacity: 0,
    elevation: 0,
  },
  formPanelShort: {
    padding: 16,
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
  formTitleNarrow: {
    marginTop: 4,
    fontSize: 26,
    lineHeight: 31,
  },
  formDescription: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  formDescriptionNarrow: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    paddingTop: 12,
  },
  footerWeb: {
    justifyContent: 'space-between',
    marginHorizontal: 44,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerWebCompact: {
    display: 'none',
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