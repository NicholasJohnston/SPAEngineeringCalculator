# SPA Engineering Calculator — GitHub Pages

This package contains the latest app, logo, icons, install manifest and offline service worker. No build tools or dependencies are required.

## Publish
1. Extract this ZIP.
2. Create a GitHub repository (public works with GitHub Free).
3. Upload all extracted files and the icons folder to the repository root. index.html must be at the top level, not inside another folder. Upload the extracted contents, not the ZIP.
4. Commit the files to main.
5. Open Settings > Pages. Under Build and deployment, choose Deploy from a branch.
6. Select main and /(root), then Save.
7. Wait for publication and open the HTTPS URL shown in Pages settings.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Install and offline use
Open the published HTTPS site while online first. Android/desktop browsers that support installation show Install app when eligible. On iPhone, use Safari > Share > Add to Home Screen. Offline use requires the initial assets to finish downloading. Opening index.html directly from disk does not enable the service worker.

All asset paths are relative, so the app supports a repository subdirectory URL as well as a root domain. Navigation uses URL hashes.

## Updates
Edit app.js or styles.css, and change the version suffix in sw.js whenever releasing changes so the offline cache refreshes. Reopen while online after publication; a further reload may be needed after the new worker activates.

Included changes: removed offline wording and original BitCalc reference, mobile-sized reference tables, shortened DCP description, and single result labels. Offline functionality remains enabled.

## Direct browser installation
The Install app button appears only when the browser exposes its native installation prompt. Clicking it immediately opens that prompt, with no instructions dialog. Confirm installation in the browser prompt. The website cannot bypass this browser confirmation or force the prompt before the browser makes it available.

If installation is not available, or the app is running in standalone mode, the button is hidden. Dismissing a prompt consumes that prompt; the button appears again only if the browser provides a new installation event. Supports the direct prompt in compatible Chromium browsers such as Chrome and Edge. Safari does not expose this website-triggered prompt.

Publish on HTTPS and visit the published URL, not a local file or embedded preview. Browser/device policies can restrict installation.

The original logo uses CSS blending on the app's light surfaces; logo.jpg is not alpha-transparent. Offline functionality is retained. This release uses cache version v6. Replace all files from the previous package and publish; reload online so the new service worker can activate. The separately hosted ChatGPT Site is not updated by this download.

Browser installation API reference: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
