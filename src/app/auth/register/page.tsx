// src/app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Redirect to dashboard after successful registration and auto-login
        router.push('/');
      } else {
        setErrors({ general: data.error || 'Registration failed' });
      }
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Sign up to get started</p>
      </div>

      {errors.general && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <Card className="border-white/30 bg-white/60 backdrop-blur-md dark:border-gray-600/30 dark:bg-gray-800/60">
        <CardContent className="space-y-5 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="first_name" 
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  First Name
                </label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="Isaac"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-900 dark:text-white dark:border-gray-600"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="last_name" 
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Last Name
                </label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Newton"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-900 dark:text-white dark:border-gray-600"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@kiu.ac.ug"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-white dark:bg-gray-900 dark:text-white dark:border-gray-600"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-white pr-10 dark:bg-gray-900 dark:text-white dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-white pr-10 dark:bg-gray-900 dark:text-white dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Sign in here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}