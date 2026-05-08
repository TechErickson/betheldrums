<?php
/**
 * Bethel Drums — Booking Form Backend
 * Handles form submissions with Cloudflare Turnstile verification
 */

header('Content-Type: application/json');

// ─── CONFIG ───────────────────────────────────────────────
define('CF_SECRET_KEY', 'YOUR_CLOUDFLARE_TURNSTILE_SECRET_KEY'); // Replace with your key
define('NOTIFY_EMAIL',  'betheldrums01@gmail.com');
define('SITE_NAME',     'Bethel Drums');

// ─── CORS / METHOD CHECK ──────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// ─── SANITIZE INPUT ───────────────────────────────────────
function clean(string $val): string {
    return htmlspecialchars(trim(strip_tags($val)), ENT_QUOTES, 'UTF-8');
}

$fullname   = clean($_POST['fullname']   ?? '');
$contact    = clean($_POST['contact']    ?? '');
$email      = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$location   = clean($_POST['location']   ?? '');
$service    = clean($_POST['service']    ?? '');
$event_date = clean($_POST['event_date'] ?? '');
$guests     = (int)($_POST['guests']     ?? 0);
$message    = clean($_POST['message']    ?? '');
$cf_token   = $_POST['cf-turnstile-response'] ?? '';

// ─── VALIDATE REQUIRED FIELDS ─────────────────────────────
$errors = [];
if (empty($fullname))  $errors[] = 'Full name is required.';
if (empty($contact))   $errors[] = 'Contact number is required.';
if (!$email)           $errors[] = 'A valid email is required.';
if (empty($location))  $errors[] = 'Location is required.';
if (empty($service))   $errors[] = 'Please select a service.';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ─── CLOUDFLARE TURNSTILE VERIFICATION ───────────────────
if (!empty($cf_token)) {
    $cf_verify = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false,
        stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => 'Content-Type: application/x-www-form-urlencoded',
                'content' => http_build_query([
                    'secret'   => CF_SECRET_KEY,
                    'response' => $cf_token,
                    'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
                ])
            ]
        ])
    );

    if ($cf_verify) {
        $cf_result = json_decode($cf_verify, true);
        if (!($cf_result['success'] ?? false)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'CAPTCHA verification failed. Please try again.']);
            exit;
        }
    }
}

// ─── ALLOWED SERVICES WHITELIST ───────────────────────────
$allowed_services = [
    'corporate', 'music-lessons', 'brand-advertisements',
    'birthday-parties', 'house-warming'
];
if (!in_array($service, $allowed_services)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid service selected.']);
    exit;
}

// ─── BUILD EMAIL ──────────────────────────────────────────
$service_label = ucwords(str_replace('-', ' ', $service));
$subject = "[" . SITE_NAME . "] New Booking Request — {$service_label}";

$body = <<<MAIL
New Booking Request — Bethel Drums
====================================

Full Name  : {$fullname}
Contact    : {$contact}
Email      : {$email}
Location   : {$location}
Service    : {$service_label}
Event Date : {$event_date}
Guests     : {$guests}

Message:
{$message}

====================================
Submitted: {$_SERVER['REMOTE_ADDR']} | {$_SERVER['HTTP_USER_AGENT']}
MAIL;

$headers  = "From: noreply@bethel.drums\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// ─── SEND EMAIL ───────────────────────────────────────────
$sent = mail(NOTIFY_EMAIL, $subject, $body, $headers);

// ─── OPTIONAL: LOG TO FILE ───────────────────────────────
$log_dir = __DIR__ . '/bookings_log';
if (!is_dir($log_dir)) mkdir($log_dir, 0755, true);
$log_entry = date('Y-m-d H:i:s') . " | {$fullname} | {$email} | {$service_label} | {$location}\n";
file_put_contents($log_dir . '/bookings.log', $log_entry, FILE_APPEND | LOCK_EX);

// ─── RESPONSE ─────────────────────────────────────────────
if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Your booking request has been received! We\'ll be in touch within 24 hours.'
    ]);
} else {
    // Mail might have failed — log but still confirm to user
    error_log("Bethel Drums: Mail send failed for {$email}");
    echo json_encode([
        'success' => true,
        'message' => 'Request received! We\'ll contact you at ' . $email . ' within 24 hours.'
    ]);
}
