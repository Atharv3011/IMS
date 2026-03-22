import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Search, Eye, Trash2, Edit2, Loader, AlertCircle } from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedModal from '../components/AnimatedModal'

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    outstandingAmount: 0,
    status: 'active'
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
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
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers')
      console.error('Fetch customers error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getOutstandingStatus = (amount) => {
    const normalizedAmount = Number(amount || 0)
    if (normalizedAmount <= 0) {
      return { color: 'bg-green-100 text-green-700', label: 'No Outstanding' }
    }

    return { color: 'bg-red-100 text-red-700', label: 'Outstanding' }
  }

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer)
    setShowDetailsModal(true)
  }

  const startEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      company: customer.company || '',
      outstandingAmount: Number(customer.outstandingAmount || 0),
      status: customer.status || 'active'
    })
    setShowEditModal(true)
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'outstandingAmount') {
      // Keep only digits and one decimal point for currency amount.
      const sanitizedValue = value.replace(/[^\d.]/g, '')
      const parts = sanitizedValue.split('.')
      const normalizedValue = parts.length > 2
        ? `${parts[0]}.${parts.slice(1).join('')}`
        : sanitizedValue

      setEditForm((prev) => ({
        ...prev,
        outstandingAmount: Number(normalizedValue || 0)
      }))
      return
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const saveCustomer = async (e) => {
    e.preventDefault()
    if (!editingCustomer) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/users/${editingCustomer._id}`,
        {
          ...editForm,
          role: 'customer'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setShowEditModal(false)
      setEditingCustomer(null)
      setError('')
      await fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  const deleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/users/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setError('')
      await fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer')
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
          <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
          <p className="mt-1 text-gray-600">Manage customer accounts and track outstanding balances</p>
        </motion.div>

        <AnimatedButton 
          onClick={fetchCustomers}
          variant="secondary"
        >
          Refresh
        </AnimatedButton>
      </div>

      {error && (
        <motion.div 
          className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={20} />
          {error}
        </motion.div>
      )}

      <AnimatedCard delay={0.2} hover={false}>
        <div className="mb-4 flex flex-col gap-3">
          <motion.div 
            className="relative flex-1"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-purple-600" size={40} />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <motion.tr 
                  className="border-b border-gray-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Outstanding Balance</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </motion.tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => {
                  const status = getOutstandingStatus(customer.outstandingAmount)
                  const normalizedAmount = Number(customer.outstandingAmount || 0)
                  return (
                    <motion.tr
                      key={customer._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800">{customer.name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-600">{customer.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-600">{customer.phone || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          normalizedAmount <= 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {formatCurrency(customer.outstandingAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <motion.span 
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase block w-fit ${status.color}`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {status.label}
                        </motion.span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() => viewCustomerDetails(customer)}
                            className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye size={18} />
                          </motion.button>
                          <motion.button
                            onClick={() => startEditCustomer(customer)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit2 size={18} />
                          </motion.button>
                          <motion.button
                            onClick={() => deleteCustomer(customer._id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </AnimatedCard>

      {/* Customer Details Modal */}
      <AnimatedModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Customer Details"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Customer Name</p>
              <p className="text-xl font-bold text-purple-600">{selectedCustomer.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-800">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-semibold text-gray-800">{selectedCustomer.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Outstanding Balance</p>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-lg text-lg font-bold ${
                  Number(selectedCustomer.outstandingAmount || 0) <= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {formatCurrency(selectedCustomer.outstandingAmount)}
                </span>
                <p className="text-gray-600">
                  {Number(selectedCustomer.outstandingAmount || 0) <= 0
                    ? 'No Outstanding'
                    : 'Outstanding'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <AnimatedButton 
                onClick={() => setShowDetailsModal(false)}
                className="w-full justify-center"
              >
                Close
              </AnimatedButton>
            </div>
          </div>
        )}
      </AnimatedModal>

      <AnimatedModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingCustomer(null)
        }}
        title="Edit Customer"
        size="md"
      >
        <form onSubmit={saveCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={editForm.name}
              onChange={handleEditInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleEditInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="text"
              name="phone"
              value={editForm.phone}
              onChange={handleEditInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              name="address"
              value={editForm.address}
              onChange={handleEditInputChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input
              type="text"
              name="company"
              value={editForm.company}
              onChange={handleEditInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outstanding Amount</label>
              <input
                type="text"
                inputMode="decimal"
                name="outstandingAmount"
                value={editForm.outstandingAmount}
                onChange={handleEditInputChange}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault()
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={editForm.status}
                onChange={handleEditInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Saving...' : 'Save Customer'}
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="secondary"
              className="flex-1 justify-center"
              onClick={() => {
                setShowEditModal(false)
                setEditingCustomer(null)
              }}
            >
              Cancel
            </AnimatedButton>
          </div>
        </form>
      </AnimatedModal>
    </motion.div>
  )
}

export default Customers
