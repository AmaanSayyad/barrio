import { useContext, useEffect, useState } from "react";
import { Disclosure, Tab } from "@headlessui/react";
import { StarIcon } from "@heroicons/react/solid";
import { HeartIcon, MinusSmIcon, PlusSmIcon } from "@heroicons/react/outline";
import { getListing } from "../../utils/getOrbitData";
import { useRouter } from "next/router";
import { makeGatewayURL } from "../../utils/getIpfs";
import getWeb3 from "../../utils/getWeb3";
import { CardListing, Offer } from "../listings";
import ErrorAlert from "../../components/ErrorAlert";
import SuccessAlert from "../../components/SuccessAlert";
import { ListingsContext } from "../../context/listings";

function classNames(...classes: any[]) {
	return classes.filter(Boolean).join(" ");
}

export default function Listing() {
	const { getAllProducts } = useContext<any>(ListingsContext);
	const router = useRouter();
	const { cid } = router.query;

	const [product, setProduct] = useState<CardListing>(null as any);
	const [isLoading, setLoading] = useState(false);

	// errors
	const [showError, setShowError] = useState(false);
	const [error, setError] = useState({
		title: "Unknown Error Occurred",
		message: "Sorry about that...",
	});

	// successAlert
	const [showAlert, setShowAlert] = useState(false);
	const [alert, setAlert] = useState({
		title: "Wow something happened!",
		message: "Congrats",
	});

	const makeOfferInMetamask = async (listingId: string) => {
		try {
			await getWeb3.makeOffer(listingId);

			getAllProducts();

			setAlert({
				title: "Success!",
				message: "You've made an offer on this item!",
			});
			setShowAlert(true);
		} catch (err) {
			setError({
				title: "Failed to send offer to smart contract",
				message:
					"Sorry, there was an issue sending your offer to the EVM. Please try again later. Check that you haven't already made an offer on this item before",
			});
			setShowError(true);
		}
	};

	const addOfferData = async (price: string) => {
		try {
			const ethData = await getWeb3.getListingData(cid as string);
			product.offersMade = ethData["buyers"].map((buyer) => {
				return {
					user: buyer,
					price,
				} as Offer;
			});
			product.bought = ethData.bought;
			setProduct(product as any);
		} catch (e) {
			console.warn(e);
		}
	};

	useEffect(() => {
		if (!router.isReady) return;
		setLoading(true);
		getListing(cid as string).then((res) => {
			// fetch the images from ipfs
			const images = res?.data.metadata.fileNames.map((image: string) => {
				return {
					id: image,
					name: image,
					src: makeGatewayURL(cid as string, image),
				};
			});

			const data: CardListing = {
				id: cid as string,
				name: res?.data.metadata.title,
				// date: res?.data.metadata.date,
				user: res?.data.metadata.user,
				price: res?.data.metadata.price,
				description: res?.data.metadata.description,
				location: res?.data.metadata.location,
				images,
				rating: -1,
				bought: false,
				offersMade: [],
			};

			setProduct(data as any);
			setLoading(false);

			addOfferData(res?.data.metadata.price);

			return res;
		});
	}, [router.isReady]);

	if (isLoading) return <p>Loading...</p>;
	if (!product) return <p>No profile data</p>;

	return (
		<div className="bg-white">
			<div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
				<div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
					{/* Image gallery */}
					<Tab.Group as="div" className="flex flex-col-reverse">
						{/* Image selector */}
						<div className="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
							<Tab.List className="grid grid-cols-4 gap-6">
								{product.images.map((image) => (
									<Tab
										key={image.id}
										className="relative h-24 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-opacity-50"
									>
										{({ selected }) => (
											<>
												<span className="sr-only">
													{image.name}
												</span>
												<span className="absolute inset-0 rounded-md overflow-hidden">
													<img
														src={image.src}
														alt={image.name}
														className="w-full h-full object-center object-cover"
													/>
												</span>
												<span
													className={classNames(
														selected
															? "ring-indigo-500"
															: "ring-transparent",
														"absolute inset-0 rounded-md ring-2 ring-offset-2 pointer-events-none"
													)}
													aria-hidden="true"
												/>
											</>
										)}
									</Tab>
								))}
							</Tab.List>
						</div>

						<Tab.Panels className="w-full aspect-w-1 aspect-h-1">
							{product.images.map((image) => (
								<Tab.Panel key={image.id}>
									<img
										src={image.src}
										alt={image.name}
										className="w-full h-full object-center object-cover sm:rounded-lg"
									/>
								</Tab.Panel>
							))}
						</Tab.Panels>
					</Tab.Group>

					{/* Product info */}
					<div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
						<h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
							{product.name}
						</h1>

						<div className="mt-3">
							<h2 className="sr-only">Product information</h2>
							<p className="text-3xl text-gray-900">
								{product.price} ETH
							</p>
						</div>

						{/* Reviews */}
						<div className="mt-3">
							<h3 className="sr-only">Reviews</h3>
							<div className="flex items-center">
								<div className="flex items-center">
									{[0, 1, 2, 3, 4].map((rating) => (
										<StarIcon
											key={rating}
											className={classNames(
												product.rating > rating
													? "text-indigo-500"
													: "text-gray-300",
												"h-5 w-5 flex-shrink-0"
											)}
											aria-hidden="true"
										/>
									))}
									{product.rating > 0 ? (
										""
									) : (
										<p className="text-s text-gray-500">
											This seller hasn't recieved any
											ratings yet
										</p>
									)}
								</div>
								<p className="sr-only">
									{product.rating} out of 5 stars
								</p>
							</div>
						</div>

						<div className="mt-6">
							<h3 className="sr-only">Description</h3>

							<div
								className="text-base text-gray-700 space-y-6"
								dangerouslySetInnerHTML={{
									__html: product.description,
								}}
							/>
						</div>

						<form className="mt-6">
							<div className="mt-10 flex sm:flex-col1">
								{product.bought ? (
									<>
										<span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
											This item has been bought already!
										</span>
									</>
								) : (
									<>
										<button
											type="submit"
											className="max-w-xs flex-1 bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500 sm:w-full"
											onClick={(e) => {
												e.preventDefault();
												makeOfferInMetamask(
													cid as string
												);
											}}
										>
											Buy
										</button>
										<button
											type="button"
											className="ml-4 py-3 px-3 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500"
										>
											<HeartIcon
												className="h-6 w-6 flex-shrink-0"
												aria-hidden="true"
											/>
											<span className="sr-only">
												Add to favorites
											</span>
										</button>
									</>
								)}
								{/* <button
									type="submit"
									className="max-w-xs flex-1 bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500 sm:w-full"
									onClick={(e) => {
										e.preventDefault();
										makeOfferInMetamask(cid as string);
									}}
								>
									Buy
								</button> */}
							</div>
						</form>

						<section
							aria-labelledby="details-heading"
							className="mt-12"
						>
							<h2 id="details-heading" className="sr-only">
								Additional details
							</h2>

							<div className="border-t divide-y divide-gray-200">
								{product.offersMade.length &&
								!product.bought ? (
									<Disclosure as="div" key={cid as string}>
										{({ open }) => (
											<>
												<h3>
													<Disclosure.Button className="group relative w-full py-6 flex justify-between items-center text-left">
														<span
															className={classNames(
																open
																	? "text-indigo-600"
																	: "text-gray-900",
																"text-sm font-medium"
															)}
														>
															{"View offers"}
														</span>
														<span className="ml-6 flex items-center">
															{open ? (
																<MinusSmIcon
																	className="block h-6 w-6 text-indigo-400 group-hover:text-indigo-500"
																	aria-hidden="true"
																/>
															) : (
																<PlusSmIcon
																	className="block h-6 w-6 text-gray-400 group-hover:text-gray-500"
																	aria-hidden="true"
																/>
															)}
														</span>
													</Disclosure.Button>
												</h3>
												<Disclosure.Panel
													as="div"
													className="pb-6 prose prose-sm"
												>
													<ul role="list">
														{product.offersMade.map(
															(offer) => (
																<li
																	key={
																		offer.user
																	}
																>
																	{offer.user}{" "}
																	<b>
																		{
																			offer.price
																		}{" "}
																		ETH
																	</b>
																</li>
															)
														)}
													</ul>
												</Disclosure.Panel>
											</>
										)}
									</Disclosure>
								) : product.bought ? (
									""
								) : (
									"No buyers yet, be the first and make an offer!"
								)}
							</div>
						</section>
					</div>
				</div>
			</div>
			<ErrorAlert
				open={showError}
				setOpen={setShowError}
				errorTitle={error.title}
				errorMessage={error.message}
			/>

			<SuccessAlert
				open={showAlert}
				setOpen={setShowAlert}
				alertTitle={alert.title}
				alertMessage={alert.message}
				callToAction="View my offers"
				navigate={`/my-offers`}
			/>
		</div>
	);
}
