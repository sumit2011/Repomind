'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function TopNav() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleConnect = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: url })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Repository connected successfully');
        setUrl('');
        // Trigger page refresh to update sidebar
        window.location.reload();
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to connect repository');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-16 items-center border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        <Link className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Enter GitHub repository URL..."
          className="flex-1 max-w-md bg-background"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          disabled={loading}
        />
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleConnect}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect'
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-green-500">{message}</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">{message}</span>
          </>
        )}
        {status === 'idle' && (
          <>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ready</span>
          </>
        )}
      </div>
    </div>
  );
}
