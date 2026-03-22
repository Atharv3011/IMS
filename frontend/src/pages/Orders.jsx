import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, Package, Loader } from 'lucide-react'
import axios, { API_URL, buildApiUrl } from '../utils/api'
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
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: ''
  })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isEditingBill, setIsEditingBill] = useState(false)
  const [editBillData, setEditBillData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: '',
    items: []
  })

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

  useEffect(() => {
    if (showModal) {
      fetchCustomers()
    }
  }, [showModal])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      let customerData = []

      try {
        const response = await axios.get(`${API_URL}/users/customers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        customerData = response.data.data || []
      } catch (primaryError) {
        const fallback = await axios.get(`${API_URL}/orders/customers/billing`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        customerData = fallback.data.data || []
      }

      setCustomers(customerData)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers')
      console.error('Fetch customers error:', err)
    }
  }

  const handleSelectCustomer = (customerId) => {
    const customer = customers.find(c => c._id === customerId)
    if (customer) {
      setSelectedCustomer(customer)
      setFormData({
        ...formData,
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone
      })
    }
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      deliveryAddress: '',
      notes: ''
    })
  }

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
    const billDate = new Date(order.billedAt || order.createdAt || order.orderDate)
    const itemTotal = formatCurrency(order.itemTotal || order.totalAmount)
    const outstandingAmount = formatCurrency(order.outstandingAmountAtTime || 0)
    const totalBilled = formatCurrency(order.totalBilled || order.totalAmount)

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
              <div class="muted" style="margin-top: 6px;">Bill Date & Time</div>
              <div>${billDate.toLocaleDateString()} ${billDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
              <div style="display: flex; justify-content: flex-end; margin-top: 12px; flex-direction: column; align-items: flex-end; gap: 8px;">
                <div style="font-size: 16px;">Order Items Total: ${itemTotal}</div>
                ${Number(order.outstandingAmountAtTime || 0) > 0 ? `
                  <div style="font-size: 14px; color: #d97706;">Previous Outstanding: ${outstandingAmount}</div>
                  <div class="total" style="border-top: 2px solid #e5e7eb; padding-top: 8px;">Total Billed Amount: ${totalBilled}</div>
                ` : `
                  <div class="total">Total Amount: ${itemTotal}</div>
                `}
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
        customerId: formData.customerId || undefined,
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
    setIsEditingBill(false)
    setEditBillData({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      deliveryAddress: order.deliveryAddress || '',
      notes: order.notes || '',
      items: (order.items || []).map((item) => ({
        product: item.product?._id || item.product,
        productName: item.productName,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0)
      }))
    })
    setShowDetailsModal(true)
  }

  const handleEditBillInputChange = (e) => {
    setEditBillData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleEditBillQuantityChange = (productId, quantity) => {
    const parsedQty = Math.max(1, parseInt(quantity || 1, 10))
    setEditBillData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        String(item.product) === String(productId)
          ? { ...item, quantity: parsedQty }
          : item
      )
    }))
  }

  const removeEditBillItem = (productId) => {
    setEditBillData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => String(item.product) !== String(productId))
    }))
  }

  const addProductToEditBill = (productId) => {
    const product = products.find((p) => p._id === productId)
    if (!product) return

    setEditBillData((prev) => {
      if (prev.items.find((item) => String(item.product) === String(productId))) {
        return prev
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            product: product._id,
            productName: product.name,
            quantity: 1,
            price: Number(product.price || 0)
          }
        ]
      }
    })
  }

  const handleSaveBill = async () => {
    if (!selectedOrder) return

    if (!editBillData.customerName.trim() || !editBillData.customerEmail.trim() || !editBillData.customerPhone.trim() || !editBillData.deliveryAddress.trim()) {
      setError('All customer and delivery fields are required')
      return
    }

    if (!editBillData.items.length) {
      setError('Please keep at least one item in bill')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const payload = {
        customerName: editBillData.customerName.trim(),
        customerEmail: editBillData.customerEmail.trim(),
        customerPhone: editBillData.customerPhone.trim(),
        deliveryAddress: editBillData.deliveryAddress.trim(),
        notes: editBillData.notes.trim(),
        items: editBillData.items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity)
        }))
      }

      let response
      try {
        response = await axios.put(buildApiUrl(`/orders/${selectedOrder._id}/bill`), payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (primaryError) {
        response = await axios.put(`/api/orders/${selectedOrder._id}/bill`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      const updatedOrder = response.data.data
      setSelectedOrder(updatedOrder)
      setOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)))
      setIsEditingBill(false)
      setError('')
    } catch (err) {
      const status = err.response?.status
      const backendMessage = err.response?.data?.message
      const requestUrl = err.config?.url
      setError(backendMessage || `Failed to update bill${status ? ` (HTTP ${status})` : ''}${requestUrl ? ` at ${requestUrl}` : ''}`)
      console.error('Update bill error:', err)
    } finally {
      setLoading(false)
    }
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Bill Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </motion.tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-gray-500">
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
                      <td className="px-4 py-4 align-top text-gray-600">
                        {order.billedAt ? (
                          <div className="text-sm">
                            <p className="font-medium text-blue-700">{new Date(order.billedAt).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{new Date(order.billedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not billed</span>
                        )}
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
                          <p className="font-bold text-gray-800">
                            ${Number((order.totalBilled ?? order.totalAmount) || 0).toLocaleString()}
                          </p>
                          {Number(order.outstandingAmountAtTime || 0) > 0 && (
                            <>
                              <p className="text-xs text-amber-700">
                                Bill: ${Number(order.totalAmount || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-amber-700">
                                Outstanding: ${Number(order.outstandingAmountAtTime || 0).toLocaleString()}
                              </p>
                            </>
                          )}
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
        onClose={() => {
          setShowModal(false)
          handleClearCustomer()
          setSelectedProducts([])
          setError('')
        }}
        title="Create New Order"
        size="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Customer
            </label>
            <select 
              onChange={(e) => handleSelectCustomer(e.target.value)}
              value={selectedCustomer?._id || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select a customer --</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} ({customer.outstandingAmount > 0 ? `Outstanding: $${customer.outstandingAmount.toFixed(2)}` : 'Paid'})
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <button
                type="button"
                onClick={handleClearCustomer}
                className="mt-2 text-sm text-purple-600 hover:text-purple-800"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Show Outstanding Amount if customer has previous balance */}
          {selectedCustomer && selectedCustomer.outstandingAmount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-sm text-amber-700">
                <span className="font-semibold">Outstanding Balance:</span> ${selectedCustomer.outstandingAmount.toFixed(2)}
              </p>
              <p className="text-xs text-amber-600 mt-1">This will be added to the current order total in the bill.</p>
            </div>
          )}

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
              <div className="p-3 bg-purple-50 rounded-lg space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Order Items Total:</span>
                  <span className="text-purple-600">${selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                {selectedCustomer && selectedCustomer.outstandingAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-amber-700">
                      <span>Previous Outstanding:</span>
                      <span>${selectedCustomer.outstandingAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-purple-200 pt-2 text-amber-700">
                      <span>Total to be Billed:</span>
                      <span>${(selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0) + selectedCustomer.outstandingAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
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
        size="lg"
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
                {isEditingBill ? (
                  <div className="space-y-2">
                    <input
                      name="customerName"
                      value={editBillData.customerName}
                      onChange={handleEditBillInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Customer name"
                    />
                    <input
                      name="customerEmail"
                      value={editBillData.customerEmail}
                      onChange={handleEditBillInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Customer email"
                    />
                    <input
                      name="customerPhone"
                      value={editBillData.customerPhone}
                      onChange={handleEditBillInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Customer phone"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                  </>
                )}
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

            {selectedOrder.billedAt && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 mb-1">Bill Date & Time</p>
                <p className="font-semibold text-blue-900">
                  {new Date(selectedOrder.billedAt).toLocaleDateString()} at {new Date(selectedOrder.billedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
              {isEditingBill ? (
                <textarea
                  name="deliveryAddress"
                  value={editBillData.deliveryAddress}
                  onChange={handleEditBillInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="text-gray-800">{selectedOrder.deliveryAddress}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Order Items</p>
              {isEditingBill && (
                <div className="mb-3">
                  <select
                    onChange={(e) => {
                      addProductToEditBill(e.target.value)
                      e.target.value = ''
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Add product to bill --</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ${product.price} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                {(isEditingBill ? editBillData.items : selectedOrder.items).map((item, index) => (
                  <div key={`${item.product || item.productName}-${index}`} className="flex justify-between items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.productName}</p>
                      {isEditingBill ? (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-gray-500">Qty</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleEditBillQuantityChange(item.product, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeEditBillItem(item.product)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800">${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {(isEditingBill || selectedOrder.notes) && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                {isEditingBill ? (
                  <textarea
                    name="notes"
                    value={editBillData.notes}
                    onChange={handleEditBillInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <p className="text-gray-800">{selectedOrder.notes}</p>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-purple-600">
                  {isEditingBill
                    ? formatCurrency(editBillData.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0))
                    : `$${selectedOrder.totalAmount.toLocaleString()}`}
                </span>
              </div>
              {selectedOrder.outstandingAmountAtTime > 0 && (
                <div className="mt-3 bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-700 mb-2">
                    <span className="font-semibold">Billing Breakdown:</span>
                  </p>
                  <div className="text-sm space-y-1 mb-2">
                    <div className="flex justify-between text-amber-700">
                      <span>Order Items:</span>
                      <span>
                        {isEditingBill
                          ? formatCurrency(editBillData.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0))
                          : `$${selectedOrder.itemTotal?.toFixed(2) || selectedOrder.totalAmount.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Previous Outstanding:</span>
                      <span>${selectedOrder.outstandingAmountAtTime.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-amber-900 border-t border-amber-200 pt-2">
                    <span>Total to be Billed:</span>
                    <span>
                      {isEditingBill
                        ? formatCurrency(
                          editBillData.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0) +
                          Number(selectedOrder.outstandingAmountAtTime || 0)
                        )
                        : `$${selectedOrder.totalBilled?.toFixed(2) || selectedOrder.totalAmount.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {!isEditingBill && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <AnimatedButton
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => setIsEditingBill(true)}
                >
                  Edit Bill
                </AnimatedButton>
              )}
              {isEditingBill && (
                <>
                  <AnimatedButton
                    variant="success"
                    className="flex-1 justify-center"
                    onClick={handleSaveBill}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Bill'}
                  </AnimatedButton>
                  <AnimatedButton
                    variant="secondary"
                    className="flex-1 justify-center"
                    onClick={() => {
                      setIsEditingBill(false)
                      setEditBillData({
                        customerName: selectedOrder.customerName || '',
                        customerEmail: selectedOrder.customerEmail || '',
                        customerPhone: selectedOrder.customerPhone || '',
                        deliveryAddress: selectedOrder.deliveryAddress || '',
                        notes: selectedOrder.notes || '',
                        items: (selectedOrder.items || []).map((item) => ({
                          product: item.product?._id || item.product,
                          productName: item.productName,
                          quantity: Number(item.quantity || 1),
                          price: Number(item.price || 0)
                        }))
                      })
                    }}
                  >
                    Cancel Edit
                  </AnimatedButton>
                </>
              )}
              <AnimatedButton
                variant="secondary"
                className="flex-1 justify-center"
                onClick={() => handlePrintBill(selectedOrder)}
              >
                Print Bill
              </AnimatedButton>
              {!isEditingBill && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <AnimatedButton 
                  variant="success" 
                  className="flex-1 justify-center"
                  onClick={() => updateOrderStatus(selectedOrder._id, 'completed')}
                  disabled={loading}
                >
                  Mark as Completed
                </AnimatedButton>
              )}
              {!isEditingBill && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
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
