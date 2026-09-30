"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  toolUsed?: boolean;
};

const examples = [
  "I have chest pain and I’m not sure whether I should see a cardiologist, go to the ER, or seek a second opinion.",
  "I need a cardiologist in Riyadh.",
  "أحتاج طبيب قلب في الرياض."
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I’m HealTrip AI. I can help you think through the next care step and search verified prototype provider data. I cannot diagnose medical conditions."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");

  async function send(text = input) {
    const value = text.trim();
    if (!value || loading) return;

    setMessages((m) => [...m, { role: "user", content: value }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value })
      });
      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.error || data.text || "No response.",
          toolUsed: data.toolUsed
        }
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Unable to reach the assistant API. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const isArabic = lang === "ar";

  return (
    <main className="shell" dir={isArabic ? "rtl" : "ltr"}>
      <header className="header">
        <div>
          <div className="brand">HealTrip <span>AI</span></div>
          <p>Patient Decision Assistant · Prototype</p>
        </div>
        <button className="lang" onClick={() => setLang(isArabic ? "en" : "ar")}>
          {isArabic ? "English" : "العربية"}
        </button>
      </header>

      <section className="notice">
        <strong>Safety first</strong>
        <span>
          This prototype does not diagnose. Emergency symptoms should be assessed
          by appropriate medical services immediately.
        </span>
      </section>

      <section className="chat">
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <div className="bubble">
                {m.content}
                {m.toolUsed && <div className="tool-badge">✓ Verified database tool used</div>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="bubble typing">Thinking…</div>
            </div>
          )}
        </div>

        <div className="examples">
          {examples.map((example) => (
            <button key={example} onClick={() => send(example)}>
              {example}
            </button>
          ))}
        </div>

        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={isArabic ? "اكتب ما تحتاج المساعدة بشأنه..." : "Describe what you need help with..."}
            rows={3}
          />
          <button className="send" onClick={() => send()} disabled={loading}>
            {loading ? "..." : isArabic ? "إرسال" : "Send"}
          </button>
        </div>
      </section>

      <footer>
        HealTrip AI Prototype · Provider data is mock/demo data only.
      </footer>
    </main>
  );
}
