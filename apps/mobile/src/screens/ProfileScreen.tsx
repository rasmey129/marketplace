import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { colors } from "../theme";

export function ProfileScreen() {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) {
          Alert.alert("Almost there", "Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <View style={styles.center}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.primaryDark }}>
            {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
          {profile?.full_name || user.email}
        </Text>
        {profile?.city ? <Text style={{ color: colors.muted }}>{profile.city}</Text> : null}
        <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
          <Text style={{ color: colors.danger, fontWeight: "600" }}>Sign out</Text>
        </Pressable>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Edit your full profile on the website.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.form}>
      <Text style={styles.heading}>
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </Text>
      {mode === "signup" && (
        <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.submit} onPress={onSubmit} disabled={busy}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
        <Text style={{ color: colors.primary, textAlign: "center" }}>
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  signOut: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  form: { padding: 20, gap: 12, paddingTop: 40 },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
});
