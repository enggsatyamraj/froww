import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Platform } from 'react-native';
import { colors, spacing } from '../../theme';

// Animated Tab Icon Component
const AnimatedTabIcon = ({
    iconName,
    iconNameFocused,
    color,
    size,
    focused
}: {
    iconName: string;
    iconNameFocused: string;
    color: string;
    size: number;
    focused: boolean;
}) => {
    const scaleAnim = React.useRef(new Animated.Value(focused ? 1 : 0.8)).current;
    const opacityAnim = React.useRef(new Animated.Value(focused ? 1 : 0.7)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: focused ? 1 : 0.8,
                useNativeDriver: true,
                tension: 150,
                friction: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: focused ? 1 : 0.7,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused]);

    return (
        <Animated.View style={{
            backgroundColor: focused ? colors.primary : 'transparent',
            borderRadius: 18,
            paddingHorizontal: focused ? 20 : 12,
            paddingVertical: focused ? 10 : 6,
            minWidth: 50,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            // Add subtle shadow for active state
            shadowColor: focused ? colors.primary : 'transparent',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: focused ? 0.3 : 0,
            shadowRadius: 8,
            elevation: focused ? 5 : 0,
        }}>
            <Ionicons
                name={focused ? iconNameFocused : iconName}
                size={focused ? 24 : size}
                color={focused ? '#ffffff' : color}
            />
        </Animated.View>
    );
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: colors.text.secondary,
                tabBarStyle: {
                    // Fixed positioning to prevent content cutoff
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? spacing.xl + 20 : spacing.xl + 10,
                    left: spacing.xl * 1.2,
                    right: spacing.xl * 1.2,
                    height: 70,

                    // Enhanced glass effect
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: 35,
                    borderTopWidth: 0,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 208, 156, 0.15)',

                    // Stronger floating shadow
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 15,
                    },
                    shadowOpacity: 0.2,
                    shadowRadius: 25,
                    elevation: 20,

                    // Better padding
                    paddingBottom: 15,
                    paddingTop: 15,
                    paddingHorizontal: spacing.lg,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 3,
                },
                tabBarItemStyle: {
                    paddingVertical: 2,
                    borderRadius: 25,
                    marginHorizontal: 5,
                },
                headerStyle: {
                    backgroundColor: colors.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                },
                headerTintColor: colors.text.primary,
                headerTitleStyle: {
                    fontWeight: '600',
                    fontSize: 18,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Explore',
                    headerTitle: 'Explore',
                    tabBarIcon: ({ color, size, focused }) => (
                        <AnimatedTabIcon
                            iconName="trending-up-outline"
                            iconNameFocused="trending-up"
                            color={color}
                            size={size}
                            focused={focused}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        focused ? null : 'Explore'
                    ),
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: 'Watchlist',
                    headerTitle: 'Watchlist',
                    tabBarIcon: ({ color, size, focused }) => (
                        <AnimatedTabIcon
                            iconName="heart-outline"
                            iconNameFocused="heart"
                            color={color}
                            size={size}
                            focused={focused}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        focused ? null : 'Watchlist'
                    ),
                }}
            />
        </Tabs>
    );
}