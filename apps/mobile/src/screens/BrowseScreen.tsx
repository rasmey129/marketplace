import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Category, ListingWithJoins } from "@localserve/shared";
import { fetchCategories, fetchListings, listingPriceLabel } from "@localserve/shared";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export function BrowseScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingWithJoins[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<number | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [cats, ls] = await Promise.all([
        categories.length ? Promise.resolve(categories) : fetchCategories(supabase),
        fetchListings(supabase, { query: query || undefined, categoryId: category }),
      ]);
      setCategories(cats);
      setListings(ls);
    } finally {
      setRefreshing(false);
    }
  }, [query, category, categories]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search services…"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills}>
        <Pill label="All" active={!category} onPress={() => setCategory(undefined)} />
        {categories.map((c) => (
          <Pill
            key={c.id}
            label={`${c.icon} ${c.name}`}
            active={category === c.id}
            onPress={() => setCategory(c.id)}
          />
        ))}
      </ScrollView>
      <FlatList
        data={listings}
        keyExtractor={(l) => l.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        ListEmptyComponent={
          !refreshing ? <Text style={styles.empty}>No services found nearby.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("Listing", { id: item.id })}
          >
            {item.photos[0] ? (
              <Image source={{ uri: item.photos[0] }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={{ fontSize: 40 }}>{item.category?.icon ?? "🔧"}</Text>
              </View>
            )}
            <View style={{ padding: 12 }}>
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.price}>{listingPriceLabel(item)}</Text>
              </View>
              <Text style={styles.muted} numberOfLines={1}>
                {item.category?.name}
                {item.city ? ` · ${item.city}` : ""}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  search: {
    margin: 12,
    marginBottom: 0,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pills: { flexGrow: 0, paddingHorizontal: 12, marginTop: 10 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: colors.card,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  photo: { width: "100%", height: 160 },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { fontWeight: "600", fontSize: 15, flex: 1, color: colors.text },
  price: { fontWeight: "700", color: colors.primary },
  muted: { color: colors.muted, marginTop: 2, fontSize: 13 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 48 },
});
