import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import { createListing } from "./getData";

function App() {
	const [name, setName] = useState("");
	const [selectedFile, setSelectedFile] = useState();

	const submitForm = async (event) => {
		event.preventDefault();
		console.log(event, name, selectedFile);

		createListing(selectedFile);
	};

	// upload file to server, wait for hash
	// start web3 process to interact with smart contract and create the listing

	return (
		<div className="App">
			<header className="App-header">
				<form>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>

					<input
						type="file"
						onChange={(e) => setSelectedFile(e.target.files[0])}
					/>
					<div>
						<button onClick={(e) => submitForm(e)}>Submit</button>
					</div>
				</form>
			</header>
		</div>
	);
}

export default App;
