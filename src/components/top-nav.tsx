'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, Loader2 } from 'lucide-react';

export function TopNav() {
  return (
    <div className="flex h-16 items-center border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        <Link className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Enter GitHub repository URL..."
          className="flex-1 max-w-md bg-background"
        />
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Connect
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Ready</span>
      </div>
    </div>
  );
}
