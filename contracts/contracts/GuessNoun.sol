// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// https://github.com/saucepoint/elo-lib
import "./ELO.sol";
import "./EAS/IEAS.sol";

import { Attestation } from "./EAS/Common.sol";

contract GuessNoun is Ownable {
    address ieas;

    uint256 public game;
    uint256 public playersRegistered;
    uint256 public startTimestamp;

    uint256 kFactor = 20;
    uint256 startingElo = 1200;
    uint256 minimumElo = 1;

    struct Player {
        address addr;
        bytes32 eloAttestation;
        bytes32 signature;
    }
    Player[2] public players;

    event Result(uint256 game, address winner, address loser, uint256 choice);

    constructor (address _ieas) {
        ieas = _ieas;
    }

    function setStartingElo(uint256 _elo) public onlyOwner {
        startingElo = _elo;
    }

    function gameSeed(uint256 _game) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), _game));
    }

    modifier makeNewGame() {
        _;
        game++;
        playersRegistered = 0;
    }

    function register(bytes32 signature, bytes32 uid) public {
        require(playersRegistered < 2, "Game is full");

        players[playersRegistered] = Player(msg.sender, uid, signature);
        playersRegistered++;

        if(playersRegistered == 2) {
            require(players[0].addr != players[1].addr, "Players must be different");
            startTimestamp = block.timestamp;
        }
    }

    // salt is signature from owner signing (game, player, choice)
    function result(uint256 winningPlayer, uint256 choice, bytes32 salt) public makeNewGame {

        Player memory winner = players[winningPlayer];
        Player memory loser = players[winningPlayer == 0 ? 1 : 0];
        require(loser.addr != address(0), "Game is not full");
        
        bytes memory message = abi.encodePacked(address(this), game, choice, salt);
        require(SignatureChecker.isValidSignatureNow(loser.addr, loser.signature, message), "Invalid signature");

        emit Result(game, winner.addr, loser.addr, choice);

        (uint256 winnerElo, bool winnerExisted) = getElo(winner.addr, winner.eloAttestation);
        (uint256 loserElo, bool loserExisted) = getElo(loser.addr, loser.eloAttestation);
        (uint256 change,  ) = Elo.ratingChange(winnerElo, loserElo, 100, kFactor);
        
        attestElo(winner.addr, winnerElo + change);
        if(loserElo < change) {
            attestElo(loser.addr, minimumElo);
        } {
            attestElo(loser.addr, loserElo - change);
        }

        if(winnerExisted) {
            revokeElo(winner.eloAttestation);
        }
        if(loserExisted) {
            revokeElo(loser.eloAttestation);
        }
    }

    function getElo(address player, bytes32 uid) public view returns (uint256, bool) {
        Attestation memory attestation = IEAS(ieas).getAttestation(uid);

        uint256 elo = abi.decode(attestation.data, (uint256));
        if(attestation.recipient != player) {
            elo = startingElo;
        }
        return (elo, attestation.recipient == player && attestation.attester == address(this));
    }

    function attestElo(address player, uint256 elo) internal {
        IEAS(ieas).attest(AttestationRequest(
            schemaUID(),
            AttestationRequestData(
                player,
                0,
                true,
                0,
                abi.encode(elo),
                0
                )
            )
        );
    }

    function revokeElo(bytes32 uid) internal {
        IEAS(ieas).revoke(RevocationRequest(
            schemaUID(),
            RevocationRequestData(
                uid,
                0
            )
        ));
    }

    function gameExpired() public makeNewGame {
        require(playersRegistered == 2, "Game is not active");
        require(block.timestamp > startTimestamp + 1 days, "Game is not over");
        emit Result(game, address(0), address(0), 0);
    }

    function schemaUID() public pure returns (bytes32) {
        return keccak256(abi.encodePacked("uint256 elo", address(0), true));
    }

}