import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/HomePage.tsx';
import ReviewPage from './pages/ReviewPage.tsx';
import Layout from './components/Layout.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'notes/:noteId', // Route for specific note
        element: <HomePage />, 
      },
      {
        path: 'review',
        element: <ReviewPage />,
      },
      {
        path: '*', // Not found
        element: <div className="p-8 text-center text-xl">Page Not Found</div>
      }
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}