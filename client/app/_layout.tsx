import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none', // Disable animations for instant navigation
        animationDuration: 0, // Ensure no animation delay
      }}
    >
      <Stack.Screen 
        name="(auth)/login" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
      <Stack.Screen 
        name="category/[slug]" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
      <Stack.Screen 
        name="product/[id]" 
        options={{ 
          headerShown: false,
          animation: 'none',
          animationDuration: 0,
        }} 
      />
    </Stack>
  );
}
