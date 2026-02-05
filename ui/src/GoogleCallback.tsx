import { useEffect } from 'react';

export function GoogleCallback() {
  useEffect(() => {
    // Parse hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');

    if (idToken && window.opener) {
      try {
        // Decode JWT (basic parsing, just split by dots)
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        
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
