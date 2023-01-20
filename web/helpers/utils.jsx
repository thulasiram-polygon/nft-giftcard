export const modifyIPFSUrl = (url) => {
	// if url start with https then return the url
	if (url.startsWith("https://")) return url;
	return url.replace("ipfs://", "https://ipfs.io/ipfs/");
};
