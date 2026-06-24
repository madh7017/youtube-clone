import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Trending', to: '/search?q=trending' },
  { label: 'Subscriptions', to: '/subscriptions' },
  { label: 'Library', to: '/search?q=library' }
];

function Sidebar() {
  const { isSidebarOpen, setIsSidebarOpen, subscriptions } = useAppContext();

  return (
    <aside className={`app-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => window.innerWidth < 900 && setIsSidebarOpen(false)}
          >
            <span className="sidebar-dot" />
            {isSidebarOpen ? <span>{item.label}</span> : null}
          </NavLink>
        ))}
        {isSidebarOpen && subscriptions.length ? (
          <>
            <p className="sidebar-section-title">Subscribed Channels</p>
            {subscriptions.slice(0, 8).map((channel) => (
              <NavLink
                key={channel.id}
                to={`/channel/${channel.id}`}
                className={({ isActive }) => `sidebar-item channel-item ${isActive ? 'active' : ''}`}
                onClick={() => window.innerWidth < 900 && setIsSidebarOpen(false)}
              >
                <span className="sidebar-dot" />
                <span>{channel.title}</span>
              </NavLink>
            ))}
          </>
        ) : null}
      </nav>
    </aside>
  );
}

export default Sidebar;
