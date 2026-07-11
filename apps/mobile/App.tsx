import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/lib/AuthContext";
import { BrowseScreen } from "./src/screens/BrowseScreen";
import { ListingScreen } from "./src/screens/ListingScreen";
import { PostScreen } from "./src/screens/PostScreen";
import { MessagesScreen } from "./src/screens/MessagesScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { BookingsScreen } from "./src/screens/BookingsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="BrowseTab"
        component={BrowseScreen}
        options={{ title: "Browse", tabBarIcon: tabIcon("🔍") }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{ title: "Post", tabBarIcon: tabIcon("➕") }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: "Messages", tabBarIcon: tabIcon("💬") }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ title: "Bookings", tabBarIcon: tabIcon("📅") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile", tabBarIcon: tabIcon("👤") }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Listing"
            component={ListingScreen}
            options={{ title: "Service" }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }: any) => ({ title: route.params?.title ?? "Chat" })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
