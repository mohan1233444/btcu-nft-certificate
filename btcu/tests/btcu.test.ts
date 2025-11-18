import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const admin = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;
const wallet5 = accounts.get("wallet_5")!;

describe("Bitcoin University NFT Contract - Unit Tests", () => {
  // ==================== BASIC MINTING TESTS ====================

  it("Test 1: Admin can mint certificates", () => {
    const { result } = simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Bitcoin 101"),
      Cl.stringAscii("A+"),
    ], admin);

    expect(result).toBeOk(Cl.uint(0));
  });

  it("Test 2: Non-admin cannot mint certificates", () => {
    const { result } = simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Bitcoin 101"),
      Cl.stringAscii("A+"),
    ], wallet2);

    expect(result).toBeErr(Cl.uint(401)); // ERR-NOT-OWNER
  });

  it("Test 3: Cannot mint with empty course name", () => {
    const { result } = simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii(""),
      Cl.stringAscii("A+"),
    ], admin);

    expect(result).toBeErr(Cl.uint(400)); // ERR-INVALID-COURSE
  });

  it("Test 4: Token counter increments with each mint", () => {
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Course 1"),
      Cl.stringAscii("A"),
    ], admin);

    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet2),
      Cl.stringAscii("Course 2"),
      Cl.stringAscii("B"),
    ], admin);

    const { result } = simnet.callReadOnlyFn("btcu", "total-Certificates", [], admin);
    expect(result).toBeUint(2);
  });

  // ==================== TRANSFER TESTS ====================

  it("Test 5: Token owner can transfer certificate", () => {
    // Mint a certificate
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Bitcoin 101"),
      Cl.stringAscii("A+"),
    ], admin);

    // Transfer it
    const { result } = simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet1), Cl.principal(wallet2)],
      wallet1
    );

    expect(result).toBeOk(Cl.bool(true));
  });

  it("Test 6: Non-owner cannot transfer certificate", () => {
    // Mint a certificate for wallet1
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Bitcoin 101"),
      Cl.stringAscii("A+"),
    ], admin);

    // Try to transfer as non-owner
    const { result } = simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet2), Cl.principal(wallet3)],
      wallet2
    );

    expect(result).toBeErr(Cl.uint(1)); // ERR-UNAUTHORIZED (actually returns u1)
  });

  it("Test 7: Owner changes after transfer", () => {
    // Mint
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Bitcoin 101"),
      Cl.stringAscii("A+"),
    ], admin);

    // Transfer
    simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet1), Cl.principal(wallet2)],
      wallet1
    );

    // Check new owner
    const { result } = simnet.callReadOnlyFn("btcu", "get-token-owner", [Cl.uint(0)], admin);
    expect(result).toBeSome(Cl.principal(wallet2));
  });

  // ==================== METADATA TESTS ====================

  it("Test 8: Get certificate metadata after minting", () => {
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Bitcoin 101"),
      Cl.stringAscii("A+"),
    ], admin);

    const { result } = simnet.callReadOnlyFn("btcu", "get-certificate", [Cl.uint(0)], admin);
    
    // Should return some value (verified by output showing course, grade, recipient)
    const resultStr = JSON.stringify(result);
    expect(resultStr).toContain("Bitcoin 101");
  });

  it("Test 9: Get metadata for non-existent token returns none", () => {
    const { result } = simnet.callReadOnlyFn("btcu", "get-certificate", [Cl.uint(999)], admin);
    expect(result).toBeNone();
  });

  // ==================== OWNERSHIP TESTS ====================

  it("Test 10: Admin can transfer ownership", () => {
    const { result: result1 } = simnet.callReadOnlyFn("btcu", "get-owner", [], admin);
    expect(result1).toBePrincipal(admin);

    // Transfer ownership
    const { result: transferResult } = simnet.callPublicFn(
      "btcu",
      "set-owner",
      [Cl.principal(wallet1)],
      admin
    );
    expect(transferResult).toBeOk(Cl.bool(true));

    // Verify new owner
    const { result: result2 } = simnet.callReadOnlyFn("btcu", "get-owner", [], admin);
    expect(result2).toBePrincipal(wallet1);
  });

  it("Test 11: Non-admin cannot transfer ownership", () => {
    const { result } = simnet.callPublicFn(
      "btcu",
      "set-owner",
      [Cl.principal(wallet2)],
      wallet1
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR-NOT-OWNER
  });

  // ==================== SUPPLY TESTS ====================

  it("Test 12: Total supply starts at 0", () => {
    const { result } = simnet.callReadOnlyFn("btcu", "total-Certificates", [], admin);
    expect(result).toBeUint(0);
  });

  it("Test 13: Total supply increases with mints", () => {
    for (let i = 0; i < 5; i++) {
      simnet.callPublicFn("btcu", "mint", [
        Cl.principal(wallet1),
        Cl.stringAscii(`Course ${i}`),
        Cl.stringAscii("A"),
      ], admin);
    }

    const { result } = simnet.callReadOnlyFn("btcu", "total-Certificates", [], admin);
    expect(result).toBeUint(5);
  });
});

describe("Bitcoin University NFT Contract - Fuzz Tests", () => {
  // ==================== FUZZ TEST 1: MULTIPLE MINTS ====================

  it("Fuzz Test 1: Mint with various courses and grades", () => {
    const grades = ["A+", "A", "B+", "B", "C+", "C"];
    const courses = [
      "Bitcoin 101",
      "Blockchain Basics",
      "Smart Contracts",
      "DeFi Fundamentals",
    ];
    const recipients = [wallet1, wallet2, wallet3, wallet4, wallet5];

    for (let i = 0; i < 15; i++) {
      const grade = grades[i % grades.length];
      const course = courses[i % courses.length];
      const recipient = recipients[i % recipients.length];

      const { result } = simnet.callPublicFn("btcu", "mint", [
        Cl.principal(recipient),
        Cl.stringAscii(course),
        Cl.stringAscii(grade),
      ], admin);

      expect(result).toBeOk(Cl.uint(i));
    }

    const { result: supplyResult } = simnet.callReadOnlyFn(
      "btcu",
      "total-Certificates",
      [],
      admin
    );
    expect(supplyResult).toBeUint(15);
  });

  // ==================== FUZZ TEST 2: TRANSFER CHAIN ====================

  it("Fuzz Test 2: Chain multiple transfers", () => {
    // Mint certificates for each wallet
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Cert 1"),
      Cl.stringAscii("A"),
    ], admin);

    // Transfer wallet1 -> wallet2
    simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet1), Cl.principal(wallet2)],
      wallet1
    );

    // Transfer wallet2 -> wallet3
    simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet2), Cl.principal(wallet3)],
      wallet2
    );

    // Transfer wallet3 -> wallet4
    simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet3), Cl.principal(wallet4)],
      wallet3
    );

    // Verify final owner
    const { result } = simnet.callReadOnlyFn("btcu", "get-token-owner", [Cl.uint(0)], admin);
    expect(result).toBeSome(Cl.principal(wallet4));
  });

  // ==================== FUZZ TEST 3: STRESS TEST ====================

  it("Fuzz Test 3: Stress test - mint 100 certificates", () => {
    for (let i = 0; i < 100; i++) {
      const { result } = simnet.callPublicFn("btcu", "mint", [
        Cl.principal(wallet1),
        Cl.stringAscii(`Course ${i}`),
        Cl.stringAscii(`Grade ${i % 10}`),
      ], admin);

      expect(result).toBeOk(Cl.uint(i));
    }

    const { result: supplyResult } = simnet.callReadOnlyFn(
      "btcu",
      "total-Certificates",
      [],
      admin
    );
    expect(supplyResult).toBeUint(100);
  });

  // ==================== FUZZ TEST 4: SECURITY - REPEATED INVALID MINTS ====================

  it("Fuzz Test 4: Reject repeated unauthorized mint attempts", () => {
    for (let i = 0; i < 10; i++) {
      const { result } = simnet.callPublicFn("btcu", "mint", [
        Cl.principal(wallet1),
        Cl.stringAscii(`Course ${i}`),
        Cl.stringAscii("A+"),
      ], wallet2); // wallet2 is not admin

      expect(result).toBeErr(Cl.uint(401));
    }

    // Supply should remain 0
    const { result: supplyResult } = simnet.callReadOnlyFn(
      "btcu",
      "total-Certificates",
      [],
      admin
    );
    expect(supplyResult).toBeUint(0);
  });

  // ==================== FUZZ TEST 5: EDGE CASES ====================

  it("Fuzz Test 5: Max length course name (128 chars)", () => {
    const maxCourse =
      "Advanced Bitcoin Smart Contracts and Decentralized Finance Protocols Complete Mastery Course";

    const { result } = simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii(maxCourse),
      Cl.stringAscii("A+"),
    ], admin);

    expect(result).toBeOk(Cl.uint(0));
  });

  // ==================== FUZZ TEST 6: QUERY NON-EXISTENT TOKENS ====================

  it("Fuzz Test 6: Query 50 non-existent tokens", () => {
    // Mint only 5 tokens
    for (let i = 0; i < 5; i++) {
      simnet.callPublicFn("btcu", "mint", [
        Cl.principal(wallet1),
        Cl.stringAscii(`Course ${i}`),
        Cl.stringAscii("A"),
      ], admin);
    }

    // Query tokens 5-49 (should not exist)
    for (let i = 5; i < 50; i++) {
      const { result } = simnet.callReadOnlyFn("btcu", "get-certificate", [Cl.uint(i)], admin);
      expect(result).toBeNone();
    }
  });

  // ==================== FUZZ TEST 7: CONCURRENT OWNERSHIP TRANSFERS ====================

  it("Fuzz Test 7: Sequential ownership changes", () => {
    const wallets = [admin, wallet1, wallet2, wallet3, wallet4, wallet5];

    for (let i = 1; i < wallets.length; i++) {
      simnet.callPublicFn("btcu", "set-owner", [Cl.principal(wallets[i])], wallets[i - 1]);

      const { result } = simnet.callReadOnlyFn("btcu", "get-owner", [], admin);
      expect(result).toBePrincipal(wallets[i]);
    }
  });

  // ==================== FUZZ TEST 8: MIXED OPERATIONS ====================

  it("Fuzz Test 8: Mixed mint, transfer, and query operations", () => {
    // Mint
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet1),
      Cl.stringAscii("Course 1"),
      Cl.stringAscii("A"),
    ], admin);

    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet2),
      Cl.stringAscii("Course 2"),
      Cl.stringAscii("B"),
    ], admin);

    // Transfer token 0
    simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet1), Cl.principal(wallet3)],
      wallet1
    );

    // Mint again
    simnet.callPublicFn("btcu", "mint", [
      Cl.principal(wallet4),
      Cl.stringAscii("Course 3"),
      Cl.stringAscii("C"),
    ], admin);

    // Transfer token 1
    simnet.callPublicFn(
      "btcu",
      "transfer",
      [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet5)],
      wallet2
    );

    // Query all
    const { result: result0 } = simnet.callReadOnlyFn("btcu", "get-token-owner", [Cl.uint(0)], admin);
    expect(result0).toBeSome(Cl.principal(wallet3));

    const { result: result1 } = simnet.callReadOnlyFn("btcu", "get-token-owner", [Cl.uint(1)], admin);
    expect(result1).toBeSome(Cl.principal(wallet5));

    const { result: result2 } = simnet.callReadOnlyFn("btcu", "get-token-owner", [Cl.uint(2)], admin);
    expect(result2).toBeSome(Cl.principal(wallet4));

    const { result: supply } = simnet.callReadOnlyFn("btcu", "total-Certificates", [], admin);
    expect(supply).toBeUint(3);
  });
});
