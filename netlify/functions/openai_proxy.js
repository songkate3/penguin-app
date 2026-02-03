const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // 1. 보안: POST 요청만 허용
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Missing API Key in Server" }) };
    }

    try {
        const body = JSON.parse(event.body);
        
        // A. Chat Completion 요청 처리
        if (body.type === 'chat') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: body.messages,
                    max_tokens: 200
                })
            });
            const data = await response.json();
            return {
                statusCode: 200,
                body: JSON.stringify(data)
            };
        }
        
        // B. TTS (Text-to-Speech) 요청 처리
        else if (body.type === 'tts') {
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "tts-1",
                    input: body.input,
                    voice: "nova",
                    speed: 0.9
                })
            });
            
            // 오디오 데이터(Buffer)를 그대로 반환
            const arrayBuffer = await response.arrayBuffer();
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'audio/mpeg' },
                body: Buffer.from(arrayBuffer).toString('base64'),
                isBase64Encoded: true
            };
        }

    } catch (error) {
        return { statusCode: 500, body: String(error) };
    }
};