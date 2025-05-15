import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { open } from "https://deno.land/x/open@v0.0.6/index.ts";

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
if (!GITHUB_TOKEN) {
  console.error("❌ Set GITHUB_TOKEN env variable");
  Deno.exit(1);
}

const PORT = 8080;

async function fetchAllRepos(): Promise<string[]> {
  const repos: string[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Deno-GitHub-CLI",
        },
      },
    );

    if (!res.ok) break;

    const data = await res.json();
    if (data.length === 0) break;

    for (const repo of data) {
      repos.push(repo.full_name); // e.g., owner/repo
    }

    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

async function deleteRepo(fullName: string): Promise<boolean> {
  const [owner, repo] = fullName.split("/");
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    method: "DELETE",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Deno-GitHub-CLI",
    },
  });

  return res.status === 204;
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/") {
    const repos = await fetchAllRepos();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Delete GitHub Repos</title>
  <style>
    body {
      background-color: #f5f5f5;
      font-family: sans-serif;
      padding: 2rem;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    .checkbox-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #ccc;
      padding: 1rem;
      border-radius: 5px;
      margin-bottom: 1rem;
    }
    .checkbox-list div {
      margin-bottom: 0.5rem;
    }
    .button {
      background-color: #e53935;
      color: white;
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .button:hover {
      background-color: #c62828;
    }
    .modal {
      display: none;
      position: fixed;
      z-index: 10;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.5);
    }
    .modal-content {
      background-color: #fff;
      margin: 10% auto;
      padding: 2rem;
      border: 1px solid #888;
      width: 90%;
      max-width: 400px;
      border-radius: 8px;
    }
    .modal-actions {
      margin-top: 1.5rem;
      text-align: right;
    }
    .modal-actions button {
      margin-left: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .cancel-btn {
      background-color: #ccc;
    }
    .confirm-btn {
      background-color: #e53935;
      color: #fff;
    }
    .confirm-btn:hover {
      background-color: #c62828;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Delete GitHub Repos</h1>
    <form id="repo-form" method="POST">
      <div class="checkbox-list">
        ${repos
          .map(
            (r) => `
          <div>
            <label>
              <input type="checkbox" name="repos" value="${r}" /> ${r}
            </label>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="button" onclick="showModal()">Delete Selected</button>
    </form>
  </div>

  <div id="confirmModal" class="modal">
    <div class="modal-content">
      <h2>Confirm Deletion</h2>
      <p>Are you sure you want to delete the selected repositories? This action cannot be undone.</p>
      <div class="modal-actions">
        <button class="cancel-btn" onclick="hideModal()">Cancel</button>
        <button class="confirm-btn" onclick="submitForm()">Yes, Delete</button>
      </div>
    </div>
  </div>

  <script>
    function showModal() {
      document.getElementById("confirmModal").style.display = "block";
    }
    function hideModal() {
      document.getElementById("confirmModal").style.display = "none";
    }
    function submitForm() {
      document.getElementById("repo-form").submit();
    }
  </script>
</body>
</html>
    `;
    return new Response(html, { headers: { "content-type": "text/html" } });
  }

  if (req.method === "POST") {
    const form = await req.formData();
    const selected = form.getAll("repos") as string[];

    const results = await Promise.all(
      selected.map((repo) => deleteRepo(repo).then((ok) => ({ repo, ok }))),
    );

    const html = `
<html>
<head>
  <meta http-equiv="refresh" content="5; url=/" />
  <title>Deleted</title>
  <style>
    body {
      font-family: sans-serif;
      background: #f5f5f5;
      padding: 2rem;
      text-align: center;
    }
    .result {
      max-width: 600px;
      margin: auto;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    ul {
      text-align: left;
      margin-top: 1rem;
    }
    li.ok { color: green; }
    li.fail { color: red; }
  </style>
</head>
<body>
  <div class="result">
    <h1>Delete Results</h1>
    <ul>
      ${results
        .map(
          (r) =>
            `<li class="${r.ok ? "ok" : "fail"}">[${r.ok ? "OK" : "FAIL"}] ${r.repo}</li>`,
        )
        .join("")}
    </ul>
    <p>Redirecting back in 5 seconds...</p>
  </div>
</body>
</html>
    `;
    return new Response(html, { headers: { "content-type": "text/html" } });
  }

  return new Response("Not found", { status: 404 });
}

// Start server
console.log(`🚀 Server running at http://localhost:${PORT}`);
open(`http://localhost:${PORT}`);
await serve(handleRequest, { port: PORT });
