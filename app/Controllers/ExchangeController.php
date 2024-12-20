<?php

namespace App\Controllers;

class ExchangeController
{
    protected $exchangeService;
    protected $translationService;

    public function __construct($exchangeService, $translationService)
    {
        $this->exchangeService = $exchangeService;
        $this->translationService = $translationService;
    }

    public function validatePairSettings()
    {
        $this->translationService->loadTranslations('errors');
        $send = $_GET['send'] ?? null;
        $receive = $_GET['receive'] ?? null;
        $sendNetwork = $_GET['sendNetwork'] ?? null;
        $receiveNetwork = $_GET['receiveNetwork'] ?? null;

        if (!$send || !$receive || !$sendNetwork || !$receiveNetwork) {
            http_response_code(400);
            echo json_encode(['message' => $this->translationService->trans('missing')]);
            exit;
        }

        $pairData = $this->exchangeService->getPair($send, $receive, $sendNetwork, $receiveNetwork);
        $httpCode = $pairData['httpCode'];

        if ($httpCode !== 200) {
            http_response_code($httpCode);
            echo json_encode(['message' => $this->translationService->trans('unavailable'), 'content' => $pairData ?? 'Unknown error']);
            exit;
        }
        $pairData = $pairData['content'] ?? $pairData;

        if (!is_array($pairData) || !isset($pairData['minimumAmount'], $pairData['maximumAmount'], $pairData['networkFee'], $pairData['confirmations'], $pairData['processingTime'])) {
            http_response_code(500);
            echo json_encode(['message' => $this->translationService->trans('internal_error'), 'content' => $pairData]);
            exit;
        }

        http_response_code(200);
        echo json_encode(['httpCode' => 200, 'content' => $pairData]);
    }

    public function validateAmount()
    {
        $this->translationService->loadTranslations('errors');
        $send = $_GET['send'] ?? null;
        $receive = $_GET['receive'] ?? null;
        $amount = $_GET['amount'] ?? null;
        $sendNetwork = $_GET['sendNetwork'] ?? null;
        $receiveNetwork = $_GET['receiveNetwork'] ?? null;

        if (!$send || !$receive || !$amount || !$sendNetwork || !$receiveNetwork) {
            http_response_code(400);
            echo json_encode(['message' => $this->translationService->trans('missing')]);
            exit;
        }

        $rateData = $this->exchangeService->getRate($send, $receive, $amount, $sendNetwork, $receiveNetwork);

        if (!$rateData || isset($rateData['error'])) {
            http_response_code(500);
            echo json_encode(['message' => $this->translationService->trans('internal_error'), 'content' => $rateData['error'] ?? 'Unknown error']);
            exit;
        }

        $httpCode = $rateData['httpCode'];

        if ($httpCode !== 200) {
            http_response_code($httpCode);
            echo json_encode([
                'response' => $rateData,
            ]);
            exit;
        }

        http_response_code(200);
        echo json_encode(['httpCode' => 200, 'content' => $rateData['content']]);
    }
}
