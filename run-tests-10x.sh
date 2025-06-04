#!/bin/bash

echo "🚀 Starting 10x Market Data API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in {1..10}; do
    echo ""
    echo "🔄 === Test Run #$i/10 ==="
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Запуск тестів
    npm run test:run
    
    # Перевірка exit code
    if [ $? -eq 0 ]; then
        echo "✅ Run #$i completed successfully"
    else
        echo "❌ Run #$i completed with errors"
    fi
    
    # Пауза між тестами (крім останнього)
    if [ $i -lt 10 ]; then
        echo "⏳ Waiting 5 seconds before next run..."
        sleep 5
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All 10 test runs completed!"
echo "📁 Check ./reports/ directory for detailed JSON reports"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 