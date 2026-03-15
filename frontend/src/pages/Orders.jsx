import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, Package, Loader } from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedModal from '../components/AnimatedModal'

const Orders = () => {
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: ''
  })
  const [selectedProducts, setSelectedProducts] = useState([])

  const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`

  const getProductSummary = (items = []) => {
    if (!items.length) return 'No products'
    const names = items.map((item) => item.productName)
    if (names.length <= 2) {
      return names.join(', ')
    }
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
  }

  const getQuantitySummary = (items = []) => {
    const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    return `${totalUnits} unit${totalUnits === 1 ? '' : 's'}`
  }

  useEffect(() => {
    fetchOrders()
    fetchProducts()

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

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data.data)
    } catch (err) {
      console.error('Fetch products error:', err)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleProductSelect = (e) => {
    const productId = e.target.value
    const product = products.find(p => p._id === productId)
    if (product && !selectedProducts.find(p => p.product === productId)) {
      setSelectedProducts([...selectedProducts, { 
        product: productId, 
        quantity: 1, 
        name: product.name, 
        price: product.price 
      }])
    }
  }

  const updateProductQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.product === productId ? { ...p, quantity: parseInt(quantity) || 1 } : p
    ))
  }

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.product !== productId))
  }

  const handlePrintBill = (order) => {
    if (!order) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      setError('Please allow pop-ups to print the bill')
      return
    }

    const itemsHtml = order.items.map((item) => {
      const lineTotal = (item.price || 0) * (item.quantity || 0)
      return `
        <tr>
          <td>${item.productName}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">${formatCurrency(item.price)}</td>
          <td style="text-align:right;">${formatCurrency(lineTotal)}</td>
        </tr>
      `
    }).join('')

    const orderDate = new Date(order.createdAt || order.orderDate)
    const totalAmount = formatCurrency(order.totalAmount)

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Bill</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
            h1 { margin: 0 0 8px; }
            .muted { color: #6b7280; font-size: 14px; }
            .section { margin-top: 20px; }
            .row { display: flex; justify-content: space-between; gap: 20px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
            th { text-align: left; background: #f9fafb; }
            .total { font-size: 18px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Order Bill</h1>
          <div class="muted">Generated on ${new Date().toLocaleString()}</div>

          <div class="section row">
            <div class="card" style="flex: 1;">
              <div class="muted">Order Number</div>
              <div style="font-weight: 700; font-size: 18px;">${order.orderNumber}</div>
              <div class="muted" style="margin-top: 6px;">Order Date</div>
              <div>${orderDate.toLocaleDateString()}</div>
              <div class="muted" style="margin-top: 6px;">Status</div>
              <div style="text-transform: uppercase;">${order.status}</div>
            </div>
            <div class="card" style="flex: 1;">
              <div class="muted">Customer</div>
              <div style="font-weight: 700;">${order.customerName}</div>
              <div>${order.customerEmail || ''}</div>
              <div>${order.customerPhone || ''}</div>
              <div class="muted" style="margin-top: 6px;">Delivery Address</div>
              <div>${order.deliveryAddress || ''}</div>
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div style="font-weight: 700;">Order Items</div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Price</th>
                    <th style="text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
                <div class="total">Total Amount: ${totalAmount}</div>
              </div>
            </div>
          </div>

          ${order.notes ? `
            <div class="section">
              <div class="card">
                <div style="font-weight: 700;">Notes</div>
                <div>${order.notes}</div>
              </div>
            </div>
          ` : ''}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (selectedProducts.length === 0) {
      setError('Please select at least one product')
      return
    }
    
    if (!formData.customerName.trim()) {
      setError('Customer name is required')
      return
    }
    if (!formData.customerEmail.trim()) {
      setError('Customer email is required')
      return
    }
    if (!formData.customerPhone.trim()) {
      setError('Customer phone is required')
      return
    }
    if (!formData.deliveryAddress.trim()) {
      setError('Delivery address is required')
      return
    }
    
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const orderData = {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        items: selectedProducts.map(p => ({ product: p.product, quantity: p.quantity })),
        notes: formData.notes.trim()
      }
      
      console.log('Sending order data:', orderData)
      
      const response = await axios.post(`${API_URL}/orders/add`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Order created successfully:', response.data)
      
      setShowModal(false)
      setFormData({ 
        customerName: '', 
        customerEmail: '', 
        customerPhone: '', 
        deliveryAddress: '', 
        notes: '' 
      })
      setSelectedProducts([])
      fetchOrders()
      setError('')
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create order'
      setError(errorMessage)
      console.error('Create order error:', err)
      console.error('Error response:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchOrders()
      setShowDetailsModal(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status')
      console.error('Update order error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchValue = searchTerm.trim().toLowerCase()
    const matchesSearch = !searchValue ||
      order.customerName.toLowerCase().includes(searchValue) ||
      order.orderNumber.toLowerCase().includes(searchValue) ||
      order.items.some((item) => item.productName.toLowerCase().includes(searchValue))

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'processing': return 'bg-blue-100 text-blue-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle size={16} />
      case 'pending': return <Clock size={16} />
      case 'processing': return <Package size={16} />
      case 'cancelled': return <XCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const viewOrderDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800">Orders List</h1>
          <p className="mt-1 text-gray-600">Review customer orders, product quantities, and status updates</p>
        </motion.div>

        <AnimatedButton 
          onClick={() => setShowModal(true)}
          icon={Plus}
        >
          New Order
        </AnimatedButton>
      </div>

      {error && (
        <motion.div 
          className="bg-red-50 text-red-600 p-4 rounded-lg mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <AnimatedCard delay={0.2} hover={false}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <motion.div 
            className="relative flex-1"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders by customer name or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </motion.div>

          <motion.select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 lg:w-56"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </motion.select>
        </div>

        {loading && filteredOrders.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-purple-600" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <motion.tr 
                  className="border-b border-gray-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Product Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Quantity</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </motion.tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <td className="px-4 py-4 align-top">
                        <span className="font-semibold text-purple-600">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div>
                          <p className="font-medium text-gray-800">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div>
                          <p className="font-medium text-gray-800">{getProductSummary(order.items)}</p>
                          <p className="text-sm text-gray-500">{order.items.length} line item(s)</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div>
                          <p className="font-semibold text-gray-800">{getQuantitySummary(order.items)}</p>
                          <p className="text-sm text-gray-500">
                            {order.items.slice(0, 2).map((item) => `${item.productName}: ${item.quantity}`).join(', ')}
                            {order.items.length > 2 ? '...' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-gray-600">
                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <motion.span 
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </motion.span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div>
                          <p className="font-bold text-gray-800">${order.totalAmount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">
                            {order.customerId ? 'Customer order' : 'Manual order'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <motion.button
                          onClick={() => viewOrderDetails(order)}
                          className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 flex items-center gap-1"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye size={18} />
                          <span className="text-sm">View</span>
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </AnimatedCard>

      {/* Add Order Modal */}
      <AnimatedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Order"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter customer name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email
            </label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Phone
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address
            </label>
            <textarea
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="3"
              placeholder="Enter delivery address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Products
            </label>
            <select 
              onChange={handleProductSelect}
              value=""
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select a product --</option>
              {products.map(product => (
                <option key={product._id} value={product._id} disabled={product.stock === 0}>
                  {product.name} - ${product.price} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Products List */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Selected Items</label>
              {selectedProducts.map((item) => (
                <div key={item.product} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{item.name}</span>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateProductQuantity(item.product, e.target.value)}
                    className="w-20 px-2 py-1 border rounded"
                  />
                  <span className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removeProduct(item.product)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ))}
              <div className="text-right font-bold">
                Total: ${selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="2"
              placeholder="Any special instructions"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Creating...' : 'Create Order'}
            </AnimatedButton>
            <AnimatedButton 
              type="button"
              variant="secondary" 
              onClick={() => setShowModal(false)}
              className="flex-1 justify-center"
            >
              Cancel
            </AnimatedButton>
          </div>
        </form>
      </AnimatedModal>

      {/* Order Details Modal */}
      <AnimatedModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-xl font-bold text-purple-600">{selectedOrder.orderNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer</p>
                <p className="font-semibold text-gray-800">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase inline-flex items-center gap-1 ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Type</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                  selectedOrder.customerId ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedOrder.customerId ? 'Customer Order' : 'Manual Order'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-semibold text-gray-800">{new Date(selectedOrder.createdAt || selectedOrder.orderDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
              <p className="text-gray-800">{selectedOrder.deliveryAddress}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Order Items</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{item.productName}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-gray-800">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-purple-600">${selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <AnimatedButton
                variant="secondary"
                className="flex-1 justify-center"
                onClick={() => handlePrintBill(selectedOrder)}
              >
                Print Bill
              </AnimatedButton>
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <AnimatedButton 
                  variant="success" 
                  className="flex-1 justify-center"
                  onClick={() => updateOrderStatus(selectedOrder._id, 'completed')}
                  disabled={loading}
                >
                  Mark as Completed
                </AnimatedButton>
              )}
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <AnimatedButton 
                  variant="danger" 
                  className="flex-1 justify-center"
                  onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                  disabled={loading}
                >
                  Cancel Order
                </AnimatedButton>
              )}
            </div>
          </div>
        )}
      </AnimatedModal>
    </motion.div>
  )
}

export default Orders
