import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import TimerScreen from '../screens/TimerScreen';
import StatsScreen from '../screens/StatsScreen';
import SessionsScreen from '../screens/SessionsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import { TimerScreenParams } from '../models';

export type RootStackParamList = {
  Main: undefined;
  Timer: TimerScreenParams;
};

export type TabParamList = {
  Home: undefined;
  Stats: undefined;
  Sessions: undefined;
  Categories: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ITEMS = [
  { name: 'Home',       label: 'Başla' },
  { name: 'Stats',      label: 'İstatistik' },
  { name: 'Sessions',   label: 'Toplam' },
  { name: 'Categories', label: 'Kategori' },
] as const;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={tb.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const item = TAB_ITEMS.find(t => t.name === route.name)!;

        return (
          <TouchableOpacity
            key={route.key}
            style={tb.item}
            onPress={() => {
              if (!focused) navigation.navigate(route.name as any);
            }}
            activeOpacity={0.6}
          >
            <Text style={[tb.label, focused && tb.labelActive]}>
              {item.label}
            </Text>
            {focused && <View style={tb.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    height: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Platform.OS === 'ios' ? 16 : 4,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    bottom: -4,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.text,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"       component={HomeScreen} />
      <Tab.Screen name="Stats"      component={StatsScreen} />
      <Tab.Screen name="Sessions"   component={SessionsScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main"  component={MainTabs}   options={{ headerShown: false }} />
        <Stack.Screen name="Timer" component={TimerScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
