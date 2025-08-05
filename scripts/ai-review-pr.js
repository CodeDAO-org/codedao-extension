const core = require("@actions/core");
const github = require("@actions/github");

(async () => {
  const token = process.env.GITHUB_TOKEN;
  const octokit = github.getOctokit(token);
  const { pull_request } = github.context.payload;

  if (!pull_request) return;

  const { data: files } = await octokit.rest.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: pull_request.number,
  });

  const changes = files.map(file => `### ${file.filename}\n\`\`\`\n${file.patch}\n\`\`\``).join("\n");

  const review = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert code reviewer." },
        { role: "user", content: `Please review these pull request changes:\n${changes}` }
      ]
    })
  }).then(res => res.json());

  const comment = review.choices?.[0]?.message?.content || "Review failed";

  await octokit.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pull_request.number,
    body: `🤖 **AI Code Review:**\n\n${comment}`
  });
})();
