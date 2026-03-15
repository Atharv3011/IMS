import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Lock, Edit2, Save, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios, { API_URL } from '../utils/api'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'

const Profile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    })
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({ ...passwordData, [name]: value })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      
      // Only send name, phone, and address (not email)
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      }
      
      await axios.put(`${API_URL}/users/${user._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      
      await axios.post(`${API_URL}/auth/change-password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setSuccess('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
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
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </motion.div>
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

      {success && (
        <motion.div 
          className="bg-green-50 text-green-600 p-4 rounded-lg mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <AnimatedCard delay={0.2} className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-600 mt-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold mt-3">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </p>
            <p className="text-gray-600 mt-4">{user?.email}</p>
            <p className="text-gray-500 text-sm mt-2">Member since {new Date(user?.createdAt).getFullYear()}</p>
          </div>
        </AnimatedCard>

        {/* Profile Details */}
        <AnimatedCard delay={0.3} className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Account Information</h3>
            <motion.button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isEditing ? <X size={18} /> : <Edit2 size={18} />}
              {isEditing ? 'Cancel' : 'Edit'}
            </motion.button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter address"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </AnimatedButton>
                <AnimatedButton 
                  type="button"
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </AnimatedButton>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="text-gray-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">Name</p>
                  <p className="font-semibold text-gray-800">{formData.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="text-gray-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{formData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="text-gray-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800">{formData.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="text-gray-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">Address</p>
                  <p className="font-semibold text-gray-800">{formData.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </AnimatedCard>

        {/* Security Section */}
        <AnimatedCard delay={0.4} className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Lock size={24} />
              Security
            </h3>
          </div>

          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <AnimatedButton type="submit" className="flex-1 justify-center" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </AnimatedButton>
                <AnimatedButton 
                  type="button"
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => setShowPasswordForm(false)}
                >
                  Cancel
                </AnimatedButton>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Secure your account with a strong password</p>
              <AnimatedButton 
                onClick={() => setShowPasswordForm(true)}
                variant="danger"
              >
                Change Password
              </AnimatedButton>
            </div>
          )}
        </AnimatedCard>
      </div>
    </motion.div>
  )
}

export default Profile
