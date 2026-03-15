import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const StatsCard = ({ icon: Icon, title, value, color, delay = 0 }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const colorVariants = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-teal-500',
    orange: 'from-orange-500 to-red-500',
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6 overflow-hidden relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay, 
        type: "spring", 
        stiffness: 100 
      }}
      whileHover={{ 
        y: -8,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <motion.div 
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorVariants[color]} opacity-10 rounded-full -mr-16 -mt-16`}
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className={`p-3 rounded-lg bg-gradient-to-br ${colorVariants[color]}`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="text-white" size={28} />
          </motion.div>
        </div>
        
        <motion.h3 
          className="text-3xl font-bold text-gray-800 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2 }}
        >
          {count}
        </motion.h3>
        
        <motion.p 
          className="text-gray-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
        >
          {title}
        </motion.p>
      </div>
    </motion.div>
  )
}

export default StatsCard
