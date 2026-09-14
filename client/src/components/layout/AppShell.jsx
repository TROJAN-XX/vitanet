import TopBar from './TopBar.jsx';
import BottomNav from './BottomNav.jsx';
import ToastContainer from '../ui/ToastContainer.jsx';

export default function AppShell({ children }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
