import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  ShoppingCart,
  Package,
  Settings,
  Loader,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react'
import axios, { API_URL } from '../utils/api'

const CustomerDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch orders
      const ordersResponse = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(ordersResponse.data.data || [])
      
      // Fetch products
      const productsResponse = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(productsResponse.data.data || [])
      
      setError('')
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    navigate('/login')
    return null
  }

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const recentOrders = [...orders].slice(0, 4)
  const featuredProducts = products
    .filter((p) => p.stock > 0)
    .slice(0, 4)

  const formatOrderDate = (orderDate) => {
    return new Date(orderDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          className: 'bg-green-100 text-green-700',
          icon: CheckCircle2
        }
      case 'cancelled':
        return {
          className: 'bg-red-100 text-red-700',
          icon: XCircle
        }
      case 'processing':
        return {
          className: 'bg-blue-100 text-blue-700',
          icon: Package
        }
      default:
        return {
          className: 'bg-yellow-100 text-yellow-700',
          icon: Clock
        }
    }
  }

  const quickStats = [
    {
      title: 'Active Orders',
      value: activeOrders.length,
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/customer-orders')
    },
    {
      title: 'Available Products',
      value: products.length,
      icon: Package,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/customer-products')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div
        className="bg-white shadow-md sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Customer Portal</h1>
              <p className="text-gray-600 text-sm">Welcome back, {user.name}!</p>
            </motion.div>
            <motion.button
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <motion.div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
          <motion.div
            className="rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 p-5 sm:p-8 text-white shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-cyan-100 text-sm uppercase tracking-wider">Customer Workspace</p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold">Welcome, {user.name}</h2>
                <p className="mt-2 text-cyan-100">
                  Track your orders, reorder quickly, and discover products in one place.
                </p>
                <p className="mt-3 text-sm text-cyan-100">{user.email}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 text-sm backdrop-blur-sm">
                <p className="font-semibold">Need items fast?</p>
                <p className="mt-1 text-cyan-100">Go straight to products and place a new order.</p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader className="animate-spin text-cyan-600" size={40} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <motion.button
                      key={index}
                      className="rounded-xl bg-white p-4 sm:p-6 text-left shadow-md transition-all hover:shadow-lg"
                      onClick={stat.action}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                        <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-4`}>
                          <Icon className="text-white" size={28} />
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <motion.button
                  onClick={() => navigate('/customer-products')}
                  className="group min-h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 sm:px-6 py-4 text-left text-white shadow-lg transition-all hover:shadow-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-emerald-100">Quick Action</p>
                      <p className="mt-1 text-lg sm:text-xl font-bold">Browse & Order Products</p>
                    </div>
                    <ArrowRight className="transition-transform group-hover:translate-x-1" size={22} />
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => navigate('/customer-orders')}
                  className="group min-h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 sm:px-6 py-4 text-left text-white shadow-lg transition-all hover:shadow-xl"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-violet-100">Quick Action</p>
                      <p className="mt-1 text-lg sm:text-xl font-bold">Track My Orders</p>
                    </div>
                    <ArrowRight className="transition-transform group-hover:translate-x-1" size={22} />
                  </div>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <motion.div
                  className="rounded-xl bg-white p-4 sm:p-6 shadow-md xl:col-span-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                      <p className="text-sm text-gray-500">Your latest order activity</p>
                    </div>
                    <button
                      onClick={() => navigate('/customer-orders')}
                      className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
                    >
                      View All
                    </button>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
                      You have not placed any orders yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => {
                        const statusStyles = getStatusStyles(order.status)
                        const StatusIcon = statusStyles.icon

                        return (
                          <div
                            key={order._id}
                            className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">{formatOrderDate(order.createdAt || order.orderDate)}</p>
                            </div>
                            <div className="text-sm text-gray-600">
                              {order.items.length} item(s) • ${Number(order.totalAmount || 0).toFixed(2)}
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusStyles.className}`}>
                              <StatusIcon size={14} />
                              {order.status}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  className="rounded-xl bg-white p-4 sm:p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={20} />
                    <h3 className="text-xl font-bold text-gray-800">Highlights</h3>
                  </div>

                  <div className="space-y-3">
                    {featuredProducts.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                        No in-stock products right now.
                      </p>
                    ) : (
                      featuredProducts.map((product) => (
                        <div key={product._id} className="rounded-lg border border-gray-100 p-3">
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                          <p className="mt-1 text-sm font-bold text-cyan-700">${Number(product.price || 0).toFixed(2)}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/customer-products')}
                    className="mt-4 w-full min-h-11 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-cyan-700"
                  >
                    Shop Products
                  </button>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                <motion.div
                  className="rounded-xl bg-white p-4 sm:p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-100 p-3">
                      <ShoppingCart className="text-blue-600" size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="font-semibold text-gray-800">{orders.length}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="rounded-xl bg-white p-4 sm:p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-green-100 p-3">
                      <Package className="text-green-600" size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed Orders</p>
                      <p className="font-semibold text-gray-800">{completedOrders.length}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="rounded-xl bg-white p-4 sm:p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-violet-100 p-3">
                      <Settings className="text-violet-600" size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="font-semibold text-emerald-600">Active</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default CustomerDashboard
