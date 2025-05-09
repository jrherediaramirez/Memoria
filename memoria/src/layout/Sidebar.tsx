// src/components/layout/Sidebar.tsx
import { signOutUser } from "../firebase/authService";
import { useAuthStore } from "../store/authStore";

export const Sidebar = () => {
  const user = useAuthStore(state => state.user);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Logout failed", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div className="w-64 bg-sidebar-bg text-text p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Memoria</h1>
      <nav className="flex-grow">
        {/* Navigation items can go here */}
        <p className="mb-2">Documents</p>
        <p>Flashcards (All)</p>
      </nav>
      {user && (
        <div className="mt-auto">
          <p className="text-sm mb-2">Logged in as: {user.email}</p>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-500 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};