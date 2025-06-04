import { Injectable, Logger } from '@nestjs/common';
import * as WebSocket from 'ws';
import axios from 'axios';
import {
  WebSocketTestResult,
  WebSocketConnectionResult,
  WebSocketMessage,
  WebSocketEndpointType,
} from '../types/websocket.types';
import {
  WEBSOCKET_CONFIG,
  WEBSOCKET_ENDPOINTS,
  WS_TEST_PAIRS,
} from '../config/websocket.config';

@Injectable()
export class WebSocketClientService {
  private readonly logger = new Logger(WebSocketClientService.name);

  /**
   * Test WebSocket connection and message reception
   */
  async testWebSocketEndpoint(
    endpoint: WebSocketEndpointType,
    exchange: string,
    exchangeType: 'cex' | 'dex',
    testDuration: number = 5000,
  ): Promise<WebSocketTestResult> {
    const startTime = Date.now();
    let ws: WebSocket | null = null;
    
    try {
      // Build WebSocket URL
      const wsUrl = this.buildWebSocketUrl(endpoint, exchange, exchangeType);
      this.logger.log(`Testing WebSocket: ${wsUrl}`);

      // Test connection
      const connectionResult = await this.establishConnection(wsUrl);
      
      if (!connectionResult.connected) {
        return {
          endpoint,
          exchange,
          connectionTime: connectionResult.connectionTime,
          messageCount: 0,
          success: false,
          error: connectionResult.error,
          messages: [],
        };
      }

      ws = connectionResult.ws as any;
      
      // Collect messages for test duration
      const messages: WebSocketMessage[] = [];
      let firstMessageTime: number | undefined;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws?.close();
          
          const result: WebSocketTestResult = {
            endpoint,
            exchange,
            connectionTime: connectionResult.connectionTime,
            firstMessageTime,
            messageCount: messages.length,
            success: true,
            messages: messages.slice(0, 5), // Keep only first 5 messages to save space
          };
          
          this.logger.log(
            `${exchange} ${endpoint}: ${messages.length} messages in ${testDuration}ms`
          );
          resolve(result);
        }, testDuration);

        ws!.on('message', (data) => {
          if (!firstMessageTime) {
            firstMessageTime = Date.now() - startTime;
            this.logger.log(`${exchange} ${endpoint}: First message in ${firstMessageTime}ms`);
          }

          try {
            const dataString = data.toString();
            const parsedData = JSON.parse(dataString);
            messages.push({
              timestamp: Date.now(),
              data: parsedData,
              size: Buffer.byteLength(dataString, 'utf8'),
            });
          } catch (error) {
            const dataString = data.toString();
            messages.push({
              timestamp: Date.now(),
              data: dataString,
              size: Buffer.byteLength(dataString, 'utf8'),
            });
          }
        });

        ws!.on('error', (error) => {
          clearTimeout(timeout);
          ws?.close();
          
          resolve({
            endpoint,
            exchange,
            connectionTime: connectionResult.connectionTime,
            firstMessageTime,
            messageCount: messages.length,
            success: false,
            error: error.message,
            messages: messages.slice(0, 5),
          });
        });

        ws!.on('close', () => {
          clearTimeout(timeout);
        });
      });

    } catch (error) {
      return {
        endpoint,
        exchange,
        connectionTime: Date.now() - startTime,
        messageCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: [],
      };
    }
  }

  /**
   * Test HTTP health endpoints
   */
  async testHealthEndpoints(): Promise<{
    health: boolean;
    readiness: boolean;
    healthTime?: number;
    readinessTime?: number;
  }> {
    const results = {
      health: false,
      readiness: false,
      healthTime: undefined as number | undefined,
      readinessTime: undefined as number | undefined,
    };

    // Test health endpoint
    try {
      const startTime = Date.now();
      const response = await axios.get(
        `${WEBSOCKET_CONFIG.httpBaseUrl}${WEBSOCKET_ENDPOINTS.HEALTH}`,
        { timeout: WEBSOCKET_CONFIG.timeout }
      );
      
      results.healthTime = Date.now() - startTime;
      results.health = response.status === 200;
      
      this.logger.log(`Health check: ${response.status} (${results.healthTime}ms)`);
    } catch (error) {
      this.logger.error(`Health check failed: ${error instanceof Error ? error.message : error}`);
    }

    // Test readiness endpoint
    try {
      const startTime = Date.now();
      const response = await axios.get(
        `${WEBSOCKET_CONFIG.httpBaseUrl}${WEBSOCKET_ENDPOINTS.READINESS}`,
        { timeout: WEBSOCKET_CONFIG.timeout }
      );
      
      results.readinessTime = Date.now() - startTime;
      results.readiness = response.status === 200;
      
      this.logger.log(`Readiness check: ${response.status} (${results.readinessTime}ms)`);
    } catch (error) {
      this.logger.error(`Readiness check failed: ${error instanceof Error ? error.message : error}`);
    }

    return results;
  }

  /**
   * Establish WebSocket connection
   */
  private async establishConnection(url: string): Promise<WebSocketConnectionResult & { ws?: WebSocket }> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve({
            connected: false,
            connectionTime: Date.now() - startTime,
            error: 'Connection timeout',
          });
        }, WEBSOCKET_CONFIG.connectionTimeout);

        ws.on('open', () => {
          clearTimeout(timeout);
          resolve({
            connected: true,
            connectionTime: Date.now() - startTime,
            ws,
          });
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          resolve({
            connected: false,
            connectionTime: Date.now() - startTime,
            error: error.message,
          });
        });

      } catch (error) {
        resolve({
          connected: false,
          connectionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Build WebSocket URL based on endpoint and exchange
   */
  private buildWebSocketUrl(
    endpoint: WebSocketEndpointType,
    exchange: string,
    exchangeType: 'cex' | 'dex',
  ): string {
    const baseUrl = WEBSOCKET_CONFIG.baseUrl;
    
    switch (endpoint) {
      case 'price':
        if (exchangeType === 'cex') {
          return `${baseUrl}${WEBSOCKET_ENDPOINTS.PRICE
            .replace('{base}', WS_TEST_PAIRS.cex.base)
            .replace('{quote}', WS_TEST_PAIRS.cex.quote)
            .replace('{exchange}', exchange)}`;
        } else {
          return `${baseUrl}/get-price/dex/${WS_TEST_PAIRS.dex.tokenAddress}/${WS_TEST_PAIRS.dex.poolAddress}/${WS_TEST_PAIRS.dex.chainId}/${exchange}`;
        }
        
      case 'orderbook':
        // Orderbook is CEX only
        return `${baseUrl}${WEBSOCKET_ENDPOINTS.ORDERBOOK
          .replace('{base}', WS_TEST_PAIRS.cex.base)
          .replace('{quote}', WS_TEST_PAIRS.cex.quote)
          .replace('{depth}', WS_TEST_PAIRS.cex.depth.toString())
          .replace('{exchange}', exchange)}`;
          
      default:
        throw new Error(`Unsupported endpoint: ${endpoint}`);
    }
  }
} 