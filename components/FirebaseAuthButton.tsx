"use client";

import { useState } from "react";
import { useAuth } from "./FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import {
  SignIn,
  UserPlus,
  SignOut,
  User,
  Eye,
  EyeSlash,
  Shield,
} from "@phosphor-icons/react";

export default function FirebaseAuthButton() {
  const { user, isSignedIn, signIn, signUp, signOut } = useAuth();
  const router = useRouter();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isSignedIn && user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <User size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {user.displayName || user.email}
          </span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          <SignOut size={16} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="p-4">
        <div className="flex mb-8 border-b border-gray-200 dark:border-[var(--card-border)]">
          <button
            onClick={() => setIsSignIn(true)}
            className={`flex-1 py-3 px-4 font-medium transition-colors border-b-2 ${
              isSignIn
                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsSignIn(false)}
            className={`flex-1 py-3 px-4 font-medium transition-colors border-b-2 ${
              !isSignIn
                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          autoComplete="on"
          method="post"
          action="#"
          data-form-type={isSignIn ? "login" : "signup"}
        >
          {!isSignIn && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Ad Soyad
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-[var(--card-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 placeholder:font-normal text-left bg-white dark:bg-[#1C1922]"
                placeholder="Adınızı girin"
                autoComplete="name"
                required={!isSignIn}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              E-posta
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[var(--card-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-[#1C1922]"
              placeholder="E-posta adresinizi girin"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-[var(--card-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-[var(--card-background)]"
                placeholder="Şifrenizi girin"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignIn ? <SignIn size={16} /> : <UserPlus size={16} />}
                <span>{isSignIn ? "Giriş Yap" : "Kayıt Ol"}</span>
              </>
            )}
          </button>
        </form>

        {/* Privacy Policy Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[var(--card-border)]">
          <button
            onClick={() => router.push("/privacy")}
            className="w-full flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 text-sm"
          >
            <Shield size={16} weight="regular" />
            <span>Gizlilik Politikası</span>
          </button>
        </div>
      </div>
    </div>
  );
}
