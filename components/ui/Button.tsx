import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
}

export const Button = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    style,
    textStyle,
    disabled = false,
}: ButtonProps) => {
    const buttonStyle = [
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
    ];

    const textStyleCombined = [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        disabled && styles.disabledText,
        textStyle,
    ];

    return (
        <Pressable
            style={({ pressed }) => [
                buttonStyle,
                pressed && styles.pressed,
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={textStyleCombined}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Variants
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.gray[100],
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },

    // Sizes
    sm: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    md: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    lg: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
    },

    // Text styles
    text: {
        fontWeight: typography.fontWeight.medium,
    },
    primaryText: {
        color: '#ffffff',
        fontSize: typography.fontSize.base,
    },
    secondaryText: {
        color: colors.text.primary,
        fontSize: typography.fontSize.base,
    },
    outlineText: {
        color: colors.text.primary,
        fontSize: typography.fontSize.base,
    },

    // Size text
    smText: {
        fontSize: typography.fontSize.sm,
    },
    mdText: {
        fontSize: typography.fontSize.base,
    },
    lgText: {
        fontSize: typography.fontSize.lg,
    },

    // States
    pressed: {
        opacity: 0.8,
    },
    disabled: {
        opacity: 0.5,
    },
    disabledText: {
        color: colors.text.muted,
    },
});