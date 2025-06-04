import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { appConfig } from '../config/app.config';
import { 
  PriceResponse, 
  OrderbookResponse, 
  TradesResponse, 
  TestResult,
  HistoricalDataResponse
} from '../types/api.types';
import { CexExchange, DexExchange } from '../config/exchanges.config';

@Injectable()
export class ApiClientService {
  private readonly logger = new Logger(ApiClientService.name);
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: appConfig.api.baseUrl,
      timeout: appConfig.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
      }
    });
  }

  /**
   * Execute API request with timing and error handling
   */
  private async executeRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    exchange: string,
    endpoint: string
  ): Promise<TestResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const response = await requestFn();
      const responseTime = Date.now() - startTime;

      this.logger.log(`${exchange} ${endpoint}: ${responseTime}ms (${response.status})`);

      return {
        success: true,
        responseTime,
        statusCode: response.status,
        data: response.data,
        timestamp
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof AxiosError) {
        const statusCode = error.response?.status;
        const errorMessage = error.message;
        
        this.logger.error(`${exchange} ${endpoint}: ${errorMessage} (${statusCode || 'no response'})`);
        
        return {
          success: false,
          responseTime,
          statusCode,
          error: errorMessage,
          data: error.response?.data,
          timestamp
        };
      }

      this.logger.error(`${exchange} ${endpoint}: Unknown error`, error);
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
    }
  }

  /**
   * Test CEX price endpoint: /get-price/{base}/{quote}/{exchange}
   */
  async testCexPrice(base: string, quote: string, exchange: CexExchange): Promise<TestResult> {
    const endpoint = `/get-price/${base}/${quote}/${exchange}`;
    
    return this.executeRequest<PriceResponse>(
      () => this.httpClient.get(endpoint),
      exchange,
      'price'
    );
  }

  /**
   * Test CEX orderbook endpoint: /get-orderbook/{base}/{quote}/{depth}/{exchange}
   */
  async testCexOrderbook(base: string, quote: string, depth: number, exchange: CexExchange): Promise<TestResult> {
    const endpoint = `/get-orderbook/${base}/${quote}/${depth}/${exchange}`;
    
    return this.executeRequest<OrderbookResponse>(
      () => this.httpClient.get(endpoint),
      exchange,
      'orderbook'
    );
  }

  /**
   * Test CEX trades endpoint: /get-trades/{base}/{quote}/{exchange}
   */
  async testCexTrades(base: string, quote: string, exchange: CexExchange): Promise<TestResult> {
    const endpoint = `/get-trades/${base}/${quote}/${exchange}`;
    
    return this.executeRequest<TradesResponse>(
      () => this.httpClient.get(endpoint),
      exchange,
      'trades'
    );
  }

  /**
   * Test CEX history endpoint: /get-history/cex/{tickerA}/{tickerB}/{timeframe}/{cexExchange}
   */
  async testCexHistory(tickerA: string, tickerB: string, timeframe: string, exchange: CexExchange): Promise<TestResult> {
    const endpoint = `/get-history/cex/${tickerA}/${tickerB}/${timeframe}/${exchange}`;
    
    return this.executeRequest<HistoricalDataResponse>(
      () => this.httpClient.get(endpoint),
      exchange,
      'history'
    );
  }

  /**
   * Test health endpoint: /health
   */
  async testHealth(): Promise<TestResult> {
    const endpoint = '/health';
    
    return this.executeRequest<any>(
      () => this.httpClient.get(endpoint),
      'system',
      'health'
    );
  }

  /**
   * Test readiness endpoint: /readiness
   */
  async testReadiness(): Promise<TestResult> {
    const endpoint = '/readiness';
    
    return this.executeRequest<any>(
      () => this.httpClient.get(endpoint),
      'system',
      'readiness'
    );
  }
} 