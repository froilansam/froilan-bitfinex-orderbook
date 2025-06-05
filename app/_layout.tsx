import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";
import { Provider } from "react-redux";

import { store } from "@/store";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: "BTC/USD",
            headerStyle: {
              backgroundColor: "#1c242e",
            },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </Provider>
  );
}
