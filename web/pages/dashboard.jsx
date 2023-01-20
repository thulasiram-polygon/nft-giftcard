import {
	VStack,
	Text,
	HStack,
	Heading,
	Image,
	Input,
	Textarea,
	Button,
	Center,
	Spinner,
} from "@chakra-ui/react";
import React, { useState, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
// The 'mime' npm package helps us set the correct file type on our File objects
import mime from "mime";

// Import the NFTStorage class and File constructor from the 'nft.storage' package
import { NFTStorage, File } from "nft.storage";
const Dashboard = () => {
	// console.log("Token is ", process.env.NEXT_PUBLIC_NFT_STORAGE_API_KAY);
	const inputRef = useRef();
	const [loading, setLoading] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [reciverEmailId, setReciverEmailId] = useState("");
	const [imageData, setImageData] = useState("");
	const [imageUploading, setImageUploading] = useState(false);

	// const ipfsURL =
	// 	"https://gateway.pinata.cloud/ipfs/QmY4W57EYTb72agwu1m4JfmLQC6hC8jCtYE7AyHrZMjZtN";

	const onChange = (e) => {
		const value = e.target.value;
		const name = e.target.name;

		if (name === "NAME") {
			setTitle(value);
		}
		if (name === "DESCRIPTION") {
			setDescription(value);
		}
		if (name === "EMAIL") {
			setReciverEmailId(value);
		}
	};

	/**
	 * On image selected, it will set the image data to state
	
	 * @param e : Event Obj
	 */
	const onImageChange = async (e) => {
		setImageData(null);

		const file = e.target.files[0];
		setImageData(file);
	};

	/**
	 * 1. Upload the image to IPFS
	 * 2. Create the NFT metadata ipfs url
	 * 3. Store the NFT data in the firebase
	 * 4. Send the email to the reciverEmailId
	 * @param e : Event Obj
	 * @returns
	 */

	const mintNFT = async () => {
		if (!title || !description || !reciverEmailId || !imageData) {
			return alert("Please fill all the fields");
		}

		setLoading(true);

		try {
			// Create a new NFTStorage client
			//console.log(`Token: ${NEXT_PUBLIC_NFT_STORAGE_API_KAY}`);
			const client = new NFTStorage({
				token: process.env.NEXT_PUBLIC_NFT_STORAGE_API_KAY,
			});
			const type = mime.getType(imageData.name);
			const file = new File([imageData], imageData.name, { type });
			// Create a new File object from the image data

			const metadata = await client.store({
				title: `${title}`,
				description: `${description}`,
				image: file,
			});
			console.log(
				"Metadata stored on Filecoin and IPFS with URL:",
				metadata.url,
			);

			// Store the data into the firebase by calling the cloud function
			// NOTE: The this cloud function will create the firestore document and
			// will send the email to the reciverEmailId
			const mintNFT = httpsCallable(functions, "createNFTRequest");
			const ipfsURL = metadata.url;

			const data = await mintNFT({
				title,
				description,
				ipfsURL,
				reciverEmailId,
			});
			console.log(data);
			setLoading(false);
			alert(`Success: ${data.data.message}`);
		} catch (error) {
			console.log(error);
			setLoading(false);
			alert(error.message);
		}
	};

	const imageUploadArea = () => {
		return (
			<VStack
				w='50%'
				h='80%'
				as={Button}
				onClick={inputRef ? () => inputRef.current?.click() : null}
				bg='white'
				padding={4}
				borderRadius={8}
				border='2px solid #eaeaea'
			>
				<input
					type='file'
					accept='image/*'
					style={{ display: "none" }}
					onChange={onImageChange}
					ref={inputRef}
				/>
				{imageData ? (
					<Image
						src={imageData && URL.createObjectURL(imageData)}
						alt='NFt image'
						width='100%'
						height='100%'
						objectFit='contain'
					/>
				) : (
					<Center>
						{imageUploading ? <Spinner /> : <Text>Upload Image</Text>}
					</Center>
				)}
			</VStack>
		);
	};

	return (
		<VStack h='100vh' w='full' bg='gray.200' p={16} spacing={6}>
			<Heading>Mint Gift NFT</Heading>
			<HStack
				w='full'
				h='full'
				bg='white'
				rounded='2xl'
				p={8}
				justify='space-between'
			>
				{imageUploadArea()}

				<VStack w='40%' p={4} spacing={8} align='top' justify='center'>
					{/* <Text>{`Ipfs Url: ${ipfsURL}`}</Text> */}
					<Input
						placeholder='Name'
						variant='outline'
						borderColor='black'
						value={title || ""}
						name='NAME'
						onChange={onChange}
					/>
					<Textarea
						placeholder='Description'
						borderColor='black'
						value={description || ""}
						name='DESCRIPTION'
						onChange={onChange}
					/>

					<Input
						placeholder='Senders Email'
						borderColor='black'
						onChange={onChange}
						value={reciverEmailId || ""}
						name='EMAIL'
					/>
					<Button
						colorScheme='blue'
						size='md'
						disabled={reciverEmailId?.length < 8}
						isLoading={loading}
						onClick={mintNFT}
					>
						Submit
					</Button>
				</VStack>
			</HStack>
		</VStack>
	);
};

export default Dashboard;
