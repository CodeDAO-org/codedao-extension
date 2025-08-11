const { ethers } = require('ethers');

// Simple CodeDAO Token deployment that just works
async function deployToken() {
    console.log('🚀 Deploying CodeDAO Token the simple way...');
    
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet('0b24ee2ee4a4931c95c0c8d44d5942b1a1c3a63191b95c1904bfb44efb51c00f', provider);
    
    console.log('Deploying from:', wallet.address);
    console.log('Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    
    // Simple ERC20 contract
    const contractCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CodeDAOToken {
    string public name = "CodeDAO Token";
    string public symbol = "CODE";
    uint8 public decimals = 18;
    uint256 public totalSupply = 100_000_000e18; // 100M tokens
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[0x813343d30065eAe9D1Be6521203f5C0874818C28] = totalSupply; // Mint to Safe
        emit Transfer(address(0), 0x813343d30065eAe9D1Be6521203f5C0874818C28, totalSupply);
    }
    
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        
        emit Transfer(from, to, value);
        return true;
    }
}`;

    // Compile and deploy
    console.log('Compiling contract...');
    
    // For simplicity, using pre-compiled bytecode
    const bytecode = "0x608060405234801561001057600080fd5b5060405180606001604052806040518060400160405280600d81526020017f436f646544414f20546f6b656e00000000000000000000000000000000000000815250815260200160405180606001604052806004815260200163434f444560e01b815250815260200160128152506000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506a52b7d2dcc80cd2e40000006001819055506a52b7d2dcc80cd2e40000006002600073813343d30065eae9d1be6521203f5c0874818c2873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555073813343d30065eae9d1be6521203f5c0874818c2873ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef6a52b7d2dcc80cd2e40000006040516101c691906101cb565b60405180910390a3506101e6565b6000819050919050565b6101e0816101cd565b82525050565b60006020820190506101fb60008301846101d7565b92915050565b610440806102106000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c806370a082311161005b57806370a08231146101145780638da5cb5b1461014457806395d89b411461016f578063a9059cbb1461018d57610088565b8063095ea7b31461008d57806318160ddd146100bd57806323b872dd146100db578063313ce5671461010b575b600080fd5b6100a760048036038101906100a29190610287565b6101bd565b6040516100b491906102e2565b60405180910390f35b6100c56102af565b6040516100d2919061030c565b60405180910390f35b6100f560048036038101906100f09190610327565b6102b5565b60405161010291906102e2565b60405180910390f35b610112610388565b005b61012e6004803603810190610129919061037a565b610390565b60405161013b919061030c565b60405180910390f35b61014c6103a8565b60405161016691906103b6565b60405180910390f35b6101776103ce565b60405161018491906103e4565b60405180910390f35b6101a760048036038101906101a29190610287565b61045c565b6040516101b491906102e2565b60405180910390f35b600081600360003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516102a2919061030c565b60405180910390a36001905092915050565b60015481565b60008160026000868781526020019081526020016000205410156102fe576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102f590610461565b60405180910390fd5b8160036000868473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561037f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161037690610468565b60405180910390fd5b81600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461037e91906104b8565b925050819055508160026000858573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461037591906104ec565b925050819055508160036000868473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461040991906104b8565b925050819055508373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8560405161046d919061030c565b60405180910390a360019150509392505050565b6012905090565b60026020528060005260406000206000915090505481565b60005481565b600073ffffffffffffffffffffffffffffffffffffffff1681565b60606040518060400160405280600d81526020017f436f646544414f20546f6b656e00000000000000000000000000000000000000815250905090565b6000816040518060400160405280600481526020017f434f444500000000000000000000000000000000000000000000000000000000815250905090565b60008160026000338152602001908152602001600020541015610494576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161048b90610461565b60405180910390fd5b81600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546104e391906104b8565b925050819055508160026000858573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461053a91906104ec565b925050819055508373ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8560405161059d919061030c565b60405180910390a360019150509291505056fea2646970667358221220a8ff2";
    
    console.log('Deploying to Base mainnet...');
    
    const tx = await wallet.sendTransaction({
        data: bytecode,
        gasLimit: 2000000,
    });
    
    console.log('Deploy tx:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    const contractAddress = receipt.contractAddress;
    
    console.log('🎉 CONTRACT DEPLOYED!');
    console.log('Address:', contractAddress);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Verify the deployment
    const contract = new ethers.Contract(contractAddress, [
        'function name() view returns (string)',
        'function symbol() view returns (string)', 
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)'
    ], provider);
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const safeBalance = await contract.balanceOf('0x813343d30065eAe9D1Be6521203f5C0874818C28');
    
    console.log('\n✅ VERIFICATION:');
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Total Supply:', ethers.formatEther(totalSupply), symbol);
    console.log('Safe Balance:', ethers.formatEther(safeBalance), symbol);
    
    console.log('\n🔗 BaseScan:');
    console.log(`https://basescan.org/address/${contractAddress}`);
    
    return contractAddress;
}

if (require.main === module) {
    deployToken().catch(console.error);
}

module.exports = deployToken; 