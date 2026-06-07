import {
  useState,
} from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

function AuthScreen() {
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [message, setMessage] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const submitAuth = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!supabase) {
      setMessage(
        "Supabase is not configured yet."
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f7fb",
        padding: "20px",
      }}
    >
      <form
        onSubmit={submitAuth}
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "420px",
          padding: "24px",
          width: "100%",
        }}
      >
        <h1
          style={{
            marginTop: 0,
          }}
        >
          Family Travel Hub
        </h1>

        <p
          style={{
            marginTop: 0,
          }}
        >
          Sign in to sync trip details
          with the family.
        </p>

        <input
          autoComplete="email"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
        />

        <input
          autoComplete="current-password"
          minLength={6}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
        />

        {message && (
          <p
            style={{
              color: "#b45309",
              margin: 0,
            }}
          >
            {message}
          </p>
        )}

        <button
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? "Please wait..."
            : "Sign In"}
        </button>

        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            margin: 0,
          }}
        >
          Access is invite-only. Ask the
          family admin to invite you.
        </p>
      </form>
    </div>
  );
}

export default AuthScreen;
