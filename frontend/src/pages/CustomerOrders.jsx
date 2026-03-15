import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Home,
  Eye,
  AlertCircle,
  Loader,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ShoppingCart,
  ArrowRight
} from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedModal from '../components/AnimatedModal'

const CustomerOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()

    const interval = setInterval(() => {
      fetchOrders(true)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(response.data.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch orders')
      console.error('Fetch orders error:', err)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} />
      case 'processing':
        return <Package size={20} />
      case 'completed':
        return <CheckCircle size={20} />
      case 'cancelled':
        return <XCircle size={20} />
      default:
        return <Clock size={20} />
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const goBack = () => {
    navigate('/customer-dashboard')
  }

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((order) => order.status === statusFilter)

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const processingCount = orders.filter((o) => o.status === 'processing').length

  const statCards = [
    {
      label: 'Total Orders',
      value: orders.length,
      icon: ShoppingCart,
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-700'
    },
    {
      label: 'Processing',
      value: processingCount,
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700'
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        className="bg-white shadow-md sticky top-0 z-30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Orders</h1>
              <p className="text-gray-600 text-sm">Track updates and review every purchase in one place</p>
            </div>
            <motion.button
              onClick={goBack}
              className="inline-flex min-h-11 items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={18} />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          className="rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 p-5 sm:p-6 text-white shadow-lg mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-cyan-100 text-sm uppercase tracking-wider">Order Control Center</p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">Keep an eye on every order</h2>
              <p className="text-cyan-100 mt-1">Filter by status, open details quickly, and continue shopping anytime.</p>
            </div>
            <motion.button
              onClick={() => navigate('/customer-products')}
              className="group inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/15 px-4 py-2 font-semibold backdrop-blur-sm hover:bg-white/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Order More
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} />
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {statCards.map((card, index) => {
            const Icon = card.icon

            return (
              <motion.div
                key={card.label}
                className="bg-white rounded-xl shadow-md p-4"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.iconBg}`}>
                    <Icon className={card.iconColor} size={20} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">Showing <span className="font-semibold text-gray-800">{filteredOrders.length}</span> order(s)</p>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label htmlFor="statusFilter" className="text-sm text-gray-600">Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full md:w-auto"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
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

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-cyan-600" size={40} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-xl shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg mb-4">
              {orders.length === 0 ? 'No orders found' : 'No orders match this status'}
            </p>
            <button
              onClick={() => navigate('/customer-products')}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-all"
            >
              Browse Products
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <AnimatedCard key={order._id} index={index}>
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className={`w-fit px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="font-semibold capitalize">{order.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Items</p>
                          <p className="text-lg font-semibold text-gray-800">{order.items.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Total Amount</p>
                          <p className="text-lg font-bold text-cyan-700">${order.totalAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Delivery To</p>
                          <p className="text-sm text-gray-800 truncate">{order.deliveryAddress}</p>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Items:</p>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-600">
                              • {item.productName} x {item.quantity} @ ${item.price?.toFixed(2)}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-sm text-gray-600 italic">
                              +{order.items.length - 2} more item(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={() => handleViewDetails(order)}
                      className="w-full md:w-auto min-h-11 justify-center bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye size={20} />
                      View Details
                    </motion.button>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* Action Button */}
        {filteredOrders.length > 0 && (
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => navigate('/customer-products')}
              className="w-full sm:w-auto min-h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Continue Shopping
            </button>
          </motion.div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatedModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedOrder(null)
        }}
        title={selectedOrder?.orderNumber}
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status */}
            <div className={`p-4 rounded-lg flex items-center gap-3 ${getStatusColor(selectedOrder.status)}`}>
              {getStatusIcon(selectedOrder.status)}
              <div>
                <p className="font-semibold capitalize">{selectedOrder.status.toUpperCase()}</p>
                <p className="text-sm">
                  Ordered on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 uppercase">Order Date</p>
                <p className="font-semibold">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase">Total Amount</p>
                <p className="text-lg font-bold text-cyan-700">${selectedOrder.totalAmount?.toFixed(2)}</p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Delivery Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="text-gray-600">Name:</span> <span className="font-semibold">{selectedOrder.customerName}</span></p>
                <p><span className="text-gray-600">Email:</span> <span className="font-semibold">{selectedOrder.customerEmail}</span></p>
                <p><span className="text-gray-600">Phone:</span> <span className="font-semibold">{selectedOrder.customerPhone}</span></p>
                <p><span className="text-gray-600">Address:</span> <span className="font-semibold">{selectedOrder.deliveryAddress}</span></p>
              </div>
            </div>

            {/* Items Details */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Order Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-grow">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                    </div>
                    <p className="font-bold text-cyan-700">${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Special Notes</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-4 bg-cyan-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${selectedOrder.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-cyan-700 border-t pt-2">
                <span>Total:</span>
                <span>${selectedOrder.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowDetailsModal(false)
                setSelectedOrder(null)
              }}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </AnimatedModal>
    </div>
  )
}

export default CustomerOrders
