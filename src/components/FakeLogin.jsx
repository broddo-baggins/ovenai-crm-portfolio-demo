import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * FakeLogin Component
 * 
 * Demo login page that always succeeds regardless of credentials
 * Pre-fills demo credentials for convenience
 * Shows banner indicating demo mode
 */
const FakeLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Always succeed - this is a demo
    localStorage.setItem('crm_demo_authenticated', 'true');
    localStorage.setItem('crm_demo_user', JSON.stringify({
      name: 'Demo Agent',
      email: email,
      role: 'Sales Agent'
    }));

    setIsLoading(false);
    
    // Call success callback
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-medium z-50 shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>
            <strong>DEMO MODE:</strong> Using sample data • Any credentials will work
          </span>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8 mt-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">HOT</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CRM Demo CRM
          </h1>
          <p className="text-gray-600">
            AI-Powered Lead Management Demo
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Demo Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>IDEA Demo Login:</strong> Pre-filled credentials or enter anything - all logins succeed in demo mode!
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="demo@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Demo Mode: Password reset is disabled. Any credentials will work!');
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3 px-4 rounded-xl font-semibold text-white
                transition-all duration-200 shadow-lg hover:shadow-xl
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In to Demo'
              )}
            </button>

            {/* Alternative Actions */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Demo Mode: Registration is disabled. Use pre-filled credentials or any email/password!');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-600">
            DATA This demo showcases real production features
          </p>
          <p className="text-xs text-gray-500">
            Original system achieved 70% response rate • 2.5× more meetings
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-4">
            <a href="/demo-notes" className="hover:text-gray-600 transition-colors">
              Demo Notes
            </a>
            <span>•</span>
            <a href="https://github.com/yourusername" className="hover:text-gray-600 transition-colors">
              GitHub
            </a>
            <span>•</span>
            <a href="https://yourportfolio.com" className="hover:text-gray-600 transition-colors">
              Portfolio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FakeLogin;

// Usage in your App routing:
// 
// import FakeLogin from './components/FakeLogin';
//
// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//
//   useEffect(() => {
//     const auth = localStorage.getItem('crm_demo_authenticated');
//     setIsAuthenticated(auth === 'true');
//   }, []);
//
//   if (!isAuthenticated) {
//     return <FakeLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
//   }
//
//   return <YourMainApp />;
// }

