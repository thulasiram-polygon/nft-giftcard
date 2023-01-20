import { Box, Center, HStack, Text, VStack } from "@chakra-ui/react";
import React from "react";
import SingleNFT from "./SingleNFT";

const UserNFTs = ({ nftIpfsUrls }) => {
	if (nftIpfsUrls.length === 0) {
		return (
			<VStack w='full' h='full' justify='center'>
				<Center>
					<Text fontSize='xl' fontWeight='bold'>
						No NFTs
					</Text>
				</Center>
			</VStack>
		);
	}
	return (
		<HStack w='full' h='full' justify='space-between'>
			{nftIpfsUrls.map((ipfsUrl, index) => {
				return <SingleNFT key={index} nftIpfsUrl={ipfsUrl} />;
			})}
		</HStack>
	);
};

export default UserNFTs;
