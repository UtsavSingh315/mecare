'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Mail, 
  ArrowLeft,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setEmailSent(true);
      toast.success('Reset email sent! 📧', {
        description: 'Check your inbox for password reset instructions.',
      });
      setIsLoading(false);
    }, 1500);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/auth/login')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" />
            <span className="text-xl font-bold text-gray-800">MeCare</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {/* Success Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Email Sent!</h1>
                <p className="text-green-100">
                  We've sent password reset instructions to your email
                </p>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">What's next?</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <p>Check your email inbox for a message from MeCare</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <p>Click the reset link in the email</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <p>Create a new password and sign in</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setEmailSent(false)}
                      className="text-rose-600 hover:text-rose-700 font-medium"
                    >
                      try again
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-rose-600 hover:text-rose-700 font-medium"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500" />
          <span className="text-xl font-bold text-gray-800">MeCare</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          {/* Header Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            <CardContent className="p-6 text-center">
              <Mail className="w-12 h-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
              <p className="text-rose-100">
                Enter your email to receive reset instructions
              </p>
            </CardContent>
          </Card>

          {/* Reset Form */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-gray-800">Forgot Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-rose-300 focus:ring-rose-200"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    We'll send password reset instructions to this email
                  </p>
                </div>

                {/* Reset Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Back to Login */}
          <div className="text-center">
            <p className="text-gray-600">
              Remember your password?{' '}
              <Link
                href="/auth/login"
                className="text-rose-600 hover:text-rose-700 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}