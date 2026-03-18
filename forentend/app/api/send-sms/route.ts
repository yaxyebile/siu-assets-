import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sendto, body } = await request.json()

    if (!sendto || !body) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    // Clean phone number (remove non-digits except +)
    const cleanPhone = sendto.replace(/[^\d+]/g, '');

    // Prepare JSON payload for xaliye6 API
    const payload = {
      mobile: cleanPhone,
      message: body
    }

    const response = await fetch("https://api.xaliye6.online/sendSMS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.text()

    // Attempt to parse JSON response if possible
    let jsonData = data;
    try {
      jsonData = JSON.parse(data);
    } catch (e) { }

    return NextResponse.json({ success: true, data: jsonData })
  } catch (error) {
    console.error("SMS Error:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
  }
}
