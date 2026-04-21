/* eslint-disable @next/next/no-img-element */
// src/app/auth/layout.tsx
"use client";
import React from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
      {/* Full-screen Background */}
      <img
        src="/static/images/kiu-home.png"
        alt="KIU Background"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-10" />

      {/* Centered Card */}
      <div className="relative z-20 w-full max-w-md">
        <div className="flex flex-col justify-center rounded-none bg-white/50 p-4 shadow-2xl backdrop-blur-lg sm:rounded-2xl sm:p-6 dark:bg-gray-900/70">
          
          {/* Logo + Title */}
          <div className="mb-3 text-center">
            <div className="flex justify-center mb-2">
              <Image
                src="/static/images/kiu-logo.png"
                alt="KIU Logo"
                width={60}
                height={60}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to UEMS
            </h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              University Exam Management System
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}