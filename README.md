# Market Data API Testing Suite

## 📊 ОСТАННІ РЕЗУЛЬТАТИ ТЕСТУВАННЯ

### 🎯 **РОЗШИРЕНИЙ ТЕСТ ЗАВЕРШЕНО!**
**Дата тестування**: 2025-06-04  
**Статус**: ✅ Розширений тест з 4 endpoints - 66% success rate

### 📈 **Загальна статистика**
- **11 бірж протестовано** (всі доступні CEX біржі)
- **44 тести виконано** (4 endpoints × 11 бірж)
- **29 тестів пройшло** (66% success rate)
- **15 тестів не пройшло** (різні проблеми)
- **Середній час відповіді**: 2260ms
- **4 performance issues** (slow endpoints > 5000ms)

### 📋 **Тестовані Endpoints**
| Endpoint | Опис | Статус |
|----------|------|--------|
| `/get-price/{base}/{quote}/{exchange}` | Ціна токена | ✅ Найстабільніший |
| `/get-orderbook/{base}/{quote}/{depth}/{exchange}` | Книга ордерів | ⚠️ Проблеми на деяких біржах |
| `/get-trades/{base}/{quote}/{exchange}` | Останні трейди | ✅ Досить стабільний |
| `/get-history/cex/{tickerA}/{tickerB}/{timeframe}/{exchange}` | Історичні дані | ❌ Багато timeouts |
| `/health` | Статус системи | ✅ Працює |
| `/readiness` | Готовність системи | ✅ Працює |

### 🏆 **Найкращі біржі (усі endpoints працюють)**
| Біржа | Успішних тестів | Середній час | Статус |
|-------|-----------------|--------------|---------|
| HTX (Huobi) | 4/4 | 4243ms | ⚠️ Повільно, але стабільно |
| MEXC Global | 4/4 | 2131ms | ✅ Добре |

### ⚠️ **Проблемні endpoints**
| Біржа | Успішних | Проблеми |
|-------|----------|----------|
| KuCoin | 3/4 | Orderbook 404 error |
| XT.com | 3/4 | History timeout |
| LBank | 3/4 | History timeout |
| BitMart | 3/4 | History timeout |
| Phemex | 3/4 | History timeout |
| Bitget | 3/4 | History timeout |
| Bybit | 3/4 | History 404 error |

### ❌ **Повністю проблемні біржі**
| Біржа | Успішних | Проблеми |
|-------|----------|----------|
| Gate.io | 0/4 | Всі endpoints 404 error |
| BingX | 0/4 | Всі endpoints 404 error |

### ⚡ **Performance Issues (>5000ms)**
- **HTX trades**: 9044ms (дуже повільно)
- **HTX history**: 6967ms (повільно)
- **MEXC history**: 6990ms (повільно)
- **KuCoin history**: 6372ms (повільно)

### 🔍 **Детальна інформація про тестування**
- **Тестові ендпоінти**: 4 CEX endpoints + 2 system endpoints
- **API Base URL**: `https://market-data-service-dev.techchain.solutions/`
- **Timeout**: 10 секунд (багато history endpoints не встигають)
- **Performance threshold**: 5000ms
- **Test pair**: BTC/USDT
- **Orderbook depth**: 10 levels
- **History timeframe**: 1H

### 🚀 **Наступні кроки для покращення**
1. **Вирішити 404 помилки**: Gate.io та BingX endpoints
2. **Збільшити timeout**: History endpoints потребують >10 секунд
3. **Оптимізувати API**: History endpoints дуже повільні
4. **DEX інтеграція**: Додати 5 децентралізованих бірж
5. **Паралельне тестування**: Прискорити виконання тестів

---

## 🏗️ Про проєкт

Комплексна система тестування для market data API, яка перевіряє доступність та продуктивність 16 різних бірж (11 CEX + 5 DEX).

### 🎯 Особливості

- **Автоматизоване тестування** всіх доступних бірж
- **Метрики продуктивності** з детальним вимірюванням часу відповіді
- **Валідація даних** для перевірки якості API responses
- **Детальна звітність** у JSON та HTML форматах
- **Retry логіка** з exponential backoff для стабільності
- **TypeScript** з повною типізацією

## 🚀 Швидкий старт

### 1. Встановлення залежностей
```bash
npm install
```

### 2. Запуск тестів
```bash
# Основна команда для запуску всіх тестів
npm run test:run

# Або альтернативно
npm run start
```

### 3. Як запустити тестування 5 разів
```bash
# Автоматичний запуск 5 разів з паузою
npm run test:run:5x

# Або альтернативно:
./run-tests-5x.sh

# Або мануально:
for i in {1..5}; do
  echo "=== Test Run #$i ==="
  npm run test:run
  echo "Completed run $i/5"
  sleep 5
done
```

### 4. GitHub Repository
🔗 **Репозиторій**: https://github.com/AlexSerbinov/exchange-tests.git

```bash
# Клонування проєкту
git clone https://github.com/AlexSerbinov/exchange-tests.git
cd exchange-tests

# Встановлення та запуск
npm install
npm run test:run
```

## 📊 Результати тестування

### Console Output
Програма виводить у консоль:
- ✅ Connectivity статус
- 📊 Загальну статистику тестів  
- 🏆 Найшвидші біржі
- 🐌 Найповільніші біржі
- ⚠️ Performance issues (> 5 секунд)
- ❌ Помилки та failed тести

### JSON Report
Детальний звіт зберігається у папці `./reports/`:
```bash
./reports/market-data-test-[timestamp].json
```

Структура звіту:
```json
{
  "summary": {
    "totalExchanges": 11,
    "totalTests": 11, 
    "passedTests": 9,
    "failedTests": 2,
    "averageResponseTime": 1250,
    "slowestExchanges": [...],
    "fastestExchanges": [...],
    "performanceIssues": [...]
  },
  "exchangeResults": [...],
  "configuration": {...},
  "metadata": {...}
}
```

## 🏗️ Архітектура

```
src/
├── config/                 # Конфігурація API та бірж
│   ├── app.config.ts      # Основні налаштування
│   └── exchanges.config.ts # Конфігурація бірж та test data
├── services/              # Основні сервіси
│   ├── api-client.service.ts      # HTTP клієнт для API
│   └── market-data-test.service.ts # Логіка тестування  
├── types/                 # TypeScript типи
│   └── api.types.ts       # API responses та test результати
└── main.ts               # Entry point програми
```

## 📋 Підтримувані біржі

### CEX (Централізовані біржі) - 11/11 підключено
- **HTX (Huobi)** ✅, **MEXC Global** ⚠️, **Gate.io** ❌, **KuCoin** ✅, **XT.com** ✅
- **LBank** ✅, **BitMart** ✅, **Phemex** ✅, **Bitget** ✅, **Bybit** ✅, **BingX** ❌

### DEX (Децентралізовані біржі) - 0/5 підключено (TODO)
- **Uniswap V2/V3** (Ethereum) - 📋 TODO
- **PancakeSwap** (BSC) - 📋 TODO
- **Raydium** (Solana) - 📋 TODO
- **Ston.fi** (TON) - 📋 TODO

## 🔧 Конфігурація

Всі налаштування знаходяться в `src/config/app.config.ts`:

```typescript
export const appConfig = {
  api: {
    baseUrl: 'https://market-data-service-dev.techchain.solutions',
    timeout: 10000, // 10 секунд
  },
  performance: {
    targetMs: 5000,   // Цільовий час відповіді
    warningMs: 3000,  // Warning threshold
  },
  test: {
    retryCount: 3,        // Кількість повторних спроб
    retryDelay: 1000,     // Затримка між спробами
  }
};
```

### Test Data
CEX тести використовують стандартні пари:
- **BTC/USDT** ✅ (основна тестова пара - поточно тестується)
- **ETH/USDT, BNB/USDT, SOL/USDT, DOGE/USDT** 📋 (заплановано)

DEX тести використовують популярні пули:
- **Ethereum**: ETH/USDC, WBTC/ETH (Uniswap)
- **BSC**: BNB/USDT, CAKE/BNB (PancakeSwap)  
- **Solana**: SOL/USDC (Raydium)
- **TON**: TON/USDT (Ston.fi)

## 🐛 Troubleshooting

### Типові проблеми

**Connection Errors**
```bash
❌ Cannot connect to API
```
- Перевірте інтернет з'єднання
- Перевірте чи API сервіс доступний

**Timeout Errors**  
```bash
Request timeout of 10000ms exceeded
```
- Це нормально для деяких бірж
- Змініть timeout в `app.config.ts` якщо потрібно

**404 Errors (Gate.io, BingX)**
```bash
Request failed with status code 404
```
- Відомі проблеми, працюємо над вирішенням
- Можливо потрібен інший формат endpoint

## 📈 Розширення функціональності

### Поточний прогрес
- ✅ **CEX тестування**: 82% success rate (9/11 бірж)
- ✅ **Performance metrics**: Детальні метрики швидкості
- ✅ **JSON звітність**: Автоматичні звіти
- ✅ **Error handling**: Proper error tracking

### Майбутні функції (TODO)
- [ ] **Виправлення 404 помилок**: Gate.io та BingX
- [ ] **DEX endpoints testing**: 5 децентралізованих бірж
- [ ] **HTML dashboard генерація**: Візуальні звіти
- [ ] **Паралельне тестування**: Concurrent requests
- [ ] **Multiple trading pairs**: ETH/USDT, BNB/USDT, etc.
- [ ] **Historical trends tracking**: Збереження історії результатів

## 📝 API Endpoints

Система тестує наступні endpoints:

### CEX ✅ (Поточно працює)
- `GET /get-price/{base}/{quote}/{exchange}` ✅

### CEX 📋 (TODO)
- `GET /get-orderbook/{base}/{quote}/{depth}/{exchange}` 
- `GET /get-trades/{base}/{quote}/{exchange}`
- `GET /get-history/cex/{tickerA}/{tickerB}/{timeframe}/{exchange}`

### DEX 📋 (TODO)
- `GET /get-price/dex/{tokenAddress}/{poolAddress}/{chainId}/{exchange}`
- `GET /get-trades/dex/{tokenAddress}/{poolAddress}/{chainId}/{exchange}`
- `GET /get-pool-data/dex/{tokenAddress}/{poolAddress}/{chainId}/{exchange}`

### System ✅
- `GET /health` ✅

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

Цей проєкт створено для внутрішнього використання TMB Trading Platform.

---

💡 **Tip**: Запускайте тести регулярно для моніторингу якості API та виявлення проблем продуктивності на ранній стадії! 