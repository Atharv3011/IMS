import { motion } from 'framer-motion'

const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600',
    success: 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600',
  }

  return (
    <motion.button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-semibold shadow-md flex items-center gap-2 ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  )
}

export default AnimatedButton
