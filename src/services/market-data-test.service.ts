import { Injectable, Logger } from '@nestjs/common';
import { ApiClientService } from './api-client.service';
import { 
  CEX_EXCHANGES, 
  DEX_EXCHANGES,
  CEX_TEST_PAIRS, 
  DEX_TEST_POOLS,
  EXCHANGE_NAMES,
  CexExchange,
  DexExchange 
} from '../config/exchanges.config';
import { 
  TestResult, 
  ExchangeTestResult, 
  TestSummary,
  TestReport,
  TradingPair,
  DexPool 
} from '../types/api.types';
import { appConfig } from '../config/app.config';

@Injectable()
export class MarketDataTestService {
  private readonly logger = new Logger(MarketDataTestService.name);

  constructor(private readonly apiClient: ApiClientService) {}

  /**
   * Run comprehensive tests for all exchanges
   */
  async runAllTests(): Promise<TestReport> {
    this.logger.log('Starting comprehensive market data API tests...');
    const startTime = Date.now();

    // Test system health first
    const healthResult = await this.apiClient.testHealth();
    this.logger.log(`System health check: ${healthResult.success ? 'PASSED' : 'FAILED'}`);

    // Test readiness endpoint
    const readinessResult = await this.apiClient.testReadiness();
    this.logger.log(`System readiness check: ${readinessResult.success ? 'PASSED' : 'FAILED'}`);

    // Test all CEX exchanges through our API
    const cexResults = await this.testAllCexExchanges();
    
    // Test all DEX exchanges through our API
    const dexResults = await this.testAllDexExchanges();
    
    // Test exchanges directly for comparison (CEX only)
    this.logger.log('Testing exchanges directly for performance comparison...');
    const directResults = await this.testAllExchangesDirectly();
    
    const endTime = Date.now();
    const testDuration = endTime - startTime;

    // Combine CEX and DEX results
    const allResults = [...cexResults, ...dexResults];

    // Generate summary
    const summary = this.generateTestSummary(allResults);
    
    // Create final report
    const report: TestReport = {
      summary,
      exchangeResults: allResults,
      directTestResults: directResults, // Add direct test results
      configuration: {
        apiBaseUrl: appConfig.api.baseUrl,
        performanceTarget: appConfig.performance.targetMs,
        testPairs: CEX_TEST_PAIRS,
        retryCount: appConfig.test.retryCount
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        testDuration
      }
    };

    this.logger.log(`Tests completed in ${testDuration}ms`);
    this.logger.log(`Summary: ${summary.passedTests}/${summary.totalTests} tests passed`);

    return report;
  }

  /**
   * Test all CEX exchanges with all test pairs and endpoints
   */
  private async testAllCexExchanges(): Promise<ExchangeTestResult[]> {
    const results: ExchangeTestResult[] = [];

    for (const exchange of CEX_EXCHANGES) {
      this.logger.log(`Testing CEX exchange: ${EXCHANGE_NAMES[exchange]}`);
      
      const exchangeResult = await this.testCexExchange(exchange);
      results.push(exchangeResult);
      
      this.logger.log(`${exchange}: ${exchangeResult.summary.passedTests}/${exchangeResult.summary.totalTests} tests passed`);
    }

    return results;
  }

  /**
   * Test all DEX exchanges with test pools and endpoints
   */
  private async testAllDexExchanges(): Promise<ExchangeTestResult[]> {
    const results: ExchangeTestResult[] = [];

    for (const exchange of DEX_EXCHANGES) {
      this.logger.log(`Testing DEX exchange: ${EXCHANGE_NAMES[exchange]}`);
      
      const exchangeResult = await this.testDexExchange(exchange);
      results.push(exchangeResult);
      
      this.logger.log(`${exchange}: ${exchangeResult.summary.passedTests}/${exchangeResult.summary.totalTests} tests passed`);
    }

    return results;
  }

  /**
   * Test a single CEX exchange with multiple endpoints
   */
  private async testCexExchange(exchange: CexExchange): Promise<ExchangeTestResult> {
    const primaryPair = CEX_TEST_PAIRS[0]; // BTC/USDT as primary test
    const results: { [key: string]: TestResult } = {};
    
    // Test price endpoint (most basic and important)
    try {
      results.price = await this.apiClient.testCexPrice(
        primaryPair.base, 
        primaryPair.quote, 
        exchange
      );
    } catch (error) {
      this.logger.error(`Price test failed for ${exchange}:`, error);
      results.price = this.createErrorResult(error);
    }

    // Test orderbook endpoint (depth 10)
    try {
      results.orderbook = await this.apiClient.testCexOrderbook(
        primaryPair.base,
        primaryPair.quote,
        10, // depth
        exchange
      );
    } catch (error) {
      this.logger.error(`Orderbook test failed for ${exchange}:`, error);
      results.orderbook = this.createErrorResult(error);
    }

    // Test trades endpoint
    try {
      results.trades = await this.apiClient.testCexTrades(
        primaryPair.base,
        primaryPair.quote,
        exchange
      );
    } catch (error) {
      this.logger.error(`Trades test failed for ${exchange}:`, error);
      results.trades = this.createErrorResult(error);
    }

    // Test history endpoint (1H timeframe)
    try {
      results.history = await this.apiClient.testCexHistory(
        primaryPair.base,
        primaryPair.quote,
        '1H', // timeframe
        exchange
      );
    } catch (error) {
      this.logger.error(`History test failed for ${exchange}:`, error);
      results.history = this.createErrorResult(error);
    }

    // Calculate summary
    const testResults = Object.values(results);
    const passedTests = testResults.filter(r => r.success).length;
    const totalTests = testResults.length;
    const averageResponseTime = testResults.length > 0 
      ? testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length 
      : 0;

    const exchangeResult: ExchangeTestResult = {
      exchange,
      displayName: EXCHANGE_NAMES[exchange],
      endpoints: results,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        averageResponseTime,
        success: passedTests === totalTests
      }
    };

    return exchangeResult;
  }

  /**
   * Test a single DEX exchange with multiple endpoints
   */
  private async testDexExchange(exchange: DexExchange): Promise<ExchangeTestResult> {
    const results: { [key: string]: TestResult } = {};
    
    // Get the first available pool for this exchange
    const testPool = this.getTestPoolForExchange(exchange);
    
    if (!testPool) {
      this.logger.warn(`No test pool configured for DEX exchange: ${exchange}`);
      return {
        exchange,
        displayName: EXCHANGE_NAMES[exchange],
        endpoints: {},
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          averageResponseTime: 0,
          success: false
        }
      };
    }

    // Test DEX price endpoint
    try {
      results.price = await this.apiClient.testDexPrice(
        testPool.tokenAddress,
        testPool.poolAddress,
        this.getChainIdForExchange(exchange),
        exchange
      );
    } catch (error) {
      this.logger.error(`DEX price test failed for ${exchange}:`, error);
      results.price = this.createErrorResult(error);
    }

    // Test DEX trades endpoint
    try {
      results.trades = await this.apiClient.testDexTrades(
        testPool.tokenAddress,
        testPool.poolAddress,
        this.getChainIdForExchange(exchange),
        exchange
      );
    } catch (error) {
      this.logger.error(`DEX trades test failed for ${exchange}:`, error);
      results.trades = this.createErrorResult(error);
    }

    // Test DEX pool data endpoint
    try {
      results.poolData = await this.apiClient.testDexPoolData(
        testPool.tokenAddress,
        testPool.poolAddress,
        this.getChainIdForExchange(exchange),
        exchange
      );
    } catch (error) {
      this.logger.error(`DEX pool data test failed for ${exchange}:`, error);
      results.poolData = this.createErrorResult(error);
    }

    // Calculate summary
    const testResults = Object.values(results);
    const passedTests = testResults.filter(r => r.success).length;
    const totalTests = testResults.length;
    const averageResponseTime = testResults.length > 0 
      ? testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length 
      : 0;

    const exchangeResult: ExchangeTestResult = {
      exchange,
      displayName: EXCHANGE_NAMES[exchange],
      endpoints: results,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        averageResponseTime,
        success: passedTests === totalTests
      }
    };

    return exchangeResult;
  }

  /**
   * Get test pool for DEX exchange
   */
  private getTestPoolForExchange(exchange: DexExchange): DexPool | null {
    // Find first pool that matches the exchange
    for (const [chainKey, chainData] of Object.entries(DEX_TEST_POOLS)) {
      const pool = chainData.pools.find(p => p.exchange === exchange);
      if (pool) {
        return pool;
      }
    }
    return null;
  }

  /**
   * Get chain ID for DEX exchange
   */
  private getChainIdForExchange(exchange: DexExchange): string {
    for (const [chainKey, chainData] of Object.entries(DEX_TEST_POOLS)) {
      const hasExchange = chainData.pools.some(p => p.exchange === exchange);
      if (hasExchange) {
        return chainData.chainId;
      }
    }
    return '1'; // Default to Ethereum
  }

  /**
   * Create error result for failed tests
   */
  private createErrorResult(error: any): TestResult {
    return {
      success: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate test summary from exchange results
   */
  private generateTestSummary(exchangeResults: ExchangeTestResult[]): TestSummary {
    const totalExchanges = exchangeResults.length;
    const totalTests = exchangeResults.reduce((sum, r) => sum + r.summary.totalTests, 0);
    const passedTests = exchangeResults.reduce((sum, r) => sum + r.summary.passedTests, 0);
    const failedTests = totalTests - passedTests;

    // Calculate average response time across all tests
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    exchangeResults.forEach(exchangeResult => {
      Object.values(exchangeResult.endpoints).forEach(testResult => {
        if (testResult) {
          totalResponseTime += testResult.responseTime;
          responseTimeCount++;
        }
      });
    });

    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

    // Find slowest and fastest exchanges
    const exchangePerformance = exchangeResults.map(r => ({
      exchange: r.displayName,
      averageTime: r.summary.averageResponseTime
    })).filter(e => e.averageTime > 0);

    const slowestExchanges = exchangePerformance
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    const fastestExchanges = exchangePerformance
      .sort((a, b) => a.averageTime - b.averageTime)
      .slice(0, 5);

    // Find failed exchanges
    const failedExchanges = exchangeResults
      .filter(r => !r.summary.success)
      .map(r => ({
        exchange: r.displayName,
        errors: Object.values(r.endpoints)
          .filter(test => test && !test.success)
          .map(test => test!.error || 'Unknown error')
      }));

    // Find performance issues (responses > target threshold)
    const performanceIssues: Array<{
      exchange: string;
      endpoint: string;
      responseTime: number;
      threshold: number;
    }> = [];

    exchangeResults.forEach(exchangeResult => {
      Object.entries(exchangeResult.endpoints).forEach(([endpoint, testResult]) => {
        if (testResult && testResult.success && testResult.responseTime > appConfig.performance.targetMs) {
          performanceIssues.push({
            exchange: exchangeResult.displayName,
            endpoint,
            responseTime: testResult.responseTime,
            threshold: appConfig.performance.targetMs
          });
        }
      });
    });

    return {
      timestamp: new Date().toISOString(),
      totalExchanges,
      totalTests,
      passedTests,
      failedTests,
      averageResponseTime,
      slowestExchanges,
      fastestExchanges,
      failedExchanges,
      performanceIssues
    };
  }

  /**
   * Test a specific exchange (useful for debugging)
   */
  async testSpecificExchange(exchange: CexExchange): Promise<ExchangeTestResult> {
    this.logger.log(`Testing specific exchange: ${EXCHANGE_NAMES[exchange]}`);
    return this.testCexExchange(exchange);
  }

  /**
   * Quick connectivity test
   */
  async testConnectivity(): Promise<boolean> {
    const healthResult = await this.apiClient.testHealth();
    return healthResult.success;
  }

  /**
   * Test all exchanges directly (bypassing our API)
   */
  private async testAllExchangesDirectly(): Promise<{ [key: string]: TestResult }> {
    const directResults: { [key: string]: TestResult } = {};

    for (const exchange of CEX_EXCHANGES) {
      try {
        directResults[exchange] = await this.apiClient.testExchangeDirectly(exchange);
        this.logger.log(`Direct test ${exchange}: ${directResults[exchange].success ? 'SUCCESS' : 'FAILED'} (${directResults[exchange].responseTime}ms)`);
      } catch (error) {
        this.logger.error(`Direct test failed for ${exchange}:`, error);
        directResults[exchange] = this.createErrorResult(error);
      }
    }

    return directResults;
  }
} 