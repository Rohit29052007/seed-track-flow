import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInputValidation } from '@/hooks/useInputValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const { 
    signIn, 
    signUp, 
    user, 
    loading: authLoading,
    getSignInAttemptsRemaining,
    getSignUpAttemptsRemaining,
    isSignInBlocked,
    isSignUpBlocked
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { errors, validateAndUpdateField, clearAllErrors, hasErrors } = useInputValidation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    clearAllErrors();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Check if blocked by rate limiting
    if (isSignInBlocked()) {
      setError('Too many login attempts. Please try again later.');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
      const remaining = getSignInAttemptsRemaining();
      if (remaining <= 2 && remaining > 0) {
        setError(`${error.message} (${remaining} attempts remaining)`);
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    clearAllErrors();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    // Check if blocked by rate limiting
    if (isSignUpBlocked()) {
      setError('Too many signup attempts. Please try again later.');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      setError(error.message);
      const remaining = getSignUpAttemptsRemaining();
      if (remaining <= 1 && remaining > 0) {
        setError(`${error.message} (${remaining} attempts remaining)`);
      }
    } else {
      setSuccess('Account created successfully! Please check your email to verify your account.');
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Shipment Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account or create a new one
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      maxLength={254}
                      required
                      onChange={(e) => {
                        validateAndUpdateField('signin-email', e.target.value, {
                          required: true,
                          email: true,
                          maxLength: 254
                        });
                      }}
                    />
                    {errors['signin-email'] && (
                      <p className="text-sm text-destructive">{errors['signin-email']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      maxLength={128}
                      required
                      onChange={(e) => {
                        validateAndUpdateField('signin-password', e.target.value, {
                          required: true,
                          maxLength: 128
                        });
                      }}
                    />
                    {errors['signin-password'] && (
                      <p className="text-sm text-destructive">{errors['signin-password']}</p>
                    )}
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || hasErrors() || isSignInBlocked()}
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  {isSignInBlocked() && (
                    <p className="text-sm text-warning text-center mt-2">
                      Account temporarily locked due to too many failed attempts
                    </p>
                  )}
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Fill in your details to create a new account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      maxLength={100}
                      required
                      onChange={(e) => {
                        validateAndUpdateField('signup-name', e.target.value, {
                          required: true,
                          maxLength: 100,
                          pattern: /^[a-zA-Z\s\-'\.]+$/
                        });
                      }}
                    />
                    {errors['signup-name'] && (
                      <p className="text-sm text-destructive">{errors['signup-name']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      maxLength={254}
                      required
                      onChange={(e) => {
                        validateAndUpdateField('signup-email', e.target.value, {
                          required: true,
                          email: true,
                          maxLength: 254
                        });
                      }}
                    />
                    {errors['signup-email'] && (
                      <p className="text-sm text-destructive">{errors['signup-email']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      maxLength={128}
                      required
                      onChange={(e) => {
                        validateAndUpdateField('signup-password', e.target.value, {
                          required: true,
                          strongPassword: true,
                          maxLength: 128
                        });
                      }}
                    />
                    {errors['signup-password'] && (
                      <p className="text-sm text-destructive">{errors['signup-password']}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character
                    </div>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || hasErrors() || isSignUpBlocked()}
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                  {isSignUpBlocked() && (
                    <p className="text-sm text-warning text-center mt-2">
                      Too many signup attempts. Please try again later.
                    </p>
                  )}
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;