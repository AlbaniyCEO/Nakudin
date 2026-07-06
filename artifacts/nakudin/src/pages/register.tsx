import { useState } from "react";
  import { Link, useLocation } from "wouter";
  import { useAuth } from "@/lib/auth-context";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Loader2, Mail, CheckCircle } from "lucide-react";
  import { NakudinLogo } from "@/components/NakudinLogo";

  function firebaseError(err: any): string {
    const code = err?.code ?? "";
    if (code === "auth/email-already-in-use") return "An account with this email already exists. Try signing in.";
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/weak-password") return "Password must be at least 6 characters.";
    if (code === "auth/too-many-requests") return "Too many attempts. Please wait and try again.";
    if (code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "";
    if (code === "auth/popup-blocked") return "Pop-ups are blocked. Please allow pop-ups and try again.";
    return "Something went wrong. Please try again.";
  }

  export default function Register() {
    const { signUp, signInGoogle, sendVerificationEmail, user } = useAuth();
    const [, navigate] = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState<"form" | "verify">("form");
    const [resending, setResending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirm) { setError("Passwords do not match"); return; }
      setError(""); setLoading(true);
      try {
        await signUp(email, password);
        setStep("verify");
      } catch (err: any) {
        const msg = firebaseError(err); if (msg) setError(msg);
      } finally { setLoading(false); }
    };

    const handleGoogle = async () => {
      setError(""); setLoading(true);
      try {
        await signInGoogle();
        navigate("/create-shop");
      } catch (err: any) {
        const msg = firebaseError(err); if (msg) setError(msg);
      } finally { setLoading(false); }
    };

    const handleResend = async () => {
      setResending(true);
      try { await sendVerificationEmail(); } catch { /* ignore */ }
      finally { setResending(false); }
    };

    const handleContinue = () => {
      // If user reloaded and is verified, go to create-shop
      // Otherwise navigate anyway — dashboard will handle unverified state
      navigate("/create-shop");
    };

    if (step === "verify") {
      return (
        <div className="min-h-[100dvh] flex flex-col justify-center px-6 py-12 text-center" data-testid="page-verify-email">
          <div className="mb-8">
            <NakudinLogo size="lg" />
          </div>
          <div className="surface-1 rounded-2xl p-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Verify your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <strong>{email}</strong>.
                Click the link in the email to activate your account.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it.</p>
            <Button className="w-full" onClick={handleContinue}>
              <CheckCircle size={16} className="mr-2" /> I've verified — continue
            </Button>
            <Button variant="ghost" className="w-full text-sm" onClick={handleResend} disabled={resending}>
              {resending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Resend email
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[100dvh] flex flex-col justify-center px-6 py-12" data-testid="page-register">
        <div className="mb-10 text-center">
          <NakudinLogo size="lg" />
          <p className="text-muted-foreground mt-2 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1" data-testid="input-email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" className="mt-1" data-testid="input-password" />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password" className="mt-1" data-testid="input-confirm" />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Create Account"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-[var(--surface-0)] px-2 text-muted-foreground">or</span></div>
        </div>

        <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full" data-testid="button-google">
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-primary font-medium hover:underline">Sign in</a>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Questions before opening an account?{" "}
          <Link href="/feedback" className="text-primary font-medium hover:underline">Message Admin as a visitor</Link>
        </p>
      </div>
    );
  }
  