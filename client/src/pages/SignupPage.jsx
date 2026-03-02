import { AuthCard } from '../components/auth/AuthCard';
import { SignupForm } from '../components/auth/SignupForm';

export function SignupPage() {
    return (
        <AuthCard
            title="Create your account"
            subtitle="Start your AI-powered business intelligence journey"
        >
            <SignupForm />
        </AuthCard>
    );
}
