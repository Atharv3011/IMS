import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Truck, Phone, Mail, MapPin, Loader } from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedModal from '../components/AnimatedModal'

const Suppliers = () => {
  const [showModal, setShowModal] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    location: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuppliers(response.data.data)
    } catch (err) {
      setError('Failed to fetch suppliers')
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
    
    if (!formData.name || !formData.contact || !formData.phone || !formData.email) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const dataToSend = {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        location: formData.location.trim()
      }

      if (editingSupplier) {
        await axios.put(`${API_URL}/suppliers/${editingSupplier._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/suppliers/add`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      resetForm()
      fetchSuppliers()
      setError('')
    } catch (err) {
      console.error('Supplier error:', err.response?.data || err.message)
      setError(err.response?.data?.message || 'Failed to save supplier')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      location: supplier.location || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchSuppliers()
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete supplier')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingSupplier(null)
    setFormData({ name: '', contact: '', phone: '', email: '', address: '', location: '' })
    setShowModal(false)
  }

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
          Suppliers
        </motion.h1>

        <AnimatedButton 
          onClick={() => setShowModal(true)}
          icon={Plus}
        >
          Add Supplier
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

      {loading && suppliers.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin text-purple-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {suppliers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No suppliers found
            </div>
          ) : (
            suppliers.map((supplier, index) => (
              <motion.div
                key={supplier._id}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <AnimatedCard hover={true}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Truck className="text-white" size={32} />
                      </motion.div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {supplier.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Contact: {supplier.contactPerson}
                        </p>
                        <motion.span 
                          className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          whileHover={{ scale: 1.1 }}
                        >
                          Supplier ID: {supplier._id?.slice(-6)}
                        </motion.span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit2 size={18} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(supplier._id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </div>

                  <motion.div 
                    className="space-y-3 pt-4 border-t border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.15 }}
                  >
                    <motion.div 
                      className="flex items-center gap-3 text-gray-600"
                      whileHover={{ x: 5 }}
                    >
                      <Phone size={18} className="text-green-600" />
                      <span>{supplier.phone}</span>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-3 text-gray-600"
                      whileHover={{ x: 5 }}
                    >
                      <Mail size={18} className="text-blue-600" />
                      <span>{supplier.email}</span>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-3 text-gray-600"
                      whileHover={{ x: 5 }}
                    >
                      <MapPin size={18} className="text-red-600" />
                      <span>{supplier.location}</span>
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
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Person
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter contact name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+1 234 567 8900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (City, Country)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., New York, USA"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Saving...' : (editingSupplier ? 'Update Supplier' : 'Add Supplier')}
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

export default Suppliers
