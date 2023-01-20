import { VStack, Heading, Button } from "@chakra-ui/react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "next/router";

export default function Home() {
	const router = useRouter();

	const provider = new GoogleAuthProvider();

	const signInWithGoogle = async () => {
		try {
			const result = await signInWithPopup(auth, provider);
			const credential = GoogleAuthProvider.credentialFromResult(result);
			const token = credential.accessToken;
			// The signed-in user info.
			const user = result.user;
			if (!!user) {
				router.push("/dashboard");
			}
			console.log(user);
		} catch (error) {
			return alert(error.message);
		}
	};
	return (
		<VStack
			width='full'
			h='100vh'
			bg='gray.200'
			justify='center'
			align='center'
		>
			<VStack>
				<Button colorScheme='blue' onClick={signInWithGoogle}>
					{"Signin With Google"}
				</Button>
			</VStack>
		</VStack>
	);
}
