import {
  useState,
} from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

type PasswordSetupGateProps = {
  onBackToSignIn: () => void;
  onPasswordSet: () => void;
};

function PasswordSetupGate({
  onBackToSignIn,
  onPasswordSet,
}: PasswordSetupGateProps) {
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [message, setMessage] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const submitPassword = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!supabase) {
      setMessage(
        "Supabase is not configured yet."
      );
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match."
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } =
      await supabase.auth.updateUser({
        password,
        data: {
          passwordConfigured: true,
        },
      });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    onPasswordSet();
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
        onSubmit={submitPassword}
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
          Create your password
        </h1>

        <p
          style={{
            marginTop: 0,
          }}
        >
          Set a password before using the
          family travel hub.
        </p>

        <input
          autoComplete="new-password"
          minLength={6}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />

        <input
          autoComplete="new-password"
          minLength={6}
          placeholder="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
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
            ? "Saving..."
            : "Save Password"}
        </button>

        <button
          disabled={isSubmitting}
          onClick={onBackToSignIn}
          type="button"
        >
          Back to sign in
        </button>
      </form>
    </div>
  );
}

export default PasswordSetupGate;
