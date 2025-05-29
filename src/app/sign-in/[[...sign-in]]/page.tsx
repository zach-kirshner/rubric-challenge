export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Local Development Mode</h1>
        <p className="text-gray-600 mb-4">
          Authentication is disabled for local development.
        </p>
        <a 
          href="/" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Continue to App
        </a>
      </div>
    </div>
  );
} 