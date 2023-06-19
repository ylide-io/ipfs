import dotenv from 'dotenv';
import http from 'http';
import busboy from 'busboy';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const cachedHashes: string[] = [
	'QmPNxHsuCpjCoUx8hvanCdzgwQH5CcXcUusvJ2cLyYz8r4',
	'QmUvZc5jmPa5GK7R5KATH5i4n9uUQPh8vPC9k7oB9oMdER',
	'QmdyTMTvKZLg33aRy3Y4ELDu5mn7pvcFbLL8KmSxhM96YR',
	'QmWEBrZzyak2qbDu825q385arxURqKM7GiyffMBTxzidct',
	'QmTRYuhzMYZ1vF8nFNh41K2KN6pF7VQu25BEmGbPoj6Ny8',
	'QmVhfBAsFKnoV4dFtaWWqEAtNTnQmAW3TjJogakvj9VwuU',
	'QmWVkC5on7f6QD4gJTRfjNb6GVYdPa6YJn8JGuU5kDdpZX',
	'QmXnUQwtiTbmedQwZ74LybbHJWMgePTvoRPTUTgCEVkWvT',
	'QmQf26iMvegpgNAiuc2SqDVL2vvwL8Q8wHJajVz3ZzWpZ3',
	'QmQ2cdJmHPtwQEKysejQLfc3JCiwYd7X7CuqLtgHUqNH7U',
	'QmRQk35pqdBj8xo57RzphdpiK5hmf7kGHZ45V2uLAi34UG',
	'QmTovX2GyBwJ5uKKudQ6r5zwjbKr8DEibp7Emodqw19Ta2',
	'QmU9CZfWpAbRNfpU2m515t5mPCiEs3TRH7G1rNdbyK9ZRg',
	'QmU8E9wHZq4TzCAzg4CL9EC7CGD2gBKdH6PbAMwGo2ZqUo',
	'QmRC1MLd2PEb3dRTKNE5z57KPgEfTkvAPX5tfvHjAZiScb',
	'Qme7Cuyk5NezKTXu5gCoNxAXrGv9T6JaUeBGTd1wmPbfpo',
	'QmetxtnQQP71YEn16YkwbrWhN98hjewgSq5vQKQjPpxeE1',
	'QmPrTT1x37dDwDsCPzvAppLgxQhsAExLyr8RjwYyRSE2oV',
	'QmdfDTHJGqFGkds6FaS4NTEqVPUapp33CHChk8Nj5ToCTz',
	'QmTAGJ7HEEFtmqPaUe3bJZwZ8RUKwBDug94AKG5rJ28puT',
	'QmdguqNpb2bUKg6znVSyXtKRaNrtrYVxchaof7xryjarhE',
	'QmW4oWhz6onHJSaWYBTVF68XCgvr8MSrs6m73dJd3tRLTb',
	'QmX9QLWtfw1Q2RddP6UNEzRFSkZwy7NcNbwxstqRpBg5P2',
	'QmZVpzzAyKnFXDLpJze7H22p8igxRfuLHCikPA3YMRhLg7',
	'QmSwxecFnFjbe44HJ3pQdLrytrZNcM48XGPbvaTbxWZsCk',
	'QmbYpa9m8QsCuyTG4tPYHtok2Cf7raJrtap9kMsND5Y25x',
];

const run = async () => {
	const env = dotenv.config();

	const IPFS_PUBLIC_KEY = env.parsed!.IPFS_PUBLIC_KEY;
	const IPFS_SECRET_KEY = env.parsed!.IPFS_SECRET_KEY;
	const IPFS_API = env.parsed!.IPFS_API;

	const origins = ['http://localhost:3000', 'https://hub.ylide.io'];

	if (!fs.existsSync('cache')) {
		fs.mkdirSync('cache');
	}

	for (const hash of cachedHashes) {
		if (!fs.existsSync(`cache/${hash}`)) {
			const response = await fetch(`https://ipfs.infura.io:5001/api/v0/cat?arg=${hash}`, {
				method: 'POST',
				headers: {
					Authorization: `Basic ${Buffer.from(`${IPFS_PUBLIC_KEY}:${IPFS_SECRET_KEY}`).toString('base64')}`,
				},
			});
			if (response.status !== 200) {
				console.error(`Error downloading cache file: ${response.status} ${response.statusText}`);
				return;
			}
			const stream = fs.createWriteStream(`cache/${hash}`);
			response.body.pipe(stream);
		}
	}

	const PORT = parseInt(env.parsed!.PORT, 10);

	const server = new http.Server((req, res) => {
		// if (!req.headers.origin || !origins.includes(req.headers.origin)) {
		// 	res.writeHead(403, { 'Content-Type': 'text/plain' });
		// 	res.end('Forbidden');
		// 	return;
		// }
		if (req.method === 'OPTIONS') {
			res.writeHead(200, {
				'Access-Control-Allow-Origin': req.headers.origin,
				'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400',
			});
			res.end();
		} else if (req.method === 'POST') {
			const bb = busboy({ headers: req.headers });
			let filesCount = 0;
			bb.on('file', (name, file, info) => {
				if (name !== 'file' || filesCount !== 0) {
					return;
				}
				filesCount++;

				const { filename, encoding, mimeType } = info;

				const formData = new FormData();
				formData.append('file', file);

				fetch(`https://ipfs.infura.io:5001/api/v0/add?pin=true`, {
					// fetch(`${IPFS_API}/api/v0/add`, {
					//
					method: 'POST',
					headers: {
						Authorization: `Basic ${Buffer.from(`${IPFS_PUBLIC_KEY}:${IPFS_SECRET_KEY}`).toString(
							'base64',
						)}`,
					},
					body: formData,
				})
					.then(result => {
						if (result.status === 200) {
							result
								.json()
								.then(json => {
									res.writeHead(
										200,
										req.headers.origin
											? {
													'Access-Control-Allow-Origin': req.headers.origin,
													'Content-Type': 'application/json',
											  }
											: {
													'Content-Type': 'application/json',
											  },
									);
									res.end(JSON.stringify(json));
								})
								.catch(err => {
									console.log(err);
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									res.end('Internal Uploading Error (json)');
								});
						} else {
							console.error(`Error uploading file: ${result.status} ${result.statusText}`);
							res.writeHead(500, { 'Content-Type': 'text/plain' });
							res.end('Internal Uploading Error (status)');
						}
					})
					.catch(err => {
						console.error(`Error uploading file: ${err}`);
						res.writeHead(500, { 'Content-Type': 'text/plain' });
						res.end('Internal Uploading Error (fetch)');
					});
			});
			bb.on('finish', () => {
				if (filesCount === 0) {
					res.writeHead(400, 'Bad Request');
					res.end();
				}
			});
			req.pipe(bb);
		} else if (req.method === 'GET') {
			if (req.url && req.url.startsWith('/file/')) {
				const hash = new URL(`a://b${req.url}`).pathname.split('/')[2];
				if (cachedHashes.includes(hash)) {
					const stream = fs.createReadStream(`cache/${hash}`);
					res.writeHead(
						200,
						req.headers.origin
							? {
									'Access-Control-Allow-Origin': req.headers.origin,
									'Content-Type': 'application/octet-stream',
							  }
							: {
									'Content-Type': 'application/octet-stream',
							  },
					);
					stream.pipe(res);
					return;
				}
				fetch(`https://ipfs.infura.io:5001/api/v0/cat?arg=${hash}`, {
					method: 'POST',
					headers: {
						Authorization: `Basic ${Buffer.from(`${IPFS_PUBLIC_KEY}:${IPFS_SECRET_KEY}`).toString(
							'base64',
						)}`,
					},
				})
					.then(result => {
						if (result.status === 200) {
							res.writeHead(
								200,
								req.headers.origin
									? {
											'Access-Control-Allow-Origin': req.headers.origin,
											'Content-Type': 'application/octet-stream',
									  }
									: {
											'Content-Type': 'application/octet-stream',
									  },
							);
							result.body.pipe(res);
						} else {
							console.error(`[${hash}] Error downloading file: ${result.status} ${result.statusText}`);
							res.writeHead(500, { 'Content-Type': 'text/plain' });
							res.end('Internal Downloading Error (status)');
						}
					})
					.catch(err => {
						console.error(`[${hash}] Error downloading file: ${err}`);
						res.writeHead(500, { 'Content-Type': 'text/plain' });
						res.end('Internal Downloading Error (fetch)');
					});
			} else {
				res.writeHead(400, 'Bad Request');
			}
		}
	});

	server.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
};

run();
