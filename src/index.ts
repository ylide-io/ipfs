import dotenv from 'dotenv';
import http from 'http';
import busboy from 'busboy';
import fetch from 'node-fetch';
import FormData from 'form-data';

const run = async () => {
	const env = dotenv.config();

	const IPFS_PUBLIC_KEY = env.parsed!.IPFS_PUBLIC_KEY;
	const IPFS_SECRET_KEY = env.parsed!.IPFS_SECRET_KEY;
	const IPFS_API = env.parsed!.IPFS_API;

	const origins = ['http://localhost:3000', 'https://hub.ylide.io'];

	const PORT = parseInt(env.parsed!.PORT, 10);

	const server = new http.Server((req, res) => {
		if (!req.headers.origin || !origins.includes(req.headers.origin)) {
			res.writeHead(403, { 'Content-Type': 'text/plain' });
			res.end('Forbidden');
			return;
		}
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
									res.writeHead(200, {
										'Content-Type': 'application/json',
									});
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
							res.writeHead(200, {
								'Content-Type': 'application/octet-stream',
							});
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
