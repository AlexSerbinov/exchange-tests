// CEX Exchanges supported by the API
export const CEX_EXCHANGES = [
  'htx', 'mexc', 'gateio', 'kucoin', 'xt',
  'lbank', 'bitmart', 'phemex', 'bitget', 'bybit', 'bingx'
] as const;

// DEX Exchanges supported by the API  
export const DEX_EXCHANGES = [
  'uniswap-v2', 'uniswap-v3', 'pancakeswap', 'raydium', 'ston'
] as const;

export type CexExchange = typeof CEX_EXCHANGES[number];
export type DexExchange = typeof DEX_EXCHANGES[number];

// Test trading pairs for CEX
export const CEX_TEST_PAIRS = [
  { base: 'BTC', quote: 'USDT' },   // Most liquid pair
  { base: 'ETH', quote: 'USDT' },   // Second most liquid  
  { base: 'BNB', quote: 'USDT' },   // Exchange token
  { base: 'SOL', quote: 'USDT' },   // Popular altcoin
  { base: 'DOGE', quote: 'USDT' },  // Meme coin test case
];

// DEX test configuration (popular pools with good liquidity)
export const DEX_TEST_POOLS = {
  ethereum: {
    chainId: '1',
    pools: [
      {
        // ETH/USDC Uniswap V2
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        poolAddress: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',   // ETH/USDC pool
        exchange: 'uniswap-v2' as DexExchange,
        description: 'ETH/USDC V2 Pool'
      },
      {
        // WBTC/ETH Uniswap V2  
        tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        poolAddress: '0xBb2b8038a1640196FbE3e38816F3e67Cba72D940',   // WBTC/ETH pool
        exchange: 'uniswap-v2' as DexExchange,
        description: 'WBTC/ETH V2 Pool'
      },
      {
        // USDC/ETH Uniswap V3 (0.05% fee tier)
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        poolAddress: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',   // USDC/ETH 0.05%
        exchange: 'uniswap-v3' as DexExchange,
        description: 'USDC/ETH V3 Pool (0.05%)'
      }
    ]
  },
  bsc: {
    chainId: '56',
    pools: [
      {
        // BNB/USDT PancakeSwap
        tokenAddress: '0x55d398326f99059fF775485246999027B3197955', // USDT
        poolAddress: '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE',   // BNB/USDT pool
        exchange: 'pancakeswap' as DexExchange,
        description: 'BNB/USDT PancakeSwap Pool'
      },
      {
        // CAKE/BNB PancakeSwap
        tokenAddress: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // CAKE
        poolAddress: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',   // CAKE/BNB pool
        exchange: 'pancakeswap' as DexExchange,
        description: 'CAKE/BNB PancakeSwap Pool'
      }
    ]
  },
  solana: {
    chainId: '101', // Solana mainnet
    pools: [
      {
        // SOL/USDC Raydium
        tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        poolAddress: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',   // SOL/USDC pool
        exchange: 'raydium' as DexExchange,
        description: 'SOL/USDC Raydium Pool'
      }
    ]
  },
  ton: {
    chainId: 'ton-mainnet',
    pools: [
      {
        // TON/USDT Ston.fi
        tokenAddress: 'EQC_1YoM8RBixN95lz7odcF3Vrkc_N8Ne7gQi7Abtlet_Efi', // USDT
        poolAddress: 'EQD-cvR0Nz6XAyRBpZWOIfmbSM_AgxHp_4lcc5EEeF7h4xPu',   // TON/USDT pool  
        exchange: 'ston' as DexExchange,
        description: 'TON/USDT Ston.fi Pool'
      }
    ]
  }
};

// Exchange mapping for display names
export const EXCHANGE_NAMES = {
  // CEX
  htx: 'HTX (Huobi)',
  mexc: 'MEXC Global', 
  gateio: 'Gate.io',
  kucoin: 'KuCoin',
  xt: 'XT.com',
  lbank: 'LBank',
  bitmart: 'BitMart',
  phemex: 'Phemex',
  bitget: 'Bitget',
  bybit: 'Bybit',
  bingx: 'BingX',
  
  // DEX
  'uniswap-v2': 'Uniswap V2',
  'uniswap-v3': 'Uniswap V3', 
  'pancakeswap': 'PancakeSwap',
  'raydium': 'Raydium',
  'ston': 'Ston.fi'
} as const; 