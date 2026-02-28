import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Cafeteria from './pages/Cafeteria';
import Menu from './pages/Menu';
import FoodSafety from './pages/FoodSafety';
import LostFound from './pages/LostFound';
import Feedback from './pages/Feedback';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cafeteria" element={<Cafeteria />} />
          <Route path="menu" element={<Menu />} />
          <Route path="food-safety" element={<FoodSafety />} />
          <Route path="lost-found" element={<LostFound />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
