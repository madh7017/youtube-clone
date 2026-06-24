import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAppContext } from '../../context/AppContext';

function AppLayout({ children }) {
  const { isSidebarOpen } = useAppContext();

  return (
    <div className="app-shell">
      <Header />
      <div className="content-shell">
        <Sidebar />
        <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
