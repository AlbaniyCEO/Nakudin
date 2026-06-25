import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { NakudinLogo } from "@/components/NakudinLogo";

function firebaseError(err: any): string {
    const code = err?.code ?? "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found")
      return "Incorrect email or password.";
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
  const { signUp, signInGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError(""); setLoading(true);
    try {
      await signUp(email, password);
      navigate("/create-shop");
    } catch (err: any) {
      const msg = firebaseError(err); if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      await signInGoogle();
      navigate("/create-shop");
    } catch (err: any) {
      const msg2 = firebaseError(err); if (msg2) setError(msg2);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
      </div>

      <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full" data-testid="button-google">
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-primary font-medium hover:underline">Sign in</a>
      </p>
    </div>
  );
}
