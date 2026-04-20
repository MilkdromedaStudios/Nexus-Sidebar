# Merge Conflict Quick Fix (Nexus Sidebar)

If your PR says there are conflicts and you just want to keep **your branch version** for the large extension files, run:

```bash
git checkout --ours nexus-sidebar/sidebar/sidebar.js nexus-sidebar/sidebar/sidebar.css nexus-sidebar/sidebar/sidebar.html nexus-sidebar/background.js nexus-sidebar/manifest.json README.md
```

Then mark resolved and commit:

```bash
git add nexus-sidebar/sidebar/sidebar.js nexus-sidebar/sidebar/sidebar.css nexus-sidebar/sidebar/sidebar.html nexus-sidebar/background.js nexus-sidebar/manifest.json README.md
git commit -m "Resolve merge conflicts by keeping local Nexus Sidebar files"
```

If instead you want to keep incoming changes from the target branch, use `--theirs` in the first command.

## Safer workflow

1. Update your branch first:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Resolve conflicts immediately.
3. Run checks:
   ```bash
   node --check nexus-sidebar/sidebar/sidebar.js
   node -e "JSON.parse(require('fs').readFileSync('nexus-sidebar/manifest.json','utf8')); console.log('manifest ok')"
   ```

## Note

This repo now includes `.gitattributes` with markdown `merge=union` to reduce README/docs conflict pain.
