'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Link, 
  MessageSquare, 
  Network, 
  Settings, 
  FileText,
  Brain,
  Loader2
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  githubUrl: string;
  indexingStatus: string;
}

export function Sidebar() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/api/repositories');
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500';
      case 'cloning':
      case 'indexing':
      case 'processing':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Brain className="mr-2 h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">RepoMind</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>

          <Separator className="my-4 bg-sidebar-border" />

          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground">Connected Repositories</p>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : repositories.length === 0 ? (
              <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Link className="mr-2 h-4 w-4" />
                No repositories
              </Button>
            ) : (
              <div className="space-y-1">
                {repositories.map((repo) => (
                  <Button
                    key={repo.id}
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <Link className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="truncate text-sm">{repo.name}</span>
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(repo.indexingStatus)}`} />
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-4 bg-sidebar-border" />

          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground">Recent Conversations</p>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <MessageSquare className="mr-2 h-4 w-4" />
              No conversations
            </Button>
          </div>

          <Separator className="my-4 bg-sidebar-border" />

          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground">Navigation</p>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Network className="mr-2 h-4 w-4" />
              Knowledge Graph
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Documentation
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
