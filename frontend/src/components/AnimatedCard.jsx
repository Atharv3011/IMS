import { motion } from 'framer-motion'

const AnimatedCard = ({ 
  children, 
  delay = 0, 
  hover = true,
  className = '' 
}) => {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        type: "spring", 
        stiffness: 100 
      }}
      whileHover={hover ? { 
        y: -5, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      } : {}}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard
