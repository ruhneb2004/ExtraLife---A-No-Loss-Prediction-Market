// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { NoLossVault } from "../contracts/Vault.sol";
import { MarketController } from "../contracts/MarketController.sol";
import { IERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IPool } from "lib/aave-v3-core/contracts/interfaces/IPool.sol";

contract DeployScript is ScaffoldETHDeploy {
    // --- SEPOLIA AAVE V3 ADDRESSES ---
    address constant SEPOLIA_LINK = 0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5;
    address constant SEPOLIA_POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    address constant SEPOLIA_ALINK = 0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24;

    // --- BASE SEPOLIA AAVE V3 ADDRESSES ---
    // Using the USDC from Circle's Base Sepolia faucet
    address constant BASE_SEPOLIA_USDC = 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f;
    address constant BASE_SEPOLIA_POOL = 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27;
    address constant BASE_SEPOLIA_AUSDC = 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC;

    function run() external ScaffoldEthDeployerRunner {
        // Detect chain and use appropriate addresses
        address tokenAddr;
        address poolAddr;
        address aTokenAddr;

        if (block.chainid == 11155111) {
            // Sepolia
            tokenAddr = SEPOLIA_LINK;
            poolAddr = SEPOLIA_POOL;
            aTokenAddr = SEPOLIA_ALINK;
            console.log("Deploying to Sepolia...");
        } else if (block.chainid == 84532) {
            // Base Sepolia
            tokenAddr = BASE_SEPOLIA_USDC;
            poolAddr = BASE_SEPOLIA_POOL;
            aTokenAddr = BASE_SEPOLIA_AUSDC;
            console.log("Deploying to Base Sepolia...");
        } else {
            revert("Unsupported chain");
        }

        IERC20 token = IERC20(tokenAddr);

        // 1. Deploy the Vault
        NoLossVault vault = new NoLossVault(token, IPool(poolAddr), aTokenAddr, "NoLoss Vault LINK", "nlLINK");
        console.log("NoLossVault deployed at:", address(vault));

        // 2. SECURITY: Prevent Inflation Attack
        // We deposit 1 LINK (1e18) immediately to burn the first shares.
        // ScaffoldEthDeployerRunner is already broadcasting, so we just call the functions.

        if (token.balanceOf(deployer) >= 1e18) {
            // Approve Vault to spend 1 LINK
            token.approve(address(vault), 1e18);

            // Deposit (Mint shares to deployer)
            vault.deposit(1e18, deployer);

            console.log("Security Deposit (1 LINK) complete. Vault is safe.");
        } else {
            console.log("--------------------------------------------------");
            console.log("WARNING: Deployer has no LINK. Vault is vulnerable!");
            console.log("Go to the Aave Faucet to get tokens for this chain.");
            console.log("--------------------------------------------------");
        }

        // 3. Deploy MarketController (Linked to Vault)
        MarketController controller = new MarketController(address(vault), tokenAddr);
        console.log("MarketController deployed at:", address(controller));

        // 4. Export for Frontend
        deployments.push(Deployment({ name: "NoLossVault", addr: address(vault) }));
        deployments.push(Deployment({ name: "MarketController", addr: address(controller) }));
    }
}
