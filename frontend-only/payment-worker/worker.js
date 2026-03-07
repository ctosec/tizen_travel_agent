/**
 * Cloudflare Worker — Toss Payment Backend
 *
 * Handles the complete Toss payment flow:
 *   POST /api/sessions           — create payment session
 *   GET  /api/sessions/:id/status — poll session status
 *   POST /api/sessions/:id/complete — confirm payment
 *   GET  /api/checkout           — serve Toss SDK checkout page
 *   GET  /api/toss-result        — handle Toss redirect callback
 *
 * Environment variables (set in wrangler.toml [vars] or via wrangler secret):
 *   TOSS_CLIENT_KEY, TOSS_SECRET_KEY, SKIP_TOSS_PAYMENT
 *
 * Uses in-memory Map for session storage (sufficient for demo/test).
 */

const sessions = new Map();

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status = 200, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function htmlResponse(html) {
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function safe(s) {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Handlers ────────────────────────────────────────────

async function handleCreateSession(request, env, origin) {
  const body = await request.json();
  const { orderId, amount, orderName, bookingType, bookingData, selectedMethod } = body;

  if (!orderId || !amount || !orderName) {
    return jsonResponse({ error: 'Missing required fields' }, 400, origin);
  }

  sessions.set(orderId, {
    orderId,
    amount,
    orderName,
    bookingType: bookingType || 'package',
    bookingData: bookingData || {},
    selectedMethod: selectedMethod || 'card',
    status: 'PENDING',
    resultData: null,
    createdAt: Date.now(),
  });

  return jsonResponse({ success: true, orderId }, 200, origin);
}

function handleGetStatus(orderId, origin) {
  const session = sessions.get(orderId);
  if (!session) {
    return jsonResponse({ status: 'NOT_FOUND' }, 404, origin);
  }

  // Auto-expire after 30 minutes
  if (session.status === 'PENDING' && Date.now() - session.createdAt > 30 * 60 * 1000) {
    session.status = 'EXPIRED';
  }

  return jsonResponse({ status: session.status, data: session.resultData }, 200, origin);
}

async function handleComplete(orderId, request, env, origin) {
  const session = sessions.get(orderId);
  if (!session) {
    return jsonResponse({ error: 'Session not found' }, 404, origin);
  }

  if (session.status === 'SUCCESS') {
    return jsonResponse({ success: true, message: 'Already completed', data: session.resultData }, 200, origin);
  }

  const body = await request.json();
  const { paymentKey, amount } = body;

  if (amount !== session.amount) {
    return jsonResponse({ error: `Amount mismatch: expected ${session.amount}, got ${amount}` }, 400, origin);
  }

  // Confirm payment
  let paymentResult;
  const skipPayment = env.SKIP_TOSS_PAYMENT === 'true';

  if (skipPayment) {
    // Test mode — mock Toss response
    const method = (session.selectedMethod || '').toLowerCase();
    const providerMap = {
      kakaopay: '카카오페이',
      naverpay: '네이버페이',
      samsungpay: '삼성페이',
      tosspay: '토스페이',
    };
    const matchedProvider = providerMap[method] || null;

    const baseData = {
      paymentKey,
      orderId,
      amount,
      status: 'DONE',
      approvedAt: new Date().toISOString(),
      totalAmount: amount,
      currency: 'KRW',
      country: 'KR',
    };

    if (matchedProvider) {
      baseData.method = '간편결제';
      baseData.easyPay = { provider: matchedProvider, amount, discountAmount: 0 };
    } else {
      baseData.method = '카드';
    }

    baseData.card = {
      issuerCode: '11',
      number: '4111****1111',
      installmentPlanMonths: 0,
      approveNo: String(Math.floor(10000000 + Math.random() * 90000000)),
      cardType: '신용',
      amount,
    };

    paymentResult = { success: true, data: baseData };
  } else {
    // Real Toss API call
    try {
      const secretKey = env.TOSS_SECRET_KEY || '';
      const encodedKey = btoa(secretKey + ':');

      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      const data = await response.json();
      if (!response.ok) {
        paymentResult = { success: false, error: data.message || 'Payment confirmation failed' };
      } else {
        paymentResult = { success: true, data };
      }
    } catch (err) {
      paymentResult = { success: false, error: err.message || 'Payment confirmation failed' };
    }
  }

  if (!paymentResult.success) {
    session.status = 'FAIL';
    session.resultData = { error: paymentResult.error };
    return jsonResponse({ success: false, error: paymentResult.error }, 400, origin);
  }

  session.status = 'SUCCESS';
  session.resultData = { payment: paymentResult.data };
  return jsonResponse({ success: true, payment: paymentResult.data }, 200, origin);
}

function handleCheckout(url, env) {
  const amount = url.searchParams.get('amount') || '0';
  const orderId = url.searchParams.get('orderId') || '';
  const orderName = url.searchParams.get('orderName') || 'Travel Booking';
  const customerName = url.searchParams.get('customerName') || '';
  const method = url.searchParams.get('method') || '';
  const clientKey = env.TOSS_CLIENT_KEY || '';
  const baseUrl = url.origin;

  const easyPayMap = { tosspay: 'TOSSPAY', kakaopay: 'KAKAOPAY', samsungpay: 'SAMSUNGPAY' };
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
    <p class="order-info">${safe(orderName)}</p>
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
        var orderName = '${safe(orderName)}';
        var customerName = '${safe(customerName)}';
        var baseUrl = '${safe(baseUrl)}';
        var easyPay = '${safe(easyPayProvider)}';

        if (!clientKey) throw new Error('TOSS_CLIENT_KEY not configured');

        var paymentConfig = {
          amount: amount, orderId: orderId, orderName: orderName,
          customerName: customerName || undefined,
          successUrl: baseUrl + '/api/toss-result?status=success',
          failUrl: baseUrl + '/api/toss-result?status=fail',
        };
        if (easyPay) { paymentConfig.flowMode = 'DIRECT'; paymentConfig.easyPay = easyPay; }

        var tossPayments = TossPayments(clientKey);
        tossPayments.requestPayment('\\uCE74\\uB4DC', paymentConfig)
          .catch(function(err) {
            if (err.code === 'USER_CANCEL') {
              window.location.href = baseUrl + '/api/toss-result?status=cancel&orderId=' + encodeURIComponent(orderId);
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

  return htmlResponse(html);
}

function handleTossResult(url) {
  const status = url.searchParams.get('status') || '';
  const paymentKey = url.searchParams.get('paymentKey') || '';
  const orderId = url.searchParams.get('orderId') || '';
  const amount = url.searchParams.get('amount') || '0';
  const code = url.searchParams.get('code') || '';
  const message = url.searchParams.get('message') || '';
  const baseUrl = url.origin;

  const isSuccess = status === 'success';
  const isCancel = status === 'cancel';

  const autoCompleteScript = isSuccess
    ? `<script>
    (function() {
      var statusEl = document.getElementById('detail');
      statusEl.textContent = '결제 확인중...';
      fetch('${baseUrl}/api/sessions/${safe(orderId)}/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey: '${safe(paymentKey)}', amount: ${parseInt(amount, 10) || 0} })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          statusEl.textContent = 'TV 화면에서 예약을 확인해주세요.';
          document.getElementById('icon').textContent = '✅';
          document.getElementById('title').textContent = '결제 완료!';
          document.getElementById('title').style.color = '#22C55E';
        } else {
          statusEl.textContent = '결제 확인 실패: ' + (data.error || '오류');
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

  return htmlResponse(html);
}

// ─── Router ──────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin') || '*';

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Route: POST /api/sessions
    if (method === 'POST' && path === '/api/sessions') {
      return handleCreateSession(request, env, origin);
    }

    // Route: GET /api/sessions/:orderId/status
    const statusMatch = path.match(/^\/api\/sessions\/([^/]+)\/status$/);
    if (method === 'GET' && statusMatch) {
      return handleGetStatus(statusMatch[1], origin);
    }

    // Route: POST /api/sessions/:orderId/complete
    const completeMatch = path.match(/^\/api\/sessions\/([^/]+)\/complete$/);
    if (method === 'POST' && completeMatch) {
      return handleComplete(completeMatch[1], request, env, origin);
    }

    // Route: GET /api/checkout
    if (method === 'GET' && path === '/api/checkout') {
      return handleCheckout(url, env);
    }

    // Route: GET /api/toss-result
    if (method === 'GET' && path === '/api/toss-result') {
      return handleTossResult(url);
    }

    return jsonResponse({ error: 'Not Found' }, 404, origin);
  },
};
