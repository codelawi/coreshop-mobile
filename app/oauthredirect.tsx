import { useEffect } from "react";
import { View } from "react-native";
import * as WebBrowser from "expo-web-browser";

// Expo Router routes here when the app is opened via the OAuth redirect URI
// (com.googleusercontent.apps.xxx:/oauthredirect). Calling maybeCompleteAuthSession()
// signals expo-auth-session that the flow is done, which resolves the promptAsync()
// promise back in the sign-in/sign-up screen.
export default function OAuthRedirect() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return <View className="flex-1 bg-bg-light dark:bg-bg-dark" />;
}
