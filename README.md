# ExtraLife: Gamified No-Loss Prediction Markets

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Network: Base Sepolia](https://img.shields.io/badge/Network-Base_Sepolia-blue)
![Yield: Aave V3](https://img.shields.io/badge/Yield-Aave_V3-purple)
![Framework: Scaffold--ETH](https://img.shields.io/badge/Framework-Scaffold--ETH-green)

**ExtraLife** is a decentralized, no-loss prediction market protocol built on Aave V3. Unlike traditional betting where users risk their principal, ExtraLife allows users to speculate on real-world events using **only the yield** generated from their deposits.

If you lose the prediction, you simply get your money back. If you win, you keep your money + a share of the pool's generated interest.

---

## System Architecture

The protocol leverages the **ERC-4626** Tokenized Vault standard to seamlessly route user liquidity into Aave lending pools while tracking prediction states off-chain via the Market Controller.

![User System Interaction](<Screenshot 2025-12-08 at 2.03.58 AM.png>)

> _High-level data flow: User Deposits → Vault → Aave V3 → Yield Accumulation → Market Resolution._

---

## Key Features

- **Principal Protection:** Users never lose their initial deposit. The "cost" of betting is only the opportunity cost of the time the funds are locked.

* **Yield-Powered Rewards:** All pooled funds are supplied to the Aave V3 Base Sepolia Pool to generate real-time interest (approx. 3.5% - 5% APY).

- **Fair Distribution:**
  - **60%** of accrued yield goes to the **Winners**.
  - **40%** of accrued yield goes to the **Market Creator** (incentivizing high-quality questions).
- **Security First:** Implements ERC-4626 inflation attack mitigation via initial dead-share minting.

## How It Works

### 1. The Setup (Market Creation)

A "Market Creator" initializes a pool with a specific question (e.g., "Will ETH hit $3k by Friday?") and a resolution deadline. They deposit a significant seed amount to bootstrap the pool and attract participants.

### 2. The Participation (Betting)

Users deposit USDC into the `NoLossVault`. They vote "Yes" or "No".

- _Under the hood:_ The Vault mints `nlUSDC` (NoLoss USDC) shares to the user and immediately supplies the USDC to Aave.

### 3. The Yield (Waiting Game)

While the event is active, the massive pool of combined capital sits in Aave, accruing interest block by block.

### 4. Resolution & Claim

Once the deadline passes, the Creator resolves the market.

- **Losers:** Withdraw their exact principal (1:1).
- **Winners:** Withdraw their principal + their share of the 60% Yield Pot.
- **Creator:** Withdraws their principal + the 40% Creator Fee.

## Incentive Model

![roles and incentive model](<Screenshot 2025-12-08 at 2.14.12 AM.png>)

### Game Theory: Why Each Role is Incentivized

**For Creators:**

- Creators receive 40% of the **total pool's yield**, not just their own deposit
- To profit, creators must attract participants — the larger the pool grows, the more yield is generated
- A creator depositing 100k needs the pool to reach ~$250K for their 40% share to exceed what they'd earn from Aave alone
- This incentivizes creators to craft compelling, high-quality prediction questions that attract bettors

**For Users (Bettors):**

- Users risk nothing — they always get their principal back regardless of outcome
- Early participation is rewarded: yield share is weighted by both deposit amount AND time in the pool
- This prevents last-minute "whale attacks" where someone deposits a huge amount right before resolution
- Winners split 60% of the total yield proportional to their time-weighted stake

**For the Protocol:**

- The mechanism creates a self-sustaining ecosystem where quality content (good predictions) is rewarded
- Creators are incentivized to promote their pools and grow participation
- Users are incentivized to join early and engage with interesting predictions

## Technical Stack

- **Smart Contracts:** Solidity v0.8.20 (Foundry)
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, DaisyUI
- **Blockchain Interaction:** wagmi, viem, RainbowKit
- **DeFi Integration:** Aave V3 `IPool` and `IAToken` interfaces

* **Network:** Base Sepolia (Testnet)

## Smart Contracts

| Contract             | Address (Base Sepolia)                       | Description                                                                   |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| **NoLossVault**      | `0xF8B51F4B5093A21192A3c3EB11FdD0E816046Be2` | ERC-4626 compliant vault. Handles deposits/withdrawals and Aave interfacing.  |
| **MarketController** | `0xE5a5148fea475D65e0542e6c111073e06FFB14d5` | The "Brain". Manages prediction states, voting logic, and yield distribution. |

## Getting Started

### Prerequisites

- Node.js >= v20.18.3
- Yarn
- Git
- Foundry (for contract work)

### Installation

```bash
git clone https://github.com/ruhneb2004/extraLife.git
cd extraLife
yarn install
```

### Quick Start (Local)

1. Start the local chain:

```bash
yarn chain
```

2. Deploy contracts:

> Note: This deploys to the local anvil chain with mocked Aave pools.

```bash
yarn deploy
```

3. Launch the App:

```bash
yarn start
```

Visit `http://localhost:3000` to interact with the UI.

### Deployment to Base Sepolia

To deploy to a public testnet:

1. Setup your `.env` in `packages/foundry` with your `DEPLOYER_PRIVATE_KEY` and `BASESCAN_API_KEY`.

2. Run the deploy command:

```bash
yarn deploy --network baseSepolia
```

3. Verify the contracts:

```bash
# (Inside packages/foundry)
forge script script/Deploy.s.sol --rpc-url baseSepolia --verify --resume
```

## Security Considerations

- **Inflation Attack:** The deployment script automatically mints "dead shares" to the deployer/burn address upon initialization to prevent the classic ERC-4626 inflation/donation attack.

- **Owner Privileges:** The MarketController currently allows the owner to resolve disputes (centralized for MVP). Future versions will implement an optimistic oracle (like UMA) for decentralized resolution.

## Roadmap

- [x] MVP: USDC Vault + Yes/No Markets
- [x] Aave V3 Integration on Base Sepolia
- [ ] Multi-choice predictions
- [ ] Integration with UMA Oracle for resolution
- [ ] Mainnet Launch on Base

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ using [Scaffold-ETH 2](https://scaffoldeth.io)
