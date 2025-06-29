import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const blue = '#007AFF';
const green = '#00C853';

export default function RootLayout() {
  // Custom tab bar with divider
  const CustomTabBar = ({ state, descriptors, navigation }: any) => (
    <View style={{ flexDirection: 'row', backgroundColor: green, height: 48, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <React.Fragment key={route.key}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', height: '100%' }}
            >
              {options.tabBarIcon && options.tabBarIcon({ color: isFocused ? '#fff' : '#e0ffe0', size: 24 })}
              <Text style={{ color: isFocused ? '#fff' : '#e0ffe0', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>{label}</Text>
            </TouchableOpacity>
            {index === 0 && (
              <View style={{ width: 1, height: 28, backgroundColor: '#e0e0e0', alignSelf: 'center' }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <Tabs
        tabBar={CustomTabBar}
        screenOptions={{
          headerStyle: { backgroundColor: blue, height: 56 },
          headerTitleStyle: { fontSize: 18, fontWeight: '700', textAlignVertical: 'center' },
          headerTintColor: '#fff',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Stocks",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="watchlist"
          options={{
            title: "Watchlist",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmark" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
