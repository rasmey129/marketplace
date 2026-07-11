import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Conversation } from "@localserve/shared";
import { fetchConversations, timeAgo } from "@localserve/shared";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { colors } from "../theme";

export function MessagesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      setConversations(await fetchConversations(supabase, user.id));
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Sign in from the Profile tab to see messages.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={conversations}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentContainerStyle={{ padding: 12, gap: 10 }}
      ListEmptyComponent={
        !refreshing ? (
          <Text style={[styles.muted, { textAlign: "center", marginTop: 48 }]}>
            No conversations yet.
          </Text>
        ) : null
      }
      renderItem={({ item }) => {
        const other = item.customer_id === user.id ? item.provider : item.customer;
        return (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate("Chat", { id: item.id, title: other?.full_name ?? "Chat" })
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(other?.full_name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600", color: colors.text }}>
                {other?.full_name || "User"}
              </Text>
              <Text style={styles.muted} numberOfLines={1}>
                {item.listing?.title}
              </Text>
            </View>
            <Text style={[styles.muted, { fontSize: 12 }]}>{timeAgo(item.created_at)}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  muted: { color: colors.muted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryDark, fontWeight: "700" },
});
