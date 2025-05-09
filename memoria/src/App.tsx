// src/App.tsx
import { useAuth } from './hooks/useAuth';
import { EditorLayout } from './layout/EditorLayout';
import { AuthForm } from './auth/AuthForm';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-main-body-bg text-text">
        Loading application...
      </div>
    );
  }

  return user ? <EditorLayout /> : <AuthForm />;
}

export default App;