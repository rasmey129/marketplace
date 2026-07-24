import streamlit as st

from lib.auth import current_user, require_login
from lib.queries import fetch_conversations, fetch_messages, send_message, time_ago
from lib.supabase_client import get_client
from lib.ui import apply_theme

st.set_page_config(page_title="Messages · LocalServe", page_icon="💬", layout="wide")
apply_theme()
st.title("💬 Messages")

if not require_login("to view your messages"):
    st.stop()

db = get_client()
user = current_user()
conversations = fetch_conversations(db, user.id)

if not conversations:
    st.info("No conversations yet. Message a provider from any listing.")
    st.stop()

labels = []
for c in conversations:
    other = c["provider"] if c["customer_id"] == user.id else c["customer"]
    labels.append(f"{other.get('full_name', 'User')} — {c['listing']['title']}")

selected_id = st.session_state.get("selected_conversation_id")
default_index = 0
ids = [c["id"] for c in conversations]
if selected_id in ids:
    default_index = ids.index(selected_id)

col1, col2 = st.columns([1, 2])
with col1:
    st.markdown("**Conversations**")
    choice = st.radio("Conversations", labels, index=default_index, label_visibility="collapsed")
    convo = conversations[labels.index(choice)]
    st.session_state["selected_conversation_id"] = convo["id"]

with col2:
    other = convo["provider"] if convo["customer_id"] == user.id else convo["customer"]
    st.markdown(f"**{other.get('full_name', 'User')}** · re: {convo['listing']['title']}")

    messages = fetch_messages(db, convo["id"])
    chat_box = st.container(height=420, border=True)
    with chat_box:
        for m in messages:
            role = "user" if m["sender_id"] == user.id else "assistant"
            with st.chat_message(role):
                st.write(m["body"])
                st.caption(time_ago(m["created_at"]))

    draft = st.chat_input("Type a message…")
    if draft:
        send_message(db, convo["id"], user.id, draft)
        st.rerun()
