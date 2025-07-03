import { Stack } from 'expo-router';
import React from 'react';

export default function WatchlistLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
        </Stack>
    );
}