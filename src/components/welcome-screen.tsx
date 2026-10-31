'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Search, 
  GitBranch, 
  Code2, 
  Zap,
  ArrowRight
} from 'lucide-react';

const suggestedPrompts = [
  {
    icon: Search,
    title: "Find authentication",
    description: "Where is authentication handled in this codebase?"
  },
  {
    icon: GitBranch,
    title: "Explain architecture",
    description: "Explain the overall project architecture"
  },
  {
    icon: Code2,
    title: "Identify dependencies",
    description: "Which files depend on this module?"
  },
  {
    icon: Zap,
    title: "Trace execution",
    description: "Explain the execution flow of this feature"
  }
];

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Brain className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to RepoMind
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered codebase intelligence. Connect a GitHub repository to start exploring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestedPrompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <Card 
                key={index}
                className="p-4 border-border bg-card hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium text-foreground">{prompt.title}</h3>
                    <p className="text-sm text-muted-foreground">{prompt.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Connect a repository above to start asking questions
          </p>
        </div>
      </div>
    </div>
  );
}
