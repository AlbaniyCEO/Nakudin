import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { copyLink, getFacebookShareUrl, getWhatsAppShareUrl } from "@/lib/share";

export function ShareDialog({ open, onOpenChange, title, url }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; url: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>Share this link or copy it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button onClick={() => copyLink(url)}>Copy Link</Button>
          <a href={getWhatsAppShareUrl(title, url)} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full">Share on WhatsApp</Button></a>
          <a href={getFacebookShareUrl(url)} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full">Share on Facebook</Button></a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
