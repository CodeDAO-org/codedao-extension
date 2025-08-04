#!/bin/bash

# CodeDAO Distributor Deployment Script
echo "🚀 Deploying CodeDAO Distributor..."

# Set environment (make sure these are set)
export PRIVATE_KEY=$PRIVATE_KEY
export REWARDS_PRIVATE_KEY=$REWARDS_PRIVATE_KEY
export RPC_URL="https://mainnet.base.org"

# Deploy the distributor contract
echo "📦 Deploying distributor contract..."
DISTRIBUTOR_ADDRESS=$(forge create \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --json \
  contracts/SimpleDistributor.sol:CodeDAODistributor | jq -r '.deployedTo')

echo "✅ Distributor deployed at: $DISTRIBUTOR_ADDRESS"

# Approve distributor to spend 60M tokens from rewards pool
echo "🔐 Approving distributor to spend rewards..."
cast send 0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0 \
  "approve(address,uint256)" \
  $DISTRIBUTOR_ADDRESS \
  60000000000000000000000000 \
  --private-key $REWARDS_PRIVATE_KEY \
  --rpc-url $RPC_URL

echo "✅ Approval complete!"

# Verify deployment
echo "🔍 Verifying setup..."
ALLOWANCE=$(cast call 0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0 \
  "allowance(address,address)" \
  0x050C7f5aeD5881F3Ce0325638F51f854F680e96F \
  $DISTRIBUTOR_ADDRESS \
  --rpc-url $RPC_URL)

echo "📊 Distributor allowance: $ALLOWANCE"

# Output summary
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📍 Distributor Address: $DISTRIBUTOR_ADDRESS"
echo "🔗 BaseScan: https://basescan.org/address/$DISTRIBUTOR_ADDRESS"
echo ""
echo "📝 Next steps:"
echo "1. Update extension CONTRACT_ADDRESS to: $DISTRIBUTOR_ADDRESS"
echo "2. Test claiming rewards"
echo "3. Users can now claim automatically!"
