import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Orders from './pages/Orders'
import Users from './pages/Users'
import Customers from './pages/Customers'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Signup from './pages/Signup'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerProducts from './pages/CustomerProducts'
import CustomerOrders from './pages/CustomerOrders'
import AnimatedLayout from './components/AnimatedLayout'

function App() {
  const { user } = useAuth()

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'customer' ? "/customer-dashboard" : "/dashboard"} /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={user.role === 'customer' ? "/customer-dashboard" : "/dashboard"} /> : <Signup />} />
        
        {/* Customer Routes */}
        <Route path="/customer-dashboard" element={user?.role === 'customer' ? <CustomerDashboard /> : <Navigate to="/login" />} />
        <Route path="/customer-products" element={user?.role === 'customer' ? <CustomerProducts /> : <Navigate to="/login" />} />
        <Route path="/customer-orders" element={user?.role === 'customer' ? <CustomerOrders /> : <Navigate to="/login" />} />
        
        {/* Admin Routes */}
        <Route path="/" element={user && user.role !== 'customer' ? <AnimatedLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
                    <Route path="customers" element={<Customers />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
