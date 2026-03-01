import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signup } from '../../api/auth';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await signup({ name, email, password });
      loginUser(res.data.token, res.data.user);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-400">Name</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20"
        />
      </div>
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
          placeholder="At least 6 characters"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-white hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
