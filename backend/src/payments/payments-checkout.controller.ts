import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';

@Controller('payments')
export class PaymentsCheckoutController {
  constructor(private readonly configService: ConfigService) {}

  @Get('checkout')
  getCheckoutPage(
    @Query('amount') amount: string,
    @Query('orderId') orderId: string,
    @Query('orderName') orderName: string,
    @Query('customerName') customerName: string,
    @Query('customerEmail') customerEmail: string,
    @Query('method') method: string,
    @Res() res: express.Response,
  ) {
    const clientKey = this.configService.get<string>('TOSS_CLIENT_KEY', '');
    const baseUrl = `http://${res.req.headers.host || '10.0.2.2:3000'}`;

    const safe = (s: string) =>
      (s || '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const easyPayMap: Record<string, string> = {
      tosspay: 'TOSSPAY',
      kakaopay: 'KAKAOPAY',
      samsungpay: 'SAMSUNGPAY',
    };
    const easyPayProvider = easyPayMap[(method || '').toLowerCase()] || '';

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 진행중</title>
  <script src="https://js.tosspayments.com/v1/payment"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0A0F1C; color: #e2e8f0;
      font-family: -apple-system, 'Malgun Gothic', sans-serif;
      display: flex; align-items: center; justify-content: center; min-height: 100vh;
    }
    .container { max-width: 440px; padding: 40px 24px; text-align: center; }
    h2 { color: #00D4AA; font-size: 28px; margin-bottom: 16px; }
    p { font-size: 18px; margin-bottom: 10px; }
    .spinner { width: 50px; height: 50px; border: 4px solid rgba(0,212,170,0.2); border-top-color: #00D4AA; border-radius: 50%; animation: spin 1s linear infinite; margin: 24px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error { color: #EF4444; margin-top: 20px; font-size: 16px; }
    .amount { font-size: 36px; color: #00D4AA; font-weight: bold; margin: 12px 0; }
    .order-info { color: #94A3B8; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container" id="loading">
    <h2>토스페이먼츠</h2>
    <p class="amount">${safe(String(parseInt(amount, 10) || 0))}원</p>
    <p class="order-info">${safe(orderName || '')}</p>
    <div class="spinner"></div>
    <p id="status">결제창을 여는 중...</p>
    <p id="error" class="error" style="display:none;"></p>
  </div>
  <script>
    (function() {
      var statusEl = document.getElementById('status');
      var errorEl = document.getElementById('error');
      try {
        var clientKey = '${safe(clientKey)}';
        var amount = ${parseInt(amount, 10) || 0};
        var orderId = '${safe(orderId)}';
        var orderName = '${safe(orderName || 'Travel Booking')}';
        var customerName = '${safe(customerName || '')}';
        var baseUrl = '${safe(baseUrl)}';
        var easyPay = '${safe(easyPayProvider)}';

        if (!clientKey) throw new Error('TOSS_CLIENT_KEY not configured');

        var paymentConfig = {
          amount: amount, orderId: orderId, orderName: orderName,
          customerName: customerName || undefined,
          successUrl: baseUrl + '/api/payments/toss-result?status=success',
          failUrl: baseUrl + '/api/payments/toss-result?status=fail',
        };
        if (easyPay) { paymentConfig.flowMode = 'DIRECT'; paymentConfig.easyPay = easyPay; }

        var tossPayments = TossPayments(clientKey);
        tossPayments.requestPayment('\\uCE74\\uB4DC', paymentConfig)
          .catch(function(err) {
            if (err.code === 'USER_CANCEL') {
              window.location.href = baseUrl + '/api/payments/toss-result?status=cancel&orderId=' + encodeURIComponent(orderId);
            } else {
              errorEl.textContent = err.message || '결제 오류';
              errorEl.style.display = 'block';
              statusEl.textContent = '오류 발생';
            }
          });
      } catch(e) {
        errorEl.textContent = 'SDK 초기화 실패: ' + e.message;
        errorEl.style.display = 'block';
        statusEl.textContent = '오류 발생';
      }
    })();
  </script>
</body>
</html>`;

    res.type('text/html').send(html);
  }

  @Get('toss-result')
  async getTossResultPage(
    @Query('status') status: string,
    @Query('paymentKey') paymentKey: string,
    @Query('orderId') orderId: string,
    @Query('amount') amount: string,
    @Query('code') code: string,
    @Query('message') message: string,
    @Res() res: express.Response,
  ) {
    const isSuccess = status === 'success';
    const isCancel = status === 'cancel';
    const baseUrl = `http://${res.req.headers.host || '10.0.2.2:3000'}`;

    const autoCompleteScript = isSuccess
      ? `<script>
      (function() {
        var statusEl = document.getElementById('detail');
        statusEl.textContent = '결제 확인중...';
        fetch('${baseUrl}/api/payments/sessions/${orderId || ''}/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey: '${paymentKey || ''}', amount: ${parseInt(amount, 10) || 0} })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.success) {
            statusEl.textContent = 'TV 화면에서 예약을 확인해주세요.';
            document.getElementById('icon').textContent = '✅';
            document.getElementById('title').textContent = '결제 완료!';
            document.getElementById('title').style.color = '#22C55E';
          } else {
            statusEl.textContent = '결제 확인 실패: ' + (data.message || '오류');
            document.getElementById('icon').textContent = '❌';
          }
        })
        .catch(function(err) { statusEl.textContent = '오류: ' + err.message; });
      })();
      </script>`
      : '';

    const title = isSuccess ? '결제 처리중' : isCancel ? '결제 취소' : '결제 실패';
    const detail = isSuccess ? '잠시만 기다려주세요...' : isCancel ? '결제가 취소되었습니다.' : message || '결제에 실패했습니다.';
    const color = isSuccess ? '#F59E0B' : '#EF4444';
    const icon = isSuccess ? '⏳' : '❌';

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background: #0A0F1C; color: #e2e8f0; font-family: -apple-system, 'Malgun Gothic', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .container { max-width: 440px; padding: 40px 24px; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h2 { color: ${color}; font-size: 28px; margin-bottom: 12px; }
    p { font-size: 18px; color: #94A3B8; }
    .info { font-size: 14px; color: #64748B; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon" id="icon">${icon}</div>
    <h2 id="title">${title}</h2>
    <p id="detail">${detail}</p>
    ${code ? `<p class="info">코드: ${code}</p>` : ''}
  </div>
  ${autoCompleteScript}
</body>
</html>`;

    res.type('text/html').send(html);
  }
}
