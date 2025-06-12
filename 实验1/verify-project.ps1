# 文件验证脚本
Write-Host "检查线段树项目文件完整性..." -ForegroundColor Green

$baseDir = "c:\Users\acm\OneDrive\SegmentTree-show\实验1"

# 检查必要文件
$requiredFiles = @(
    "index.html",
    "README.md",
    "styles\main.css",
    "styles\components.css", 
    "styles\tree.css",
    "styles\quiz.css",
    "styles\settings.css",
    "js\main.js",
    "js\navigation.js",
    "js\syntaxHighlighter.js", 
    "js\treeVisualizer.js",
    "js\quiz.js",
    "js\settings.js"
)

$allExists = $true
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $baseDir $file
    if (Test-Path $fullPath) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file (缺失)" -ForegroundColor Red
        $allExists = $false
    }
}

if ($allExists) {
    Write-Host "`n🎉 所有文件都存在，项目结构完整！" -ForegroundColor Green
    Write-Host "现在可以在浏览器中打开 index.html 来测试功能。" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ 有文件缺失，请检查项目结构。" -ForegroundColor Red
}

# 显示文件大小信息
Write-Host "`n文件大小信息:" -ForegroundColor Blue
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $baseDir $file
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        Write-Host "  $file : $size bytes"
    }
}
