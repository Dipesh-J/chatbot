import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/auth';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      getMe().then((res) => {
        loginUser(token, res.data.user);
        navigate('/');
      });
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}
