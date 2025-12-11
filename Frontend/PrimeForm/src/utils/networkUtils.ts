import NetInfo from '@react-native-community/netinfo';

class NetworkUtils {
  /**
   * Check if device is currently connected to internet
   */
  async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
      console.error('Network check failed:', error);
      // Assume connected if check fails
      return true;
    }
  }

  /**
   * Check network connection and show appropriate error if offline
   */
  async checkConnectionOrThrow(operation: string = 'this operation'): Promise<void> {
    const connected = await this.isConnected();
    
    if (!connected) {
      throw new Error(`No internet connection. ${operation} requires an active internet connection. Please check your network and try again.`);
    }
  }

  /**
   * Subscribe to network state changes
   */
  subscribeToNetworkChanges(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected === true && state.isInternetReachable === true;
      
      if (isConnected) {
        onOnline();
      } else {
        onOffline();
      }
    });

    return unsubscribe;
  }

  /**
   * Get detailed network information
   */
  async getNetworkInfo(): Promise<{
    connected: boolean;
    type: string | null;
    effectiveType: string | null;
  }> {
    try {
      const state = await NetInfo.fetch();
      
      return {
        connected: state.isConnected === true && state.isInternetReachable === true,
        type: state.type,
        effectiveType: state.details?.cellularGeneration || null,
      };
    } catch (error) {
      return {
        connected: true,
        type: null,
        effectiveType: null,
      };
    }
  }
}

export default new NetworkUtils();
