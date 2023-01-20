import { Image, VStack, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { modifyIPFSUrl } from "../helpers/utils";
function SingleNFT({ nftIpfsUrl }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [imageUrl, setImageUrl] = useState("");

	useEffect(() => {
		async function fetchNFTData() {
			const res = await fetch(nftIpfsUrl);
			const data = await res.json();
			console.log(data);
			setTitle(data.title);
			setDescription(data.description);
			setImageUrl(data.image);
		}
		fetchNFTData();
	}, [nftIpfsUrl]);
	return (
		<VStack h='250px' w='200px' justify='center' align='center' spacing={4}>
			<Image
				boxSize='200px'
				objectFit='contain'
				src={modifyIPFSUrl(imageUrl)}
				rounded='3xl'
			/>
			<Text fontSize='md' fontWeight='bold'>
				{title}
			</Text>
			<Text fontSize='sm'>{description}</Text>
		</VStack>
	);
}

export default SingleNFT;
