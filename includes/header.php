<?php require_once __DIR__ . '/functions.php'; ?>
<?php
$documentTitle = $pageTitle ?? $siteConfig['projectTitle'];
$documentDescription = $pageDescription ?? $siteConfig['pageDescription'];
$pageScripts = $pageScripts ?? $siteConfig['scripts'];
$requestHost = $_SERVER['HTTP_HOST'] ?? '';
$requestScheme = !empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off'
    ? 'https'
    : 'http';
$siteOrigin = preg_match('/^(?:localhost|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[a-f0-9:.]+\])(?::\d{1,5})?$/iD', $requestHost)
    ? $requestScheme . '://' . $requestHost
    : '';
$socialImage = ($siteOrigin !== '' ? $siteOrigin : '') . '/assets/images/neon-drop-social-preview.png';
?>
<!doctype html>
<html lang="<?= escapeHtml($siteConfig['language']) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?= escapeHtml($documentDescription) ?>">
    <meta name="theme-color" content="<?= escapeHtml($siteConfig['themeColor']) ?>">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= escapeHtml($documentTitle) ?>">
    <meta property="og:description" content="<?= escapeHtml($documentDescription) ?>">
    <meta property="og:image" content="<?= escapeHtml($socialImage) ?>">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1733">
    <meta property="og:image:height" content="908">
    <meta property="og:image:alt" content="Neon Drop robotic glass blocks above a glowing game board in a cryo robotics lab">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= escapeHtml($documentTitle) ?>">
    <meta name="twitter:description" content="<?= escapeHtml($documentDescription) ?>">
    <meta name="twitter:image" content="<?= escapeHtml($socialImage) ?>">
    <link rel="icon" type="image/png" href="assets/icons/neon-drop-icon.png">
    <link rel="apple-touch-icon" href="assets/icons/neon-drop-icon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title><?= escapeHtml($documentTitle) ?></title>
    <?php foreach ($siteConfig['stylesheets'] as $stylesheet): ?>
        <link rel="stylesheet" href="<?= escapeHtml($stylesheet) ?>">
    <?php endforeach; ?>
    <?php foreach ($pageScripts as $script): ?>
        <script src="<?= escapeHtml($script) ?>" type="module" defer></script>
    <?php endforeach; ?>
</head>
<body>
    <div class="ambient-grid" aria-hidden="true"></div>
    <main class="app-shell">
