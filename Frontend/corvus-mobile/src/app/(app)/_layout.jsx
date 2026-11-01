import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/signup');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.forest} size="large" />
      </View>
    );
  }

  if (!user) return null;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
