import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signup } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import toast from 'react-hot-toast';

export function SignupForm() {
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) { toast.error('Please fill in all fields'); return; }
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const res = await signup(form);
            loginUser(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Full Name</label>
                    <Input
                        name="name"
                        placeholder="John Smith"
                        value={form.name}
                        onChange={handleChange}
                        autoComplete="name"
                        className="bg-zinc-900/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email</label>
                    <Input
                        name="email"
                        type="email"
                        placeholder="you@business.com"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        className="bg-zinc-900/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Password</label>
                    <div className="relative">
                        <Input
                            name="password"
                            type={showPw ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className="bg-zinc-900/50 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
            </Button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.location.href = '/api/auth/google'}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
            </Button>

            <p className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                    Sign in
                </Link>
            </p>
        </form>
    );
}
