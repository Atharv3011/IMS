import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Users, 
  Truck,
  ShoppingCart,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/categories', icon: FolderOpen, label: 'Categories' },
  { path: '/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/customers', icon: Users, label: 'Customers' },
]

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <motion.aside
      className="bg-gradient-to-b from-indigo-900 to-purple-900 text-white"
      initial={{ x: -300 }}
      animate={{ 
        x: 0,
        width: isExpanded ? 256 : 80
      }}
      transition={{ 
        type: "spring", 
        stiffness: 120,
        damping: 20
      }}
    >
      <div className="flex items-center justify-between p-6">
        <motion.h1 
          className="text-2xl font-bold"
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded && 'IMS'}
        </motion.h1>
        
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight size={20} />
          </motion.div>
        </motion.button>
      </div>

      <nav className="mt-8 space-y-2 px-3">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/20 shadow-lg'
                  : 'hover:bg-white/10'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex items-center gap-4 w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <item.icon size={24} />
                
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="ml-auto w-1 h-8 bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  )
}

export default Sidebar
