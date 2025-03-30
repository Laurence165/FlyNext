import { NextResponse } from 'next/server';

export function withErrorHandling(handler: Function) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      // Determine status code based on error
      const statusCode = error.status || 500;
      const message = statusCode === 500 
        ? 'Internal Server Error' 
        : error.message || 'Something went wrong';
      
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  };
}
