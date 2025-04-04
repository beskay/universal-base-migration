import Link from 'next/link';
import { useRouter } from 'next/router';
import { AnimatedShinyText } from './AnimatedShinyText';

export default function Navigation() {
  const router = useRouter();
  
  // Only register link is available
  const registerEnabled = true;
  
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-10 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {/* Logo removed */}
          </div>
          
          <div className="flex space-x-2">
            {/* Register link */}
            {registerEnabled ? (
              <Link 
                href="/" 
                className={`px-4 py-2 rounded-lg transition font-mono text-xs md:text-sm ${
                  router.pathname === '/' 
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white' 
                    : 'text-gray-800 hover:bg-gray-100'
                }`}
              >
                <AnimatedShinyText className={router.pathname === '/' ? 'text-white' : 'text-current'}>
                  Register
                </AnimatedShinyText>
              </Link>
            ) : (
              <div 
                className="px-4 py-2 rounded-lg font-mono text-xs md:text-sm text-gray-400 bg-gray-100 cursor-not-allowed"
                style={{ opacity: 0.6 }}
              >
                <span className="text-current">
                  Register
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Spacer div reduced size since logo is removed */}
      <div className="h-16 w-full"></div>
    </>
  );
} 