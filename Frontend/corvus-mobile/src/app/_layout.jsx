import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

function ThemedStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ThemedStack />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
