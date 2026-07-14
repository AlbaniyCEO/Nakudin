import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { NakudinLogo } from "@/components/NakudinLogo";

/** Key used across login.tsx and App.tsx PostLoginRedirect component */
export const AUTH_REDIRECT_KEY = "nakudin_auth_redirect";

export default function Login() {
  const { signIn, signInGoogle, user } = useAuth();
  const [, navigate] = useLocation();

  // Where to send the user after sign-in.
  // BottomNav passes e.g. /login?next=dashboard.
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const nextParam = searchParams.get("next");
  const redirectTo = nextParam ? `/${nextParam.replace(/^\//, "")}` : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already signed in (e.g. page refresh), redirect immediately.
  // Also handles desktop Google popup path where onAuthStateChanged fires
  // after signInWithPopup resolves and the component is still mounted.
  useEffect(() => {
    if (user) {
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      navigate(redirectTo);
    }
  }, [user]);

  /** Persist the intended destination so PostLoginRedirect can use it
   *  even when mobile signInWithRedirect brings the user back to app root. */
  const storeRedirect = () => {
    if (redirectTo !== "/") {
      sessionStorage.setItem(AUTH_REDIRECT_KEY, redirectTo);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    storeRedirect();
    try {
      await signIn(email, password);
      // onAuthStateChanged will fire → useEffect above navigates.
    } catch (err: any) {
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    storeRedirect(); // Must happen BEFORE signInWithRedirect navigates the browser away
    try {
      await signInGoogle();
      // Desktop popup: signInGoogle() resolves here → useEffect navigates.
      // Mobile redirect: signInWithRedirect navigates away; PostLoginRedirect handles return.
    } catch (err: any) {
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-6 py-12" data-testid="page-login">
      <div className="mb-10 text-center">
        <NakudinLogo size="lg" />
        <p className="text-muted-foreground mt-2 text-sm">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="mt-1"
            data-testid="input-email"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Your password"
            className="mt-1"
            data-testid="input-password"
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading} data-testid="button-signin">
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign In"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--surface-0)] px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full"
        data-testid="button-google"
      >
        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        New to Nakudin?{" "}
        <a href="/register" className="text-primary font-medium hover:underline">Create account</a>
      </p>
      <p className="text-center text-xs text-muted-foreground mt-3">
        Have feedback or need help?{" "}
        <Link href="/feedback" className="text-primary font-medium hover:underline">
          Message Admin without signing in
        </Link>
      </p>
    </div>
  );
}
