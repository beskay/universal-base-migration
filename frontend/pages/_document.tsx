import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" />
        <script dangerouslySetInnerHTML={{
          __html: `            (function() {
              try {
                // Mark Phantom EVM if it exists
                if (window.phantom && window.phantom.ethereum) {
                  // Instead of deleting, mark the provider
                  try {
                    window.phantom.ethereum._isPhantomEVM = true;
                  } catch(e) {
                    // Property might be non-configurable
                  }
                  
                  // If window.ethereum is from Phantom, mark it
                  if (window.ethereum && window.ethereum.isPhantom) {
                    try {
                      window.ethereum._isPhantomEVM = true;
                    } catch(e) {
                      // Property might be non-configurable
                    }
                  }
                }
              } catch(e) {
                console.error("Error marking Phantom EVM:", e);
              }
            })();
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}