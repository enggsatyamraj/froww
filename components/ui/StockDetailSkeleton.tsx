// components/ui/StockDetailSkeleton.tsx

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 60;

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

const SkeletonBox = ({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: false,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E2E8F0', '#F1F5F9'],
    });

    return (
        <Animated.View
            style={[
                // @ts-ignore
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor,
                },
                style,
            ]}
        />
    );
};

export const StockDetailSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Company Header Skeleton */}
            <View style={styles.headerSkeleton}>
                <View style={styles.companyInfoSkeleton}>
                    <SkeletonBox width={48} height={48} borderRadius={12} style={styles.logoSkeleton} />
                    <View style={styles.companyTextSkeleton}>
                        <SkeletonBox width="80%" height={18} borderRadius={4} style={styles.companyNameSkeleton} />
                        <SkeletonBox width="40%" height={14} borderRadius={4} style={styles.symbolSkeleton} />
                        <SkeletonBox width="30%" height={12} borderRadius={4} style={styles.exchangeSkeleton} />
                    </View>
                </View>
                <View style={styles.priceInfoSkeleton}>
                    <SkeletonBox width={120} height={28} borderRadius={6} style={styles.priceSkeleton} />
                    <SkeletonBox width={80} height={16} borderRadius={4} style={styles.changeSkeleton} />
                    <SkeletonBox width={70} height={14} borderRadius={4} style={styles.percentageSkeleton} />
                </View>
            </View>

            {/* Chart Section Skeleton */}
            <View style={styles.chartSectionSkeleton}>
                <View style={styles.chartHeaderSkeleton}>
                    <SkeletonBox width={100} height={18} borderRadius={4} />
                </View>

                {/* Chart Area */}
                <View style={styles.chartContainerSkeleton}>
                    <SkeletonBox
                        width={CHART_WIDTH}
                        height={200}
                        borderRadius={12}
                        style={styles.chartAreaSkeleton}
                    />
                </View>

                {/* Time Period Buttons */}
                <View style={styles.timePeriodSkeleton}>
                    {['1D', '1W', '1M', '3M', '1Y'].map((period, index) => (
                        <SkeletonBox
                            key={period}
                            width={45}
                            height={32}
                            borderRadius={8}
                            style={styles.periodButtonSkeleton}
                        />
                    ))}
                </View>

                {/* Chart Info */}
                <View style={styles.chartInfoSkeleton}>
                    <SkeletonBox width="60%" height={12} borderRadius={4} />
                </View>
            </View>

            {/* About Section Skeleton */}
            <View style={styles.aboutSectionSkeleton}>
                <SkeletonBox width={150} height={18} borderRadius={4} style={styles.sectionTitleSkeleton} />
                <View style={styles.aboutTextSkeleton}>
                    <SkeletonBox width="100%" height={14} borderRadius={4} style={styles.textLineSkeleton} />
                    <SkeletonBox width="95%" height={14} borderRadius={4} style={styles.textLineSkeleton} />
                    <SkeletonBox width="88%" height={14} borderRadius={4} style={styles.textLineSkeleton} />
                    <SkeletonBox width="92%" height={14} borderRadius={4} style={styles.textLineSkeleton} />
                    <SkeletonBox width="75%" height={14} borderRadius={4} style={styles.textLineSkeleton} />
                </View>

                {/* Tags */}
                <View style={styles.tagsSkeleton}>
                    <SkeletonBox width={80} height={24} borderRadius={12} style={styles.tagSkeleton} />
                    <SkeletonBox width={100} height={24} borderRadius={12} style={styles.tagSkeleton} />
                </View>
            </View>

            {/* Metrics Section Skeleton */}
            <View style={styles.metricsSectionSkeleton}>
                {/* Top Metrics Grid */}
                <View style={styles.metricsGridSkeleton}>
                    {[1, 2, 3].map((item) => (
                        <View key={item} style={styles.metricCardSkeleton}>
                            <SkeletonBox width="80%" height={11} borderRadius={4} style={styles.metricLabelSkeleton} />
                            <SkeletonBox width="60%" height={16} borderRadius={4} style={styles.metricValueSkeleton} />
                        </View>
                    ))}
                </View>

                {/* Additional Metrics */}
                <View style={styles.additionalMetricsSkeleton}>
                    {[1, 2, 3, 4, 5].map((item) => (
                        <View key={item} style={styles.metricRowSkeleton}>
                            <SkeletonBox width={100} height={14} borderRadius={4} />
                            <SkeletonBox width={60} height={14} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
        backgroundColor: '#F8FAFC',
    },

    // Header Skeleton
    headerSkeleton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    companyInfoSkeleton: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    logoSkeleton: {
        marginRight: 16,
    },
    companyTextSkeleton: {
        flex: 1,
    },
    companyNameSkeleton: {
        marginBottom: 6,
    },
    symbolSkeleton: {
        marginBottom: 6,
    },
    exchangeSkeleton: {
        marginBottom: 0,
    },
    priceInfoSkeleton: {
        alignItems: 'flex-end',
    },
    priceSkeleton: {
        marginBottom: 8,
    },
    changeSkeleton: {
        marginBottom: 4,
    },
    percentageSkeleton: {},

    // Chart Section Skeleton
    chartSectionSkeleton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    chartHeaderSkeleton: {
        marginBottom: 16,
    },
    chartContainerSkeleton: {
        alignItems: 'center',
        marginBottom: 16,
    },
    chartAreaSkeleton: {},
    timePeriodSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    periodButtonSkeleton: {},
    chartInfoSkeleton: {
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },

    // About Section Skeleton
    aboutSectionSkeleton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionTitleSkeleton: {
        marginBottom: 12,
    },
    aboutTextSkeleton: {
        marginBottom: 16,
    },
    textLineSkeleton: {
        marginBottom: 6,
    },
    tagsSkeleton: {
        flexDirection: 'row',
        gap: 8,
    },
    tagSkeleton: {},

    // Metrics Section Skeleton
    metricsSectionSkeleton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    metricsGridSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricCardSkeleton: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    metricLabelSkeleton: {
        marginBottom: 8,
    },
    metricValueSkeleton: {},
    additionalMetricsSkeleton: {
        gap: 12,
    },
    metricRowSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
});