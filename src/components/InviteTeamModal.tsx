import { X, Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface InviteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteTeamModal({ isOpen, onClose }: InviteTeamModalProps) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const inviteLink = `${window.location.origin}/invite/demo`;

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your team members.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (!email.trim()) return;
    toast({
      title: 'Invitation sent!',
      description: `An invite has been sent to ${email}`,
    });
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md shadow-elevated animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <h2 className="text-xl font-bold text-foreground mb-2">Invite Team Members</h2>
        <p className="text-muted-foreground mb-6">
          Collaborate with your team on dashboards and insights.
        </p>

        <div className="space-y-6">
          {/* Email invite */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Invite by email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button variant="default" onClick={handleInvite} disabled={!email.trim()}>
                <Mail className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Link invite */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Share invite link</label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="text-muted-foreground"
              />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Team collaboration features are coming soon. For now, you can share dashboard links.
          </p>
        </div>
      </div>
    </div>
  );
}
