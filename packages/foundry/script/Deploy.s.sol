// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { NoLossVault } from "../contracts/Vault.sol";
import { MarketController } from "../contracts/MarketController.sol";
import { IERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IPool } from "lib/aave-v3-core/contracts/interfaces/IPool.sol";

contract DeployScript is ScaffoldETHDeploy {
    // --- SEPOLIA AAVE V3 ADDRESSES ---
    address constant SEPOLIA_USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address constant SEPOLIA_POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    address constant SEPOLIA_AUSDC = 0x16dA4541aD1807f4443d92D26044C1147406EB80;

    // --- BASE SEPOLIA AAVE V3 ADDRESSES ---
    // Using the USDC from Circle's Base Sepolia faucet
    address constant BASE_SEPOLIA_USDC = 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f;
    address constant BASE_SEPOLIA_POOL = 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27;
    address constant BASE_SEPOLIA_AUSDC = 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC;

    function run() external ScaffoldEthDeployerRunner {
        // Detect chain and use appropriate addresses
        address usdcAddr;
        address poolAddr;
        address aUsdcAddr;

        if (block.chainid == 11155111) {
            // Sepolia
            usdcAddr = SEPOLIA_USDC;
            poolAddr = SEPOLIA_POOL;
            aUsdcAddr = SEPOLIA_AUSDC;
            console.log("Deploying to Sepolia...");
        } else if (block.chainid == 84532) {
            // Base Sepolia
            usdcAddr = BASE_SEPOLIA_USDC;
            poolAddr = BASE_SEPOLIA_POOL;
            aUsdcAddr = BASE_SEPOLIA_AUSDC;
            console.log("Deploying to Base Sepolia...");
        } else {
            revert("Unsupported chain");
        }

        IERC20 usdc = IERC20(usdcAddr);

        // 1. Deploy the Vault
        NoLossVault vault = new NoLossVault(usdc, IPool(poolAddr), aUsdcAddr, "NoLoss Vault USDC", "nlUSDC");
        console.log("NoLossVault deployed at:", address(vault));

        // 2. SECURITY: Prevent Inflation Attack
        // We deposit 1 USDC (1e6) immediately to burn the first shares.
        // ScaffoldEthDeployerRunner is already broadcasting, so we just call the functions.

        if (usdc.balanceOf(deployer) >= 1e6) {
            // Approve Vault to spend 1 USDC
            usdc.approve(address(vault), 1e6);

            // Deposit (Mint shares to deployer)
            vault.deposit(1e6, deployer);

            console.log("Security Deposit (1 USDC) complete. Vault is safe.");
        } else {
            console.log("--------------------------------------------------");
            console.log("WARNING: Deployer has no USDC. Vault is vulnerable!");
            console.log("Go to the Aave Faucet to get tokens for this chain.");
            console.log("--------------------------------------------------");
        }

        // 3. Deploy MarketController (Linked to Vault)
        MarketController controller = new MarketController(address(vault), usdcAddr);
        console.log("MarketController deployed at:", address(controller));

        // 4. Export for Frontend
        deployments.push(Deployment({ name: "NoLossVault", addr: address(vault) }));
        deployments.push(Deployment({ name: "MarketController", addr: address(controller) }));
    }
}
