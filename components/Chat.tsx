"use client";

import { useState } from "react";
import type { ProviderOption } from "@/lib/provider-data";

type Message = {
  role: "user" | "assistant";
  content: string;
  toolUsed?: boolean;
  language?: "en" | "ar";
  providers?: ProviderOption[];
  stage?: "clarification" | "safety" | "recommendation" | "provider_search" | "response";
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
      language: "en",
      content:
        "Hello. I’m HealTrip AI. I can help you think through the next care step and search demo provider options. Provider records are fictional and are not a real care directory. I cannot diagnose medical conditions."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");

  async function send(text = input) {
    const value = text.trim();
    if (!value || loading) return;

    const language = /[\u0600-\u06ff]/u.test(value) ? "ar" : "en";
    setMessages((m) => [...m, { role: "user", content: value, language }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          history: messages.slice(-12).map(({ role, content, stage }) => ({ role, content, stage }))
        })
      });
      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.error || data.text || "No response.",
          toolUsed: data.toolUsed,
          language: /[\u0600-\u06ff]/u.test(data.text || "") ? "ar" : "en",
          providers: Array.isArray(data.providers) ? data.providers : [],
          stage: data.stage
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
            <div key={i} className={`message ${m.role}`} dir={m.language === "ar" ? "rtl" : "ltr"}>
              <div className="bubble">
                {m.content}
                {m.stage && m.stage !== "response" && (
                  <div className="workflow-step">
                    {m.language === "ar"
                      ? m.stage === "clarification"
                        ? "استيضاح"
                        : m.stage === "safety"
                          ? "تقييم السلامة"
                          : m.stage === "recommendation"
                            ? "الخطوة التالية"
                            : "بحث مقدمي الرعاية"
                      : m.stage === "clarification"
                        ? "Clarification"
                        : m.stage === "safety"
                          ? "Safety assessment"
                          : m.stage === "recommendation"
                            ? "Next-step recommendation"
                            : "Provider search"}
                  </div>
                )}
                {m.toolUsed && (
                  <div className="tool-badge">
                    {m.language === "ar" ? "تم البحث في دليل البيانات التجريبي" : "Demo provider directory searched"}
                  </div>
                )}
              </div>
              {!!m.providers?.length && (
                <div className="provider-options" aria-label={m.language === "ar" ? "خيارات مقدمي الرعاية التجريبية" : "Demo provider options"}>
                  {m.providers.map((provider) => (
                    <article className="provider-option" key={provider.id}>
                      <span className="provider-type">
                        {m.language === "ar"
                          ? provider.type === "doctor" ? "طبيب" : "مستشفى"
                          : provider.type === "doctor" ? "Doctor" : "Hospital"}
                      </span>
                      <strong>{m.language === "ar" ? provider.nameAr : provider.name}</strong>
                      {provider.specialty && (
                        <span>{m.language === "ar" ? provider.specialtyAr : provider.specialty}</span>
                      )}
                      <span>{m.language === "ar" ? provider.cityAr : provider.city}</span>
                      {provider.type === "doctor" && (
                        <small>{m.language === "ar" ? provider.hospitalNameAr : provider.hospitalName}</small>
                      )}
                    </article>
                  ))}
                </div>
              )}
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
