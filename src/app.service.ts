import fetch from 'node-fetch';
import fs from 'fs';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { cachedHashes } from './constants';

@Injectable()
export class AppService {

	ipfsPublicKey: string;
	ipfsSecretKey: string;
	ipfsApi: string;

	constructor(private readonly logger: Logger, private readonly config: ConfigService) {
		this.ipfsPublicKey = this.config.get<string>('ipfs.publicKey');
		this.ipfsSecretKey = this.config.get<string>('ipfs.secretKey');
		this.ipfsApi = this.config.get<string>('ipfs.api');
	}
	
	async init() {
		if (!fs.existsSync('cache')) {
			fs.mkdirSync('cache');
		}

		for (const hash of cachedHashes) {
			if (!fs.existsSync(`cache/${hash}`)) {
				const response = await fetch(`https://ipfs.infura.io:5001/api/v0/cat?arg=${hash}`, {
					method: 'POST',
					headers: {
						Authorization: `Basic ${Buffer.from(`${this.ipfsPublicKey}:${this.ipfsSecretKey}`).toString('base64')}`,
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
	}
}
