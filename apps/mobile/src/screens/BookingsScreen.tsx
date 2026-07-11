import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { BookingRequest, BookingStatus } from "@localserve/shared";
import { fetchBookings, updateBookingStatus } from "@localserve/shared";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { colors } from "../theme";

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "#b45309",
  accepted: colors.primaryDark,
  declined: colors.danger,
  cancelled: colors.muted,
  completed: "#1d4ed8",
};

export function BookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      setBookings(await fetchBookings(supabase, user.id));
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function setStatus(id: string, status: BookingStatus) {
    await updateBookingStatus(supabase, id, status);
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.muted }}>Sign in from the Profile tab to see bookings.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={bookings}
      keyExtractor={(b) => b.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentContainerStyle={{ padding: 12, gap: 10 }}
      ListEmptyComponent={
        !refreshing ? (
          <Text style={{ color: colors.muted, textAlign: "center", marginTop: 48 }}>
            No booking requests yet.
          </Text>
        ) : null
      }
      renderItem={({ item: b }) => {
        const isProvider = b.provider_id === user.id;
        const other = isProvider ? b.customer : b.provider;
        return (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontWeight: "600", flex: 1, color: colors.text }} numberOfLines={1}>
                {b.listing?.title ?? "Listing"}
              </Text>
              <Text style={{ color: STATUS_COLORS[b.status], fontWeight: "600", fontSize: 12 }}>
                {b.status.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: colors.muted, marginTop: 2, fontSize: 13 }}>
              {isProvider ? "From" : "With"} {other?.full_name || "user"} ·{" "}
              {new Date(b.requested_at).toLocaleString()}
            </Text>
            {!!b.details && (
              <Text style={{ marginTop: 6, color: colors.text }}>{b.details}</Text>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              {isProvider && b.status === "pending" && (
                <>
                  <SmallBtn label="Accept" onPress={() => setStatus(b.id, "accepted")} />
                  <SmallBtn label="Decline" danger onPress={() => setStatus(b.id, "declined")} />
                </>
              )}
              {isProvider && b.status === "accepted" && (
                <SmallBtn label="Mark completed" onPress={() => setStatus(b.id, "completed")} />
              )}
              {!isProvider && (b.status === "pending" || b.status === "accepted") && (
                <SmallBtn label="Cancel" danger onPress={() => setStatus(b.id, "cancelled")} />
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

function SmallBtn({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.smallBtn, danger ? styles.smallBtnDanger : styles.smallBtnPrimary]}
    >
      <Text style={{ color: danger ? colors.danger : "#fff", fontWeight: "600", fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  smallBtn: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  smallBtnPrimary: { backgroundColor: colors.primary },
  smallBtnDanger: { borderWidth: 1, borderColor: colors.danger },
});
