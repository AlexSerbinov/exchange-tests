import { CexExchange, DexExchange } from '../config/exchanges.config';

// Basic trading pair interface
export interface TradingPair {
  base: string;
  quote: string;
}

// DEX pool configuration
export interface DexPool {
  tokenAddress: string;
  poolAddress: string;
  exchange: DexExchange;
  description: string;
}

// API Response interfaces based on OpenAPI spec
export interface PriceResponse {
  price?: number;
  volume?: number;
  timestamp?: string;
  symbol?: string;
  exchange?: string;
  [key: string]: any; // Allow for additional fields from different exchanges
}

export interface OrderbookResponse {
  bids?: Array<[number, number]>; // [price, quantity]
  asks?: Array<[number, number]>;
  timestamp?: string;
  symbol?: string;
  exchange?: string;
  [key: string]: any;
}

export interface TradesResponse {
  trades?: Array<{
    price: number;
    quantity: number;
    timestamp: string;
    side?: 'buy' | 'sell';
  }>;
  symbol?: string;
  exchange?: string;
  [key: string]: any;
}

export interface HistoricalDataResponse {
  data?: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  symbol?: string;
  timeframe?: string;
  exchange?: string;
  [key: string]: any;
}

export interface PoolDataResponse {
  liquidity?: number;
  token0?: string;
  token1?: string;
  reserve0?: number;
  reserve1?: number;
  fee?: number;
  [key: string]: any;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services?: Record<string, any>;
  [key: string]: any;
}

// Test result interfaces
export interface TestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
  data?: any;
  timestamp: string;
}

export interface ExchangeTestResult {
  exchange: CexExchange | DexExchange;
  displayName: string;
  endpoints: {
    price?: TestResult;
    orderbook?: TestResult;
    trades?: TestResult;
    history?: TestResult;
    poolData?: TestResult;
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageResponseTime: number;
    success: boolean;
  };
}

export interface TestSummary {
  timestamp: string;
  totalExchanges: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  slowestExchanges: Array<{
    exchange: string;
    averageTime: number;
  }>;
  fastestExchanges: Array<{
    exchange: string;
    averageTime: number;
  }>;
  failedExchanges: Array<{
    exchange: string;
    errors: string[];
  }>;
  performanceIssues: Array<{
    exchange: string;
    endpoint: string;
    responseTime: number;
    threshold: number;
  }>;
}

export interface TestReport {
  summary: TestSummary;
  exchangeResults: ExchangeTestResult[];
  directTestResults?: { [exchangeName: string]: TestResult };
  configuration: {
    apiBaseUrl: string;
    performanceTarget: number;
    testPairs: TradingPair[];
    retryCount: number;
  };
  metadata: {
    generatedAt: string;
    version: string;
    testDuration: number;
  };
}

// Validation result interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldValidation: Record<string, {
    present: boolean;
    type: string;
    valid: boolean;
    value?: any;
  }>;
}

// Error types
export class ApiTestError extends Error {
  constructor(
    message: string,
    public exchange: string,
    public endpoint: string,
    public statusCode?: number,
    public responseData?: any
  ) {
    super(message);
    this.name = 'ApiTestError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public validationResult: ValidationResult
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Performance metrics
export interface PerformanceMetrics {
  responseTime: number;
  isSlowResponse: boolean;
  isVerySlowResponse: boolean;
  percentile95?: number;
  measurements: number[];
}

// Test configuration types
export interface TestConfiguration {
  targetExchanges?: (CexExchange | DexExchange)[];
  targetEndpoints?: string[];
  targetPairs?: TradingPair[];
  performanceThresholds?: {
    warning: number;
    error: number;
  };
  retryPolicy?: {
    maxRetries: number;
    delayMs: number;
    exponentialBackoff: boolean;
  };
} 