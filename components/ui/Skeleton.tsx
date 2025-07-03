// components/ui/Skeleton.tsx

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                // @ts-ignore
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

export const SkeletonStockCard = ({ style }: { style?: ViewStyle }) => {
    return (
        <View style={[styles.skeletonCard, style]}>
            {/* Header */}
            <View style={styles.skeletonHeader}>
                <Skeleton width={60} height={16} borderRadius={8} />
                <Skeleton width={20} height={20} borderRadius={10} />
            </View>

            {/* Price */}
            <View style={styles.skeletonPrice}>
                <Skeleton width={80} height={20} borderRadius={6} />
                <Skeleton width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
                <Skeleton width={50} height={12} borderRadius={4} style={{ marginTop: 2 }} />
            </View>

            {/* Footer */}
            <View style={styles.skeletonFooter}>
                <Skeleton width={40} height={12} borderRadius={4} />
                <Skeleton width={8} height={8} borderRadius={4} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: colors.gray[200],
    },
    skeletonCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        minHeight: 130,
        flex: 1,
        marginHorizontal: 4,
        marginVertical: 4,
        borderTopWidth: 2,
        borderTopColor: colors.gray[200],
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    skeletonPrice: {
        flex: 1,
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
});