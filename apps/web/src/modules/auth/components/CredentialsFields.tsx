interface CredentialsFieldsProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  passwordAutoComplete: "current-password" | "new-password";
}

/**
 * Shared email/password inputs used by both LoginForm and RegisterForm.
 * Kept presentation-only — no submit handling, no validation logic —
 * so each form controls its own submit/error behavior.
 */
export function CredentialsFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  passwordAutoComplete,
}: CredentialsFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          autoComplete={passwordAutoComplete}
          minLength={8}
        />
      </div>
    </>
  );
}
