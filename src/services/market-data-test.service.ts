import { Injectable, Logger } from '@nestjs/common';
import { ApiClientService } from './api-client.service';
import { 
  CEX_EXCHANGES, 
  CEX_TEST_PAIRS, 
  EXCHANGE_NAMES,
  CexExchange 
} from '../config/exchanges.config';
import { 
  TestResult, 
  ExchangeTestResult, 
  TestSummary,
  TestReport,
  TradingPair 
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

    // Test all CEX exchanges
    const cexResults = await this.testAllCexExchanges();
    
    // TODO: Add DEX testing in next phase
    
    const endTime = Date.now();
    const testDuration = endTime - startTime;

    // Generate summary
    const summary = this.generateTestSummary(cexResults);
    
    // Create final report
    const report: TestReport = {
      summary,
      exchangeResults: cexResults,
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
   * Test all CEX exchanges with all test pairs
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
   * Test a single CEX exchange with primary test pair
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
      results.price = {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
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
} 