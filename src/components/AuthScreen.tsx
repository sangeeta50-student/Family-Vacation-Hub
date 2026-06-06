import {
  useState,
} from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

type AuthMode = "sign-in" | "sign-up";

function AuthScreen() {
  const [mode, setMode] =
    useState<AuthMode>("sign-in");
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

    const authRequest =
      mode === "sign-in"
        ? supabase.auth.signInWithPassword({
            email,
            password,
          })
        : supabase.auth.signUp({
            email,
            password,
          });

    const { error } =
      await authRequest;

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "sign-up") {
      setMessage(
        "Account created. Check your email if Supabase asks you to confirm it, then sign in."
      );
      setMode("sign-in");
      setPassword("");
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
          autoComplete={
            mode === "sign-in"
              ? "current-password"
              : "new-password"
          }
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
            : mode === "sign-in"
              ? "Sign In"
              : "Create Account"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            setMode(
              mode === "sign-in"
                ? "sign-up"
                : "sign-in"
            );
          }}
        >
          {mode === "sign-in"
            ? "Create an account"
            : "Back to sign in"}
        </button>
      </form>
    </div>
  );
}

export default AuthScreen;
