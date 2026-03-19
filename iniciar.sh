#!/bin/bash
echo "🚀 Iniciando N&G EXPRESS..."
brew services start mysql 2>/dev/null || mysql.server start 2>/dev/null
echo "✅ MySQL iniciado"
echo "🌐 Servidor rodando em http://localhost:8000"
php -S localhost:8000
