import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Navbar />
        <Outlet />
      </main>
    </div>
  );
}
