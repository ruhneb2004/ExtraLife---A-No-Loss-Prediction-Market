// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { NoLossVault } from "./Vault.sol";
// UMA Import matching your remappings
import {
    OptimisticOracleV2Interface
} from "protocol/packages/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";

contract MarketController {
    // --- UMA CONFIGURATION ---
    OptimisticOracleV2Interface public oo;
    IERC20 public bondCurrency; // Usually WETH on testnets
    bytes32 public constant IDENTIFIER = bytes32("YES_OR_NO_QUERY");

    struct Pool {
        address creator;
        string question;
        uint256 endTime;
        uint256 totalShares;
        uint256 totalPrincipal;
        uint256 creatorPrincipal;

        // Resolution State
        bool resolved;
        bool outcome;

        // UMA Oracle State
        bool requestSubmitted;
        uint256 requestTime;
        bytes ancillaryData;

        // Accounting
        uint256 yesPrincipal;
        uint256 noPrincipal;
        uint256 totalYesWeight;
        uint256 totalNoWeight;
        uint256 finalTotalYield;
    }

    struct UserBet {
        uint256 principal;
        uint256 weight;
        bool side;
        bool claimed;
    }

    NoLossVault public vault;
    IERC20 public usdc;

    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => UserBet)) public bets;

    event PoolCreated(uint256 indexed poolId, string question, uint256 endTime);
    event BetPlaced(uint256 indexed poolId, address indexed user, bool side, uint256 amount, uint256 weight);
    event OracleRequested(uint256 indexed poolId, uint256 timestamp);
    event PoolResolved(uint256 indexed poolId, bool outcome, uint256 totalYield);

    // Update Constructor to take OO Address and Bond Token Address
    constructor(address _vaultAddress, address _usdcAddress, address _ooAddress, address _bondAddress) {
        vault = NoLossVault(_vaultAddress);
        usdc = IERC20(_usdcAddress);
        oo = OptimisticOracleV2Interface(_ooAddress);
        bondCurrency = IERC20(_bondAddress);
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

        emit PoolCreated(poolCount, _question, newPool.endTime);
        return poolCount;
    }

    // --- 2. Place Bet ---
    function placeBet(uint256 _poolId, bool _side, uint256 _amount) external {
        Pool storage pool = pools[_poolId];
        require(block.timestamp < pool.endTime, "Closed");
        require(!pool.resolved, "Resolved");
        require(bets[_poolId][msg.sender].principal == 0, "Already bet");

        usdc.transferFrom(msg.sender, address(this), _amount);
        usdc.approve(address(vault), _amount);
        uint256 sharesReceived = vault.deposit(_amount, address(this));

        uint256 timeRemaining = pool.endTime - block.timestamp;
        uint256 userWeight = _amount * timeRemaining;

        pool.totalShares += sharesReceived;
        pool.totalPrincipal += _amount;

        if (_side) {
            pool.yesPrincipal += _amount;
            pool.totalYesWeight += userWeight;
        } else {
            pool.noPrincipal += _amount;
            pool.totalNoWeight += userWeight;
        }

        bets[_poolId][msg.sender] = UserBet({ principal: _amount, side: _side, claimed: false, weight: userWeight });

        emit BetPlaced(_poolId, msg.sender, _side, _amount, userWeight);
    }

    // --- 3. Request Resolution (UMA STEP 1) ---
    function requestResolution(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        require(block.timestamp > pool.endTime, "Betting still active");
        require(!pool.requestSubmitted, "Already requested");
        require(!pool.resolved, "Already resolved");

        pool.requestTime = block.timestamp;

        // Construct Question: "Q: Is sky blue? A: 1 for Yes. 0 for No."
        string memory questionStr = string(abi.encodePacked("Q: ", pool.question, " A: 1 for Yes. 0 for No."));
        pool.ancillaryData = bytes(questionStr);

        uint256 reward = 0; // We aren't paying the oracle (proposer pays bond)

        // Request price from UMA
        oo.requestPrice(IDENTIFIER, pool.requestTime, pool.ancillaryData, bondCurrency, reward);

        // DEMO SETTING: 30 Seconds Liveness
        oo.setCustomLiveness(IDENTIFIER, pool.requestTime, pool.ancillaryData, 30);

        pool.requestSubmitted = true;
        emit OracleRequested(_poolId, pool.requestTime);
    }

    // --- 4. Settle Resolution (UMA STEP 2) ---
    function settleResolution(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        require(pool.requestSubmitted, "Request not made");
        require(!pool.resolved, "Already resolved");

        // This will revert if liveness period hasn't passed
        oo.settle(address(this), IDENTIFIER, pool.requestTime, pool.ancillaryData);

        // Get the final price (1e18 = YES, 0 = NO)
        int256 price = oo.getRequest(address(this), IDENTIFIER, pool.requestTime, pool.ancillaryData).resolvedPrice;

        // Determine outcome (>= 0.5 is YES)
        if (price >= 500000000000000000) {
            pool.outcome = true;
        } else {
            pool.outcome = false;
        }

        pool.resolved = true;

        // Calculate Yield (Existing Logic)
        uint256 currentAssets = vault.convertToAssets(pool.totalShares);
        if (currentAssets > pool.totalPrincipal) {
            pool.finalTotalYield = currentAssets - pool.totalPrincipal;
        } else {
            pool.finalTotalYield = 0;
        }

        emit PoolResolved(_poolId, pool.outcome, pool.finalTotalYield);
    }

    // --- 5. Claim (Unchanged) ---
    function claim(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        UserBet storage userBet = bets[_poolId][msg.sender];

        require(pool.resolved, "Not resolved");
        require(userBet.principal > 0, "No bet");
        require(!userBet.claimed, "Claimed");

        userBet.claimed = true;

        uint256 payout = userBet.principal;

        if (userBet.side == pool.outcome && pool.finalTotalYield > 0) {
            uint256 winnerPot = (pool.finalTotalYield * 60) / 100;
            uint256 winningSideTotalWeight = pool.outcome ? pool.totalYesWeight : pool.totalNoWeight;

            if (winningSideTotalWeight > 0) {
                uint256 userShare = (userBet.weight * winnerPot) / winningSideTotalWeight;
                payout += userShare;
            }
        }

        uint256 sharesToRedeem = vault.previewWithdraw(payout);
        if (sharesToRedeem > pool.totalShares) {
            sharesToRedeem = pool.totalShares;
        }

        pool.totalShares -= sharesToRedeem;
        vault.redeem(sharesToRedeem, msg.sender, address(this));
    }

    // --- 6. Claim Creator Rewards (Unchanged) ---
    function claimCreatorRewards(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        require(msg.sender == pool.creator, "Only Creator");
        require(pool.resolved, "Not resolved");
        require(pool.creatorPrincipal > 0, "Claimed");

        uint256 principal = pool.creatorPrincipal;
        pool.creatorPrincipal = 0;

        uint256 payout = principal;
        if (pool.finalTotalYield > 0) {
            uint256 creatorFee = pool.finalTotalYield - ((pool.finalTotalYield * 60) / 100);
            payout += creatorFee;
        }

        uint256 sharesToRedeem = vault.previewWithdraw(payout);
        if (sharesToRedeem > pool.totalShares) {
            sharesToRedeem = pool.totalShares;
        }

        pool.totalShares -= sharesToRedeem;
        vault.redeem(sharesToRedeem, msg.sender, address(this));
    }
}
