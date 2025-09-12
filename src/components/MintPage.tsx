import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parseEther, formatEther } from 'viem';
import { useContract } from '../hooks/useContract';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';

const MintPage = () => {
  const { eventCode } = useParams<{ eventCode: string }>();
  const navigate = useNavigate();
  const { contractAddress, contractAbi, address, isConnected, chainId } = useContract();
  const { address: account } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  const [eventData, setEventData] = useState<any>(null);
  const [mintingFee, setMintingFee] = useState<string>('0');
  const [hasUserMinted, setHasUserMinted] = useState(false);
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const isCorrectNetwork = chainId === 8453; // Base mainnet

  // Use Wagmi hooks for contract reads
  const { data: tokenId } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getTokenIdByEventCode',
    args: eventCode ? [eventCode] : undefined,
    query: {
      enabled: !!eventCode
    }
  });

  const { data: eventDataFromContract } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getEventData',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId
    }
  });

  const { data: mintingFeeFromContract } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'mintingFee',
    query: {
      enabled: true
    }
  });

  const { data: totalSupply } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'totalSupply',
    query: {
      enabled: true
    }
  });

  const { data: userMinted } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'hasUserMinted',
    args: eventCode && account ? [eventCode, account] : undefined,
    query: {
      enabled: !!(eventCode && account)
    }
  });

  // Write contract hook for minting
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // Update local state when contract data changes
  useEffect(() => {
    if (eventDataFromContract) {
      setEventData(eventDataFromContract);
    }
  }, [eventDataFromContract]);

  useEffect(() => {
    if (mintingFeeFromContract) {
      setMintingFee(formatEther(mintingFeeFromContract as bigint));
    }
  }, [mintingFeeFromContract]);

  useEffect(() => {
    if (totalSupply) {
      setTotalMinted(Number(totalSupply));
    }
  }, [totalSupply]);

  useEffect(() => {
    if (userMinted !== undefined) {
      setHasUserMinted(userMinted as boolean);
    }
  }, [userMinted]);

  // Network switching is handled by AppKit automatically

  // All contract reads are now handled by Wagmi hooks above

  const mintNFT = async () => {
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }

    if (hasUserMinted) {
      alert('You have already minted an NFT for this event');
      return;
    }

    setIsMinting(true);
    setMintStatus('Preparing transaction...');

    try {
      const walletClient = getWalletClient();
      if (!walletClient) {
        setMintStatus('Wallet client not available. Please check your wallet connection.');
        setIsMinting(false);
        return;
      }

      const ipfsHash = 'bafkreiat5vst4hwcor3uctfre3rhie34ginwy7hvtqjubs3enjeykjinpa';

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'mintEventNFT',
        args: [eventCode!, ipfsHash],
        value: parseEther(mintingFee),
        account: account as `0x${string}`
      });

      setMintStatus('Transaction submitted! Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setMintStatus('Success! Your NFT has been minted!');
        setHasUserMinted(true);
        // Refresh the total minted count
        fetchTotalMinted();
      } else {
        setMintStatus('Transaction failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      setMintStatus(`Error: ${error.message || 'Transaction failed'}`);
    } finally {
      setIsMinting(false);
    }
  };

  if (!eventCode) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Invalid Event Code
          </h1>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              border: '2px solid black',
              transition: 'all 0.1s ease',
              fontSize: '1rem',
              cursor: 'pointer',
              color: 'black',
              backgroundColor: '#60a5fa',
              boxShadow: '0 4px 0 0 rgba(0,0,0,1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0,0,0,1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 0 0 rgba(0,0,0,1)';
              e.currentTarget.style.transform = 'translateY(2px)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
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
            ← Back to Event Code Input
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
            <span style={{ fontWeight: '600', color: '#111827' }}>Base Events</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {/* Event Details */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.5rem'
          }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Event Details
            </h1>
            
            {eventData ? (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.25rem'
                  }}>
                    {eventData.eventName}
                  </h2>
                  <p style={{ color: '#6b7280' }}>Event Code: {eventData.eventCode}</p>
                </div>
                
                <div style={{ fontSize: '0.875rem' }}>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Host:</strong> {eventData.hostName}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Location:</strong> {eventData.location}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Attendees:</strong> {eventData.attendeeCount}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>NFTs Minted:</strong> 
                    <span style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontWeight: '600'
                    }}>
                      {totalMinted}
                    </span>
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Status:</strong> 
                    <span style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: eventData.isActive ? '#dcfce7' : '#fecaca',
                      color: eventData.isActive ? '#166534' : '#991b1b'
                    }}>
                      {eventData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Loading event data...</p>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.5rem',
                  border: '1px solid #f59e0b'
                }}>
                  <p style={{
                    color: '#92400e',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    ⚠️ Event Not Registered
                  </p>
                  <p style={{
                    color: '#92400e',
                    fontSize: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    This event needs to be registered on the blockchain before users can mint NFTs.
                  </p>
                  <button
                    onClick={() => navigate('/create-event')}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#d97706';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f59e0b';
                    }}
                  >
                    Register Event on Blockchain
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mint Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Mint Your Attendance NFT
            </h2>

            {!isConnected ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  color: '#6b7280',
                  marginBottom: '1rem'
                }}>
                  Connect your wallet to mint your attendance NFT
                </p>
                <button
                  onClick={connectWallet}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    border: '2px solid black',
                    transition: 'all 0.1s ease',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    color: 'black',
                    backgroundColor: '#60a5fa',
                    boxShadow: '0 4px 0 0 rgba(0,0,0,1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0,0,0,1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#60a5fa';
                    e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 0 0 rgba(0,0,0,1)';
                    e.currentTarget.style.transform = 'translateY(2px)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#166534'
                  }}>
                    <strong>Connected:</strong> {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Minting Fee:</strong> {mintingFee} ETH</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Event Code:</strong> {eventCode}</p>
                  {!isCorrectNetwork && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      borderRadius: '0.5rem',
                      marginBottom: '1rem',
                      border: '1px solid #f59e0b'
                    }}>
                      <p style={{
                        color: '#92400e',
                        fontWeight: '500',
                        marginBottom: '0.5rem'
                      }}>
                        ⚠️ Wrong Network
                      </p>
                      <p style={{
                        color: '#92400e',
                        fontSize: '0.875rem',
                        marginBottom: '0.75rem'
                      }}>
                        Please switch to Base network to mint NFTs.
                      </p>
                      <button
                        onClick={switchToBaseNetwork}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#d97706';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#f59e0b';
                        }}
                      >
                        Switch to Base
                      </button>
                    </div>
                  )}
                </div>

                {hasUserMinted ? (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <p style={{
                      color: '#92400e',
                      fontWeight: '500'
                    }}>
                      You have already minted an NFT for this event!
                    </p>
                  </div>
                ) : null}
                
                {!hasUserMinted && (
                  <button
                    onClick={mintNFT}
                    disabled={isMinting || !eventData?.isActive || !isCorrectNetwork}
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
                      cursor: isMinting || !eventData?.isActive || !isCorrectNetwork ? 'not-allowed' : 'pointer',
                      color: isMinting || !eventData?.isActive || !isCorrectNetwork ? '#3b82f6' : 'black',
                      borderColor: isMinting || !eventData?.isActive || !isCorrectNetwork ? '#93c5fd' : 'black',
                      backgroundColor: isMinting || !eventData?.isActive || !isCorrectNetwork ? 'transparent' : '#60a5fa',
                      boxShadow: isMinting || !eventData?.isActive || !isCorrectNetwork ? 'none' : '0 4px 0 0 rgba(0,0,0,1)'
                    }}
                    onMouseOver={(e) => {
                      if (!isMinting && eventData?.isActive && isCorrectNetwork) {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0,0,0,1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isMinting && eventData?.isActive && isCorrectNetwork) {
                        e.currentTarget.style.backgroundColor = '#60a5fa';
                        e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!isMinting && eventData?.isActive && isCorrectNetwork) {
                        e.currentTarget.style.boxShadow = '0 2px 0 0 rgba(0,0,0,1)';
                        e.currentTarget.style.transform = 'translateY(2px)';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!isMinting && eventData?.isActive && isCorrectNetwork) {
                        e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0,0,0,1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {isMinting ? 'Minting...' : 'Mint NFT'}
                  </button>
                )}

                {mintStatus && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: mintStatus.includes('Success') 
                      ? '#f0fdf4'
                      : mintStatus.includes('Error')
                      ? '#fef2f2'
                      : '#eff6ff',
                    color: mintStatus.includes('Success') 
                      ? '#166534'
                      : mintStatus.includes('Error')
                      ? '#991b1b'
                      : '#1e40af'
                  }}>
                    {mintStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintPage;
