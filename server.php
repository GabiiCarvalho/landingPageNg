<?php
require_once __DIR__ . '/vendor/autoload.php';

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

$app = AppFactory::create();

// Configurar CORS
$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

// Servir arquivos estáticos da pasta public
$app->get('/', function ($request, $response, $args) {
    $file = __DIR__ . '/public/index.html';
    if (file_exists($file)) {
        $response->getBody()->write(file_get_contents($file));
        return $response->withHeader('Content-Type', 'text/html');
    }
    return $response->withStatus(404);
});

// Servir arquivos estáticos (CSS, JS, imagens)
$app->get('/{file:.+\.(css|js|png|jpg|jpeg|gif|ico|svg|webp)}', function ($request, $response, $args) {
    $file = __DIR__ . '/public/' . $args['file'];
    if (file_exists($file)) {
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp'
        ];
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mime = $mimeTypes[$ext] ?? 'application/octet-stream';
        $response->getBody()->write(file_get_contents($file));
        return $response->withHeader('Content-Type', $mime);
    }
    return $response->withStatus(404);
});

// Suas rotas da API (já existentes)
$app->post('/api/pix/criar', function ($request, $response, $args) {
    // seu código existente
});

$app->get('/api/pix/status/{paymentId}', function ($request, $response, $args) {
    // seu código existente
});

$app->post('/api/usuarios/login', function ($request, $response, $args) {
    // seu código existente
});

$app->post('/api/usuarios/cadastrar', function ($request, $response, $args) {
    // seu código existente
});

// Para qualquer outra rota, servir o index.html (SPA fallback)
$app->get('/{routes:.+}', function ($request, $response, $args) {
    $file = __DIR__ . '/public/index.html';
    if (file_exists($file)) {
        $response->getBody()->write(file_get_contents($file));
        return $response->withHeader('Content-Type', 'text/html');
    }
    return $response->withStatus(404);
});

$app->run();