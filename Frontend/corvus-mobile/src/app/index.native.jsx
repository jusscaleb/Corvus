import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function NativeEntry() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/main_screen" />;
  }

  return <Redirect href="/signup" />;
}
