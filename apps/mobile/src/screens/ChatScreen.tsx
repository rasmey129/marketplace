import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Message } from "@localserve/shared";
import { fetchMessages, sendMessage } from "@localserve/shared";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { colors } from "../theme";

export function ChatScreen({ route }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages(supabase, id).then(setMessages);
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((ms) => (ms.some((m) => m.id === msg.id) ? ms : [...ms, msg]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function onSend() {
    if (!draft.trim() || !user) return;
    const body = draft.trim();
    setDraft("");
    const msg = await sendMessage(supabase, id, user.id, body);
    setMessages((ms) => (ms.some((m) => m.id === msg.id) ? ms : [...ms, msg]));
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, gap: 6 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender_id === user?.id ? styles.mine : styles.theirs,
            ]}
          >
            <Text style={item.sender_id === user?.id ? { color: "#fff" } : { color: colors.text }}>
              {item.body}
            </Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={onSend}
        />
        <Pressable style={styles.sendBtn} onPress={onSend}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.primary },
  theirs: { alignSelf: "flex-start", backgroundColor: "#e4e4e7" },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
});
