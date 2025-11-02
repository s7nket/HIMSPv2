// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';

// === IMPORT YOUR COMPONENTS ===
import Landing from './components/common/Landing';   // <-- ADD THIS LINE
import Login from './components/common/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import OfficerDashboard from './components/officer/OfficerDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />       {/* <-- CHANGED THIS LINE */}
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Officer Routes */}
            <Route 
              path="/officer/*" 
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Default Route (No longer needed, "/" is the default) */}
            {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} /> {/* <-- CHANGED THIS LINE */}
          </Routes>

          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;