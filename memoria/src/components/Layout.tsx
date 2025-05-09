import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-gray-800 text-white p-4 space-y-2 flex-shrink-0"> {/* Increased width slightly */}
        <h1 className="text-2xl font-bold mb-6">Memoria</h1>
        <nav>
          <ul>
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded hover:bg-gray-700 transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`
                }
                end 
              >
                Notes
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/review"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded hover:bg-gray-700 transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`
                }
              >
                Review
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-0 md:p-6 overflow-auto h-full"> {/* p-0 for mobile, p-6 for md+ */}
        <Outlet />
      </main>
    </div>
  );
}