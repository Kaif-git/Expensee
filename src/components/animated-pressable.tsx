import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  haptic?: 'light' | 'medium' | 'selection' | false;
};

export function AnimatedPressable({ haptic = 'light', onPressIn, onPressOut, style, ...props }: Props) {
  const scale = useSharedValue(1);
  const motionStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const pressIn: NonNullable<PressableProps['onPressIn']> = (event) => {
    // Reanimated shared values are intentionally mutated inside event callbacks.
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withTiming(0.96, { duration: 90 });
    if (haptic === 'selection') void Haptics.selectionAsync().catch(() => undefined);
    else if (haptic === 'medium') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    else if (haptic === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPressIn?.(event);
  };

  const pressOut: NonNullable<PressableProps['onPressOut']> = (event) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withTiming(1, { duration: 160 });
    onPressOut?.(event);
  };

  const mergedStyle: PressableProps['style'] = (state) => [
    typeof style === 'function' ? style(state) : style as StyleProp<ViewStyle>,
    motionStyle as unknown as StyleProp<ViewStyle>,
  ];

  return <AnimatedPressableBase {...props} onPressIn={pressIn} onPressOut={pressOut} style={mergedStyle} />;
}
