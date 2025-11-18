;; title: Bitcoin University Course Completion Certificate NFT
;; version: 1.0
;; summary: NFT contract for course completion certificates
;; description: Mint and transfer course completion certificates as NFTs

(impl-trait .btcu-trait.nft-trait)
;; token definitions
(define-non-fungible-token btcu-certificate uint)


;; constants
(define-constant CONTRACT-OWNER tx-sender)

;; Error codes
(define-constant ERR-NOT-OWNER (err u401))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-TOKEN-NOT-FOUND (err u404))
(define-constant ERR-INVALID-COURSE (err u400))
(define-constant ERR-INVALID-RECIPIENT (err u402))
(define-constant ERR-TRANSFER-FAILED (err u405))
(define-constant ERR-MINT-FAILED (err u406))

;; data vars
(define-data-var minted-count uint u0)
(define-data-var owner principal CONTRACT-OWNER)

;; data maps
(define-map cert-data uint {course: (string-ascii 128), recipient: principal, grade: (string-ascii 32)})

;; public functions

;; Mint a certificate NFT
(define-public (mint (recipient principal) (course (string-ascii 128)) (grade (string-ascii 32)))
  (let ((token-id (var-get minted-count)))
    (begin
      (asserts! (is-eq tx-sender (var-get owner)) ERR-NOT-OWNER)
      (asserts! (> (len course) u0) ERR-INVALID-COURSE)
      (try! (nft-mint? btcu-certificate token-id recipient))
      (map-set cert-data token-id {course: course, recipient: recipient, grade: grade})
      (var-set minted-count (+ token-id u1))
      (ok token-id)
    )
  )
)

;; Transfer a certificate
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-UNAUTHORIZED)
    (try! (nft-transfer? btcu-certificate token-id sender recipient))
    (ok true)
  )
)

;; Update contract owner
(define-public (set-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-NOT-OWNER)
    (var-set owner new-owner)
    (ok true)
  )
)

;; read only functions

;; Get certificate data
(define-read-only (get-certificate (token-id uint))
  (ok (map-get? cert-data token-id))
)

;; Get total supply
(define-read-only (total-Certificates)
  (ok (var-get minted-count))
)

;; Get owner
(define-read-only (get-owner)
  (ok (var-get owner))
)

;; Get token owner
(define-read-only (get-token-owner (token-id uint))
  (ok (nft-get-owner? btcu-certificate token-id))
)

