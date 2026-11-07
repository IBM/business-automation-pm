# View the site locally

## Prerequisites

- Node.js and npm (the versions are pinned in `.mise.toml`)

## Run the development server

```bash
git clone https://github.com/IBM/business-automation-pm.git
cd business-automation-pm
npm install        # first time only
npm run dev
```

Vite prints the local URL, usually <http://localhost:5173>. Open it in your browser. The page reloads automatically when you edit files in `src/`.

## Preview the production build

This is what GitHub Pages serves.

```bash
npm run build
npm run preview    # serves dist/ at http://localhost:4173
```

## Tips

- Pages use hash links, for example `http://localhost:5173/#enablement-top`.
- IBM-only pages ask for a password. To skip it for the current browser session, run this in the browser console and reload:

  ```js
  sessionStorage.setItem('ibm-access-granted', 'true')
  ```

- Every push to `main` deploys to GitHub Pages, so check changes locally first.
