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

  /**
   * Test exchange directly (bypassing our API) for comparison
   */
  async testExchangeDirectly(exchange: CexExchange): Promise<TestResult> {
    const directUrls: Record<CexExchange, string> = {
      'htx': 'https://api.huobi.pro/market/detail/merged?symbol=btcusdt',
      'mexc': 'https://api.mexc.com/api/v3/ticker/24hr?symbol=BTCUSDT',
      'gateio': 'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BTC_USDT',
      'kucoin': 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT',
      'xt': 'https://sapi.xt.com/v4/public/ticker?symbol=btc_usdt',
      'lbank': 'https://api.lbank.info/v2/ticker.do?symbol=btc_usdt',
      'bitmart': 'https://api-cloud.bitmart.com/spot/v1/ticker?symbol=BTC_USDT',
      'phemex': 'https://api.phemex.com/md/ticker/24hr?symbol=BTCUSDT',
      'bitget': 'https://api.bitget.com/api/spot/v1/market/ticker?symbol=BTCUSDT',
      'bybit': 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT',
      'bingx': 'https://open-api.bingx.com/openApi/spot/v1/ticker/24hr?symbol=BTC-USDT'
    };

    const directClient = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ExchangeTestBot/1.0)',
        'Accept': 'application/json'
      }
    });

    const url = directUrls[exchange];
    if (!url) {
      return {
        success: false,
        responseTime: 0,
        error: 'Direct URL not configured for this exchange',
        timestamp: new Date().toISOString()
      };
    }

    return this.executeRequest<any>(
      () => directClient.get(url),
      exchange,
      'direct-test'
    );
  }
} 