import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api/auth';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      loginUser(res.data.token, res.data.user);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-400">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@company.com"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-400">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
      <p className="text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-white hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
