import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Package, FolderOpen, Truck, Users, TrendingUp, AlertTriangle, ShoppingCart, Loader } from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import StatsCard from '../components/StatsCard'
import AnimatedCard from '../components/AnimatedCard'

const Dashboard = () => {
  const [stats, setStats] = useState([
    { icon: Package, title: 'Total Products', value: 0, color: 'blue' },
    { icon: FolderOpen, title: 'Categories', value: 0, color: 'purple' },
    { icon: Truck, title: 'Suppliers', value: 0, color: 'green' },
    { icon: Users, title: 'Users', value: 0, color: 'orange' },
  ])

  const [orders, setOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch all data in parallel
      const [productsRes, categoriesRes, suppliersRes, usersRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { headers }),
        axios.get(`${API_URL}/categories`, { headers }),
        axios.get(`${API_URL}/suppliers`, { headers }),
        axios.get(`${API_URL}/users`, { headers }),
        axios.get(`${API_URL}/orders`, { headers }).catch(() => ({ data: { data: [] } })) // Orders might fail if endpoint not ready
      ])

      const products = productsRes.data.data || []
      const categories = categoriesRes.data.data || []
      const suppliers = suppliersRes.data.data || []
      const users = usersRes.data.data || []
      const allOrders = ordersRes.data.data || []

      // Update stats
      setStats([
        { icon: Package, title: 'Total Products', value: products.length, color: 'blue' },
        { icon: FolderOpen, title: 'Categories', value: categories.length, color: 'purple' },
        { icon: Truck, title: 'Suppliers', value: suppliers.length, color: 'green' },
        { icon: Users, title: 'Users', value: users.length, color: 'orange' },
      ])

      // Filter low stock products (stock < 50)
      const lowStock = products.filter(p => p.stock < 50).slice(0, 3)
      setLowStockProducts(lowStock)

      // Get recent orders (last 4)
      const recentOrders = allOrders.slice(0, 4).map(order => ({
        id: order._id,
        action: 'Order Created',
        item: `${order.customerName} ordered ${order.items.length} item(s)`,
        total: `$${order.totalAmount}`,
        time: new Date(order.createdAt).toLocaleDateString(),
        status: order.status,
        type: order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'info'
      }))
      setOrders(recentOrders)
      setError('')
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your inventory overview</p>
        </div>
        
        <motion.div
          className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp size={20} />
          <span className="font-semibold">All Systems Operational</span>
        </motion.div>
      </motion.div>

      {error && (
        <motion.div 
          className="bg-red-50 text-red-600 p-4 rounded-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            color={stat.color}
            delay={index * 0.1}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders/Activity */}
        <AnimatedCard delay={0.5}>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
          </div>
          
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ x: 5, backgroundColor: '#f9fafb' }}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.item}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-purple-600">{activity.total}</span>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatedCard>

        {/* Low Stock Alerts */}
        <AnimatedCard delay={0.6}>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={24} />
            Low Stock Alerts
          </h2>
          
          {lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <TrendingUp className="text-green-600 mb-2" size={32} />
              <p className="text-gray-600 text-center">All products have sufficient stock! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-600">Category: {product.category?.name}</p>
                  </div>
                  <motion.div 
                    className="text-right"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-orange-600 font-bold block">{product.stock} units</span>
                    <span className="text-xs text-orange-500">Low stock</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatedCard>
      </div>

      {/* Summary Stats Row */}
      <AnimatedCard delay={0.7}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-600 text-sm font-semibold">Total Orders</p>
            <p className="text-2xl font-bold text-blue-700">{orders.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-green-600 text-sm font-semibold">Low Stock Items</p>
            <p className="text-2xl font-bold text-green-700">{lowStockProducts.length}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-purple-600 text-sm font-semibold">Inventory Value</p>
            <p className="text-2xl font-bold text-purple-700">Calc...</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <p className="text-orange-600 text-sm font-semibold">Status</p>
            <p className="text-2xl font-bold text-orange-700">✓ Active</p>
          </div>
        </div>
      </AnimatedCard>
    </div>
  )
}

export default Dashboard
