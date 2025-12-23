// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title YokozunaNFT
 * @dev 横綱に昇進したプレイヤーに発行されるNFT
 * tokenId = 第○代横綱の「○」に対応
 */
contract YokozunaNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId = 1;
    string private _imageURI;

    event YokozunaMinted(address indexed to, uint256 indexed generation);

    constructor(
        string memory initialImageURI
    ) ERC721("Yokozuna", "YOKOZUNA") Ownable(msg.sender) {
        _imageURI = initialImageURI;
    }

    /**
     * @dev 横綱NFTをミント
     * 誰でも呼び出し可能（ガス代はユーザー負担）
     */
    function mint() external returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        emit YokozunaMinted(msg.sender, tokenId);

        return tokenId;
    }

    /**
     * @dev 現在の発行数（次のtokenId - 1）
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev 次にミントされるtokenId（第○代）
     */
    function nextGeneration() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev メタデータをオンチェーンで生成
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory generation = tokenId.toString();

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        unicode"第",
                        generation,
                        unicode"代横綱",
                        '", "description": "',
                        unicode"相撲ゲームで横綱に昇進した証。",
                        '", "image": "',
                        _imageURI,
                        '", "attributes": [{"trait_type": "Generation", "value": ',
                        generation,
                        '}]}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @dev 画像URIを更新（オーナーのみ）
     */
    function setImageURI(string memory newImageURI) external onlyOwner {
        _imageURI = newImageURI;
    }

    /**
     * @dev 現在の画像URI
     */
    function imageURI() external view returns (string memory) {
        return _imageURI;
    }
}
