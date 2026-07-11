import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ListingWithJoins } from "@localserve/shared";
import {
  createBookingRequest,
  fetchListing,
  getOrCreateConversation,
  listingPriceLabel,
} from "@localserve/shared";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { colors } from "../theme";

export function ListingScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingWithJoins | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [details, setDetails] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchListing(supabase, id).then(setListing);
  }, [id]);

  if (!listing) return <View style={styles.container} />;

  const requireAuth = () => {
    if (!user) {
      navigation.navigate("Profile");
      return false;
    }
    return true;
  };

  async function onMessage() {
    if (!requireAuth() || !listing) return;
    setBusy(true);
    try {
      const convo = await getOrCreateConversation(supabase, listing, user!.id);
      navigation.navigate("Chat", { id: convo.id, title: listing.title });
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onBook() {
    if (!requireAuth() || !listing) return;
    setBusy(true);
    try {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      tomorrow.setHours(9, 0, 0, 0);
      await createBookingRequest(supabase, {
        listing,
        customerId: user!.id,
        requestedAt: tomorrow.toISOString(),
        address: address || undefined,
        details: details || undefined,
      });
      setShowBooking(false);
      Alert.alert("Sent!", "Your booking request was sent to the provider.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const isOwner = user?.id === listing.provider_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {listing.photos[0] ? (
        <Image source={{ uri: listing.photos[0] }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={{ fontSize: 64 }}>{listing.category?.icon ?? "🔧"}</Text>
        </View>
      )}
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={styles.category}>
          {listing.category?.icon} {listing.category?.name}
          {listing.city ? ` · ${listing.city}` : ""}
        </Text>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>{listingPriceLabel(listing)}</Text>
        <Text style={styles.provider}>
          Offered by {listing.provider?.full_name || "a local provider"}
        </Text>
        <Text style={styles.description}>{listing.description}</Text>

        {!isOwner && (
          <View style={{ gap: 10, marginTop: 12 }}>
            <Pressable style={styles.primaryBtn} onPress={onMessage} disabled={busy}>
              <Text style={styles.primaryBtnText}>💬 Message provider</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => requireAuth() && setShowBooking((s) => !s)}
            >
              <Text style={styles.secondaryBtnText}>📅 Request booking</Text>
            </Pressable>
            {showBooking && (
              <View style={styles.bookingForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Service address (optional)"
                  value={address}
                  onChangeText={setAddress}
                />
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Describe the job…"
                  multiline
                  value={details}
                  onChangeText={setDetails}
                />
                <Pressable style={styles.primaryBtn} onPress={onBook} disabled={busy}>
                  <Text style={styles.primaryBtnText}>
                    {busy ? "Sending…" : "Send request"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { width: "100%", height: 240 },
  heroPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  category: { color: colors.muted, fontSize: 13 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  price: { fontSize: 20, fontWeight: "700", color: colors.primary },
  provider: { color: colors.muted },
  description: { marginTop: 8, lineHeight: 21, color: colors.text },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  secondaryBtn: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.primary, fontWeight: "600" },
  bookingForm: {
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.card,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
});
