import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { WebSocketTestService } from './services/websocket-test.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('WebSocketTestRunner');
  
  try {
    logger.log('🚀 Starting WebSocket Market Data API Tests...');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get WebSocket test service
    const wsTestService = app.get(WebSocketTestService);
    
    // Run comprehensive WebSocket tests
    const report = await wsTestService.runAllWebSocketTests();
    
    // Save JSON report
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFileName = `websocket-test-${Date.now()}.json`;
    const reportPath = path.join(reportsDir, reportFileName);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logger.log(`📄 JSON report saved: reports/${reportFileName}`);
    
    // Final status
    if (report.summary.successRate >= 80) {
      logger.log(`✅ WebSocket tests completed successfully! Success rate: ${report.summary.successRate}%`);
    } else if (report.summary.successRate >= 50) {
      logger.warn(`⚠️ WebSocket tests completed with warnings. Success rate: ${report.summary.successRate}%`);
    } else {
      logger.error(`❌ WebSocket tests failed. Success rate: ${report.summary.successRate}%`);
    }
    
    logger.log(`📄 Detailed report available at: reports/${reportFileName}`);
    
    await app.close();
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ WebSocket test runner failed:', error);
    process.exit(1);
  }
}

bootstrap(); 