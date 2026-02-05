import { useEffect } from 'react';

export function GoogleCallback() {
  useEffect(() => {
    // Parse hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');

    if (idToken && window.opener) {
      try {
        // Decode JWT with proper UTF-8 handling
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        
        console.log('✅ Decoded payload with UTF-8:', payload);
        console.log('✅ User name:', payload.name);
        
        const user = {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          sub: payload.sub,
        };

        // Send message to parent window
        window.opener.postMessage({
          type: 'google_oauth_success',
          jwt: idToken,
          user,
        }, window.location.origin);

        // Close popup
        window.close();
      } catch (error) {
        console.error('Failed to process OAuth callback:', error);
        window.close();
      }
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
        <div>Đăng nhập thành công!</div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          Đang đóng cửa sổ...
        </div>
      </div>
    </div>
  );
}
