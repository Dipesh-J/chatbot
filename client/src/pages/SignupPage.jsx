import SignupForm from '../components/auth/SignupForm';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-gray-400 mt-1">Get started with BizCopilot</p>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <GoogleAuthButton />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 text-gray-500">or</span>
            </div>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
