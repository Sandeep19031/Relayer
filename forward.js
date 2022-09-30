const Web3 = require("web3");
const dotenv = require("dotenv");
var CryptoJS = require("crypto-js");

dotenv.config();
// Functions for gaseless transaction => start
const getWeb3 = () => {
  var web3 = new Web3();
  web3.setProvider(
    new web3.providers.WebsocketProvider(
      `wss://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API}` // config
    )
  );
  return web3;
};

const getContractOfRelayer = async () => {
  const artifact = await require("./abi/BouncerProxy.json");
  let { abi } = artifact;
  const web3 = getWeb3();
  console.log("artifact address", artifact.address);
  let _contract = new web3.eth.Contract(abi, artifact.address);
  return _contract;
};

const decryption = async () => {
  const encrypt_pk = process.env.ENC_PRIVATE_KEY;
  var bytes = CryptoJS.AES.decrypt(encrypt_pk, process.env.SECRET_KEY);
  var pkWithNonce = bytes.toString(CryptoJS.enc.Utf8);

  let decrypt_pk = "";
  let dec_nonce = "";
  for (let i = 0; i < pkWithNonce.length; i++) {
    if (i % 2 == 0 && i < 2 * process.env.NONCE.length) {
      dec_nonce = dec_nonce + pkWithNonce[i];
    } else {
      decrypt_pk = decrypt_pk + pkWithNonce[i];
    }
  }
  console.log("decrypted pk", decrypt_pk);
  console.log("dec nonce", dec_nonce);
  return decrypt_pk;
};
const execution = async (metaTxData, _contract, return_obj) => {
  let tx_hash;
  try {
    let txparams = {
      from: process.env.PAYER_ACC_ADDR,
      gas: metaTxData.gas,
      gasPrice: Math.round(4 * 7000000),
    };
    let hash = await _contract.methods
      .getHash(
        metaTxData.parts[1],
        metaTxData.parts[2],
        metaTxData.parts[3],
        metaTxData.parts[4],
        metaTxData.parts[5],
        metaTxData.parts[6]
      )
      .call();
    console.log("HASH:", hash);

    console.log("NO EXISTING TX, DOING TX");
    console.log(
      "TX",
      metaTxData.sig,
      metaTxData.parts[1],
      metaTxData.parts[2],
      metaTxData.parts[3],
      metaTxData.parts[4],
      metaTxData.parts[5],
      metaTxData.parts[6]
    );
    console.log("PARAMS", txparams);

    //first sign the transaction with the private key because alchedy dosn't have private key

    console.log("Relayer sc addr");

    const web3 = getWeb3();

    const nonce = await web3.eth.getTransactionCount(
      process.env.PAYER_ACC_ADDR,
      "latest"
    );
    const tx = {
      from: process.env.PAYER_ACC_ADDR,
      to: process.env.RELAYER_SC_ADDR,
      gas: metaTxData.gas,
      data: _contract.methods
        .forward(
          metaTxData.sig,
          metaTxData.parts[1],
          metaTxData.parts[2],
          metaTxData.parts[3],
          metaTxData.parts[4],
          metaTxData.parts[5],
          metaTxData.parts[6]
        )
        .encodeABI(),
    };

    const decrypt_pk = await decryption();

    const pk = "0x" + decrypt_pk;

    console.log("pk", pk);
    const signature = await web3.eth.accounts.signTransaction(tx, pk);

    let res = true;

    return new Promise((resolve, reject) => {
      web3.eth
        .sendSignedTransaction(signature.rawTransaction, (error, txHash) => {
          // console.log(chalk.green("sendSignedTransaction error, txHash"), error, txHash);
          tx_hash = txHash;
          if (error) {
            res = false;
            return_obj.result = false;
            return_obj.tx_hash = txHash;
            return_obj.err = "err in forwading" + error;
            return reject(error);
          }
          // else
          return_obj.result = true;
          return_obj.tx_hash = txHash;
          return_obj.err = "err in forwading" + error;
          return resolve(txHash);
        })
        .on("confirmation", (confirmationNumber, receipt) => {
          console.log(confirmationNumber, "reciept", receipt);
        })
        .on("error", reject);
    });

    // await web3.eth
    //   .sendSignedTransaction(signature.rawTransaction)
    //   .on("error", (err, receiptMaybe) => {
    //     console.log("TX ERROR", err, receiptMaybe);
    //     res = false;
    //   })
    //   .on("transactionHash", (transactionHash) => {
    //     console.log("TX HASH", transactionHash);
    //     tx_hash = transactionHash;
    //   })
    //   .on("receipt", (receipt) => {
    //     console.log("TX RECEIPT", receipt);
    //   })
    //   .then((receipt) => {
    //     console.log("TX THEN", receipt);
    //   });

    return_obj.result = true;
    return_obj.tx_hash = tx_hash;
    return_obj.err = null;
  } catch (err) {
    console.log("err in forwading", err.message);
    return_obj.result = false;
    return_obj.tx_hash = tx_hash;

    return_obj.err = "err in forwading" + err;
  }
};
module.exports = async (metaTxData) => {
  const _contract = await getContractOfRelayer();
  let return_obj = {
    result: null,
    tx_hash: null,
    error: null,
  };
  await execution(metaTxData, _contract, return_obj);

  return return_obj;
};
