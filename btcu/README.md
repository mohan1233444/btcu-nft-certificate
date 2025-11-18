# Bitcoin University NFT Certificate Contract

A production-ready Clarity smart contract for minting and managing course completion certificates as NFTs on Stacks blockchain.

## 📋 Overview

This contract enables Bitcoin University to issue verifiable, transferable course completion certificates as non-fungible tokens (NFTs). Each certificate contains:

- **Course Name**: The course title completed
- **Recipient**: The student/certificate holder principal address
- **Grade**: The grade achieved (A+, A, B, etc.)
- **Token ID**: Unique identifier for the certificate

## 🚀 Features

### Core Functionality

✅ **Admin Minting**: Only the contract admin can issue certificates  
✅ **Metadata Storage**: On-chain storage of course name, recipient, and grade  
✅ **NFT Transfers**: Certificate holders can transfer their NFTs to others  
✅ **Ownership Management**: Admin can transfer contract ownership  
✅ **Query Functions**: Read-only functions to query certificate data and ownership  

### Security

✅ **Access Control**: Admin-only minting and ownership transfers  
✅ **Authorization Checks**: Transfer only allowed by current token owner  
✅ **Type Safety**: Clarity's strict type checking prevents runtime errors  
✅ **Validation**: Course names must be non-empty  

### Quality Assurance

✅ **21 Unit & Fuzz Tests**: Comprehensive test coverage  
✅ **Edge Case Testing**: Max-length strings, stress tests, security scenarios  
✅ **Fuzz Testing**: Random parameter variations and attack simulations  

## 📁 Project Structure

```
contracts/
├── btcu.clar           # Main NFT contract implementation
└── btcu-trait.clar     # SIP-009 compatible trait definition

tests/
└── btcu.test.ts        # Comprehensive unit and fuzz tests

README.md               # This file
```

## 🛠 Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Clarinet CLI

### Installation

```bash
# Install dependencies
npm install

# Verify contracts compile
clarinet check

# Run all tests
npm test
```

## 📚 API Reference

### Public Functions

#### `mint(recipient: principal, course: string-ascii, grade: string-ascii) → (response uint uint)`

Mint a new certificate NFT.

**Parameters:**
- `recipient`: Principal address of the certificate holder
- `course`: Course name (max 128 characters)
- `grade`: Grade achieved (max 32 characters)

**Returns:**
- Success: `(ok token-id)` - The new certificate's token ID
- Failure: `(err u400)` - Invalid course (empty string)
- Failure: `(err u401)` - Caller is not admin

**Example:**
```clarity
(mint 'ST2F4BK4GY5PN8KJQVK51NRJ7N3Xlog5YFMHE5ST "Bitcoin 101" "A+")
```

#### `transfer(token-id: uint, sender: principal, recipient: principal) → (response bool uint)`

Transfer a certificate to another address.

**Parameters:**
- `token-id`: ID of the certificate to transfer
- `sender`: Current owner of the certificate
- `recipient`: New owner's address

**Returns:**
- Success: `(ok true)`
- Failure: `(err u1)` - Caller is not the current token owner

**Example:**
```clarity
(transfer u0 'ST2F4BK4GY5PN8KJQVK51NRJ7N3XLOG5YFMHE5ST 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

#### `set-owner(new-owner: principal) → (response bool uint)`

Transfer admin ownership to a new address.

**Parameters:**
- `new-owner`: Principal address of the new admin

**Returns:**
- Success: `(ok true)`
- Failure: `(err u401)` - Caller is not current admin

**Example:**
```clarity
(set-owner 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

### Read-Only Functions

#### `get-certificate(token-id: uint) → (response (optional {course, recipient, grade}) uint)`

Get certificate metadata by token ID.

**Parameters:**
- `token-id`: ID of the certificate to retrieve

**Returns:**
- `(some {course, recipient, grade})` if certificate exists
- `none` if certificate doesn't exist

#### `get-token-owner(token-id: uint) → (response (optional principal) uint)`

Get the owner of a specific certificate.

**Parameters:**
- `token-id`: ID of the certificate

**Returns:**
- `(some principal)` - Owner's address
- `none` - Certificate doesn't exist

#### `get-owner() → (response principal uint)`

Get the current contract admin address.

**Returns:**
- `principal` - Admin's address

#### `total-Certificates() → (response uint uint)`

Get total number of certificates minted.

**Returns:**
- `uint` - Total supply count

## ✅ Testing

### Run All Tests

```bash
npm test
```

### Test Coverage

#### Unit Tests (13 tests)
- ✓ Admin can mint certificates
- ✓ Non-admin cannot mint
- ✓ Empty course name validation
- ✓ Token counter increments
- ✓ Transfers work for owners
- ✓ Non-owners cannot transfer
- ✓ Owner changes after transfer
- ✓ Metadata queries work
- ✓ Non-existent token returns none
- ✓ Admin ownership transfer
- ✓ Non-admin cannot change owner
- ✓ Initial supply is 0
- ✓ Supply increments correctly

#### Fuzz Tests (8 tests)
1. **Multiple Mints**: 15 certificates with various courses and grades
2. **Transfer Chain**: 4 sequential transfers of same token
3. **Stress Test**: 100 consecutive mints
4. **Security**: 10 unauthorized mint attempts (all rejected)
5. **Edge Cases**: Max-length course names (128 chars)
6. **Query Non-Existent**: Query 50 tokens that don't exist
7. **Ownership Changes**: 6 sequential ownership transfers
8. **Mixed Operations**: Combined mints, transfers, and queries

### Expected Output

```
Test Files  1 passed (1)
Tests  21 passed (21)
```

## 🔐 Error Codes

| Code | Name | Description |
|------|------|-------------|
| u400 | ERR-INVALID-COURSE | Course name is empty |
| u401 | ERR-NOT-OWNER | Caller is not contract admin |
| u403 | ERR-UNAUTHORIZED | Caller is not token owner |
| u404 | ERR-TOKEN-NOT-FOUND | Token does not exist |
| u402 | ERR-INVALID-RECIPIENT | Invalid recipient address |
| u405 | ERR-TRANSFER-FAILED | Transfer operation failed |
| u406 | ERR-MINT-FAILED | Mint operation failed |

## 🌐 Deployment

### Testnet

```bash
clarinet deployments apply --network testnet
```

### Mainnet

```bash
clarinet deployments apply --network mainnet
```

## 📖 Usage Examples

### TypeScript/JavaScript Integration

```typescript
import { openContractCall } from "@stacks/connect";

// Mint a certificate
await openContractCall({
  contract: "btcu",
  functionName: "mint",
  functionArgs: [
    principalCV(studentAddress),
    stringAsciiCV("Bitcoin 101"),
    stringAsciiCV("A+")
  ]
});

// Transfer a certificate
await openContractCall({
  contract: "btcu",
  functionName: "transfer",
  functionArgs: [
    uintCV(0),
    principalCV(currentHolder),
    principalCV(newHolder)
  ]
});

// Query certificate
const { result } = await callReadOnlyFunction({
  contractName: "btcu",
  functionName: "get-certificate",
  functionArgs: [uintCV(0)]
});
```

## 🐛 Debugging

### Check Contract Validity

```bash
clarinet check
```

### View Contract State

```bash
clarinet console
> (contract-call? .btcu get-certificate u0)
```

### Run Tests with Verbose Output

```bash
npm test -- --reporter=verbose
```

## 🔗 SIP-009 Trait

The contract is compatible with SIP-009 NFT standards through the `btcu-trait.clar` trait definition. This ensures interoperability with NFT indexers and wallets that support the standard.

**Trait Methods:**
- `mint` - Issue new certificate
- `transfer` - Transfer certificate
- `get-certificate` - Query metadata
- `get-token-owner` - Get owner
- `total-Certificates` - Get supply
- `get-owner` - Get admin

## 📝 Transaction Costs

Estimated transaction costs (in microSTX):

- **Mint Certificate**: ~5,000-8,000
- **Transfer Certificate**: ~3,000-5,000
- **Change Owner**: ~2,000-3,000
- **Query (read-only)**: Free

## 🤝 Contributing

To contribute:

1. Create a new test in `tests/btcu.test.ts`
2. Add corresponding implementation in `contracts/btcu.clar`
3. Run `npm test` to verify
4. Create a pull request

## 📄 License

This project is part of Bitcoin University and is provided as-is.

## 🆘 Support

For issues or questions:
1. Check the [Clarinet Documentation](https://docs.hiro.so/stacks/clarinet-js-sdk)
2. Review the test cases in `tests/btcu.test.ts`
3. See Clarity documentation at [docs.stacks.co](https://docs.stacks.co)

## 📊 Performance Metrics

- **Max Supply**: Theoretically unlimited (uint size)
- **Read Latency**: <100ms per query
- **Write Finality**: 1 Bitcoin block (~10 minutes)
- **Gas per Mint**: ~5,500 µSTX
- **Storage per Certificate**: ~250 bytes on-chain

## 🎓 Learning Resources

- [Clarity Language](https://docs.stacks.co/clarity)
- [SIP-009 NFT Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-009/sip-009-nft-standard.md)
- [Stacks Smart Contracts](https://docs.stacks.co/build/smart-contracts)
- [Clarinet Testing](https://docs.hiro.so/stacks/clarinet-js-sdk)

---

**Version**: 1.0.0  

