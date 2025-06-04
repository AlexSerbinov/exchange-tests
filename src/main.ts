import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { MarketDataTestService } from './services/market-data-test.service';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('MarketDataTestRunner');
  
  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Get the test service
    const testService = app.get(MarketDataTestService);

    logger.log('🚀 Starting Market Data API Tests...');
    logger.log('━'.repeat(60));

    // Quick connectivity test first
    logger.log('Testing API connectivity...');
    const isConnected = await testService.testConnectivity();
    
    if (!isConnected) {
      logger.error('❌ Cannot connect to API. Please check the API URL and try again.');
      process.exit(1);
    }
    
    logger.log('✅ API connectivity verified');
    logger.log('━'.repeat(60));

    // Run comprehensive tests
    const report = await testService.runAllTests();

    // Create reports directory if it doesn't exist
    const reportsDir = './reports';
    try {
      mkdirSync(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save JSON report
    const jsonReportPath = join(reportsDir, `market-data-test-${Date.now()}.json`);
    writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    logger.log(`📄 JSON report saved: ${jsonReportPath}`);

    // Print summary to console
    logger.log('━'.repeat(60));
    logger.log('📊 TEST SUMMARY');
    logger.log('━'.repeat(60));
    logger.log(`Total Exchanges Tested: ${report.summary.totalExchanges}`);
    logger.log(`Total Tests Run: ${report.summary.totalTests}`);
    logger.log(`Tests Passed: ${report.summary.passedTests}`);
    logger.log(`Tests Failed: ${report.summary.failedTests}`);
    logger.log(`Average Response Time: ${Math.round(report.summary.averageResponseTime)}ms`);
    
    if (report.summary.performanceIssues.length > 0) {
      logger.warn('⚠️  PERFORMANCE ISSUES DETECTED:');
      report.summary.performanceIssues.forEach(issue => {
        logger.warn(`  ${issue.exchange} ${issue.endpoint}: ${issue.responseTime}ms (limit: ${issue.threshold}ms)`);
      });
    }

    if (report.summary.failedExchanges.length > 0) {
      logger.error('❌ FAILED EXCHANGES:');
      report.summary.failedExchanges.forEach(failed => {
        logger.error(`  ${failed.exchange}: ${failed.errors.join(', ')}`);
      });
    }

    // Show top performers
    if (report.summary.fastestExchanges.length > 0) {
      logger.log('🏆 TOP PERFORMERS:');
      report.summary.fastestExchanges.slice(0, 3).forEach(fast => {
        logger.log(`  ${fast.exchange}: ${Math.round(fast.averageTime)}ms`);
      });
    }

    if (report.summary.slowestExchanges.length > 0) {
      logger.log('🐌 SLOWEST EXCHANGES:');
      report.summary.slowestExchanges.slice(0, 3).forEach(slow => {
        logger.log(`  ${slow.exchange}: ${Math.round(slow.averageTime)}ms`);
      });
    }

    logger.log('━'.repeat(60));
    
    const successRate = Math.round((report.summary.passedTests / report.summary.totalTests) * 100);
    if (successRate >= 90) {
      logger.log(`✅ Test completed successfully! Success rate: ${successRate}%`);
    } else if (successRate >= 70) {
      logger.warn(`⚠️  Test completed with warnings. Success rate: ${successRate}%`);
    } else {
      logger.error(`❌ Test completed with errors. Success rate: ${successRate}%`);
    }

    logger.log(`📄 Detailed report available at: ${jsonReportPath}`);

    // Close the application
    await app.close();
    
    process.exit(successRate >= 70 ? 0 : 1);

  } catch (error) {
    logger.error('Fatal error during test execution:', error);
    process.exit(1);
  }
}

bootstrap(); 