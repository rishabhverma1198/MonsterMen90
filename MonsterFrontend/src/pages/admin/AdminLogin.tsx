import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Check if user is already authenticated and is admin
  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (error) {
          setCheckingAuth(false);
          return;
        }

        if (user) {
          // Check if user has admin profile
          const { data: profile } = await supabase
            .from('users')
            .select('user_type, is_active')
            .eq('id', user.id)
            .single();

          if (mounted && profile?.user_type === 'admin' && profile?.is_active) {
            navigate('/admin/dashboard', { replace: true });
            return;
          }
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Authenticate user
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        throw new Error('Login failed. Please try again.');
      }

      if (!data.user) {
        throw new Error('Authentication failed. Please try again.');
      }

      // Step 2: Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_type, is_active')
        .eq('id', data.user.id)
        .single();

      // Step 3: Handle profile scenarios
      if (profileError && profileError.code === 'PGRST116') {
        // No profile exists - create admin profile
        const { data: userData } = await supabase.auth.getUser();
        const fullName = userData.user?.user_metadata?.full_name || 'System Administrator';

        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            user_type: 'admin',
            is_active: true
          });

        if (createError) {
          console.error('Failed to create admin profile:', createError);
          await supabase.auth.signOut();
          throw new Error('Failed to create admin account. Please contact support.');
        }

        toast({ 
          title: "Welcome!", 
          description: "Admin account created successfully. Welcome to the admin panel!" 
        });
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      if (profileError) {
        console.error('Profile check error:', profileError);
        await supabase.auth.signOut();
        throw new Error('Failed to verify admin credentials. Please try again.');
      }

      // Step 4: Validate admin status
      if (profile?.user_type !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      if (!profile?.is_active) {
        await supabase.auth.signOut();
        throw new Error('Admin account is inactive. Please contact support.');
      }

      // Step 5: Success - redirect to dashboard
      toast({ 
        title: "Login Successful", 
        description: "Welcome back, Admin!" 
      });
      navigate('/admin/dashboard', { replace: true });

    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Handle specific error types
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({ 
        title: "Login Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Simple form validation
  const isFormValid = email.trim() && password.length >= 6;

  // Show loading while checking auth status
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={loading}
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={loading}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              disabled={loading || !isFormValid}
              type="submit"
            >
              {loading ? 'Signing In...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}