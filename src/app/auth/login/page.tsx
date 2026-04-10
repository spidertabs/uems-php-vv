// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // ✅ Instead of throwing an error, handle invalid credentials gracefully
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      // Redirect to dashboard/root on successful login
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Access your account</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-white/30 bg-white/60 backdrop-blur-md dark:border-gray-600/30 dark:bg-gray-800/60">
        <CardContent className="space-y-5 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="lecturer@kiu.ac.ug"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="bg-white dark:bg-gray-900 dark:text-white dark:border-gray-600"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="bg-white pr-10 dark:bg-gray-900 dark:text-white dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  disabled={loading}
                />
                <span className="text-gray-700 dark:text-gray-300">Remember me</span>
              </label>
              <Link href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline dark:text-blue-400">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
