import { motion } from 'framer-motion'
import { Bell, Settings, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <motion.header 
      className="bg-white shadow-md p-4 flex items-center justify-between"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120 }}
    >
      <motion.h2 
        className="text-2xl font-bold text-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Inventory Management System
      </motion.h2>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => navigate('/notifications')}
          className="p-2 hover:bg-gray-100 rounded-full relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Notifications"
        >
          <Bell size={20} />
          <motion.span
            className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.button>

        <motion.button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 rounded-full"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          title="Settings"
        >
          <Settings size={20} />
        </motion.button>

        <div className="relative">
          <motion.button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-700">{user?.name}</span>
          </motion.button>

          {showDropdown && (
            <motion.div
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button 
                onClick={() => {
                  navigate('/profile')
                  setShowDropdown(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <User size={16} />
                Profile
              </button>
              <button 
                onClick={() => {
                  logout()
                  setShowDropdown(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
              >
                <LogOut size={16} />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}

export default Header
