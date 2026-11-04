<?php
require_once __DIR__ . '/includes/functions.php';
sendConfiguredHeaders($siteConfig['responseHeaders']);

$requestMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($requestMethod, ['GET', 'HEAD', 'POST'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD, POST', true);
    exit('Method not allowed.');
}

$pageTitle = 'Feedback — ' . $siteConfig['shortTitle'];
$pageDescription = 'Share feedback about NEON DROP. Feedback is validated but not stored.';
$pageScripts = ['js/cursor.js'];
$isPost = $requestMethod === 'POST';
$errors = [];
$displayName = '';
$rating = '';
$message = '';
$isValidSubmission = false;

if ($isPost) {
    $rawName = $_POST['display_name'] ?? null;
    if (!is_string($rawName)) {
        $errors[] = 'Please enter your display name.';
    } else {
        $displayName = trim($rawName);
        if ($displayName === '') {
            $errors[] = 'Please enter your display name.';
        } elseif (utf8CharacterCount($displayName) > 50) {
            $errors[] = 'Your display name must be 50 characters or fewer.';
        }
    }

    $rawRating = $_POST['rating'] ?? null;
    if (!is_string($rawRating) || !preg_match('/^[1-5]$/D', $rawRating)) {
        $errors[] = 'Choose a rating from 1 to 5.';
    } else {
        $rating = $rawRating;
    }

    $rawMessage = $_POST['message'] ?? '';
    if (!is_string($rawMessage)) {
        $errors[] = 'The feedback message must be plain text.';
    } else {
        $message = trim($rawMessage);
        if (utf8CharacterCount($message) > 500) {
            $errors[] = 'Your feedback message must be 500 characters or fewer.';
        }
    }

    if ($errors !== []) {
        http_response_code(422);
    } else {
        $isValidSubmission = true;
    }
}

require __DIR__ . '/includes/header.php';
?>
        <section class="feedback-page glass-panel" aria-labelledby="feedback-title">
            <p class="eyebrow"><span class="pulse-dot"></span> PILOT REPORT // OPTIONAL</p>
            <h1 id="feedback-title">PLAYER <span>FEEDBACK</span></h1>
            <p class="feedback-intro">Tell us how your run went. This form validates and displays your response, but does not save or send it anywhere.</p>

            <?php if ($errors !== []): ?>
                <div class="feedback-message feedback-errors" role="alert">
                    <p>Please fix the following:</p>
                    <ul>
                        <?php foreach ($errors as $error): ?>
                            <li><?= escapeHtml($error) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php elseif ($isValidSubmission): ?>
                <div class="feedback-message feedback-success" role="status">
                    <p>Thanks, <?= escapeHtml($displayName) ?>. Your rating of <?= escapeHtml($rating) ?>/5 has been processed for this response.</p>
                    <?php if ($message !== ''): ?>
                        <p class="submitted-message">“<?= nl2br(escapeHtml($message)) ?>”</p>
                    <?php endif; ?>
                    <p class="storage-note">This feedback is not saved. Refreshing this page may submit the form again.</p>
                </div>
            <?php endif; ?>

            <form class="feedback-form" action="feedback.php" method="post">
                <div class="feedback-field">
                    <label for="display-name">Display name <span>(required, up to 50 characters)</span></label>
                    <input id="display-name" name="display_name" type="text" maxlength="50" autocomplete="name" required value="<?= escapeHtml($displayName) ?>">
                </div>
                <div class="feedback-field">
                    <label for="rating">Rating <span>(required)</span></label>
                    <select id="rating" name="rating" required>
                        <option value="">Choose a rating</option>
                        <?php for ($score = 1; $score <= 5; $score++): ?>
                            <option value="<?= $score ?>"<?= $rating === (string) $score ? ' selected' : '' ?>><?= $score ?> / 5</option>
                        <?php endfor; ?>
                    </select>
                </div>
                <div class="feedback-field">
                    <label for="message">Feedback message <span>(optional, up to 500 characters)</span></label>
                    <textarea id="message" name="message" rows="5" maxlength="500"><?= escapeHtml($message) ?></textarea>
                </div>
                <p class="storage-note">No database, file, browser storage, or external service is used for feedback.</p>
                <div class="feedback-actions">
                    <button class="button button-primary" type="submit">SUBMIT FEEDBACK</button>
                    <a class="button button-secondary" href="index.php">RETURN TO GAME</a>
                </div>
            </form>
        </section>
<?php require __DIR__ . '/includes/footer.php'; ?>
