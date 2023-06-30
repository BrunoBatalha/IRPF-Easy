import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const ticket = request.nextUrl.searchParams.get('ticket')
    const url = 'https://brapi.dev/api/quote/' + ticket
    const response = await fetch(url);
    return response
}