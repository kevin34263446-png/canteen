"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            找回密码
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            请联系管理员重置密码
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          返回登录
        </Link>
      </div>
    </main>
  );
}
