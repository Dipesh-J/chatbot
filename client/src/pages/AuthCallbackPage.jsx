import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/auth';
import { Loader2 } from 'lucide-react';

export function AuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Store token then fetch user
        localStorage.setItem('bizcopilot_token', token);
        getMe()
            .then((res) => {
                loginUser(token, res.data.user);
                navigate('/');
            })
            .catch(() => {
                localStorage.removeItem('bizcopilot_token');
                navigate('/login');
            });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Signing you in...</p>
            </div>
        </div>
    );
}
