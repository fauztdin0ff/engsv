<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

/*==========================================================================
Получаем данные формы
============================================================================*/

$block       = $_POST['block'] ?? '';
$subject     = $_POST['subject'] ?? 'Запрос с сайта';

$name        = $_POST['lucky'] ?? '';
$phone       = $_POST['phone'] ?? '';
$email       = $_POST['email'] ?? '';
$messageText = $_POST['message'] ?? '';

// Спам-метка
$honeypot = trim($_POST['name'] ?? '');

if ($honeypot !== '') {
    http_response_code(400);
    exit;
}

/*==========================================================================
Проверка обязательных полей
============================================================================*/

$required = trim($_POST['required'] ?? '');

$allowedRequiredFields = [
    'name',
    'email',
    'phone',
    'message'
];

if ($required === '') {
    http_response_code(400);
    echo 'Required field is not specified';
    exit;
}

$requiredFields = array_map('trim', explode(',', $required));

foreach ($requiredFields as $field) {

    if (!in_array($field, $allowedRequiredFields, true)) {
        http_response_code(400);
        echo 'Invalid required field';
        exit;
    }
}

if (in_array('phone', $requiredFields, true) && !$phone) {
    http_response_code(400);
    echo 'Phone is required';
    exit;
}

if (in_array('email', $requiredFields, true) && !$email) {
    http_response_code(400);
    echo 'Email is required';
    exit;
}

if (in_array('name', $requiredFields, true) && !$name) {
    http_response_code(400);
    echo 'Name is required';
    exit;
}

/*==========================================================================
PHPMailer
============================================================================*/

$mail = new PHPMailer(true);

try {

    $mail->SMTPDebug = 0;
    $mail->isSMTP();
    $mail->Host = 'smtp.beget.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'site@engsv.ru';
    $mail->Password = '';
    $mail->Port = 2525;
    $mail->CharSet = 'UTF-8';

    /*======================================================================
    Отправитель
    ======================================================================*/

    $mail->setFrom(
        'site@engsv.ru',
        'ENGSV'
    );

    /*======================================================================
    Получатель
    ======================================================================*/

    $mail->addAddress(
        'tii@vverh.biz',
        'tigor'
    );

    /*======================================================================
    Письмо
    ======================================================================*/

    $mail->isHTML(true);

    $mailSubject = trim($subject);

    if ($phone) {
        $mailSubject .= ' / ' . $phone;
    }

    if ($name) {
        $mailSubject .= ' / ' . $name;
    }

    $mail->Subject = $mailSubject;

    /*======================================================================
    Формируем сообщение
    ======================================================================*/

    $mail->Body = '
        <p><strong>Поля формы обратной связи</strong></p>
        <p>
            Блок формы: <b>' . htmlspecialchars($block) . '</b><br>
            Телефон: <b>' . htmlspecialchars($phone) . '</b><br>
            E-mail: <b>' . htmlspecialchars($email) . '</b><br>
            Имя: <b>' . htmlspecialchars($name) . '</b><br>
            Сообщение: <b>' . nl2br(htmlspecialchars($messageText)) . '</b>
        </p>
    ';

    /*======================================================================
    Отправка
    ======================================================================*/

    $mail->send();

    http_response_code(200);
    echo 'Message has been sent successfully';

} catch (Exception $e) {

    http_response_code(500);
    echo 'Mailer Error: ' . $mail->ErrorInfo;

}

/*
// Тестовый успешный ответ
http_response_code(200);
echo 'Message has been sent successfully';
exit;
*/