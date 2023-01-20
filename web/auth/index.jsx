import { auth } from "../firebase";
import Login from "../components/Login";

const withAuth = (Component) => {
	const Auth = (props) => {
		// If user is not logged in, return login component
		if (auth.currentUser) {
			return <Login />;
		}

		// If user is logged in, return original component
		return <Component {...props} />;
	};

	// // Copy getInitial props so it will run as well
	// if (Component.getInitialProps) {
	// 	Auth.getInitialProps = Component.getInitialProps;
	// }

	return Auth;
};

export default withAuth;
