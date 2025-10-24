import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/ClientAuthContext'; // This will need to be updated after ClientAuthContext is potentially moved
import { toast } from 'sonner';

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const { register } = useAuth();

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Password strength validation
  const validatePassword = (password: string): { isValid: boolean; strength: 'weak' | 'medium' | 'strong' } => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = 
      hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar ? 'strong' :
      hasMinLength && hasUpperCase && hasLowerCase && hasNumber ? 'medium' : 'weak';

    const isValid = strength !== 'weak';

    return { isValid, strength };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword) {
      const { strength } = validatePassword(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    
    // Validate all fields
    if (!email || !name || !password) {
      setRegisterError('Please fill in all required fields.');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setRegisterError('Please enter a valid email address.');
      return;
    }

    // Validate password strength
    const { isValid } = validatePassword(password);
    if (!isValid) {
      setRegisterError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(email, password, name);
      toast.success('Registration successful! Please check your email for confirmation. Your account is pending admin approval.');
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed.';
      setRegisterError(errorMessage);
      toast.error(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'weak': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <CardContent className="space-y-4 pt-4">
        {registerError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{registerError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-register">Email</Label>
          <Input
            id="email-register"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-register">Password</Label>
          <div className="relative">
            <Input
              id="password-register"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              required
              className="w-full pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '66%' : '33%' }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-500">
                {passwordStrength === 'strong' ? 'Strong password' :
                 passwordStrength === 'medium' ? 'Medium strength' :
                 'Weak password'}
              </p>
            </div>
          )}
        </div>

        <Alert className='mt-4'>
          <AlertCircle />
          <AlertDescription>
            Registration requires admin approval before access is granted.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Request Access'}
        </Button>
      </CardFooter>
    </form>
  );
};

export default RegisterForm; 