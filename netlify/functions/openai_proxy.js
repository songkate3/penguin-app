// netlify/functions/openai_proxy.js

export default async (req, context) => {
    // 1. OpenAI API 키 확인 (Netlify 환경 변수에서 가져옴)
    const apiKey = Netlify.env.get("OPENAI_API_KEY");

    if (!apiKey) {
        return new Response(JSON.stringify({ error: "Missing OpenAI API Key" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    // 2. 요청 본문(Body) 파싱
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
    }

    const { userInput, status, context: scenarioContext, attempts } = body;

    // 3. AI 프롬프트 메시지 구성
    const messages = [
        {
            role: "system",
            content: `You are a Reading Coach. 
Context: ${scenarioContext}
Current Status: ${status} (Is the user correct?)
Attempts made: ${attempts}
Task: Generate a 1-sentence friendly response.
- If Correct: Congratulate enthusiasticly and confirm the action.
- If Wrong (Attempt 1): Ask a leading question guiding them to the text.
- If Wrong (Attempt 2+): Give a specific hint about the answer.`
        },
        {
            role: "user",
            content: userInput
        }
    ];

    try {
        // 4. OpenAI API 호출
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o", // 필요시 "gpt-3.5-turbo"로 변경 가능
                messages: messages,
                max_tokens: 150,
                temperature: 0.7
            })
        });

        const data = await response.json();

        // 5. 응답 텍스트 추출
        const text = data.choices?.[0]?.message?.content || "Error generating response.";

        return new Response(JSON.stringify({ text }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};