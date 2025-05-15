GH Repo Delete CLI
A simple Deno CLI that runs a local web UI to delete your GitHub repos.

Setup
Set your GitHub token:

bash
Copy
Edit
export GITHUB_TOKEN=your_token_here
Run the CLI:

bash
Copy
Edit
deno run --allow-net --allow-env --unstable web_repo_delete.ts
Usage
Opened automatically at http://localhost:8080

Select repos to delete

Confirm deletion

See results and auto-redirect

Notes
This permanently deletes repos, no undo.

Requires GitHub token with repo scope.

Only fetches your repos.

License
MIT © 2025 Vinay
