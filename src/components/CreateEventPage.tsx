import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import { useAccount, useWriteContract } from 'wagmi';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { contractAddress, contractAbi, publicClient, verifyContract, getContractName } = useContract();
  const { address: account, isConnected } = useAccount();
  const { writeContract, isPending: isWritePending } = useWriteContract();
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState('');
  const [, setContractOwner] = useState<string>('');
  
  // Form data
  const [eventCode, setEventCode] = useState('B56-A64');
  const [eventName, setEventName] = useState('Side Event: Touch Base @EthSafari 2025');
  const [location, setLocation] = useState('Kilifi Bay Beach Resort');
  const [timestamp] = useState(Math.floor(new Date("2025-09-12T18:00:00+03:00").getTime() / 1000));
  const [hostName, setHostName] = useState('Eddie Kago');
  const [attendeeCount, setAttendeeCount] = useState(7);
  const [ipfsHash, setIpfsHash] = useState('bafkreiat5vst4hwcor3uctfre3rhie34ginwy7hvtqjubs3enjeykjinpa');

  // Load contract owner on component mount
  React.useEffect(() => {
    const loadContractOwner = async () => {
      try {
        const owner = await publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: 'owner'
        });
        setContractOwner(owner as string);
      } catch (error) {
        console.error('Error loading contract owner:', error);
      }
    };
    
    loadContractOwner();
  }, [contractAddress, contractAbi, publicClient]);

  // Wallet connection is now handled by AppKit

  const createEvent = async () => {
    if (!isConnected || !account) {
      setStatus('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    setStatus('Checking permissions and event status...');

    try {
      // First, check if the event is already registered
      const existingTokenId = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getTokenIdByEventCode',
        args: [eventCode]
      });

      if (Number(existingTokenId) > 0) {
        setStatus(`Event "${eventCode}" is already registered! Token ID: ${existingTokenId}`);
        setIsCreating(false);
        return;
      }

      // Check if the connected account is the contract owner
      const currentContractOwner = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'owner'
      }) as string;

      if (account.toLowerCase() !== currentContractOwner.toLowerCase()) {
        setStatus(`❌ Permission Denied: You are not the contract owner. Owner: ${currentContractOwner}`);
        setIsCreating(false);
        return;
      }

      setStatus('✅ Permission verified. Creating event...');

      if (!window.ethereum) {
        setStatus('❌ MetaMask not detected. Please install MetaMask.');
        setIsCreating(false);
        return;
      }

      // Verify contract is deployed and accessible
      try {
        const isContractDeployed = await verifyContract();
        
        if (!isContractDeployed) {
          setStatus('❌ Contract not found at the specified address. Please verify the contract is deployed.');
          setIsCreating(false);
          return;
        }
        
        console.log('✅ Contract verified at address:', contractAddress);
        
        // Test if we can read from the contract
        try {
          const totalSupply = await publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'totalSupply'
          });
          console.log('✅ Contract readable, total supply:', totalSupply);
          
          // Verify this is the correct contract by checking the name
          const contractName = await getContractName();
          console.log('✅ Contract name:', contractName);
          
          if (contractName !== 'EthSafari Event NFTs V2') {
            setStatus(`❌ Wrong contract! Expected "EthSafari Event NFTs V2" but got "${contractName}". Please check the contract address.`);
            setIsCreating(false);
            return;
          }
        } catch (readError) {
          console.error('❌ Error reading from contract:', readError);
          setStatus('❌ Contract found but not readable. Please check the ABI matches the deployed contract.');
          setIsCreating(false);
          return;
        }
      } catch (error) {
        console.error('❌ Error verifying contract:', error);
        setStatus('❌ Error verifying contract. Please check the contract address.');
        setIsCreating(false);
        return;
      }

      // Format IPFS hash properly (add ipfs:// prefix if not present)
      const formattedIpfsHash = ipfsHash.startsWith('ipfs://') ? ipfsHash : `ipfs://${ipfsHash}`;
      
      console.log('🔍 Registering event with parameters:', {
        eventCode,
        eventName,
        location,
        timestamp,
        hostName,
        attendeeCount,
        ipfsHash: formattedIpfsHash
      });

      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'registerEvent',
        args: [
          eventCode,
          eventName,
          location,
          BigInt(timestamp), // Ensure timestamp is BigInt
          hostName,
          BigInt(attendeeCount), // Ensure attendeeCount is BigInt
          formattedIpfsHash
        ],
        value: 0n
      }, {
        onSuccess: (hash) => {
          setStatus(`✅ Event "${eventCode}" created successfully! Transaction: ${hash}`);
          
          // Reset form
          setEventCode('');
          setEventName('');
          setLocation('');
          setHostName('');
          setAttendeeCount(0);
          setIpfsHash('');
        },
        onError: (error) => {
          console.error('Error creating event:', error);
          setStatus(`❌ Transaction failed: ${error.message || 'Unknown error'}`);
        }
      });

      // Transaction handling is now done in the writeContract callbacks above
    } catch (error: any) {
      console.error('Error creating event:', error);
      if (error.message?.includes('Event already registered')) {
        setStatus('❌ This event is already registered on the contract.');
      } else if (error.message?.includes('Ownable: caller is not the owner')) {
        setStatus('❌ Permission Denied: Only the contract owner can register events.');
      } else {
        setStatus(`❌ Error: ${error.message || 'Transaction failed'}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              color: '#2563eb',
              fontWeight: '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#2563eb';
            }}
          >
            ← Back to Home
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
            <span style={{ fontWeight: '600', color: '#111827' }}>Base Events - Create Event</span>
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
            Create New Event
          </h1>
          
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Register a new event on the blockchain so users can mint attendance NFTs.
          </p>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.5rem',
            border: '1px solid #3b82f6',
            marginBottom: '2rem'
          }}>
            <p style={{
              color: '#1e40af',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              🔍 Having Issues?
            </p>
            <p style={{
              color: '#1e40af',
              fontSize: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              If transactions are failing, verify the contract is deployed correctly.
            </p>
            <button
              onClick={() => navigate('/verify-contract')}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Verify Contract
            </button>
          </div>

          {!isConnected ? (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Connect your wallet to create an event
              </p>
              <appkit-button />
            </div>
          ) : (
            <div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.5rem',
                marginBottom: '2rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#166534' }}>
                  <strong>Connected:</strong> {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Unknown'}
                </p>
              </div>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Event Code *
                  </label>
                  <input
                    type="text"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Host Name *
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Attendee Count *
                  </label>
                  <input
                    type="number"
                    value={attendeeCount}
                    onChange={(e) => setAttendeeCount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    IPFS Hash *
                  </label>
                  <input
                    type="text"
                    value={ipfsHash}
                    onChange={(e) => setIpfsHash(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={createEvent}
                disabled={isCreating || !eventCode.trim() || !eventName.trim()}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  border: '2px solid',
                  transition: 'all 0.1s ease',
                  fontSize: '1rem',
                  cursor: isCreating || !eventCode.trim() || !eventName.trim() ? 'not-allowed' : 'pointer',
                  color: isCreating || !eventCode.trim() || !eventName.trim() ? '#3b82f6' : 'black',
                  borderColor: isCreating || !eventCode.trim() || !eventName.trim() ? '#93c5fd' : 'black',
                  backgroundColor: isCreating || !eventCode.trim() || !eventName.trim() ? 'transparent' : '#60a5fa',
                  boxShadow: isCreating || !eventCode.trim() || !eventName.trim() ? 'none' : '0 4px 0 0 rgba(0,0,0,1)'
                }}
                onMouseOver={(e) => {
                  if (!isCreating && eventCode.trim() && eventName.trim()) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0,0,0,1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isCreating && eventCode.trim() && eventName.trim()) {
                    e.currentTarget.style.backgroundColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!isCreating && eventCode.trim() && eventName.trim()) {
                    e.currentTarget.style.boxShadow = '0 2px 0 0 rgba(0,0,0,1)';
                    e.currentTarget.style.transform = 'translateY(2px)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!isCreating && eventCode.trim() && eventName.trim()) {
                    e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isCreating || isWritePending ? 'Creating Event...' : 'Create Event'}
              </button>
            </div>
          )}

          {status && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: status.includes('Error') || status.includes('failed')
                ? '#fef2f2'
                : status.includes('Success') || status.includes('successfully')
                ? '#f0fdf4'
                : '#eff6ff',
              color: status.includes('Error') || status.includes('failed')
                ? '#991b1b'
                : status.includes('Success') || status.includes('successfully')
                ? '#166534'
                : '#1e40af'
            }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
