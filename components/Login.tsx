
import React from 'react';
import { ButterflyIcon } from './Icons';

const Login: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-butterfly-50 via-white to-purple-50 min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md text-center border border-white relative overflow-hidden">
        
        {/* Decorative Butterfly Elements */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-butterfly-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-butterfly-500 to-butterfly-700 rounded-2xl shadow-lg mb-6 text-white transform hover:scale-105 transition duration-300">
                <ButterflyIcon className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500 mb-8">Sign in to manage your beautiful budget.</p>

            <a href="/login/google" className="group relative flex items-center justify-center gap-3 w-full bg-white border border-gray-200 hover:border-butterfly-500 text-gray-700 font-bold py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                {/* Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Sign in with Google</span>
                <div className="absolute inset-0 rounded-xl border-2 border-butterfly-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </a>

            <div className="mt-8 text-xs text-gray-400">
                Secure access powered by Google OAuth 2.0
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
