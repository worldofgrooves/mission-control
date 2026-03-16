"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LS_TOKEN_KEY  = 'mc_session_token';
const LS_EXPIRY_KEY = 'mc_session_expiry';
const SESSION_TTL   = 365 * 24 * 60 * 60 * 1000; // 1 year in ms

export default function LoginPage() {
  const [step, setStep]       = useState("email"); // "email" | "code"
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true); // hide form while auto-restore runs
  const router = useRouter();

  // On mount: check localStorage for a saved session and silently restore it.
  // This handles macOS/iOS web apps where httpOnly cookies don't persist between launches.
  useEffect(() => {
    const token  = localStorage.getItem(LS_TOKEN_KEY);
    const expiry = localStorage.getItem(LS_EXPIRY_KEY);

    if (!token || !expiry || Date.now() > parseInt(expiry, 10)) {
      // No valid saved session -- show the login form
      setRestoring(false);
      return;
    }

    fetch('/api/auth/restore-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          router.replace('/');
        } else {
          localStorage.removeItem(LS_TOKEN_KEY);
          localStorage.removeItem(LS_EXPIRY_KEY);
          setRestoring(false);
        }
      })
      .catch(() => setRestoring(false));
  }, [router]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep("code");
      } else {
        setError(body.error || "Something went wrong. Try again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        // Save session to localStorage so web app can restore it on next launch
        if (body.token) {
          localStorage.setItem(LS_TOKEN_KEY,  body.token);
          localStorage.setItem(LS_EXPIRY_KEY, String(Date.now() + SESSION_TTL));
        }
        router.push("/");
        router.refresh();
      } else {
        setError("Incorrect or expired code. Try again.");
        setCode("");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#111",
    border: error ? "1px solid #ef4444" : "1px solid #2a2a2a",
    borderRadius: 8,
    color: "#f0f0f0",
    fontSize: 16,
    padding: "14px 16px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    letterSpacing: step === "code" ? 6 : 0,
    textAlign: step === "code" ? "center" : "left",
  };

  const btnReady = step === "email" ? email.trim() : code.trim().length === 6;

  const btnStyle = {
    width: "100%",
    padding: "14px",
    background: (loading || !btnReady) ? "#1a1a1a" : "#c9a96e",
    border: "none",
    borderRadius: 8,
    color: (loading || !btnReady) ? "#444" : "#000",
    fontSize: 15,
    fontWeight: 700,
    cursor: (loading || !btnReady) ? "default" : "pointer",
    transition: "all 0.15s",
    letterSpacing: 0.5,
  };

  // Show blank screen while auto-restore is in progress -- avoids login flash
  if (restoring) {
    return <div style={{ minHeight: "100vh", background: "#000" }} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 18,
            color: "#ffffff",
            letterSpacing: 4,
            fontWeight: 700,
            marginBottom: 8,
            textTransform: "uppercase",
          }}>
            World of Grooves
          </div>
          <div style={{
            fontSize: 13,
            color: "#c9a96e",
            letterSpacing: 4,
            fontWeight: 700,
          }}>
            MISSION CONTROL
          </div>
        </div>

        {step === "email" ? (
          <form onSubmit={handleRequestCode}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoFocus
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 14, textAlign: "center" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !email.trim()} style={btnStyle}>
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <div style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 20 }}>
              Code sent to {email}
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                autoFocus
                autoComplete="one-time-code"
                maxLength={6}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 14, textAlign: "center" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || code.trim().length !== 6} style={btnStyle}>
              {loading ? "Verifying..." : "Enter"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(""); }}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "10px",
                background: "transparent",
                border: "none",
                color: "#555",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Use a different email
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
