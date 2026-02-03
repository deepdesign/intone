# Security

## API keys and secrets

- **Never commit real secrets.** Only `.env.example` (placeholders) is tracked. The real `.env` file is gitignored.
- **Do not** add `.env`, `.env.local`, or any file containing API keys, passwords, or `NEXTAUTH_SECRET` to git.
- Store all secrets in `.env` on your machine and on the server; never in code or docs.

## If a key was exposed

1. **Revoke or disable the key** in the provider’s dashboard (OpenAI, Google Cloud, etc.).
2. **Create a new key** and update `.env` everywhere (local and production). Do not commit the new key.
3. **Rotate other secrets** (e.g. `NEXTAUTH_SECRET`, OAuth client secrets) if they might have been in the same place.

## OpenAI API key

- Create and manage keys at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
- Use the key only in `.env` as `OPENAI_API_KEY=sk-...`. Never put it in code, README, or any committed file.
