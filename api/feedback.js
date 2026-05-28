export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { completedCount, totalCount, todos } = req.body;

  const todoList = todos
    .map((t) => `- [${t.done ? "완료" : "미완료"}] ${t.text}`)
    .join("\n");

  const prompt = `당신은 사용자의 하루 생산성을 응원하는 따뜻한 코치입니다.
아래는 사용자의 할 일 목록입니다:

${todoList}

전체 ${totalCount}개 중 ${completedCount}개를 완료했습니다.

딱 한 문장으로 격려 또는 조언 피드백을 한국어로 작성해주세요.
이모지를 1개 포함하고, 구체적이고 따뜻하게 써주세요.`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content?.trim();

    if (!feedback) throw new Error("No feedback returned");
    res.status(200).json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ feedback: "오늘도 꾸준히 나아가고 있어요. 잘하고 있습니다! 💪" });
  }
}
