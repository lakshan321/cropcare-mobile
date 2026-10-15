import React from 'react';
import { Stack } from 'expo-router';

export default function OfficerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="review/[id]" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
