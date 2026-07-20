"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Невірний email або пароль."
          : error.message
      );
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
      `}</style>
      <div style={styles.card}>
        <div style={styles.badge}>JYSK</div>
        <h1 style={styles.title}>Kyiv 3 Workforce &amp; Recruitment</h1>
        <p style={styles.subtitle}>Увійдіть, щоб продовжити</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@jysk.com"
            />
          </label>
          <label style={styles.label}>
            Пароль
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </label>
          {error ? <div style={styles.error}>{error}</div> : null}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Вхід…" : "Увійти"}
          </button>
        </form>

        <p style={styles.footnote}>
          Немає доступу? Зверніться до District Manager'а — акаунти створюються
          через Supabase, самостійна реєстрація вимкнена.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F2F4F8",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#FFFFFF",
    border: "1px solid #E1E6EE",
    borderRadius: 14,
    padding: "32px 28px",
    boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.06)",
  },
  badge: {
    display: "inline-block",
    background: "#0046AD",
    color: "#FFFFFF",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    padding: "6px 12px",
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#1C2433",
    margin: "0 0 4px",
  },
  subtitle: { color: "#6B7684", fontSize: 13, margin: "0 0 20px" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#6B7684" },
  input: {
    background: "#EFF2F7",
    border: "1px solid #E1E6EE",
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 14,
    color: "#1C2433",
    outline: "none",
  },
  error: { color: "#D2291C", fontSize: 12.5 },
  button: {
    background: "#0046AD",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  footnote: { marginTop: 20, fontSize: 11.5, color: "#8A93A0", lineHeight: 1.5 },
};
