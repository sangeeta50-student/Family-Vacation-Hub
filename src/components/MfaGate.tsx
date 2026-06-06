import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

type MfaGateProps = {
  children: ReactNode;
  onVerified: () => void;
};

type MfaState =
  | "loading"
  | "needs-enrollment"
  | "needs-verification"
  | "verified";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

function MfaGate({
  children,
  onVerified,
}: MfaGateProps) {
  const [state, setState] =
    useState<MfaState>("loading");
  const [factorId, setFactorId] =
    useState("");
  const [enrollment, setEnrollment] =
    useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] =
    useState("");
  const [isWorking, setIsWorking] =
    useState(false);

  const refreshMfaState =
    useCallback(async () => {
      if (!supabase) {
        return;
      }

      setState("loading");
      setMessage("");

      const [
        assurance,
        factors,
      ] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);

      if (assurance.error) {
        setMessage(
          assurance.error.message
        );
        setState("needs-verification");
        return;
      }

      if (factors.error) {
        setMessage(
          factors.error.message
        );
        setState("needs-verification");
        return;
      }

      const verifiedTotp =
        factors.data.totp[0];

      if (!verifiedTotp) {
        setState("needs-enrollment");
        return;
      }

      setFactorId(verifiedTotp.id);

      if (
        assurance.data.nextLevel ===
          "aal2" &&
        assurance.data.currentLevel !==
          "aal2"
      ) {
        setState("needs-verification");
        return;
      }

      onVerified();
      setState("verified");
    }, [onVerified]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void refreshMfaState();
      },
      0
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshMfaState]);

  const startEnrollment = async () => {
    if (!supabase) {
      return;
    }

    setIsWorking(true);
    setMessage("");

    const { data, error } =
      await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName:
          "Family Travel Hub",
      });

    setIsWorking(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setFactorId(data.id);
    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  };

  const verifyCode = async () => {
    if (!supabase || !code.trim()) {
      return;
    }

    const activeFactorId =
      enrollment?.factorId || factorId;

    if (!activeFactorId) {
      setMessage(
        "No MFA factor is ready yet."
      );
      return;
    }

    setIsWorking(true);
    setMessage("");

    const { error } =
      await supabase.auth.mfa.challengeAndVerify(
        {
          factorId: activeFactorId,
          code: code.trim(),
        }
      );

    setIsWorking(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCode("");
    setEnrollment(null);
    await refreshMfaState();
  };

  if (state === "verified") {
    return <>{children}</>;
  }

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
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "460px",
          padding: "24px",
          width: "100%",
        }}
      >
        <h1
          style={{
            marginTop: 0,
          }}
        >
          Two-factor authentication
        </h1>

        {state === "loading" && (
          <p>Checking MFA status...</p>
        )}

        {state === "needs-enrollment" && (
          <>
            <p>
              Add this app to an
              authenticator before viewing
              trip details.
            </p>

            {!enrollment && (
              <button
                disabled={isWorking}
                onClick={startEnrollment}
              >
                {isWorking
                  ? "Creating QR code..."
                  : "Set Up 2FA"}
              </button>
            )}

            {enrollment && (
              <div>
                <img
                  alt="Authenticator QR code"
                  src={enrollment.qrCode}
                  style={{
                    display: "block",
                    height: "220px",
                    marginBottom: "12px",
                    width: "220px",
                  }}
                />

                <p>
                  Manual code:{" "}
                  <strong>
                    {enrollment.secret}
                  </strong>
                </p>
              </div>
            )}
          </>
        )}

        {state === "needs-verification" && (
          <p>
            Enter the 6-digit code from
            your authenticator app.
          </p>
        )}

        {(enrollment ||
          state ===
            "needs-verification") && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                )
              }
            />

            <button
              disabled={isWorking}
              onClick={verifyCode}
            >
              {isWorking
                ? "Verifying..."
                : "Verify Code"}
            </button>
          </div>
        )}

        {message && (
          <p
            style={{
              color: "#b45309",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default MfaGate;
