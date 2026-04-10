// src/app/users/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface College {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  college_id: number;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'lecturer' as 'lecturer' | 'hod' | 'dean' | 'exam_master' | 'admin',
    department_id: '',
    college_id: '',
    phone: '',
    is_active: true,
    change_password: false,
    new_password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUser();
    fetchColleges();
    fetchDepartments();
  }, [userId]);

  useEffect(() => {
    if (formData.college_id) {
      const filtered = departments.filter(
        (dept) => dept.college_id.toString() === formData.college_id
      );
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments(departments);
    }
  }, [formData.college_id, departments]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const user = data.data || data.user;
        setFormData({
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role || 'lecturer',
          department_id: user.department_id?.toString() || '',
          college_id: user.college_id?.toString() || '',
          phone: user.phone || '',
          is_active: user.is_active ?? true,
          change_password: false,
          new_password: '',
          confirm_password: '',
        });
      } else if (response.status === 404) {
        alert('User not found');
        router.push('/users');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    if (formData.change_password) {
      if (!formData.new_password) {
        newErrors.new_password = 'New password is required';
      } else if (formData.new_password.length < 8) {
        newErrors.new_password = 'Password must be at least 8 characters';
      }

      if (formData.new_password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    if (['hod', 'lecturer'].includes(formData.role) && !formData.department_id) {
      newErrors.department_id = 'Department is required for this role';
    }

    if (['dean'].includes(formData.role) && !formData.college_id) {
      newErrors.college_id = 'College is required for this role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        college_id: formData.college_id ? parseInt(formData.college_id) : null,
        phone: formData.phone || null,
        is_active: formData.is_active,
      };

      if (formData.change_password && formData.new_password) {
        payload.password = formData.new_password;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert('User updated successfully!');
        router.push(`/users/${userId}`);
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ✏️ Edit User
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update user information
          </p>
        </div>
        <Link
          href={`/users/${userId}`}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
        >
          ← Back
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              name="change_password"
              checked={formData.change_password}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Change Password
            </label>
          </div>

          {formData.change_password && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${
                    errors.new_password ? 'border-red-500' : 'border-gray-300'
                  } px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                />
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.new_password}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${
                    errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  } px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.confirm_password}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role & Organization */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Role & Organization
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="lecturer">Lecturer</option>
                <option value="hod">HOD</option>
                <option value="dean">Dean</option>
                <option value="exam_master">Exam Master</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                College
              </label>
              <select
                name="college_id"
                value={formData.college_id}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.college_id ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
              >
                <option value="">Select College</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
              </select>
              {errors.college_id && (
                <p className="mt-1 text-sm text-red-500">{errors.college_id}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.department_id ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
              >
                <option value="">Select Department</option>
                {filteredDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.department_id}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Account is Active
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/users/${userId}`}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
}