export const WEBSOCKET_CONFIG = {
  baseUrl: 'wss://websocket-service-dev.techchain.solutions', // Передбачувана WebSocket URL
  httpBaseUrl: 'https://websocket-service-dev.techchain.solutions', // HTTP endpoints для health/readiness
  timeout: 10000, // 10 seconds timeout for WebSocket connections
  connectionTimeout: 5000, // 5 seconds to establish connection
  messageTimeout: 3000, // 3 seconds to receive message
} as const;

export const WEBSOCKET_ENDPOINTS = {
  // Real-time price subscription
  PRICE: '/get-price/{base}/{quote}/{exchange}',
  
  // Real-time orderbook subscription (CEX only)
  ORDERBOOK: '/get-orderbook/{base}/{quote}/{depth}/{exchange}',
  
  // Health check (HTTP)
  HEALTH: '/health',
  
  // Readiness check (HTTP)
  READINESS: '/readiness',
} as const;

// Test pairs for WebSocket testing
export const WS_TEST_PAIRS = {
  cex: {
    base: 'BTC',
    quote: 'USDT',
    depth: 10,
  },
  dex: {
    tokenAddress: '0xA0b86a33E6441C41576B5cB06F1c4e8E39b7D7Bc', // WETH
    poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8', // WETH/USDC
    chainId: '1',
  },
} as const;

// Sample exchanges for WebSocket testing
export const WS_CEX_EXCHANGES = ['htx', 'mexc', 'kucoin', 'bybit'] as const;
export const WS_DEX_EXCHANGES = ['uniswap-v3', 'raydium'] as const; 