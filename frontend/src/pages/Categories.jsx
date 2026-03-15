import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, Loader } from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedModal from '../components/AnimatedModal'

const Categories = () => {
  const [showModal, setShowModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCategories(response.data.data)
    } catch (err) {
      setError('Failed to fetch categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      setError('Category name is required')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim()
      }

      if (editingCategory) {
        await axios.put(`${API_URL}/categories/${editingCategory._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/categories/add`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      resetForm()
      fetchCategories()
      setError('')
    } catch (err) {
      console.error('Category error:', err.response?.data || err.message)
      setError(err.response?.data?.message || 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchCategories()
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setShowModal(false)
  }

  const colorVariants = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-red-500 to-orange-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-cyan-500',
  ]

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
          Categories
        </motion.h1>

        <AnimatedButton 
          onClick={() => setShowModal(true)}
          icon={Plus}
        >
          Add Category
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

      {loading && categories.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin text-purple-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No categories found
            </div>
          ) : (
            categories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <AnimatedCard hover={true}>
                  <motion.div
                    className="relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div 
                      className={`h-32 bg-gradient-to-br ${colorVariants[index % colorVariants.length]} rounded-lg flex items-center justify-center mb-4 relative overflow-hidden`}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-white opacity-0"
                        whileHover={{ opacity: 0.1 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <FolderOpen className="text-white" size={64} />
                      </motion.div>
                    </motion.div>

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {category.name}
                        </h3>
                        <motion.p 
                          className="text-gray-600 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                        >
                          {category.description || 'No description'}
                        </motion.p>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleEdit(category)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(category._id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          whileHover={{ scale: 1.2, rotate: -10 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>

                    <motion.div 
                      className="w-full bg-gray-200 rounded-full h-2 mt-4"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    >
                      <motion.div
                        className={`bg-gradient-to-r ${colorVariants[index % colorVariants.length]} h-2 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                      />
                    </motion.div>
                  </motion.div>
                </AnimatedCard>
              </motion.div>
            ))
          )}
        </div>
      )}

      <AnimatedModal
        isOpen={showModal}
        onClose={resetForm}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="3"
              placeholder="Enter category description"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
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

export default Categories
