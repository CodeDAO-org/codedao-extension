const fs = require('fs');
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

(async () => {
  const owner = "CodeDAO-org";
  const repo = "codedao-extension";
  const branch = "main";

  // Get current file content
  const { data: file } = await octokit.repos.getContent({
    owner, repo,
    path: "package.json",
    ref: branch
  });

  const content = Buffer.from(file.content, 'base64').toString('utf-8');
  
  // Fix JSON syntax (remove trailing commas)
  const fixed = content.replace(/,\s*}/g, '}');

  // Commit the fix
  await octokit.repos.createOrUpdateFileContents({
    owner, repo,
    path: "package.json",
    message: "AI: Fix JSON syntax error",
    content: Buffer.from(fixed).toString('base64'),
    sha: file.sha,
    branch
  });

  console.log("✅ JSON fix pushed by AI agent");
})();
