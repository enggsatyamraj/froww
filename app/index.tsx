import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '../theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    // Animation values
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        startAnimations();

        // Navigate to main app after 2.5 seconds
        const timer = setTimeout(() => {
            router.replace('/(tabs)');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const startAnimations = () => {
        // Logo animation
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Text animation with delay
        setTimeout(() => {
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }, 500);
    };

    return (
        <>
        <StatusBar barStyle= "light-content" backgroundColor = { colors.primary } />
            <View style={ styles.container }>
                {/* Logo Section */ }
                < Animated.View
    style = {
        [
        styles.logoContainer,
        {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
        },
          ]}
        >
        {/* Logo Circle */ }
        < View style = { styles.logoCircle } >
            <Text style={ styles.logoText }> F </Text>
                </View>
                </Animated.View>

    {/* App Name */ }
    <Animated.View
          style={
        [
            styles.textContainer,
            { opacity: textOpacity },
        ]
    }
        >
        <Text style={ styles.appName }> Froww </Text>
            < Text style = { styles.tagline } > Smart Stock Trading </Text>
                </Animated.View>

    {/* Loading Dots */ }
    <Animated.View
          style={
        [
            styles.loadingContainer,
            { opacity: textOpacity },
        ]
    }
        >
        <LoadingDots />
        </Animated.View>
        </View>
        </>
  );
}

// Loading Dots Component
const LoadingDots = () => {
    const dot1 = useRef(new Animated.Value(0.4)).current;
    const dot2 = useRef(new Animated.Value(0.4)).current;
    const dot3 = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animateDots = () => {
            const createDotAnimation = (dot: Animated.Value, delay: number) => {
                return Animated.sequence([
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0.4,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]);
            };

            Animated.stagger(200, [
                createDotAnimation(dot1, 0),
                createDotAnimation(dot2, 200),
                createDotAnimation(dot3, 400),
            ]).start(() => animateDots());
        };

        animateDots();
    }, []);

    return (
        <View style= { styles.dotsContainer } >
        <Animated.View style={ [styles.dot, { opacity: dot1 }] } />
            < Animated.View style = { [styles.dot, { opacity: dot2 }]} />
                <Animated.View style={ [styles.dot, { opacity: dot3 }] } />
                    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    logoContainer: {
        marginBottom: spacing.xxxl,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 42,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxxl * 2,
    },
    appName: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.bold,
        color: '#ffffff',
        marginBottom: spacing.xs,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: '#ffffff',
        opacity: 0.9,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 80,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
    },
});