// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { NoLossVault } from "./Vault.sol";

contract MarketController {
    struct Pool {
        address creator;
        string question;
        uint256 endTime;
        uint256 totalShares;
        uint256 totalPrincipal;
        uint256 creatorPrincipal;
        bool resolved;
        bool outcome;
        uint256 yesPrincipal;
        uint256 noPrincipal;

        // NEW: Track Time-Weighted Scores
        uint256 totalYesWeight; // Sum of (DepositAmount * TimeLeft) for YES
        uint256 totalNoWeight; // Sum of (DepositAmount * TimeLeft) for NO

        uint256 finalTotalYield;
    }

    struct UserBet {
        uint256 principal;
        uint256 weight; // NEW: This user's "Score" (Amount * Time)
        bool side;
        bool claimed;
    }

    NoLossVault public vault;
    IERC20 public usdc;
    address public owner;

    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => UserBet)) public bets;

    event PoolCreated(uint256 indexed poolId, string question, uint256 endTime);
    event BetPlaced(uint256 indexed poolId, address indexed user, bool side, uint256 amount, uint256 weight);
    event PoolResolved(uint256 indexed poolId, bool outcome, uint256 totalYield);

    constructor(address _vaultAddress, address _usdcAddress) {
        vault = NoLossVault(_vaultAddress);
        usdc = IERC20(_usdcAddress);
        owner = msg.sender;
    }

    // --- VIEW FUNCTION ---
    function getPoolMetrics(uint256 _poolId)
        external
        view
        returns (uint256 currentTotalYield, uint256 estimatedWinnerPrize, uint256 estimatedCreatorFee)
    {
        Pool storage pool = pools[_poolId];
        if (pool.resolved) {
            uint256 winnerPot = (pool.finalTotalYield * 60) / 100;
            uint256 creatorFee = pool.finalTotalYield - winnerPot;
            return (pool.finalTotalYield, winnerPot, creatorFee);
        }
        uint256 currentAssets = vault.convertToAssets(pool.totalShares);
        if (currentAssets > pool.totalPrincipal) {
            currentTotalYield = currentAssets - pool.totalPrincipal;
            estimatedWinnerPrize = (currentTotalYield * 60) / 100;
            estimatedCreatorFee = currentTotalYield - estimatedWinnerPrize;
        } else {
            return (0, 0, 0);
        }
    }

    // --- 1. Create Pool ---
    function createPool(string memory _question, uint256 _duration, uint256 _initialSeed) external returns (uint256) {
        require(_initialSeed > 0, "Seed > 0");
        usdc.transferFrom(msg.sender, address(this), _initialSeed);
        usdc.approve(address(vault), _initialSeed);
        uint256 sharesReceived = vault.deposit(_initialSeed, address(this));

        poolCount++;
        Pool storage newPool = pools[poolCount];
        newPool.creator = msg.sender;
        newPool.question = _question;
        newPool.endTime = block.timestamp + _duration;
        newPool.totalShares = sharesReceived;
        newPool.totalPrincipal = _initialSeed;
        newPool.creatorPrincipal = _initialSeed;

        // Note: Creator takes a flat 40% fee, so we don't need to track their "Weight"
        // for the winner's pot calculation.

        emit PoolCreated(poolCount, _question, newPool.endTime);
        return poolCount;
    }

    // --- 2. Place Bet (TIME WEIGHTED UPDATE) ---
    function placeBet(uint256 _poolId, bool _side, uint256 _amount) external {
        Pool storage pool = pools[_poolId];
        require(block.timestamp < pool.endTime, "Closed");
        require(!pool.resolved, "Resolved");
        require(bets[_poolId][msg.sender].principal == 0, "Already bet");

        usdc.transferFrom(msg.sender, address(this), _amount);
        usdc.approve(address(vault), _amount);
        uint256 sharesReceived = vault.deposit(_amount, address(this));

        // --- NEW LOGIC START ---
        // Calculate Weight based on Time Remaining
        uint256 timeRemaining = pool.endTime - block.timestamp;
        uint256 userWeight = _amount * timeRemaining;
        // --- NEW LOGIC END ---

        pool.totalShares += sharesReceived;
        pool.totalPrincipal += _amount;

        if (_side) {
            pool.yesPrincipal += _amount;
            pool.totalYesWeight += userWeight; // Track weight separately
        } else {
            pool.noPrincipal += _amount;
            pool.totalNoWeight += userWeight;
        }

        bets[_poolId][msg.sender] = UserBet({
            principal: _amount,
            side: _side,
            claimed: false,
            weight: userWeight // Save individual weight
        });

        emit BetPlaced(_poolId, msg.sender, _side, _amount, userWeight);
    }

    // --- 3. Resolve Pool ---
    function resolvePool(uint256 _poolId, bool _outcome) external {
        require(msg.sender == owner, "Only Owner");
        Pool storage pool = pools[_poolId];
        require(!pool.resolved, "Already resolved");
        require(block.timestamp >= pool.endTime, "Not ended");

        pool.resolved = true;
        pool.outcome = _outcome;

        uint256 currentAssets = vault.convertToAssets(pool.totalShares);
        if (currentAssets > pool.totalPrincipal) {
            pool.finalTotalYield = currentAssets - pool.totalPrincipal;
        } else {
            pool.finalTotalYield = 0;
        }
        emit PoolResolved(_poolId, _outcome, pool.finalTotalYield);
    }

    // --- 4. Claim (TIME WEIGHTED PAYOUT) ---
    function claim(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        UserBet storage userBet = bets[_poolId][msg.sender];

        require(pool.resolved, "Not resolved");
        require(userBet.principal > 0, "No bet");
        require(!userBet.claimed, "Claimed");

        userBet.claimed = true;

        // 1. ALWAYS Return Principal (No Loss)
        uint256 payout = userBet.principal;

        // 2. Add Winnings based on WEIGHT, not Principal
        if (userBet.side == pool.outcome && pool.finalTotalYield > 0) {
            uint256 winnerPot = (pool.finalTotalYield * 60) / 100;

            // Get Total WEIGHT of the winning side
            uint256 winningSideTotalWeight = pool.outcome ? pool.totalYesWeight : pool.totalNoWeight;

            if (winningSideTotalWeight > 0) {
                // Formula: (MyWeight / TotalWinningWeight) * WinnerPot
                uint256 userShare = (userBet.weight * winnerPot) / winningSideTotalWeight;
                payout += userShare;
            }
        }

        uint256 sharesToRedeem = vault.previewDeposit(payout);
        if (sharesToRedeem > pool.totalShares) sharesToRedeem = pool.totalShares;

        pool.totalShares -= sharesToRedeem;
        vault.withdraw(payout, msg.sender, address(this));
    }

    // --- 5. Claim Creator Rewards (Unchanged) ---
    function claimCreatorRewards(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        require(msg.sender == pool.creator, "Only Creator");
        require(pool.resolved, "Not resolved");
        require(pool.creatorPrincipal > 0, "Claimed");

        uint256 principal = pool.creatorPrincipal;
        pool.creatorPrincipal = 0;

        uint256 payout = principal;
        if (pool.finalTotalYield > 0) {
            // Creator gets the remaining 40% flat
            uint256 creatorFee = pool.finalTotalYield - ((pool.finalTotalYield * 60) / 100);
            payout += creatorFee;
        }

        uint256 sharesToRedeem = vault.previewDeposit(payout);
        if (sharesToRedeem > pool.totalShares) sharesToRedeem = pool.totalShares;

        pool.totalShares -= sharesToRedeem;
        vault.withdraw(payout, msg.sender, address(this));
    }
}
