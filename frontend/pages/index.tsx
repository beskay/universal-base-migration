import React from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import WalletConnector from '../components/WalletConnector';
import Card from '../components/Card';

export default function Home() {
  return (
    <div className="min-h-screen bg-white pt-16 pb-12 px-4">
      <Head>
        <title>Solana to Base Migration</title>
        <meta name="description" content="Register to migrate your tokens from Solana to Base" />
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