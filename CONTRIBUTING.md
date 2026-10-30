## Contributing to GRAB Tools

#### **Did you find a bug?**

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/twhlynch/GRAB-Tools/issues), and _#editor-bugs_ in the [discord server](https://discord.grabvr.tools).

- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/twhlynch/GRAB-Tools/issues/new). Be sure to include a **title and clear description**, and as much relevant information as possible.

#### **Do you intend to add a feature or fix a bug?**

- Suggest your change in the [discord server](https://discord.grabvr.tools) or [open an issue](https://github.com/twhlynch/GRAB-Tools/issues/new) tagged as _enhancement_ and mention you want to build it to avoid writing unwanted features.

- Browse around the source code to get an idea for conventions. Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary), prefer `snake_case`, and so on.

- Open a new GitHub pull request with the changes, including a relevant issue number if applicable.

#### **Do you have questions about the source code?**

- Ask any question in the [discord server](https://discord.grabvr.tools).

#### Development Conventions

- Name branches using [conventional branch naming](https://conventionalbranch.org/) Purpose Prefixes.
- Write clear commit messages using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) excluding scopes and breaking change indication.
- Each commit should be atomic, with one change per commit. Don't bundle unrelated changes or hotfixes.
- Commit only relevant files. Don't commit configs, logs, or temporary files.
- Utilitse `pnpm test|check|typecheck|lint|format` before comitting.
- Don't merge `main` into a PR branch. Intead always rebase and force push.
