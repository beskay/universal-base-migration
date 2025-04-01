import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import Card from '../components/Card';
import supabase from '../lib/supabase';
import { formatAddress } from '../lib/walletUtils';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import dynamic from 'next/dynamic';
import PageLoader from '../components/PageLoader';

// Import this component dynamically to avoid SSR issues
const ClaimPageWithProvider = dynamic(
  () => import('../components/ClaimPageWithProvider'),
  {
    ssr: false,
    loading: () => <PageLoader />
  }
);

export default function ClaimPage() {
  return <ClaimPageWithProvider />;
}