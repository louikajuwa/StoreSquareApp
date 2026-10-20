<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Square\SquareClient;
use Square\Models\CreatePaymentRequest;
use Square\Models\Money;

class CheckoutController extends Controller
{
    public function show(Product $product)
    {
        return Inertia::render('Checkout/Show', [
            'product'          => $product,
            'squareAppId'      => config('services.square.application_id'),
            'squareLocationId' => config('services.square.location_id'),
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $request->validate([
            'customer_name'  => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'source_id'      => 'required|string',
        ]);

        $payment = Payment::create([
            'product_id'        => $product->id,
            'square_payment_id' => null,
            'amount'            => $product->price,
            'currency'          => 'usd',
            'customer_email'    => $request->customer_email,
            'customer_name'     => $request->customer_name,
            'status'            => 'pending',
        ]);

        $payment->load('product');
        $this->broadcast($payment);

        return response()->json([
            'paymentId' => $payment->id,
            'sourceId'  => $request->source_id,
        ]);
    }

    public function capture(Request $request, Product $product)
    {
        $request->validate([
            'paymentId' => 'required|integer',
            'sourceId'  => 'required|string',
        ]);

        $payment = Payment::findOrFail($request->paymentId);

        $client = new SquareClient([
            'accessToken' => config('services.square.access_token'),
            'environment' => config('services.square.environment'),
        ]);

        $amountInCents = (int) round($payment->amount * 100);

        $money = new Money();
        $money->setAmount($amountInCents);
        $money->setCurrency('USD');

        $body = new CreatePaymentRequest(
            $request->sourceId,
            uniqid('sq_idempotency_', true)
        );
        $body->setAmountMoney($money);
        $body->setLocationId(config('services.square.location_id'));

        $response = $client->getPaymentsApi()->createPayment($body);

        if (!$response->isSuccess()) {
            Log::error('Square capture failed', [
                'errors' => array_map(fn ($e) => [
                    'code'    => $e->getCode(),
                    'detail'  => $e->getDetail(),
                    'category' => $e->getCategory(),
                ], $response->getErrors()),
            ]);

            $payment->update(['status' => 'failed']);
            $payment->load('product');
            $this->broadcast($payment);

            $firstError = $response->getErrors()[0] ?? null;
            $message = $this->mapSquareError($firstError);

            return response()->json(['message' => $message], 500);
        }

        $squarePayment = $response->getResult()->getPayment();

        $payment->update([
            'square_payment_id' => $squarePayment->getId(),
            'status'            => 'paid',
        ]);
        $payment->load('product');
        $this->broadcast($payment);

        return response()->json(['success' => true]);
    }

    public function success(Product $product)
    {
        return Inertia::render('Checkout/Success', [
            'product' => $product,
        ]);
    }

    private function broadcast(Payment $payment): void
    {
        try {
            Http::post(config('services.realtime.url') . '/broadcast-payment', [
                'secret'  => config('services.realtime.secret'),
                'payment' => [
                    'id'                => $payment->id,
                    'product_id'        => $payment->product_id,
                    'product_name'      => $payment->product->name ?? null,
                    'square_payment_id' => $payment->square_payment_id,
                    'amount'            => $payment->amount,
                    'currency'          => $payment->currency,
                    'customer_email'    => $payment->customer_email,
                    'customer_name'     => $payment->customer_name,
                    'status'            => $payment->status,
                    'created_at'        => $payment->created_at->toISOString(),
                    'updated_at'        => $payment->updated_at->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast payment update: ' . $e->getMessage());
        }
    }

    private function mapSquareError(?\Square\Models\Error $error): string
    {
        if (!$error) {
            return 'Payment failed. Please try again.';
        }

        return match ($error->getCode()) {
            'CARD_DECLINED'       => 'Your card was declined. Please try a different card.',
            'CVV_FAILURE'         => 'The security code is incorrect. Please check your card and try again.',
            'CARD_EXPIRED'        => 'Your card has expired. Please use a different card.',
            'INSUFFICIENT_FUNDS'  => 'Insufficient funds. Please try a different payment method.',
            'INVALID_CARD'        => 'Invalid card details. Please check and try again.',
            'CARD_TOKEN_EXPIRED'  => 'Your session expired. Please re-enter your card details.',
            'GENERIC_DECLINE'     => 'The transaction was declined. Please try a different card.',
            'ADDRESS_MISMATCH'    => 'The billing address does not match. Please check and try again.',
            default               => 'Payment failed. Please try again or use a different payment method.',
        };
    }
}
