# 第4阶段统计API测试脚本
Write-Host "🚀 开始测试第4阶段统计分析API..." -ForegroundColor Green
Write-Host "=" * 50

$baseUrl = "http://localhost:3000/api/statistics"

# 测试1: 热门图书API
Write-Host "`n📚 测试热门图书排行API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/books/popular?limit=3" -Method GET -ContentType "application/json"
    Write-Host "✅ 热门图书API测试成功" -ForegroundColor Green
    Write-Host "   📊 返回图书数量: $($response.data.Count)"
    if ($response.data.Count -gt 0) {
        Write-Host "   📖 第1本: $($response.data[0].title)"
        Write-Host "   👤 作者: $($response.data[0].author)"
    }
} catch {
    Write-Host "❌ 热门图书API测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试2: 读者借阅分析API
Write-Host "`n👥 测试读者借阅分析API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/readers/borrows" -Method GET -ContentType "application/json"
    Write-Host "✅ 读者借阅分析API测试成功" -ForegroundColor Green
    Write-Host "   📊 读者类型数量: $($response.data.Count)"
    Write-Host "   📈 总借阅量: $($response.summary.total_borrows)"
    Write-Host "   👤 总活跃读者: $($response.summary.total_active_readers)"
} catch {
    Write-Host "❌ 读者借阅分析API测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试3: 图书分类统计API
Write-Host "`n📂 测试图书分类统计API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method GET -ContentType "application/json"
    Write-Host "✅ 图书分类统计API测试成功" -ForegroundColor Green
    Write-Host "   📊 分类数量: $($response.data.Count)"
    Write-Host "   📚 总图书数: $($response.summary.total_books)"
} catch {
    Write-Host "❌ 图书分类统计API测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: 月度借阅趋势API
Write-Host "`n📈 测试月度借阅趋势API..." -ForegroundColor Yellow
try {
    $currentYear = (Get-Date).Year
    $response = Invoke-RestMethod -Uri "$baseUrl/borrows/monthly?year=$currentYear&months=6" -Method GET -ContentType "application/json"
    Write-Host "✅ 月度借阅趋势API测试成功" -ForegroundColor Green
    Write-Host "   📊 月份数据量: $($response.data.labels.Count)"
} catch {
    Write-Host "❌ 月度借阅趋势API测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50
Write-Host "🎉 API测试完成！" -ForegroundColor Green