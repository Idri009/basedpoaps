import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { eventNFTAbi } from '../../contract/abi';

// Contract configuration
export const CONTRACT_ADDRESS = '0xef83c6e7953d028d637e416f581ae2fa836ebae8' as const;
export const CONTRACT_ABI = eventNFTAbi;

// Public client for read operations
export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base.drpc.org', { 
    timeout: 60_000,
    retryCount: 3,
    retryDelay: 1000
  })
});

// Hook for contract interactions using Wagmi
export const useContract = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Helper function to check if contract is accessible
  const verifyContract = async () => {
    try {
      const contractCode = await publicClient.getBytecode({
        address: CONTRACT_ADDRESS
      });
      return contractCode && contractCode !== '0x';
    } catch (error) {
      console.error('Error verifying contract:', error);
      return false;
    }
  };

  // Helper function to get contract name for verification
  const getContractName = async () => {
    try {
      return await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'name'
      });
    } catch (error) {
      console.error('Error getting contract name:', error);
      return null;
    }
  };

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractAbi: CONTRACT_ABI,
    publicClient,
    address,
    isConnected,
    chainId,
    verifyContract,
    getContractName,
    // Wagmi hooks for contract interactions
    useReadContract,
    useWriteContract
  };
};

export default useContract;
