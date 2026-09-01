import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Unable to process request');
      }

      toast.success(data.message || 'Reset link sent!');
      if (data.devResetLink) {
        setDevLink(data.devResetLink);
      }
    } catch (err: any) {
      toast.error(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0C0C0C 0%, #1c1c1c 100%)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-10 pb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-4" style={{ color: '#DCCA87' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-base)" }}>
                Forgot Password
              </h1>
              <p className="text-gray-500 mt-1">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-lg font-semibold text-black hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#DCCA87' }}
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>

            {devLink && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-2">Local test reset link:</p>
                <p className="text-xs text-amber-700 break-all">{devLink}</p>
                <a
                  href={devLink}
                  className="inline-block mt-2 text-xs font-semibold text-amber-800 underline"
                >
                  Open reset page →
                </a>
              </div>
            )}

            <p className="text-center text-gray-600 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="font-semibold text-black underline underline-offset-2">
                Back to Login
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">PCS Certificate Management System</p>
      </div>
    </div>
  );
};

export default ForgotPassword;