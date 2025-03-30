import LoginForm from "../components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
        <LoginForm />
      </div>
    </div>
  )
}

