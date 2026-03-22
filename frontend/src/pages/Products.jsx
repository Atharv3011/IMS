import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Package, Loader, Archive, RotateCcw } from 'lucide-react'
import axios, { API_URL, BACKEND_ORIGIN } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedModal from '../components/AnimatedModal'

const Products = () => {
  const resolveImageUrl = (value) => {
    if (!value) return ''
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    const normalizedPath = value.startsWith('/') ? value : `/${value}`
    return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${normalizedPath}` : normalizedPath
  }

  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplier: '',
    price: '',
    stock: '',
    description: ''
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchSuppliers()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/products?includeArchived=true`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data.data)
    } catch (err) {
      setError('Failed to fetch products')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCategories(response.data.data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuppliers(response.data.data)
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    setSelectedImage(file || null)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category || !formData.supplier || !formData.price) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const dataToSend = new FormData()
      dataToSend.append('name', formData.name)
      dataToSend.append('category', formData.category)
      dataToSend.append('supplier', formData.supplier)
      dataToSend.append('price', parseFloat(formData.price))
      dataToSend.append('stock', parseInt(formData.stock) || 0)
      dataToSend.append('description', formData.description || '')
      if (selectedImage) {
        dataToSend.append('image', selectedImage)
      }

      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/products/add`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setShowModal(false)
      setEditingProduct(null)
      setSelectedImage(null)
      setImagePreview('')
      setFormData({ name: '', category: '', supplier: '', price: '', stock: '', description: '' })
      fetchProducts()
      setError('')
    } catch (err) {
      console.error('Product error:', err.response?.data || err.message)
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category._id,
      supplier: product.supplier._id,
      price: product.price,
      stock: product.stock,
      description: product.description || ''
    })
    setSelectedImage(null)
    setImagePreview(resolveImageUrl(product.imageUrl || ''))
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchProducts()
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveToggle = async (product) => {
    const isArchived = product.status === 'archived'
    const actionText = isArchived ? 'unarchive' : 'archive'
    if (!window.confirm(`Are you sure you want to ${actionText} this product?`)) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const endpoint = isArchived ? 'unarchive' : 'archive'
      await axios.patch(`${API_URL}/products/${product._id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchProducts()
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${actionText} product`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setSelectedImage(null)
    setImagePreview('')
    setFormData({ name: '', category: '', supplier: '', price: '', stock: '', description: '' })
    setShowModal(false)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const visibleProducts = filteredProducts.filter((product) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return product.status === 'active'
    if (statusFilter === 'archived') return product.status === 'archived'
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <motion.h1 
          className="text-3xl font-bold text-gray-800"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Products
        </motion.h1>

        <AnimatedButton 
          onClick={() => setShowModal(true)}
          icon={Plus}
        >
          Add Product
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
        <div className="mb-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === 'archived'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Archived
            </button>
          </div>

          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </motion.div>
        </div>

        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-purple-600" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <motion.tr 
                  className="border-b border-gray-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </motion.tr>
              </thead>
              <tbody>
                {visibleProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  visibleProducts.map((product, index) => (
                    <motion.tr
                      key={product._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={resolveImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <motion.div 
                              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                            >
                              <Package className="text-white" size={20} />
                            </motion.div>
                          )}
                          <span className="font-medium text-gray-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{product.category?.name || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          product.status === 'archived'
                            ? 'bg-gray-200 text-gray-700'
                            : product.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <motion.span 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            product.stock > 100 
                              ? 'bg-green-100 text-green-700' 
                              : product.stock > 50 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                          whileHover={{ scale: 1.1 }}
                        >
                          {product.stock}
                        </motion.span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-800">${product.price}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => handleEdit(product)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit2 size={18} />
                          </motion.button>
                          <motion.button
                            onClick={() => handleArchiveToggle(product)}
                            className={`p-2 rounded-lg ${
                              product.status === 'archived'
                                ? 'hover:bg-emerald-50 text-emerald-600'
                                : 'hover:bg-amber-50 text-amber-600'
                            }`}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            title={product.status === 'archived' ? 'Unarchive Product' : 'Archive Product'}
                          >
                            {product.status === 'archived' ? <RotateCcw size={18} /> : <Archive size={18} />}
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </AnimatedCard>

      <AnimatedModal
        isOpen={showModal}
        onClose={resetForm}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Product preview"
                className="mt-3 w-28 h-28 object-cover rounded-lg border border-gray-200"
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <select 
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(sup => (
                <option key={sup._id} value={sup._id}>{sup.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Product description"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
            </AnimatedButton>
            <AnimatedButton 
              type="button"
              variant="secondary" 
              onClick={resetForm}
              className="flex-1 justify-center"
            >
              Cancel
            </AnimatedButton>
          </div>
        </form>
      </AnimatedModal>
    </motion.div>
  )
}

export default Products
