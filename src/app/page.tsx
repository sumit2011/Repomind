import { Sidebar } from '@/components/sidebar';
import { TopNav } from '@/components/top-nav';
import { WelcomeScreen } from '@/components/welcome-screen';

export default function Home() {
  return (
    <div className="flex h-screen bg-background dark">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopNav />
        <div className="flex-1 overflow-hidden">
          <WelcomeScreen />
        </div>
      </div>
    </div>
  );
}
