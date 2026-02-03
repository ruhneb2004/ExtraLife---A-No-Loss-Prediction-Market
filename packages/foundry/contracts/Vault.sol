// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC4626 } from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
import { ERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IPool } from "lib/aave-v3-core/contracts/interfaces/IPool.sol";

/**
 * @title NoLossVault
 * @notice Wraps Aave V3 lending into a standard ERC-4626 Vault.
 */
contract NoLossVault is ERC4626 {
    IPool public immutable aavePool;
    IERC20 public immutable aToken; // The receipt token from Aave (e.g., aUSDC)

    constructor(
        IERC20 _asset, // The underlying token (e.g., USDC)
        IPool _aavePool, // The Aave V3 Pool address
        address _aToken, // The Aave aToken address (e.g., aUSDC)
        string memory _name,
        string memory _symbol
    )
        ERC4626(_asset)
        ERC20(_name, _symbol)
    {
        aavePool = _aavePool;
        aToken = IERC20(_aToken);
    }

    /**
     * @dev Total assets is the balance of aTokens we hold (Principal + Interest)
     */
    function totalAssets() public view override returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /**
     * @dev When we deposit, we supply to Aave.
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        // 1. Receive assets from user (handled by super)
        super._deposit(caller, receiver, assets, shares);

        // 2. Approve Aave to spend our USDC
        IERC20(asset()).approve(address(aavePool), assets);

        // 3. Supply to Aave
        aavePool.supply(address(asset()), assets, address(this), 0);
    }

    /**
     * @dev When we withdraw, we pull from Aave.
     */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        // 1. Withdraw from Aave
        aavePool.withdraw(address(asset()), assets, address(this));

        // 2. Send to user (handled by super)
        super._withdraw(caller, receiver, owner, assets, shares);
    }
}
