// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { NoLossVault } from "../contracts/Vault.sol";
import { MarketController } from "../contracts/MarketController.sol";
import { IERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IPool } from "lib/aave-v3-core/contracts/interfaces/IPool.sol";

contract DeployScript is ScaffoldETHDeploy {
    // --- SEPOLIA (Ethereum) ADDRESSES ---
    address constant SEPOLIA_LINK_TOKEN = 0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5;
    address constant SEPOLIA_LINK_TOKEN_POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    address constant SEPOLIA_ALINK_TOKEN = 0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24;
    // UMA Addresses for Sepolia
    address constant SEPOLIA_OO = 0x9f1263B8f0355673619168b5B8c0248f1d03e88C;
    address constant SEPOLIA_WETH = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;

    // --- BASE SEPOLIA (Coinbase) ADDRESSES ---
    // Using the USDC from Circle's Base Sepolia faucet
    address constant BASE_SEPOLIA_USDC = 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f;
    address constant BASE_SEPOLIA_POOL = 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27;
    address constant BASE_SEPOLIA_AUSDC = 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC;

    // UMA Addresses for Base Sepolia
    // Optimistic Oracle V2
    // these addresses for base sepolia are just placeholders, they have to replaced in the time of testing!
    address constant BASE_SEPOLIA_OO = 0xB1d29dFA311eE18559D7769996D934278f335453;
    // Bond Token (WETH)
    address constant BASE_SEPOLIA_BOND_WETH = 0x4200000000000000000000000000000000000006;

    function run() external ScaffoldEthDeployerRunner {
        // Detect chain and use appropriate addresses
        address tokenAddr;
        address poolAddr;
        address aTokenAddr;
        address ooAddr;
        address bondAddr;
        string memory vaultName;
        string memory vaultSymbol;

        if (block.chainid == 11155111) {
            // Sepolia (LINK)
            tokenAddr = SEPOLIA_LINK_TOKEN;
            poolAddr = SEPOLIA_LINK_TOKEN_POOL;
            aTokenAddr = SEPOLIA_ALINK_TOKEN;
            ooAddr = SEPOLIA_OO;
            bondAddr = SEPOLIA_WETH;
            vaultName = "NoLoss Vault LINK";
            vaultSymbol = "nlLINK";
            console.log("Deploying to Sepolia with LINK...");
        } else if (block.chainid == 84532) {
            // Base Sepolia (USDC)
            tokenAddr = BASE_SEPOLIA_USDC;
            poolAddr = BASE_SEPOLIA_POOL;
            aTokenAddr = BASE_SEPOLIA_AUSDC;
            ooAddr = BASE_SEPOLIA_OO;
            bondAddr = BASE_SEPOLIA_BOND_WETH;
            vaultName = "NoLoss Vault USDC";
            vaultSymbol = "nlUSDC";
            console.log("Deploying to Base Sepolia with USDC...");
        } else {
            revert("Unsupported chain");
        }

        IERC20 token = IERC20(tokenAddr);

        // 1. Deploy the Vault
        NoLossVault vault = new NoLossVault(token, IPool(poolAddr), aTokenAddr, vaultName, vaultSymbol);
        console.log("NoLossVault deployed at:", address(vault));

        // 2. SECURITY: Prevent Inflation Attack
        // We deposit 1 unit (1e18 or 1e6 depending on token) immediately to burn the first shares.

        uint256 decimals = 18; // Default for LINK
        if (block.chainid == 84532) decimals = 6; // USDC on Base Sepolia is 6 decimals

        // Calculate 1 token unit
        uint256 oneUnit = 1 * (10 ** decimals);

        if (token.balanceOf(deployer) >= oneUnit) {
            // Approve Vault to spend 1 Unit
            token.approve(address(vault), oneUnit);

            // Deposit (Mint shares to deployer)
            vault.deposit(oneUnit, deployer);

            console.log("Security Deposit complete. Vault is safe.");
        } else {
            console.log("--------------------------------------------------");
            console.log("WARNING: Deployer has no Token balance. Vault is vulnerable!");
            console.log("Go to the Faucet to get tokens for this chain.");
            console.log("--------------------------------------------------");
        }

        // 3. Deploy MarketController (Linked to Vault + UMA Oracle)
        MarketController controller = new MarketController(
            address(vault),
            tokenAddr,
            ooAddr, // <--- New Argument: Optimistic Oracle
            bondAddr // <--- New Argument: Bond Token
        );
        console.log("MarketController deployed at:", address(controller));

        // 4. Export for Frontend
        deployments.push(Deployment({ name: "NoLossVault", addr: address(vault) }));
        deployments.push(Deployment({ name: "MarketController", addr: address(controller) }));
    }
}
