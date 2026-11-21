import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Demo from './pages/Demo';
import About from './pages/About';
import Help from './pages/Help';
import Auth from './pages/Auth';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-orange-100 selection:text-orange-900">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
