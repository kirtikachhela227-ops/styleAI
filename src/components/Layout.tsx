import { ReactNode } from 'react';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#FAF5EF] font-sans">
      {!isLoginPage && <Navbar />}
      <main className={isLoginPage ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {children}
      </main>
    </div>
  );
}
