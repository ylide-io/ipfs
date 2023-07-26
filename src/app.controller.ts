import * as busboy from 'busboy';
import fetch from 'node-fetch';
import * as FormData from 'form-data';
import * as fs from 'fs';
import { Request, Response } from 'express';

import { Controller, Get, Param, Post, Req, Res, StreamableFile } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation } from '@nestjs/swagger';
import { Logger } from '@ylide/backend-scripts';
import { ConfigService } from '@nestjs/config';
import { cachedHashes } from './constants';

@Controller()
export class AppController {
	ipfsPublicKey: string;
	ipfsSecretKey: string;
	ipfsApi: string;

	constructor(
		private readonly appService: AppService,
		private readonly logger: Logger,
		private readonly config: ConfigService,
	) {
		this.ipfsPublicKey = this.config.get<string>('ipfs.publicKey');
		this.ipfsSecretKey = this.config.get<string>('ipfs.secretKey');
		this.ipfsApi = this.config.get<string>('ipfs.api');
	}

	@Post()
	@ApiOperation({ summary: `Upload file to IPFS` })
	async uploadFile(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const bb = busboy({ headers: req.headers });
		let filesCount = 0;
		let sent = false;
		bb.on('file', async (name, file) => {
			if (name !== 'file' || filesCount !== 0) {
				return;
			}
			filesCount++;

			// const { filename, encoding, mimeType } = info;

			const formData = new FormData();
			formData.append('file', file);

			try {
				const result = await fetch(`https://ipfs.infura.io:5001/api/v0/add?pin=true`, {
					method: 'POST',
					headers: {
						Authorization: `Basic ${Buffer.from(`${this.ipfsPublicKey}:${this.ipfsSecretKey}`).toString(
							'base64',
						)}`,
					},
					body: formData,
				});
				if (result.status === 200) {
					const json = await result.json();
					sent = true;
					console.log(`1`);
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
				} else {
					console.error(`Error uploading file: ${result.status} ${result.statusText}`);
					sent = true;
					console.log(`2`);
					res.writeHead(500, { 'Content-Type': 'text/plain' });
					res.end('Internal Uploading Error (status)');
				}
			} catch (err) {
				console.error(`Error uploading file: ${err}`);
				sent = true;
				console.log(`3`);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('Internal Uploading Error (fetch)');
			}
		});
		bb.on('finish', () => {
			if (filesCount === 0 && !sent) {
				console.log(`4`);
				res.writeHead(400, 'Bad Request');
				res.end();
			}
		});
		req.pipe(bb);
	}

	@Get('/health')
	@ApiOperation({ summary: `Health check` })
	async healthCheck() {
		return 'OK';
	}

	@Get('/file/:hash')
	@ApiOperation({ summary: `Get file from IPFS` })
	async getFile(@Param('hash') hash: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
		if (cachedHashes.includes(hash)) {
			const stream = fs.createReadStream(`cache/${hash}`);
			res.set('Content-Type', 'application/octet-stream');
			if (req.headers.origin) {
				res.set('Access-Control-Allow-Origin', req.headers.origin);
			}
			return new StreamableFile(stream);
		}

		try {
			const result = await fetch(`https://ipfs.infura.io:5001/api/v0/cat?arg=${hash}`, {
				method: 'POST',
				headers: {
					Authorization: `Basic ${Buffer.from(`${this.ipfsPublicKey}:${this.ipfsSecretKey}`).toString(
						'base64',
					)}`,
				},
			});
			if (result.status === 200) {
				res.set('Content-Type', 'application/octet-stream');
				if (req.headers.origin) {
					res.set('Access-Control-Allow-Origin', req.headers.origin);
				}
				return new StreamableFile(result.body);
			} else {
				console.error(`[${hash}] Error downloading file: ${result.status} ${result.statusText}`);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('Internal Downloading Error (status)');
			}
		} catch (err) {
			console.error(`[${hash}] Error downloading file: ${err}`);
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('Internal Downloading Error (fetch)');
		}
	}
}
