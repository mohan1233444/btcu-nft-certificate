;; title: Bitcoin University Certificate NFT Trait
;; version: 1.0
;; summary: SIP-009 compatible trait for NFT contracts
;; description: Standard trait interface for Bitcoin University certificate NFTs

;; Define the trait for NFT contracts
(define-trait nft-trait
  (
    ;; Mint a new NFT
    (mint (principal (string-ascii 128) (string-ascii 32)) (response uint uint))

    ;; Transfer an NFT
    (transfer (uint principal principal) (response bool uint))

    ;; Get certificate metadata
    (get-certificate (uint) (response (optional {course: (string-ascii 128), recipient: principal, grade: (string-ascii 32)}) uint))

    ;; Get total supply of minted certificates
    (total-Certificates () (response uint uint))

    ;; Get contract owner
    (get-owner () (response principal uint))

    ;; Get owner of a specific token
    (get-token-owner (uint) (response (optional principal) uint))
  )
)
