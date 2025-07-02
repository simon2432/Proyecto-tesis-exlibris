import React from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CustomTabBarProps {
  activeTab: "home" | "market" | "perfil";
  onTabPress: (tab: "home" | "market" | "perfil") => void;
}

export default function CustomTabBar({
  activeTab,
  onTabPress,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabPress("home")}
      >
        <Image
          source={require("../assets/images/home.png")}
          style={[styles.icon, activeTab === "home" && styles.activeIcon]}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabPress("market")}
      >
        <Image
          source={require("../assets/images/market.png")}
          style={[styles.icon, activeTab === "market" && styles.activeIcon]}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabPress("perfil")}
      >
        <Image
          source={require("../assets/images/perfil.png")}
          style={[styles.icon, activeTab === "perfil" && styles.activeIcon]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "#FFF4E4",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0d3c2",
    elevation: 10,
    zIndex: 10,
    width: "100%",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 40,
    height: 40,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
  },
});
