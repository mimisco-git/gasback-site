# GasBack Frontend MVP

A premium static landing page and demo dashboard for an EVM gas recovery concept.

## What is included

- Premium dark landing page
- Responsive layout
- MetaMask or injected wallet connection
- Demo mode if no wallet is installed
- Simulated wallet analytics based on address
- One-click simulated claim flow using browser local storage
- GitHub Pages ready structure

## Important note

This is a frontend MVP only.

It does **not** provide real blockchain gas refunds, real wallet identity scraping, or a production rebate engine.
It is built to help you launch the idea visually, test the concept, and share a polished working prototype.

## Files

- `index.html` main page
- `styles.css` all styling
- `app.js` interactivity and wallet demo logic
- `404.html` fallback page for GitHub Pages
- `.nojekyll` disables Jekyll processing on GitHub Pages

## How to run locally

Just open `index.html` in a browser.

For better wallet testing, serve it with a small local server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## How to publish on GitHub Pages

### Option 1, upload with GitHub website

1. Create a new repository on GitHub.
2. Upload all files from this folder into the repository root.
3. Go to **Settings**.
4. Open **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select your main branch and `/root` folder.
7. Save.
8. GitHub will give you a live URL after deployment.

### Option 2, use git commands

```bash
cd gasback-site
git init
git branch -M main
git add .
git commit -m "Initial GasBack MVP"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Then enable GitHub Pages in repository settings.

## Best next upgrade path

To make this a real product, add:

- backend API
- real on-chain indexing
- supported chain integrations
- claim funding logic
- wallet reputation and analytics engine
- proper security review
- optional ENS and user-authorized social linking

## Branding

You can rename the project by changing the brand text in `index.html`.
