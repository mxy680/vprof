import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

// #region agent log
const log = (location: string, message: string, data: any) => {
  fetch('http://127.0.0.1:7243/ingest/0f661d19-0f97-4614-82fe-e84f3a13638c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: data.hypothesisId || 'A'
    })
  }).catch(() => {});
};
// #endregion

const handler = toNextJsHandler(auth.handler)

export const GET = async (req: Request, context: any) => {
  // #region agent log
  const url = new URL(req.url);
  log('app/api/auth/[...all]/route.ts:GET', 'API GET request received', {
    hypothesisId: 'A',
    pathname: url.pathname,
    searchParams: Object.fromEntries(url.searchParams),
    method: req.method,
    headers: Object.fromEntries(req.headers.entries())
  });
  // #endregion
  
  try {
    const response = await handler.GET(req, context);
    
    // #region agent log
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    log('app/api/auth/[...all]/route.ts:GET', 'API GET response', {
      hypothesisId: 'A',
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyLength: responseText.length,
      bodyPreview: responseText.substring(0, 200),
      isJSON: (() => {
        try {
          JSON.parse(responseText);
          return true;
        } catch {
          return false;
        }
      })()
    });
    // #endregion
    
    return response;
  } catch (error: any) {
    // #region agent log
    log('app/api/auth/[...all]/route.ts:GET', 'API GET error', {
      hypothesisId: 'A',
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name
    });
    // #endregion
    throw error;
  }
}

export const POST = async (req: Request, context: any) => {
  // #region agent log
  const url = new URL(req.url);
  log('app/api/auth/[...all]/route.ts:POST', 'API POST request received', {
    hypothesisId: 'B',
    pathname: url.pathname,
    searchParams: Object.fromEntries(url.searchParams),
    method: req.method,
    headers: Object.fromEntries(req.headers.entries())
  });
  // #endregion
  
  try {
    const response = await handler.POST(req, context);
    
    // #region agent log
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    log('app/api/auth/[...all]/route.ts:POST', 'API POST response', {
      hypothesisId: 'B',
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyLength: responseText.length,
      bodyPreview: responseText.substring(0, 200),
      isJSON: (() => {
        try {
          JSON.parse(responseText);
          return true;
        } catch {
          return false;
        }
      })()
    });
    // #endregion
    
    return response;
  } catch (error: any) {
    // #region agent log
    log('app/api/auth/[...all]/route.ts:POST', 'API POST error', {
      hypothesisId: 'B',
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name
    });
    // #endregion
    throw error;
  }
}

