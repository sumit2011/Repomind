'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopNav } from '@/components/top-nav';
import { WelcomeScreen } from '@/components/welcome-screen';
import { ChatInterface } from '@/components/chat-interface';

export default function Home() {
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | undefined>();

  return (
    <div className="flex h-screen bg-background dark">
      <Sidebar 
        selectedRepositoryId={selectedRepositoryId}
        onRepositorySelect={setSelectedRepositoryId}
      />
      <div className="flex flex-1 flex-col">
        <TopNav />
        <div className="flex-1 overflow-hidden">
          {selectedRepositoryId ? (
            <ChatInterface repositoryId={selectedRepositoryId} />
          ) : (
            <WelcomeScreen />
          )}
        </div>
      </div>
    </div>
  );
}
