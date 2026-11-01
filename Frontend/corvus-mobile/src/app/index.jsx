import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewsroomHeader from '../components/NewsroomHeader';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const narrow = width < 620;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NewsroomHeader mode="landing" />
        <View style={styles.page}>
          <View style={styles.editionLine}>
            <Text style={styles.editionLabel}>INDEPENDENT REPORTING / SHARED WITH CARE</Text>
            <Text style={styles.editionNumber}>CORVUS - NO. 01</Text>
          </View>

          <View style={[styles.mainSection, narrow && styles.mainSectionNarrow]}>
            <View style={styles.leftColumn}>
              <View style={styles.badgeRow}>
                <View style={styles.redDash} />
                <Text style={styles.badgeText}>THE EDITORIAL DESK</Text>
              </View>

              <Text style={[styles.heroTitle, narrow && styles.heroTitleNarrow]}>
                Empowering reporters with clarity.
              </Text>
              <View style={styles.titleUnderline} />

              <Text style={styles.heroSubtitle}>
                Analyze facts, collaborate on stories, and bring your reporting into focus.
              </Text>

              <View style={styles.actions}>
                <PrimaryButton
                  title="Get started"
                  onPress={() => router.push('/signup')}
                  variant="accent"
                />
                <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.signInLink}>
                  <Text style={styles.signInText}>I already have an account</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rightColumn}>
              <View style={styles.photoFrame}>
                <View style={styles.photoTopline}>
                  <Text style={styles.photoSection}>FIELD REPORT</Text>
                  <Text style={styles.photoNumber}>01 / 03</Text>
                </View>
                <View style={styles.photoCrop}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=85' }}
                    style={styles.photo}
                  />
                </View>
                <View style={styles.photoCaption}>
                  <Text style={styles.captionTitle}>A closer look at the everyday.</Text>
                  <Text style={styles.captionCredit}>REPORTING IS A TEAM SPORT.</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.workflow, narrow && styles.workflowNarrow]}>
            <View style={styles.workflowItem}>
              <Text style={styles.workflowNumber}>01</Text>
              <Text style={styles.workflowTitle}>REPORT</Text>
              <Text style={styles.workflowText}>Build a clear first draft.</Text>
            </View>
            <View style={styles.workflowItem}>
              <Text style={styles.workflowNumber}>02</Text>
              <Text style={styles.workflowTitle}>VERIFY</Text>
              <Text style={styles.workflowText}>Keep sources in view.</Text>
            </View>
            <View style={styles.workflowItem}>
              <Text style={styles.workflowNumber}>03</Text>
              <Text style={styles.workflowTitle}>REFINE</Text>
              <Text style={styles.workflowText}>Make the story stronger together.</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerMasthead}>CORVUS / THE NEWSROOM</Text>
            <Text style={styles.footerQuote}>For the stories worth telling.</Text>
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
    paddingBottom: 28,
  },
  page: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  editionLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 44,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  editionLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  editionNumber: {
    color: colors.orange,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  mainSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 44,
    paddingVertical: 44,
  },
  mainSectionNarrow: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 28,
  },
  leftColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    paddingVertical: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 15,
  },
  redDash: {
    width: 20,
    height: 2,
    backgroundColor: colors.orange,
  },
  badgeText: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    maxWidth: 540,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 58,
    fontWeight: '400',
    lineHeight: 64,
  },
  heroTitleNarrow: {
    fontSize: 43,
    lineHeight: 49,
  },
  titleUnderline: {
    width: 118,
    height: 3,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: colors.orange,
  },
  heroSubtitle: {
    maxWidth: 440,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 25,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 28,
  },
  signInLink: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  signInText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: colors.orange,
  },
  rightColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 360,
    minWidth: 0,
  },
  photoFrame: {
    width: '100%',
    padding: 11,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  photoTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingBottom: 9,
  },
  photoSection: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  photoNumber: {
    color: colors.muted,
    fontFamily: 'monospace',
    fontSize: 9,
  },
  photoCrop: {
    width: '100%',
    aspectRatio: 1.08,
    overflow: 'hidden',
    backgroundColor: colors.note,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoCaption: {
    paddingTop: 11,
    paddingBottom: 3,
  },
  captionTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 17,
  },
  captionCredit: {
    marginTop: 5,
    color: colors.muted,
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 0.8,
  },
  workflow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    marginHorizontal: 44,
  },
  workflowNarrow: {
    marginHorizontal: 20,
  },
  workflowItem: {
    flexGrow: 1,
    flexBasis: 180,
    paddingVertical: 15,
    paddingHorizontal: 12,
  },
  workflowNumber: {
    color: colors.orange,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  workflowTitle: {
    marginTop: 6,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  workflowText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 26,
    marginHorizontal: 44,
    paddingTop: 14,
  },
  footerMasthead: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerQuote: {
    color: colors.muted,
    fontFamily: 'serif',
    fontSize: 12,
  },
});