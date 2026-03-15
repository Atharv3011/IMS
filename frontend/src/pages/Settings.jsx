import { motion } from 'framer-motion'
import { useState } from 'react'
import { Settings, Moon, Sun, Bell, Lock, Database, Globe, Smartphone, Mail, Save, RotateCcw } from 'lucide-react'
import AnimatedCard from '../components/AnimatedCard'
import AnimatedButton from '../components/AnimatedButton'

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'light',
    notifications: {
      email: true,
      push: true,
      orderUpdates: true,
      lowStockAlerts: true,
      weeklyReport: true
    },
    privacy: {
      showProfile: true,
      allowAnalytics: true,
      twoFactorAuth: false
    },
    system: {
      autoBackup: true,
      dataRetention: 30,
      maxUploadSize: 10
    }
  })

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleThemeChange = (theme) => {
    setSettings({
      ...settings,
      theme
    })
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleNotificationChange = (key) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    })
  }

  const handlePrivacyChange = (key) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key]
      }
    })
  }

  const handleSystemChange = (key, value) => {
    setSettings({
      ...settings,
      system: {
        ...settings.system,
        [key]: value
      }
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      localStorage.setItem('app-settings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSettings({
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        orderUpdates: true,
        lowStockAlerts: true,
        weeklyReport: true
      },
      privacy: {
        showProfile: true,
        allowAnalytics: true,
        twoFactorAuth: false
      },
      system: {
        autoBackup: true,
        dataRetention: 30,
        maxUploadSize: 10
      }
    })
  }

  const SettingToggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <motion.button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-purple-600' : 'bg-gray-300'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    </div>
  )

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
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Settings size={32} />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Customize your application preferences</p>
        </motion.div>
      </div>

      {saved && (
        <motion.div 
          className="bg-green-50 text-green-600 p-4 rounded-lg mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Settings saved successfully!
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Theme Settings */}
        <AnimatedCard delay={0.2}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Globe size={24} />
            Appearance
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-medium">Theme</p>
            <div className="flex gap-4">
              <motion.button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === 'light'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sun className="mx-auto mb-2 text-yellow-500" size={24} />
                <p className="font-medium text-gray-800">Light</p>
              </motion.button>

              <motion.button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === 'dark'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Moon className="mx-auto mb-2 text-indigo-600" size={24} />
                <p className="font-medium text-gray-800">Dark</p>
              </motion.button>
            </div>
          </div>
        </AnimatedCard>

        {/* Notification Settings */}
        <AnimatedCard delay={0.3}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bell size={24} />
            Notifications
          </h2>

          <div className="space-y-3">
            <SettingToggle
              label="Email Notifications"
              description="Receive important updates via email"
              checked={settings.notifications.email}
              onChange={() => handleNotificationChange('email')}
            />
            <SettingToggle
              label="Push Notifications"
              description="Get real-time alerts in your browser"
              checked={settings.notifications.push}
              onChange={() => handleNotificationChange('push')}
            />
            <SettingToggle
              label="Order Updates"
              description="Be notified about order status changes"
              checked={settings.notifications.orderUpdates}
              onChange={() => handleNotificationChange('orderUpdates')}
            />
            <SettingToggle
              label="Low Stock Alerts"
              description="Alert when product stock is below threshold"
              checked={settings.notifications.lowStockAlerts}
              onChange={() => handleNotificationChange('lowStockAlerts')}
            />
            <SettingToggle
              label="Weekly Report"
              description="Receive inventory summary every week"
              checked={settings.notifications.weeklyReport}
              onChange={() => handleNotificationChange('weeklyReport')}
            />
          </div>
        </AnimatedCard>

        {/* Privacy Settings */}
        <AnimatedCard delay={0.4}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Lock size={24} />
            Privacy & Security
          </h2>

          <div className="space-y-3">
            <SettingToggle
              label="Show Profile to Others"
              description="Allow other users to view your profile"
              checked={settings.privacy.showProfile}
              onChange={() => handlePrivacyChange('showProfile')}
            />
            <SettingToggle
              label="Analytics & Improvements"
              description="Help us improve by sharing usage analytics"
              checked={settings.privacy.allowAnalytics}
              onChange={() => handlePrivacyChange('allowAnalytics')}
            />
            <SettingToggle
              label="Two-Factor Authentication"
              description="Add extra security layer to your account"
              checked={settings.privacy.twoFactorAuth}
              onChange={() => handlePrivacyChange('twoFactorAuth')}
            />
          </div>
        </AnimatedCard>

        {/* System Settings */}
        <AnimatedCard delay={0.5}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Database size={24} />
            System
          </h2>

          <div className="space-y-4">
            <SettingToggle
              label="Auto Backup"
              description="Automatically backup data daily"
              checked={settings.system.autoBackup}
              onChange={() => handleSystemChange('autoBackup', !settings.system.autoBackup)}
            />

            <div className="p-4 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-800 mb-2">Data Retention (days)</label>
              <input
                type="number"
                value={settings.system.dataRetention}
                onChange={(e) => handleSystemChange('dataRetention', parseInt(e.target.value))}
                min="7"
                max="365"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-600 mt-2">Keep deleted records for this many days</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-800 mb-2">Max Upload Size (MB)</label>
              <input
                type="number"
                value={settings.system.maxUploadSize}
                onChange={(e) => handleSystemChange('maxUploadSize', parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-600 mt-2">Maximum file size allowed for uploads</p>
            </div>
          </div>
        </AnimatedCard>

        {/* Action Buttons */}
        <AnimatedCard delay={0.6}>
          <div className="flex gap-4 flex-wrap">
            <AnimatedButton 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 justify-center min-w-48"
            >
              {loading ? 'Saving...' : <><Save size={18} /> Save Settings</>}
            </AnimatedButton>
            <AnimatedButton 
              onClick={handleReset}
              variant="secondary"
              className="flex-1 justify-center min-w-48"
            >
              <RotateCcw size={18} /> Reset to Default
            </AnimatedButton>
          </div>
        </AnimatedCard>
      </div>
    </motion.div>
  )
}

export default SettingsPage
