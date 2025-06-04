export interface WebSocketTestResult {
  endpoint: string;
  exchange: string;
  connectionTime: number;
  firstMessageTime?: number;
  messageCount: number;
  success: boolean;
  error?: string;
  messages: WebSocketMessage[];
}

export interface WebSocketMessage {
  timestamp: number;
  data: any;
  size: number; // Size in bytes
}

export interface WebSocketConnectionResult {
  connected: boolean;
  connectionTime: number;
  error?: string;
}

export interface WebSocketTestSummary {
  totalTests: number;
  successfulConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  averageFirstMessageTime: number;
  totalMessagesReceived: number;
  successRate: number;
}

export interface WebSocketTestReport {
  timestamp: string;
  testDuration: number;
  summary: WebSocketTestSummary;
  cexResults: WebSocketTestResult[];
  dexResults: WebSocketTestResult[];
  healthResults: {
    health: boolean;
    readiness: boolean;
    healthTime?: number;
    readinessTime?: number;
  };
}

export type WebSocketEndpointType = 'price' | 'orderbook' | 'health' | 'readiness';
export type WebSocketExchangeType = 'cex' | 'dex'; 