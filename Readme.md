# GH Repo Delete CLI

A simple Deno CLI that runs a local web UI to delete your GitHub repos.

## Setup

1. Set your GitHub token:

```bash
export GITHUB_TOKEN=your_token_here
```
2. Run the CLI
```bash
deno run --allow-net --allow-env --unstable main.ts
```

## Usage
- Opened automatically at [http://localhost:8080](http://localhost:8080)
- Select repos to delete
- Confirm deletion
- See results and auto-redirect

## Notes
- This permanently deletes repos, no undo.
- Requires GitHub token with repo scope.
- Only fetches your repos.


## License
MIT © 2025 Vinay
