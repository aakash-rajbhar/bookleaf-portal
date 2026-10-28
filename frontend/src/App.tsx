import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Books } from './pages/author/Books';
import { SubmitQuery } from './pages/author/SubmitQuery';
import { Tickets } from './pages/author/Tickets';
import { TicketDetail } from './pages/author/TicketDetail';
import { AdminPlaceholder } from './pages/admin/AdminPlaceholder';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Author routes with app shell Layout */}
          <Route
            element={
              <ProtectedRoute role="author">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/books" element={<Books />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/new" element={<SubmitQuery />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Route>

          {/* Admin routes (reserved for T13) */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="admin">
                <AdminPlaceholder />
              </ProtectedRoute>
            }
          />

          {/* Default and catch-all redirect */}
          <Route path="/" element={<Navigate to="/books" replace />} />
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
