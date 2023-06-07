# mStable Apps

Web frontends for interacting with the Merlin contracts.

---

## Apps

This repository comprises multiple Merlin apps, all built using common libraries and a common UI.

| Status | Name               | Nx project   | Port | Public hosts                                                                                                                                                                       |
| ------ | ------------------ | ------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | Merlin Protocol   | `protocol`   | 3000 | [Google Cloud](https://incubus.network)              |
| ✅     | Merlin Governance | `governance` | 3200 | [Google Cloud](https://staking.incubus.network/#/stake) |


---

## Development

This project was generated using [Nx](https://nx.dev).

### Quickstart

```bash
# Copy the default env vars so they can be overridden
cp .env .env.local

# Now edit the Subgraph API key env vars to add a local API key
# e.g. `vim .env.local`

# Then install, codegen, and run the apps
yarn
yarn codegen:typechain
yarn nx serve <PROJECT>
```

### Running an app

```bash
yarn nx serve protocol
yarn nx serve governance
```

### Building an app

```bash
yarn nx run build protocol
yarn nx run build governance
```

### NX module boundaries

To get the benefit of nx modules, it's important to avoid creating dependency cycles. ESlint is set up to catch this, so simply run:

```bash
yarn nx affected:lint
```
