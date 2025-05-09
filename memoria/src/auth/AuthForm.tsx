// src/components/auth/AuthForm.tsx
import React, { useState } from 'react';
import { signInUser, signUpUser } from '../firebase/authService';
import { AuthError } from 'firebase/auth';

export type AuthFormData = {
  email: string;
  password: string;
};

export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInUser({ email, password });
      } else {
        await signUpUser({ email, password });
      }
      // Auth state change will be handled by useAuth hook, redirecting/updating UI
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-main-body-bg">
      <div className="p-8 rounded-lg shadow-xl bg-sidebar-bg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-text mb-6">
          {isLogin ? 'Login to Memoria' : 'Sign Up for Memoria'}
        </h2>
        {error && <p className="mb-4 text-center text-sm text-error-text bg-error-bg p-2 rounded">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <button
          onClick={() => { setIsLogin(!isLogin); setError(null); }}
          className="w-full mt-4 text-sm text-center text-blue-400 hover:underline"
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};