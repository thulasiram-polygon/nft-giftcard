const functions = require("firebase-functions");
var randomstring = require("randomstring");
const ethers = require("ethers");
const admin = require("firebase-admin");
const mailgun = require("mailgun-js");
admin.initializeApp();

const { contractAddress_polygon_mumbai, abi } = require("./utils/abi.json");
require("dotenv").config();

/**
 * Create NFT Request
 * This funtions takes the input form the user for creating NFT
 * this will save the nft data in the firestore db
 * and make it avilable for the claim
 * and sends the email to the reciver
 */

exports.createNFTRequest = functions.https.onCall(async (data, context) => {
	// const email = context.auth.token.email
	const uid = context.auth.uid;

	//const { name, description, image, reciverEmailId } = data;

	// Create a token for reclaiming NFT
	const tokenId = randomstring.generate();

	// Save in the firestore
	const db = admin.firestore();
	try {
		const docRef = db.collection(`NFT_REQUESTS`).doc();
		await docRef.set({
			...data,
			uid,
			tokenId,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			status: "PENDING",
		});

		// sample email to the reciver
		console.log(
			`Email sent to ${data.reciverEmailId} successfully with the link:  http://localhost:3000/claim/${tokenId}`,
		);
		// This will trigger the email sending
		await sendEmail(
			data.reciverEmailId,
			`http://localhost:3000/claim/${tokenId}`,
		);
		// return the success message
		return {
			message: "NFT Request Created Successfully",
			status: "success",
		};
	} catch (error) {
		console.log(error);
		throw new functions.https.HttpsError(`${error.message}`);
	}
});

/**
 * This funciton is for claiming the NFT
 * the end user will call this function by clicking the link with the claim token
 * this will mint the nft from the backend and transfer it to the user
 */

exports.claimNFT = functions.https.onCall(async (data, context) => {
	if (context.auth === null) {
		throw new functions.https.HttpsError(`Please login to claim the NFT`);
	}
	const email = context.auth.token.email;
	const uid = context.auth.uid;

	const { tokenId, userAddress } = data;

	// Save in the firestore

	const db = admin.firestore();
	try {
		const docRef = db.collection(`NFT_REQUESTS`);

		// check if the token is valid by fetching the data from the db by using the token
		const snapshot = await docRef.where("tokenId", "==", tokenId).get();
		if (snapshot.empty) {
			throw new functions.https.HttpsError(`Invalid Token`);
		}
		// check if the nft is already claimed or not and the reciver email address is same as the user email address
		snapshot.forEach(async (doc) => {
			const docData = doc.data();
			console.log(docData);
			if (docData.reciverEmailId !== email) {
				throw new functions.https.HttpsError(
					`You are not the reciver of this NFT`,
				);
			}
			if (docData.status === "CLAIMED") {
				throw new functions.https.HttpsError(`NFT is already claimed`);
			}

			// if the token is valid then mint the nft and transfer it to the user
			const mintAndTransferNFTResponse = await mintAndTransferNFT(
				userAddress,
				docData.ipfsURL,
			);
			console.log("NFT Claimed Successfully");

			if (mintAndTransferNFTResponse.status === "failed") {
				throw new functions.https.HttpsError(
					`${mintAndTransferNFTResponse.message}`,
				);
			}
			// update the status of the nft to claimed
			await docRef.doc(doc.id).update({
				status: "CLAIMED",
				claimedAt: admin.firestore.FieldValue.serverTimestamp(),
				claimedByUid: uid,
			});
			console.log("DB updated successfully");
			// return the success message
			return {
				message: `NFT Claimed Successfully for the user ${userAddress}`,
				ipfsURL: docData.ipfsURL,
				status: "success",
			};
		});
	} catch (error) {
		// return the error message
		throw new functions.https.HttpsError(`${error.message}`);
	}
});

// Mint and transfer the NFT
// This function will be called by the claimNFT function
// this function will mint the nft and transfer it to the user

const mintAndTransferNFT = async (userAddress, ipfsURL) => {
	const { PRIVATEKEY, RPC_URL } = process.env;

	// mint the nft
	// transfer the nft to the user

	try {
		const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
		const signer = new ethers.Wallet(PRIVATEKEY, provider);
		const contract = new ethers.Contract(
			contractAddress_polygon_mumbai,
			abi,
			signer,
		);
		const tx = await contract.mintAward(userAddress, ipfsURL);
		await tx.wait();
		console.log(`receipt: ${tx.hash}`);

		return {
			message: "mintAndTransferNFT: NFT Minted Successfully",
			status: "success",
		};
	} catch (error) {
		console.log(`mintAndTransferNFT: Minting failed => ${error}`);
		return {
			message: `Error: ${error}`,
			status: "failed",
		};
	}
};

// For sending email to the user
const sendEmail = async (senderEmail, text) => {
	try {
		const mg = mailgun({
			apiKey: process.env.MAILGUN_API_KEY,
			domain: process.env.MAILGUN_BASE_URL,
		});
		const data = {
			from: "hello@nftfarword.io",
			to: senderEmail,
			subject: "Hey, you got an NFT gift, claim it now by clicking the link",
			text,
		};

		const body = await mg.messages().send(data);
		console.log(body);
		return {
			status: "success",
			message: `Email sent successfully ${body.message}}`,
		};
	} catch (error) {
		console.log(`Error: ${error}`);
		return {
			status: "failed",
			message: `Error: ${error}`,
		};
	}
};
