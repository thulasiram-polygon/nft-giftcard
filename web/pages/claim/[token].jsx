import {
	Button,
	VStack,
	Heading,
	Text,
	Box,
	CircularProgress,
	Center,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { ethers } from "ethers";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { useRouter } from "next/router";
import UserNFTsArea from "../../components/UserNFTs";
import { modifyIPFSUrl } from "../../helpers/utils";

const contractAddress = "0xfc8f9C79aa5075aeD52846348654fd11ea6fe6B7";
const contractABI = [
	"function balanceOf(address owner) view returns (uint256)",
	"function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
	"function tokenURI(uint _tokenId) public view  override returns (string memory)",
];

const MintToken = () => {
	const router = useRouter();
	const provider = new GoogleAuthProvider();
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState(null);
	const [address, setAccountAddress] = useState(null);
	const [userNFTs, setUserNFTs] = useState([]);
	const [stateLoading, setStateLoading] = useState(false);

	useEffect(() => {
		fetchInitialData();
	}, [user]);

	const fetchUserNFTs = async () => {
		if (window) {
			const { ethereum } = window;
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();

			const contract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer,
			);
			const balance = await contract.balanceOf(address);
			console.log("Balance: ", balance.toNumber());
			let tokenURIs = [];
			for (let i = 0; i < balance.toNumber(); i++) {
				const id = await contract.tokenOfOwnerByIndex(address, i);
				//get the token uri for the id
				const uri = await contract.tokenURI(id.toNumber());
				console.log(modifyIPFSUrl(uri));
				tokenURIs.push(modifyIPFSUrl(uri));
			}
			console.log(tokenURIs);
			setUserNFTs(tokenURIs);
		}
	};

	const fetchInitialData = async () => {
		setStateLoading(true);
		await getAddress();
		if (address) {
			await fetchUserNFTs();
		}

		setStateLoading(false);
	};

	const getAddress = async () => {
		if (window) {
			const { ethereum } = window;
			if (ethereum) {
				const accounts = await ethereum.request({
					method: "eth_accounts",
				});
				if (accounts.length !== 0) {
					const account = ethers.utils.getAddress(accounts[0]);
					console.log(`Found an autharized account ${account}`);
					setAccountAddress(account);
				}
			}
		}
	};

	const signInWithGoogle = async () => {
		try {
			const result = await signInWithPopup(auth, provider);
			const credential = GoogleAuthProvider.credentialFromResult(result);
			const token = credential.accessToken;
			// The signed-in user info.
			const user = result.user;
			if (!!user) {
				setUser(user);
			}
			console.log(user);
		} catch (error) {
			return alert(error.message);
		}
	};

	const signOut = async () => {
		try {
			await auth.signOut();
			setUser(null);
		} catch (error) {
			console.log(error);
		}
	};

	const returnSignIn = () => {
		return (
			<Button colorScheme='blue' onClick={signInWithGoogle}>
				Signin With Google
			</Button>
		);
	};

	const claimToken = async () => {
		setLoading(true);
		try {
			const claimToken = httpsCallable(functions, "claimNFT");
			const result = await claimToken({
				tokenId: router.query.token,
				userAddress: address,
			});
			console.log(result);
			alert(`Success: ${result.data}`);
			setLoading(false);
		} catch (error) {
			alert(`Error: ${error.message}`);
			setLoading(false);
		}
	};

	const returnClaimNFT = () => {
		return (
			<VStack w='full' spacing={4} h='full' bg='white' rounded='2xl' p={8}>
				<Box h='80%' w='full'>
					<UserNFTsArea nftIpfsUrls={userNFTs} />
				</Box>

				{/* {<Text>{`${router.query.token}`}</Text>} */}
				<Button
					colorScheme='green'
					onClick={claimToken}
					isLoading={loading}
					m={8}
				>
					{"You have a token => Claim IT"}
				</Button>
			</VStack>
		);
	};

	// Method triggerd when we are trying to connect
	// to the wallet
	const connectWallet = async () => {
		try {
			const { ethereum } = window;
			if (!ethereum) {
				alert(
					"Get Metamask To connect with the blockchain => https://metamask.io/",
				);
				return;
			}
			// Request wallet accounts access
			const accounts = await ethereum.request({
				method: "eth_requestAccounts",
			});

			//If we got the access we will get this line printed
			console.log(`Connected : ${accounts[0]}`);
			setAccountAddress(accounts[0]);
			const chainId = await ethereum.request({ method: "eth_chainId" });
			console.log(`Chain id ${chainId}`);
			setNetwork(network[chainId]);
			// ethereum.on("chainChanged", handleChainChanged);

			// // Refreshes the page when chain id changed
			// function handleChainChanged(chainId) {
			// 	window.location.reload();
			// }
		} catch (error) {
			return alert(`Error connecting to metamask, \n Error: ${error}`);
		}
	};

	if (stateLoading) {
		return (
			<Box h='100vh' w='100%'>
				<Center>
					<CircularProgress />
				</Center>
			</Box>
		);
	}

	return (
		<VStack h='100vh' w='full' bg='gray.200' p={16} spacing={6}>
			<Heading>Claim your nft</Heading>

			<Box justify='center' align='center'>
				<Text>
					{!!user ? (
						<Button onClick={signOut} variant='ghost'>
							{user.email}
						</Button>
					) : (
						"User not logged in"
					)}
				</Text>
				{!!address ? (
					<Text>{`${address.slice(0, 5)}...${address.slice(
						-5,
						address.length,
					)}`}</Text>
				) : (
					<Button onClick={connectWallet}>{"Connect with wallet"}</Button>
				)}
			</Box>

			{!!user ? returnClaimNFT() : returnSignIn()}
		</VStack>
	);
};

export default MintToken;
