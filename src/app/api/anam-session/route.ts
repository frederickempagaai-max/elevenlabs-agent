// src/app/api/anam-session/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const anamApiKey = process.env.ANAM_API_KEY;
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!anamApiKey) {
      return NextResponse.json({ error: "Missing ANAM_API_KEY" }, { status: 500 });
    }

    if (!elevenLabsApiKey) {
      return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 });
    }

    const { avatarId, agentId } = await request.json();

    if (!avatarId || !agentId) {
      return NextResponse.json(
        { error: "Missing avatarId or agentId" },
        { status: 400 }
      );
    }

    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": elevenLabsApiKey,
        },
      }
    );

    if (!elRes.ok) {
      const text = await elRes.text();
      return NextResponse.json(
        { error: `ElevenLabs API error: ${elRes.status} ${text}` },
        { status: elRes.status }
      );
    }

    const { signed_url: signedUrl } = await elRes.json();

    const anamRes = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anamApiKey}`,
      },
      body: JSON.stringify({
        personaConfig: {
          avatarId,
        },
        environment: {
          elevenLabsAgentSettings: {
            signedUrl,
            agentId,
          },
        },
      }),
    });

    if (!anamRes.ok) {
      const text = await anamRes.text();
      return NextResponse.json(
        { error: `Anam API error: ${anamRes.status} ${text}` },
        { status: anamRes.status }
      );
    }

    const data = await anamRes.json();

    return NextResponse.json({
      sessionToken: data.sessionToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create Anam session" },
      { status: 500 }
    );
  }
}
