import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    const success = await login(email, password);
    if (success) {
      setLocation('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  const demoAccounts = [
    { email: 'juan@example.com', role: 'Resident' },
    { email: 'pedro@brgy.gov.ph', role: 'Official' },
    { email: 'admin@brgy.gov.ph', role: 'Admin' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 gradient-mesh">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Barangay Report System</h1>
          <p className="text-muted-foreground">Sign in to access your account</p>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11 font-semibold" data-testid="button-login">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-sm font-medium">Demo Accounts</p>
            </div>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => setEmail(account.email)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-background hover:bg-accent transition-colors text-sm"
                  data-testid={`demo-${account.role.toLowerCase()}`}
                >
                  <span className="font-medium">{account.role}</span>
                  <span className="text-muted-foreground ml-2">{account.email}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
