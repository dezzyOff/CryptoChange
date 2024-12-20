<?php

namespace App\Utils;

use Exception;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel\ErrorCorrectionLevelLow;

class QRCode
{
    public static function generateQRCode($network, $address, $amount)
    {
        if ($network === null || $address === null) {
            http_response_code(400);
            echo 'Network and address are required.';
            exit();
        }

        $cryptoURI = $network . ':' . $address;
        if (!empty($amount)) {
            $cryptoURI .= '?amount=' . $amount;
        }

        try {
            $result = Builder::create()
                ->writer(new PngWriter())
                ->data($cryptoURI)
                ->encoding(new Encoding('UTF-8'))
                ->errorCorrectionLevel(new ErrorCorrectionLevelLow())
                ->size(300)
                ->margin(0)
                ->build();

            header('Content-Type: ' . $result->getMimeType());
            echo $result->getString();
        } catch (Exception $e) {
            http_response_code(500);
            echo 'Error generating QR code: ' . $e->getMessage();
        }

        exit();
    }
    
    public static function generateQRCodeForMemo($memo)
    {
        if ($memo === null) {
            http_response_code(400);
            echo 'Memo is required.';
            exit();
        }

        try {
            $result = Builder::create()
                ->writer(new PngWriter())
                ->data($memo) 
                ->encoding(new Encoding('UTF-8'))
                ->errorCorrectionLevel(new ErrorCorrectionLevelLow())
                ->size(300)
                ->margin(0)
                ->build();

            header('Content-Type: ' . $result->getMimeType());
            echo $result->getString();
        } catch (Exception $e) {
            http_response_code(500);
            echo 'Error generating QR code: ' . $e->getMessage();
        }

        exit();
    }
}
