import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pattern">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-purple-800/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">RAN Awards 2026</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Your voice matters. Vote for the organisation making a real impact in recycling and circular economy! Choose based on their contributions and responsibilities in driving Nigeria's recycling value chain forward.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/vote" 
                className="btn btn-primary px-10 py-4 text-lg shadow-xl hover:shadow-2xl"
              >
                Start Voting →
              </Link>
              <Link 
                href="/results" 
                className="btn btn-secondary px-10 py-4 text-lg"
              >
                View Results
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Voting</h3>
            <p className="text-gray-600">
              Email verification ensures one vote per person. Your votes are encrypted and secure.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Optimized for Nigerian networks. Vote quickly even on slow connections.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Real-Time Results</h3>
            <p className="text-gray-600">
              Watch the results update live as votes come in from across the country.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Enter Email</h3>
              <p className="text-gray-600 text-sm">Provide your email address to get started</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Verify</h3>
              <p className="text-gray-600 text-sm">Enter the code sent to your email</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Vote</h3>
              <p className="text-gray-600 text-sm">Select your favorites in each category</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-xl mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Celebrate</h3>
              <p className="text-gray-600 text-sm">Your votes are counted!</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/vote" className="btn btn-primary px-10 py-4 text-lg">
              Vote Now
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2026 RAN Awards Voting Platform. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <Link href="#" className="text-gray-400 hover:text-white">
              Admin
            </Link>
            <span className="text-gray-600">|</span>
            <a href="#" className="text-gray-400 hover:text-white">
              Privacy Policy
            </a>
            <span className="text-gray-600">|</span>
            <a href="#" className="text-gray-400 hover:text-white">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
