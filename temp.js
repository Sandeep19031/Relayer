var CryptoJS = require("crypto-js");

const pk = "aece8d8da9a28335c29cd164d8c01ce0cbe0bcd0b0f7c4f1ca705e94bcf04b04";

const nonce = "b1r2a3i4n5c6h7a8i9n";

let PK_ENCRYPT = "";
let j = 0;
let k = 0;

for (let i = 0; i < pk.length + nonce.length; i++) {
  if (i % 2 == 0 && j < nonce.length) {
    PK_ENCRYPT = PK_ENCRYPT + nonce[j];
    j++;
  } else {
    PK_ENCRYPT = PK_ENCRYPT + pk[k];
    k++;
  }
}

console.log("new pk", PK_ENCRYPT);

const secret_key =
  "91 65 e9 e4 7e c1 52 10 f4 5d b4 fe b2 3f 60 9f e0 cd c8 9c 37 67 70 ab 6c 98 63 3c 14 66 bf bf d7 14 02 69 7c 6b e2 ea 6e 9c 90 14 36 8a 69 d5 48 a0 61 be 04 8a ea 67 3b fe 26 fe dc 4b a5 9a 2e 1a 11 4d cd 83 52 b4 7d e0 8b fa f9 89 67 61 a5 3a f4 92 7b 8a 6c 5d 64 2e 58 c7 61 74 c7 bb a3 b2 91 60 38 07 c8 6e 53 eb 99 24 49 45 22 6a ae d6 5f 25 95 a0 9d 5b 52 19 a4 8b 30 7d 64 f8 ";

// Encrypt
var ciphertext = CryptoJS.AES.encrypt(PK_ENCRYPT, secret_key).toString();

console.log("on secure file", ciphertext);

// Decrypt
var bytes = CryptoJS.AES.decrypt(ciphertext, secret_key);
var pkWithNonce = bytes.toString(CryptoJS.enc.Utf8);

console.log(pkWithNonce === PK_ENCRYPT);

let decrypt_pk = "";
let dec_nonce = "";
for (let i = 0; i < pkWithNonce.length; i++) {
  if (i % 2 == 0 && i < 2 * nonce.length) {
    dec_nonce = dec_nonce + pkWithNonce[i];
  } else {
    decrypt_pk = decrypt_pk + pkWithNonce[i];
  }
}

console.log("decrypted pk", decrypt_pk === pk);
console.log("dec nonce", dec_nonce);
