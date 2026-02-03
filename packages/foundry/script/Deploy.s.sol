// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { NoLossVault } from "../contracts/Vault.sol";
import { MarketController } from "../contracts/MarketController.sol";
import { IERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IPool } from "lib/aave-v3-core/contracts/interfaces/IPool.sol";

contract DeployScript is ScaffoldETHDeploy {
    // --- SEPOLIA AAVE V3 ADDRESSES ---
    // This is the USDC used by the Aave Faucet on Sepolia
    address constant SEPOLIA_USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address constant SEPOLIA_POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    address constant SEPOLIA_AUSDC = 0x16dA4541aD1807f4443d92D26044C1147406EB80;

    function run() external ScaffoldEthDeployerRunner {
        IERC20 usdc = IERC20(SEPOLIA_USDC);

        // 1. Deploy the Vault
        NoLossVault vault = new NoLossVault(usdc, IPool(SEPOLIA_POOL), SEPOLIA_AUSDC, "NoLoss Vault USDC", "nlUSDC");
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
            console.log("Go to the Aave Faucet on Sepolia to get tokens.");
            console.log("--------------------------------------------------");
        }

        // 3. Deploy MarketController (Linked to Vault)
        MarketController controller = new MarketController(address(vault), SEPOLIA_USDC);
        console.log("MarketController deployed at:", address(controller));

        // 4. Export for Frontend
        deployments.push(Deployment({ name: "NoLossVault", addr: address(vault) }));
        deployments.push(Deployment({ name: "MarketController", addr: address(controller) }));
    }
}
