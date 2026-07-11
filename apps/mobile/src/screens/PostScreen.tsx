import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Category, PriceUnit } from "@localserve/shared";
import { fetchCategories } from "@localserve/shared";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { colors } from "../theme";

const PRICE_UNITS: { value: PriceUnit; label: string }[] = [
  { value: "quote", label: "On request" },
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
];

export function PostScreen({ navigation }: any) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("quote");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchCategories(supabase).then(setCategories).catch(() => {});
  }, []);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Sign in from the Profile tab to post a service.</Text>
      </View>
    );
  }

  async function onSubmit() {
    if (!title || !categoryId || !description) {
      Alert.alert("Missing info", "Title, category and description are required.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("listings").insert({
        provider_id: user!.id,
        category_id: categoryId,
        title,
        description,
        price: priceUnit === "quote" || !price ? null : Number(price),
        price_unit: priceUnit,
        city: city || null,
      });
      if (error) throw error;
      await supabase.from("profiles").update({ is_provider: true }).eq("id", user!.id);
      setTitle("");
      setDescription("");
      setPrice("");
      Alert.alert("Published!", "Your service is now live.", [
        { text: "OK", onPress: () => navigation.navigate("BrowseTab") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.form}>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Category</Text>
      <View style={styles.wrapRow}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategoryId(c.id)}
            style={[styles.pill, categoryId === c.id && styles.pillActive]}
          >
            <Text style={categoryId === c.id ? { color: "#fff" } : { color: colors.text }}>
              {c.icon} {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[styles.input, { height: 110 }]}
        placeholder="Describe your service…"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <Text style={styles.label}>Pricing</Text>
      <View style={styles.wrapRow}>
        {PRICE_UNITS.map((u) => (
          <Pressable
            key={u.value}
            onPress={() => setPriceUnit(u.value)}
            style={[styles.pill, priceUnit === u.value && styles.pillActive]}
          >
            <Text style={priceUnit === u.value ? { color: "#fff" } : { color: colors.text }}>
              {u.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {priceUnit !== "quote" && (
        <TextInput
          style={styles.input}
          placeholder="Price ($)"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="City / area"
        value={city}
        onChangeText={setCity}
      />
      <Pressable style={styles.submit} onPress={onSubmit} disabled={busy}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {busy ? "Publishing…" : "Publish listing"}
        </Text>
      </Pressable>
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
        Tip: add photos to your listing from the website for now.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  form: { padding: 16, gap: 12 },
  label: { fontWeight: "600", color: colors.text },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.card,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
});
