import { Injectable, Logger } from '@nestjs/common';
import { WebSocketClientService } from './websocket-client.service';
import {
  WebSocketTestReport,
  WebSocketTestResult,
  WebSocketTestSummary,
} from '../types/websocket.types';
import {
  WS_CEX_EXCHANGES,
  WS_DEX_EXCHANGES,
} from '../config/websocket.config';

@Injectable()
export class WebSocketTestService {
  private readonly logger = new Logger(WebSocketTestService.name);

  constructor(private readonly wsClient: WebSocketClientService) {}

  /**
   * Run comprehensive WebSocket tests
   */
  async runAllWebSocketTests(): Promise<WebSocketTestReport> {
    this.logger.log('🚀 Starting WebSocket API tests...');
    const startTime = Date.now();

    // Test health endpoints first
    this.logger.log('Testing WebSocket service health...');
    const healthResults = await this.wsClient.testHealthEndpoints();

    // Test CEX WebSocket endpoints
    this.logger.log('Testing CEX WebSocket endpoints...');
    const cexResults = await this.testCexWebSockets();

    // Test DEX WebSocket endpoints
    this.logger.log('Testing DEX WebSocket endpoints...');
    const dexResults = await this.testDexWebSockets();

    const testDuration = Date.now() - startTime;
    
    // Calculate summary
    const allResults = [...cexResults, ...dexResults];
    const summary = this.calculateSummary(allResults);

    const report: WebSocketTestReport = {
      timestamp: new Date().toISOString(),
      testDuration,
      summary,
      cexResults,
      dexResults,
      healthResults,
    };

    this.logSummary(report);
    
    return report;
  }

  /**
   * Test CEX WebSocket endpoints
   */
  private async testCexWebSockets(): Promise<WebSocketTestResult[]> {
    const results: WebSocketTestResult[] = [];

    for (const exchange of WS_CEX_EXCHANGES) {
      this.logger.log(`Testing CEX WebSocket: ${exchange}`);

      // Test price endpoint
      try {
        const priceResult = await this.wsClient.testWebSocketEndpoint(
          'price',
          exchange,
          'cex',
          5000, // 5 seconds test duration
        );
        results.push(priceResult);
        
        this.logger.log(
          `${exchange} price: ${priceResult.success ? '✅' : '❌'} ` +
          `(${priceResult.connectionTime}ms connection, ${priceResult.messageCount} messages)`
        );
      } catch (error) {
        this.logger.error(`${exchange} price test failed:`, error);
        results.push({
          endpoint: 'price',
          exchange,
          connectionTime: 0,
          messageCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          messages: [],
        });
      }

      // Test orderbook endpoint
      try {
        const orderbookResult = await this.wsClient.testWebSocketEndpoint(
          'orderbook',
          exchange,
          'cex',
          5000, // 5 seconds test duration
        );
        results.push(orderbookResult);
        
        this.logger.log(
          `${exchange} orderbook: ${orderbookResult.success ? '✅' : '❌'} ` +
          `(${orderbookResult.connectionTime}ms connection, ${orderbookResult.messageCount} messages)`
        );
      } catch (error) {
        this.logger.error(`${exchange} orderbook test failed:`, error);
        results.push({
          endpoint: 'orderbook',
          exchange,
          connectionTime: 0,
          messageCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          messages: [],
        });
      }

      // Small delay between exchanges
      await this.sleep(500);
    }

    return results;
  }

  /**
   * Test DEX WebSocket endpoints
   */
  private async testDexWebSockets(): Promise<WebSocketTestResult[]> {
    const results: WebSocketTestResult[] = [];

    for (const exchange of WS_DEX_EXCHANGES) {
      this.logger.log(`Testing DEX WebSocket: ${exchange}`);

      // Test price endpoint (DEX only has price, no orderbook)
      try {
        const priceResult = await this.wsClient.testWebSocketEndpoint(
          'price',
          exchange,
          'dex',
          5000, // 5 seconds test duration
        );
        results.push(priceResult);
        
        this.logger.log(
          `${exchange} price: ${priceResult.success ? '✅' : '❌'} ` +
          `(${priceResult.connectionTime}ms connection, ${priceResult.messageCount} messages)`
        );
      } catch (error) {
        this.logger.error(`${exchange} price test failed:`, error);
        results.push({
          endpoint: 'price',
          exchange,
          connectionTime: 0,
          messageCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          messages: [],
        });
      }

      // Small delay between exchanges
      await this.sleep(500);
    }

    return results;
  }

  /**
   * Calculate test summary statistics
   */
  private calculateSummary(results: WebSocketTestResult[]): WebSocketTestSummary {
    const totalTests = results.length;
    const successfulConnections = results.filter(r => r.success).length;
    const failedConnections = totalTests - successfulConnections;
    
    const connectionTimes = results
      .filter(r => r.connectionTime > 0)
      .map(r => r.connectionTime);
    
    const firstMessageTimes = results
      .filter(r => r.firstMessageTime !== undefined)
      .map(r => r.firstMessageTime!);
    
    const totalMessagesReceived = results.reduce(
      (sum, r) => sum + r.messageCount,
      0
    );

    return {
      totalTests,
      successfulConnections,
      failedConnections,
      averageConnectionTime: connectionTimes.length > 0 
        ? Math.round(connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length)
        : 0,
      averageFirstMessageTime: firstMessageTimes.length > 0
        ? Math.round(firstMessageTimes.reduce((a, b) => a + b, 0) / firstMessageTimes.length)
        : 0,
      totalMessagesReceived,
      successRate: totalTests > 0 ? Math.round((successfulConnections / totalTests) * 100) : 0,
    };
  }

  /**
   * Log comprehensive test summary
   */
  private logSummary(report: WebSocketTestReport): void {
    const { summary, healthResults } = report;
    
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('📊 WEBSOCKET TEST SUMMARY');
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log(`Total WebSocket Tests: ${summary.totalTests}`);
    this.logger.log(`Successful Connections: ${summary.successfulConnections}`);
    this.logger.log(`Failed Connections: ${summary.failedConnections}`);
    this.logger.log(`Success Rate: ${summary.successRate}%`);
    this.logger.log(`Average Connection Time: ${summary.averageConnectionTime}ms`);
    this.logger.log(`Average First Message Time: ${summary.averageFirstMessageTime}ms`);
    this.logger.log(`Total Messages Received: ${summary.totalMessagesReceived}`);
    
    this.logger.log('');
    this.logger.log('🏥 HEALTH CHECK RESULTS:');
    this.logger.log(`Health: ${healthResults.health ? '✅' : '❌'} ${healthResults.healthTime ? `(${healthResults.healthTime}ms)` : ''}`);
    this.logger.log(`Readiness: ${healthResults.readiness ? '✅' : '❌'} ${healthResults.readinessTime ? `(${healthResults.readinessTime}ms)` : ''}`);
    
    // Show failed connections
    const failed = [...report.cexResults, ...report.dexResults].filter(r => !r.success);
    if (failed.length > 0) {
      this.logger.error('');
      this.logger.error('❌ FAILED WEBSOCKET CONNECTIONS:');
      failed.forEach(result => {
        this.logger.error(`  ${result.exchange} ${result.endpoint}: ${result.error}`);
      });
    }
    
    // Show top performers
    const successful = [...report.cexResults, ...report.dexResults]
      .filter(r => r.success && r.messageCount > 0)
      .sort((a, b) => b.messageCount - a.messageCount);
    
    if (successful.length > 0) {
      this.logger.log('');
      this.logger.log('🏆 TOP MESSAGE PERFORMERS:');
      successful.slice(0, 3).forEach(result => {
        this.logger.log(`  ${result.exchange} ${result.endpoint}: ${result.messageCount} messages in 5s`);
      });
    }

    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Helper function to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 