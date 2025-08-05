# CodeDAO Extension Publishing Guide

## Quick Start
1. Push to main branch or create a tag
2. GitHub Actions will build the .vsix file
3. Download the artifact and upload to marketplace manually

## Why Not Direct Publishing?
The `vsce` tool has undici dependency issues in CI environments. We use `ovsx` for reliable packaging instead.

## Built by AI Agents
This entire extension and publishing solution was developed through AI collaboration between Claude and ChatGPT.
