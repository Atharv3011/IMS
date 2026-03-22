import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, User, Shield, UserCircle, Loader } from 'lucide-react'
import axios, { API_URL } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedModal from '../components/AnimatedModal'

const Users = () => {
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const filteredUsers = (response.data.data || []).filter(
        (user) => user.role === 'admin' || user.role === 'manager'
      )
      setUsers(filteredUsers)
    } catch (err) {
      setError('Failed to fetch users')
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
    
    if (!formData.name || !formData.email) {
      setError('Name and email are required')
      return
    }

    if (!editingUser && !formData.password) {
      setError('Password is required for new users')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const dataToSend = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role
      }
      
      if (editingUser && formData.password) {
        dataToSend.password = formData.password
      } else if (!editingUser) {
        dataToSend.password = formData.password
      }

      if (editingUser) {
        await axios.put(`${API_URL}/users/${editingUser._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/users/add`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      resetForm()
      fetchUsers()
      setError('')
    } catch (err) {
      console.error('User error:', err.response?.data || err.message)
      setError(err.response?.data?.message || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'manager' })
    setShowModal(false)
  }

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'from-purple-500 to-indigo-600'
      case 'manager': return 'from-blue-500 to-cyan-600'
      case 'staff': return 'from-green-500 to-teal-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return Shield
      case 'manager': return UserCircle
      default: return User
    }
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
          Users
        </motion.h1>

        <AnimatedButton 
          onClick={() => setShowModal(true)}
          icon={Plus}
        >
          Add User
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

      {loading && users.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin text-purple-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            users.map((user, index) => {
              const RoleIcon = getRoleIcon(user.role)
              
              return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 120
                  }}
                >
                  <AnimatedCard hover={true}>
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className={`w-16 h-16 bg-gradient-to-br ${getRoleColor(user.role)} rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden`}
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 2, opacity: 0.2 }}
                          transition={{ duration: 0.4 }}
                        />
                        <RoleIcon className="text-white relative z-10" size={32} />
                      </motion.div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                              {user.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {user.email}
                            </p>
                            <div className="flex gap-2">
                              <motion.span 
                                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : user.role === 'manager'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                                whileHover={{ scale: 1.1 }}
                              >
                                {user.role}
                              </motion.span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => handleEdit(user)}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                              whileHover={{ scale: 1.2, rotate: 15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit2 size={18} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(user._id)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                              whileHover={{ scale: 1.2, rotate: -15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.div 
                      className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm text-gray-600"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <span>User ID: {user._id?.slice(-6)}</span>
                    </motion.div>
                  </AnimatedCard>
                </motion.div>
              )
            })
          )}
        </div>
      )}

      <AnimatedModal
        isOpen={showModal}
        onClose={resetForm}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter full name"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {editingUser && '(Leave blank to keep current)'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editingUser}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select 
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
              {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
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

export default Users
