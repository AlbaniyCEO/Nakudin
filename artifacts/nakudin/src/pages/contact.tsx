import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Loader2, Mail, MessageSquareText, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGetMyShop } from "@/lib/hooks";
import { useCreateFeedbackMessage } from "@/lib/feedback-hooks";
import type { FeedbackCategory } from "@/lib/feedback";

const CONTACT_PHONE = "08145455720";
const CONTACT_EMAIL = "info@nakudin.com";
const CATEGORIES: Array<{ id: FeedbackCategory; label: string }> = [
  { id: "feedback", label: "General feedback" },
  { id: "support", label: "Support request" },
  { id: "bug", label: "Report a bug" },
  { id: "verification", label: "Verification" },
  { id: "billing", label: "Billing" },
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
    setSent(false);
    if (subject.trim().length < 3) { setError("Please add a short subject."); return; }
    if (message.trim().length < 10) { setError("Please write a little more detail."); return; }
    try {
      await createFeedback.mutateAsync({
        category,
        subject: subject.trim(),
        message: message.trim(),
        guestName,
        guestEmail,
      });
      setSubject("");
      setMessage("");
      setGuestName("");
      setGuestEmail("");
      setCategory("support");
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Could not send message. Please try again.");
    }
  };

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-contact">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/"><button className="text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Contact Nakudin</h1>
          <p className="text-xs text-muted-foreground">Call, email, or send Admin a message without registration.</p>
        </div>
      </div>

      <div className="grid gap-3 mb-5">
        <a href={`tel:${CONTACT_PHONE}`} className="surface-1 rounded-2xl p-4 border border-white/8 flex items-center gap-3 hover:border-primary/30 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center"><Phone size={20} /></div>
          <div>
            <p className="text-sm font-semibold text-foreground">Phone</p>
            <p className="text-xs text-muted-foreground">{CONTACT_PHONE}</p>
          </div>
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="surface-1 rounded-2xl p-4 border border-white/8 flex items-center gap-3 hover:border-primary/30 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Mail size={20} /></div>
          <div>
            <p className="text-sm font-semibold text-foreground">Email</p>
            <p className="text-xs text-muted-foreground">{CONTACT_EMAIL}</p>
          </div>
        </a>
      </div>

      <div className="surface-1 rounded-2xl p-4 mb-4 flex items-start gap-3 border border-white/8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><MessageSquareText size={20} /></div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Sending as {shop ? shop.businessName : user ? user.email : "Visitor"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {shop ? "Your shop details will be attached automatically." : user ? "Your signed-in email will be attached." : "No account needed. Add contact details only if you want Admin to reply."}
          </p>
        </div>
      </div>

      {sent && (
        <div className="surface-1 rounded-2xl p-3 mb-4 flex items-center gap-2 border border-green-500/20">
          <CheckCircle2 size={16} className="text-green-400" />
          <p className="text-sm text-green-400">Message sent to Admin.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="surface-1 rounded-2xl p-4 space-y-4 border border-white/8">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Send us a message</h2>
          <p className="text-xs text-muted-foreground mt-1">This goes to Admin and appears in the Admin feedback inbox.</p>
        </div>
        {!user && (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Name, optional</label>
              <input value={guestName} onChange={e => setGuestName(e.target.value)} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none" placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email/phone, optional</label>
              <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none" placeholder="How Admin can reach you" />
            </div>
          </div>
        )}
        <div>
          <label className="text-xs text-muted-foreground">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as FeedbackCategory)} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none">
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none" placeholder="How can we help?" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={7} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none resize-none" placeholder="Write your message..." />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={createFeedback.isPending}>
          {createFeedback.isPending ? <Loader2 className="animate-spin" size={16} /> : <><Send size={15} className="mr-2" />Send message</>}
        </Button>
      </form>
    </div>
  );
}
