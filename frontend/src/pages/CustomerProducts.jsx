import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Home,
  Search,
  ShoppingCart,
  AlertCircle,
  Loader,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Package
} from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedCard from '../components/AnimatedCard'
import { useAuth } from '../context/AuthContext'

const CustomerProducts = () => {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    // Pre-fill phone from user profile if available
    if (user?.phone) {
      setPhone(user.phone)
    }
    fetchProducts()
  }, [user])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch products')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id)
    if (existingItem) {
      updateQuantity(product._id, existingItem.quantity + 1)
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      const product = products.find(p => p._id === productId)
      if (quantity > product.stock) {
        setError(`Cannot exceed available stock (${product.stock})`)
        return
      }
      setCart(cart.map(item =>
        item._id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const totalCartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    
    // Clear previous error
    setError('')
    
    if (cart.length === 0) {
      setError('Please add items to cart')
      return
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter delivery address')
      return
    }

    if (!phone.trim()) {
      setError('Please enter phone number')
      return
    }

    // Validate form data
    if (!user?.name || !user?.email) {
      setError('Customer information is incomplete. Please update your profile.')
      return
    }

    setOrderLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Prepare order items with validation
      const orderItems = cart.map(item => {
        if (!item._id) {
          throw new Error('Invalid product in cart')
        }
        return {
          product: item._id,
          quantity: parseInt(item.quantity) || 1
        }
      })

      const orderData = {
        customerName: user.name.trim(),
        customerEmail: user.email.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        items: orderItems,
        notes: notes.trim()
      }

      console.log('Sending order data:', JSON.stringify(orderData, null, 2))

      const response = await axios.post(`${API_URL}/orders/add`, orderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Order response:', response.data)

      if (response.data.success) {
        setCart([])
        setDeliveryAddress('')
        setPhone('')
        setNotes('')
        setShowCart(false)
        setError('')
        alert('Order placed successfully!')
        navigate('/customer-orders')
      } else {
        setError(response.data.message || 'Failed to place order')
      }
    } catch (err) {
      console.error('Full error object:', err)
      console.error('Error response data:', err.response?.data)
      console.error('Error status:', err.response?.status)
      console.error('Error message:', err.message)
      
      let errorMessage = 'Failed to place order'
      
      // Try to extract meaningful error message
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(`Error Creating Order: ${errorMessage}`)
    } finally {
      setOrderLoading(false)
    }
  }

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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Browse Products</h1>
              <p className="text-gray-600 text-sm">Choose products, manage cart, and place orders quickly</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => navigate('/customer-dashboard')}
                className="hidden sm:inline-flex min-h-11 items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home size={18} />
                Dashboard
              </motion.button>

              <motion.button
                onClick={() => setShowCart(!showCart)}
                className="relative inline-flex min-h-11 items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart size={20} />
                Cart ({totalCartQuantity})
                {totalCartQuantity > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {totalCartQuantity}
                  </span>
                )}
              </motion.button>
            </div>
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
              <p className="text-cyan-100 text-sm uppercase tracking-wider">Shop Assistant</p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">Find products and order in minutes</h2>
              <p className="text-cyan-100 mt-1">Use search, add quantities, and place one consolidated order.</p>
            </div>
            <motion.button
              onClick={() => navigate('/customer-orders')}
              className="group inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/15 px-4 py-2 font-semibold backdrop-blur-sm hover:bg-white/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View My Orders
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} />
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
            <p className="text-xs text-gray-600 uppercase">Products</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{products.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
            <p className="text-xs text-gray-600 uppercase">In Cart</p>
            <p className="text-2xl font-bold text-violet-700 mt-1">{totalCartQuantity}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
            <p className="text-xs text-gray-600 uppercase">Categories</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{new Set(products.map((p) => p.category?.name).filter(Boolean)).size}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
            <p className="text-xs text-gray-600 uppercase">Cart Total</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">${calculateTotal().toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Products List */}
          <div className="lg:col-span-3">
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by product name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </motion.div>

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

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin text-cyan-600" size={40} />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <p className="text-gray-600 text-lg">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProducts.map((product, index) => (
                  <AnimatedCard key={product._id} index={index}>
                    <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Category: <span className="font-medium">{product.category?.name || 'N/A'}</span></p>
                          <p className="text-sm text-gray-600">Supplier: <span className="font-medium">{product.supplier?.name || 'N/A'}</span></p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-2xl font-bold text-cyan-700">${product.price?.toFixed(2) || '0.00'}</p>
                            <p className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Stock: {product.stock}
                            </p>
                          </div>
                        </div>
                        <AnimatedButton
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                          className={`w-full min-h-11 py-2 rounded-lg font-semibold transition-all ${
                            product.stock === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-cyan-600 text-white hover:bg-cyan-700'
                          }`}
                        >
                          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </AnimatedButton>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          {showCart && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 p-4 lg:col-span-1 lg:static lg:z-auto lg:bg-transparent lg:p-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ml-auto h-full w-full max-w-md overflow-y-auto bg-white rounded-xl shadow-lg p-5 sm:p-6 lg:sticky lg:top-24 lg:h-auto lg:max-w-none">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Shopping Cart</h2>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      <Package size={14} />
                      {totalCartQuantity} item(s)
                    </div>
                    <button
                      onClick={() => setShowCart(false)}
                      className="inline-flex min-h-10 items-center rounded-lg bg-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">Your cart is empty</p>
                ) : (
                  <div>
                    <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <motion.div
                          key={item._id}
                          className="bg-gray-50 p-3 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-cyan-700 font-semibold text-sm mb-2">${item.price?.toFixed(2)}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="inline-flex min-h-9 min-w-9 items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="flex-grow text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="inline-flex min-h-9 min-w-9 items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="text-gray-600 text-xs mt-2">Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Delivery Address */}
                    <div className="mb-4 border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter delivery address"
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Order Notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any special instructions"
                        rows="2"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-cyan-700">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Order Button */}
                    <AnimatedButton
                      onClick={handlePlaceOrder}
                      disabled={orderLoading || cart.length === 0 || !deliveryAddress.trim()}
                      className="w-full min-h-11 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {orderLoading ? 'Placing Order...' : 'Place Order'}
                    </AnimatedButton>

                    <button
                      onClick={() => setShowCart(false)}
                      className="w-full min-h-11 mt-2 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                    >
                      Hide Cart
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerProducts
