$files = Get-ChildItem -Path d:\WEBSITE\wa-cs-backend\wa-cs-frontend\src -Filter *.js -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $content = $content -replace 'http://localhost:3001/api', '/api'
    $content = $content -replace 'http://localhost:3001\$\{p\.gambar\}', '`${p.gambar}'
    $content = $content -replace "io\('http://localhost:3001'\)", "io()"
    Set-Content -Path $file.FullName -Value $content
}
