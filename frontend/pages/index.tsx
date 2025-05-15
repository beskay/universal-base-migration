import React from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import WalletConnector from '../components/WalletConnector';

export default function Home() {
  return (
    <div className="min-h-screen bg-white pt-16 pb-12 px-4">
      <Head>
        <title>Solana to Base Migration</title>
        <meta name="description" content="Register to migrate your tokens from Solana to Base" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <Navigation />

      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Solana to Base Migration</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect your Solana and Base wallets to register for token migration. 
            After registration, you will be able to migrate your tokens from Solana to Base.
          </p>
        </div>

        <div className="max-w-md mx-auto animate-slideIn">
          <WalletConnector />
        </div>
      </main>
    </div>
  );
} 