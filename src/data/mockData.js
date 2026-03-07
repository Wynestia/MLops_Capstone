export const DOGS = [
  { id: 1, name: "Mochi", breed: "Shiba Inu", age: 3, weight: 10.2, sex: "Male", emoji: "🐕", mood: "Happy", moodEmoji: "😄", moodColor: "#f59e0b", moodBg: "#fef3c7", alerts: 1, analyses: 12 },
  { id: 2, name: "Butter", breed: "Golden Retriever", age: 5, weight: 28.5, sex: "Female", emoji: "🦮", mood: "Relaxed", moodEmoji: "😌", moodColor: "#34d399", moodBg: "#d1fae5", alerts: 0, analyses: 8 },
  { id: 3, name: "Pepper", breed: "French Bulldog", age: 2, weight: 9.1, sex: "Male", emoji: "🐶", mood: "Sad", moodEmoji: "😢", moodColor: "#60a5fa", moodBg: "#dbeafe", alerts: 2, analyses: 5 },
];

export const MOOD_CONFIG = {
  Happy:   { color: "#f59e0b", bg: "#fef3c7", text: "#92400e", emoji: "😄", val: 4 },
  Relaxed: { color: "#34d399", bg: "#d1fae5", text: "#065f46", emoji: "😌", val: 3 },
  Sad:     { color: "#60a5fa", bg: "#dbeafe", text: "#1e40af", emoji: "😢", val: 2 },
  Angry:   { color: "#f87171", bg: "#fee2e2", text: "#991b1b", emoji: "😠", val: 1 },
};

export const WEEK_DATA = [
  { day: "Mon", mood: 2, label: "Sad" },
  { day: "Tue", mood: 2, label: "Sad" },
  { day: "Wed", mood: 3, label: "Relaxed" },
  { day: "Thu", mood: 4, label: "Happy" },
  { day: "Fri", mood: 1, label: "Angry" },
  { day: "Sat", mood: 3, label: "Relaxed" },
  { day: "Sun", mood: 4, label: "Happy" },
];

export const CHAT_HISTORY = [
  { role: "assistant", text: "Hi! I'm Mochi's wellness advisor 🐾 I've reviewed his recent mood history. He had 2 sad days earlier this week but bounced back to Happy after outdoor activity. How can I help you today?" },
  { role: "user", text: "Why does he bark a lot at night?" },
  { role: "assistant", text: "Based on Mochi's profile and history, nighttime barking in Shiba Inus often stems from heightened alertness or mild anxiety. Given that he reacted strongly to strangers last week, he may be responding to outside sounds. Try a white noise machine near his sleeping area and establish a consistent pre-sleep routine — short walk, then calm play, then rest. If it persists beyond 2 weeks, a vet visit would be worthwhile." },
];

export const SUGGESTED_QS = [
  "วันนี้น้องดูเครียด ควรทำยังไง?",
  "ทำไมน้องเห่าเยอะตอนกลางคืน?",
  "เธญเธฒเธฃเธกเธ“เนเธชเธฑเธเธ”เธฒเธซเนเธเธตเนเนเธขเนเธฅเธเนหม?",
  "น้องมี trigger อะไรบ้าง?",
];
