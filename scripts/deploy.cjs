const hre = require("hardhat");

async function main() {
  // デプロイ前にIPFSに画像をアップロードして、そのURIをここに設定
  // 例: "ipfs://QmXxx.../sumoNFT.png"
  const IMAGE_URI = process.env.NFT_IMAGE_URI || "ipfs://YOUR_IMAGE_CID/sumoNFT.png";

  console.log("Deploying YokozunaNFT...");
  console.log("Image URI:", IMAGE_URI);

  const YokozunaNFT = await hre.ethers.getContractFactory("YokozunaNFT");
  const yokozunaNFT = await YokozunaNFT.deploy(IMAGE_URI);

  await yokozunaNFT.waitForDeployment();

  const address = await yokozunaNFT.getAddress();
  console.log("YokozunaNFT deployed to:", address);

  console.log("\n--- Next Steps ---");
  console.log("1. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${address} "${IMAGE_URI}"`);
  console.log("\n2. Update VITE_CONTRACT_ADDRESS in .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
