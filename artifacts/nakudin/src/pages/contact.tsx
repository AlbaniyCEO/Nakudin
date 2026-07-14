import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, CheckCircle2, Loader2, Mail, MessageSquareText,
  Phone, Send, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGetMyShop } from "@/lib/hooks";
import { useCreateFeedbackMessage } from "@/lib/feedback-hooks";
import type { FeedbackCategory } from "@/lib/feedback";

const CONTACT_PHONE = "08145455720";
const CONTACT_EMAIL = "info@nakudin.com";

const CATEGORIES: Array<{ id: FeedbackCategory; label: string }> = [
  { id: "support", label: "Support request" },
  { id: "feedback", label: "General feedback" },
  { id: "bug", label: "Report a bug" },
  { id: "verification", label: "Shop verification" },
  { id: "billing", label: "Billing & payments" },
  { id: "other", label: "Other" },
];

export default function ContactPage() {
  const { user } = useAuth();
  const { data: shop } = useGetMyShop({ query: { enabled: !!user } });
  const createFeedback = useCreateFeedbackMessage();

  const [category, setCategory] = useState<FeedbackCategory>("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (subject.trim().length < 3) { setError("Please add a short subject."); return; }
    if (message.trim().length < 10) { setError("Please write a bit more detail."); return; }
    try {
      await createFeedback.mutateAsync({ category, subject: subject.trim(), message: message.trim(), guestName, guestEmail });
      setSubject(""); setMessage(""); setGuestName(""); setGuestEmail("");
      setCategory("support");
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Could not send message. Please try again.");
    }
  };

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-contact">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <button className="text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Contact Nakudin</h1>
          <p className="text-xs text-muted-foreground">We reply within 24 hours — no account needed to message us.</p>
        </div>
      </div>

      {/* Quick contact tiles */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <a
          href={`tel:${CONTACT_PHONE}`}
          className="surface-1 rounded-2xl p-4 border border-white/8 flex flex-col items-center gap-2 text-center hover:border-green-500/40 hover:bg-green-500/5 transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <Phone size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Call us</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{CONTACT_PHONE}</p>
          </div>
        </a>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="surface-1 rounded-2xl p-4 border border-white/8 flex flex-col items-center gap-2 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Email us</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{CONTACT_EMAIL}</p>
          </div>
        </a>
      </div>

      {/* Message form */}
      <section className="surface-1 rounded-3xl p-5 border border-white/8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-28 h-28 bg-primary/8 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquareText size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Send a message</h2>
              <p className="text-xs text-muted-foreground">Reach Admin directly. No account required.</p>
            </div>
          </div>

          {sent ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Message sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll reply to <strong>{user?.email || guestEmail || "you"}</strong> within 24 hours.
                </p>
              </div>
              <Button variant="outline" className="mt-2" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Guest fields — shown only when not signed in */}
              {!user && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Your name</label>
                    <input
                      className="surface-2 border border-input rounded-xl px-3 py-2.5 text-sm w-full outline-none focus:border-primary/50 transition-colors"
                      placeholder="e.g. Ahmed"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Your email</label>
                    <input
                      type="email"
                      className="surface-2 border border-input rounded-xl px-3 py-2.5 text-sm w-full outline-none focus:border-primary/50 transition-colors"
                      placeholder="for our reply"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as FeedbackCategory)}
                    className="surface-2 border border-input rounded-xl px-3 py-2.5 text-sm w-full outline-none focus:border-primary/50 appearance-none pr-8 transition-colors"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                <input
                  className="surface-2 border border-input rounded-xl px-3 py-2.5 text-sm w-full outline-none focus:border-primary/50 transition-colors"
                  placeholder="Brief subject line"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={140}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                <textarea
                  className="surface-2 border border-input rounded-xl px-3 py-2.5 text-sm w-full outline-none focus:border-primary/50 resize-none transition-colors"
                  placeholder="Describe your question or issue in detail…"
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={5000}
                  required
                />
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={createFeedback.isPending}
              >
                {createFeedback.isPending
                  ? <Loader2 size={15} className="animate-spin mr-2" />
                  : <Send size={15} className="mr-2" />}
                {createFeedback.isPending ? "Sending…" : "Send message"}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Or email us directly at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-medium">{CONTACT_EMAIL}</a>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
