import { AuthCard } from '../components/auth/AuthCard';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your BizCopilot account">
      <LoginForm />
    </AuthCard>
  );
}
