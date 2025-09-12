import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';

const ContractVerificationPage = () => {
  const { contractAddress, contractAbi, publicClient, verifyContract: checkContractDeployed, getContractName } = useContract();
  const [verificationResults, setVerificationResults] = useState<any>({});
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyContract = async () => {
    setIsVerifying(true);
    const results: any = {};

    try {
      // 1. Check if contract exists
      console.log('🔍 Checking contract bytecode...');
      const isDeployed = await checkContractDeployed();
      
      results.bytecode = isDeployed ? '✅ Contract deployed' : '❌ No contract found';
      results.bytecodeLength = isDeployed ? 'Contract found' : 0;

      if (isDeployed) {
        // 2. Try to read contract name
        try {
          const contractName = await getContractName();
          results.name = `✅ ${contractName}`;
        } catch (error: any) {
          results.name = `❌ Error reading name: ${error.message}`;
        }

        // 3. Try to read total supply
        try {
          const totalSupply = await publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'totalSupply'
          });
          results.totalSupply = `✅ ${totalSupply}`;
        } catch (error: any) {
          results.totalSupply = `❌ Error reading totalSupply: ${error.message}`;
        }

        // 4. Try to read owner
        try {
          const owner = await publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'owner'
          });
          results.owner = `✅ ${owner}`;
        } catch (error: any) {
          results.owner = `❌ Error reading owner: ${error.message}`;
        }

        // 5. Try to read minting fee
        try {
          const mintingFee = await publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'mintingFee'
          });
          results.mintingFee = `✅ ${mintingFee} ETH`;
        } catch (error: any) {
          results.mintingFee = `❌ Error reading mintingFee: ${error.message}`;
        }

        // 6. Check if event B56-A64 exists
        try {
          const tokenId = await publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'getTokenIdByEventCode',
            args: ['B56-A64']
          });
          results.eventB56A64 = Number(tokenId) > 0 ? `✅ Event exists (Token ID: ${tokenId})` : '❌ Event not registered';
        } catch (error: any) {
          results.eventB56A64 = `❌ Error checking event: ${error.message}`;
        }
      }

    } catch (error: any) {
      results.error = `❌ Verification failed: ${error.message}`;
    }

    setVerificationResults(results);
    setIsVerifying(false);
  };

  useEffect(() => {
    verifyContract();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              color: '#2563eb',
              fontWeight: '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img 
              src="/Base_square_blue.svg" 
              alt="Base Logo" 
              style={{ 
                width: '24px', 
                height: '24px'
              }} 
            />
            <span style={{ fontWeight: '600', color: '#111827' }}>Contract Verification</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Contract Verification
          </h1>
          
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Verifying contract at address: <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{contractAddress}</code>
          </p>

          {isVerifying ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Verifying contract...</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(verificationResults).map(([key, value]) => (
                <div key={key} style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={verifyContract}
              disabled={isVerifying}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                opacity: isVerifying ? 0.5 : 1
              }}
            >
              {isVerifying ? 'Verifying...' : 'Re-verify Contract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractVerificationPage;
