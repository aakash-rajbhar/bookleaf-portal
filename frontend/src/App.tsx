import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Books } from './pages/author/Books';
import { SubmitQuery } from './pages/author/SubmitQuery';
import { Tickets } from './pages/author/Tickets';
import { TicketDetail } from './pages/author/TicketDetail';
import { Queue } from './pages/admin/Queue';
import { TicketDetailPlaceholder } from './pages/admin/TicketDetailPlaceholder';

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

          {/* Admin routes with app shell Layout */}
          <Route
            element={
              <ProtectedRoute role="admin">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<Queue />} />
            <Route path="/admin/tickets/:id" element={<TicketDetailPlaceholder />} />
          </Route>

          {/* Default and catch-all redirect */}
          <Route path="/" element={<Navigate to="/books" replace />} />
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
