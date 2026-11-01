import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewsroomHeader from '../../components/NewsroomHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NewsroomHeader mode="app" />

        <View style={styles.page}>
          <View style={styles.mastheadLine}>
            <Text style={styles.kicker}>YOUR EDITORIAL DESK</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.signOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>

          <View style={styles.welcome}>
            <Text style={styles.title}>Welcome to your newsroom.</Text>
            <Text style={styles.description}>
              A shared place to shape a story, compare notes, and keep reporting moving.
            </Text>
            <PrimaryButton
              title="Open newsroom chat"
              onPress={() => router.push('/chat')}
              variant="accent"
            />
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>THE DESK</Text>
              <Text style={styles.sectionTitle}>Recent work</Text>
            </View>
            <Text style={styles.sectionIndex}>01 / 01</Text>
          </View>

          <View style={styles.emptyState}>
            <View style={styles.emptyMark} />
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>Your story list is clear.</Text>
              <Text style={styles.emptyDescription}>
                Drafts and investigations will appear here when your newsroom workspace is connected.
              </Text>
            </View>
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
    paddingBottom: 32,
  },
  page: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  mastheadLine: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  kicker: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  signOut: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  signOutText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  welcome: {
    alignItems: 'flex-start',
    paddingTop: 34,
    paddingBottom: 38,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: {
    maxWidth: 700,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 42,
    lineHeight: 49,
  },
  description: {
    maxWidth: 520,
    marginTop: 10,
    marginBottom: 22,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 26,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sectionKicker: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    marginTop: 5,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 24,
  },
  sectionIndex: {
    color: colors.muted,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 22,
  },
  emptyMark: {
    width: 10,
    height: 10,
    marginTop: 5,
    backgroundColor: colors.orange,
  },
  emptyCopy: {
    flex: 1,
    gap: 5,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDescription: {
    maxWidth: 560,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});