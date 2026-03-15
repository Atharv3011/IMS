import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { Bell, Trash2, CheckCircle, AlertCircle, Info, Package, ShoppingCart } from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'

const LOW_STOCK_THRESHOLD = 20
const DATA_REFRESH_MS = 15000
const CLOCK_REFRESH_MS = 30000

const Notifications = () => {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem('notificationsReadIds')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('notificationsDismissedIds')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    localStorage.setItem('notificationsReadIds', JSON.stringify(readIds))
  }, [readIds])

  useEffect(() => {
    localStorage.setItem('notificationsDismissedIds', JSON.stringify(dismissedIds))
  }, [dismissedIds])

  useEffect(() => {
    const updateClock = () => setNow(new Date())
    const interval = setInterval(updateClock, CLOCK_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Please login to view notifications')
          setLoading(false)
          return
        }

        const config = { headers: { Authorization: `Bearer ${token}` } }
        const [ordersRes, productsRes] = await Promise.all([
          axios.get(`${API_URL}/orders`, config),
          axios.get(`${API_URL}/products`, config)
        ])

        setOrders(ordersRes.data?.data || [])
        setProducts(productsRes.data?.data || [])
        setError('')
      } catch (fetchError) {
        console.error('Failed to fetch notifications data:', fetchError)
        setError('Unable to load real-time notifications')
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()
    const interval = setInterval(fetchLiveData, DATA_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  const notifications = useMemo(() => {
    const generated = []

    orders.forEach((order) => {
      const createdAt = new Date(order.createdAt || order.orderDate || Date.now())
      generated.push({
        id: `order-created-${order._id}`,
        type: 'info',
        title: 'New Order Received',
        message: `Order #${order.orderNumber || order._id.slice(-6)} from ${order.customerName} for $${Number(order.totalAmount || 0).toFixed(2)}.`,
        time: createdAt,
        icon: ShoppingCart
      })

      if (order.status === 'completed') {
        generated.push({
          id: `order-completed-${order._id}`,
          type: 'success',
          title: 'Order Completed',
          message: `Order #${order.orderNumber || order._id.slice(-6)} has been completed.`,
          time: createdAt,
          icon: CheckCircle
        })
      }

      if (order.status === 'cancelled') {
        generated.push({
          id: `order-cancelled-${order._id}`,
          type: 'warning',
          title: 'Order Cancelled',
          message: `Order #${order.orderNumber || order._id.slice(-6)} was cancelled.`,
          time: createdAt,
          icon: AlertCircle
        })
      }
    })

    products.forEach((product) => {
      const createdAt = new Date(product.createdAt || Date.now())
      const stock = Number(product.stock || 0)

      if (stock === 0) {
        generated.push({
          id: `stock-out-${product._id}`,
          type: 'warning',
          title: 'Out of Stock',
          message: `Product "${product.name}" is out of stock.`,
          time: createdAt,
          icon: AlertCircle
        })
      } else if (stock <= LOW_STOCK_THRESHOLD) {
        generated.push({
          id: `stock-low-${product._id}`,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `Product "${product.name}" has only ${stock} unit${stock === 1 ? '' : 's'} left.`,
          time: createdAt,
          icon: AlertCircle
        })
      }

      if (now - createdAt <= 24 * 60 * 60 * 1000) {
        generated.push({
          id: `product-added-${product._id}`,
          type: 'success',
          title: 'Product Added',
          message: `New product "${product.name}" has been added to inventory.`,
          time: createdAt,
          icon: Package
        })
      }
    })

    return generated
      .filter((item) => !dismissedIds.includes(item.id))
      .sort((a, b) => b.time - a.time)
      .slice(0, 100)
      .map((item) => ({
        ...item,
        read: readIds.includes(item.id)
      }))
  }, [orders, products, now, dismissedIds, readIds])

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filterType || (filterType === 'unread' && !n.read))

  const markAsRead = (id) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev)
      notifications.forEach((n) => next.add(n.id))
      return Array.from(next)
    })
  }

  const deleteNotification = (id) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const deleteAll = () => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      notifications.forEach((n) => next.add(n.id))
      return Array.from(next)
    })
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'success': return 'border-l-4 border-green-500 bg-green-50'
      case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-50'
      case 'info': return 'border-l-4 border-blue-500 bg-blue-50'
      case 'error': return 'border-l-4 border-red-500 bg-red-50'
      default: return 'border-l-4 border-gray-500 bg-gray-50'
    }
  }

  const getTypeTextColor = (type) => {
    switch(type) {
      case 'success': return 'text-green-700'
      case 'warning': return 'text-yellow-700'
      case 'info': return 'text-blue-700'
      case 'error': return 'text-red-700'
      default: return 'text-gray-700'
    }
  }

  const formatTime = (date) => {
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const currentDateTime = now.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with system notifications</p>
          <p className="text-xs text-gray-500 mt-1">Live as of {currentDateTime}</p>
        </motion.div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <motion.button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mark All as Read
            </motion.button>
          )}
          {notifications.length > 0 && (
            <motion.button
              onClick={deleteAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All
            </motion.button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <AnimatedCard delay={0.2} hover={false} className="mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {['all', 'unread', 'success', 'warning', 'info'].map((filter) => (
            <motion.button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterType === filter
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filter === 'unread' ? `Unread (${unreadCount})` : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </motion.button>
          ))}
        </div>
      </AnimatedCard>

      {error && (
        <AnimatedCard delay={0.25} hover={false} className="mb-4">
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
        </AnimatedCard>
      )}

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <AnimatedCard delay={0.3}>
          <div className="text-center py-12">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">Loading notifications...</p>
          </div>
        </AnimatedCard>
      ) : filteredNotifications.length === 0 ? (
        <AnimatedCard delay={0.3}>
          <div className="text-center py-12">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No notifications to display</p>
          </div>
        </AnimatedCard>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => (
            <AnimatedCard 
              key={notification.id}
              delay={0.2 + index * 0.05}
              hover={true}
              className={`cursor-pointer transition-all ${getTypeColor(notification.type)} ${!notification.read ? 'shadow-md' : ''}`}
            >
              <div className="flex items-start gap-4 p-4">
                <motion.div
                  className={`p-3 rounded-lg ${getTypeColor(notification.type)}`}
                  whileHover={{ scale: 1.1 }}
                >
                  <notification.icon className={`${getTypeTextColor(notification.type)}`} size={24} />
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold text-gray-800 ${!notification.read ? 'font-bold' : ''}`}>
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                      <p className="text-gray-500 text-xs mt-2">{formatTime(notification.time)}</p>
                    </div>
                    
                    {!notification.read && (
                      <motion.div
                        className="w-2 h-2 bg-purple-600 rounded-full mt-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!notification.read && (
                    <motion.button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-200 rounded-lg text-red-600"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete notification"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default Notifications
