import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi';
import { eventNFTAbi } from '../../contract/abi';

// Contract configuration
export const CONTRACT_ADDRESS = '0xef83c6e7953d028d637e416f581ae2fa836ebae8' as const;
export const CONTRACT_ABI = eventNFTAbi;

// Hook for contract interactions using Wagmi
export const useContract = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Helper function to check if contract is accessible
  const verifyContract = async () => {
    try {
      // This would need to be implemented with a custom hook or direct viem call
      // For now, we'll assume it's accessible if we're connected to the right chain
      return isConnected && chainId === 8453; // Base mainnet chain ID
    } catch (error) {
      console.error('Error verifying contract:', error);
      return false;
    }
  };

  // Helper function to get contract name for verification
  const getContractName = async () => {
    try {
      // This would need to be implemented with useReadContract
      // For now, return the expected name
      return 'EthSafari Event NFTs V2';
    } catch (error) {
      console.error('Error getting contract name:', error);
      return null;
    }
  };

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractAbi: CONTRACT_ABI,
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
