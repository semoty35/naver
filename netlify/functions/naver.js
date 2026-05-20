// netlify/functions/naver.js
// -------------------------------------------------------
// 이 파일은 Netlify 서버에서 실행됩니다.
// API 키는 Netlify 환경변수에서만 읽으며, 브라우저에 절대 노출되지 않습니다.
// -------------------------------------------------------

exports.handler = async function (event) {
  // CORS preflight 처리 (OPTIONS 요청)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: "",
    };
  }

  // GET 요청만 허용
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: corsHeaders(), body: "Method Not Allowed" };
  }

  // 쿼리 파라미터 파싱
  const params = event.queryStringParameters || {};
  const query = params.query || "";
  const display = Math.min(parseInt(params.display) || 10, 20); // 최대 20개
  const sort = params.sort === "sim" ? "sim" : "date"; // date(최신순) or sim(관련도)

  if (!query) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "query 파라미터가 필요합니다" }) };
  }

  // 환경변수에서 API 키 읽기 (Netlify 대시보드에서 설정)
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "서버 환경변수 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정" }),
    };
  }

  // 네이버 검색 API 호출
  const apiUrl =
    `https://openapi.naver.com/v1/search/news.json` +
    `?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers: corsHeaders(),
        body: JSON.stringify({ error: `네이버 API 오류: ${response.status}`, detail: errText }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "서버 오류", detail: err.message }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",       // 필요 시 특정 도메인으로 제한 가능
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
