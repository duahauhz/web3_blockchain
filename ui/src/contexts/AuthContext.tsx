import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  googleJWT: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [googleJWT, setGoogleJWT] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedJWT = localStorage.getItem('google_jwt');
    const storedUser = localStorage.getItem('google_user');
    
    if (storedJWT && storedUser) {
      try {
        const decoded: any = jwtDecode(storedJWT);
        
        // Check if token expired
        if (decoded.exp * 1000 > Date.now()) {
          setGoogleJWT(storedJWT);
          setUser(JSON.parse(storedUser));
        } else {
          // Token expired, clear storage
          localStorage.removeItem('google_jwt');
          localStorage.removeItem('google_user');
        }
      } catch (error) {
        console.error('Failed to decode JWT:', error);
      }
    }

    // Listen for Google OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google_oauth_success') {
        const { jwt, user } = event.data;
        setGoogleJWT(jwt);
        setUser(user);
        localStorage.setItem('google_jwt', jwt);
        localStorage.setItem('google_user', JSON.stringify(user));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = () => {
    // Open Google OAuth popup
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${REDIRECT_URI}&` +
      `response_type=token id_token&` +
      `scope=openid email profile&` +
      `nonce=${Math.random().toString(36)}`;

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      authUrl,
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const logout = () => {
    setUser(null);
    setGoogleJWT(null);
    localStorage.removeItem('google_jwt');
    localStorage.removeItem('google_user');
  };

  const isAuthenticated = !!user && !!googleJWT;

  return (
    <AuthContext.Provider value={{ user, googleJWT, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
