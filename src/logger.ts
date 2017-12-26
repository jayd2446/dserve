import * as bunyan from 'bunyan';
import * as _ from 'lodash';
import { getLogDir, CommitHash, getImageName } from './api';
import { Writable } from 'stream';

const dserveLogger = bunyan.createLogger({
	name: 'dserve',
	streams: [
		{
			type: 'rotating-file',
			path: './logs/log.txt',
			period: '1d',
			count: 30,
		},
		{
			stream: process.stdout,
		},
	],
	serializers: bunyan.stdSerializers, // allows one to use err, req, and res as special keys
});

/* super convenient name */
export const l = {
	log: (...args: any[]) => dserveLogger.info(...args),
	error: (...args: any[]) => dserveLogger.error(...args),
};

/**
 * Creates a child logger that outputs to the build directory and
 * outputs errors to the console.
 *
 * @param commitHash - hash to make logger for
 */
export function getLoggerForBuild(commitHash: CommitHash) {
	const path = getLogDir(commitHash);
	const logger = dserveLogger.child({
		streams: [
			{
				type: 'file',
				path,
			},
			{
				stream: process.stdout,
				level: bunyan.INFO,
			},
		],
		commitHash,
		imageName: getImageName(commitHash),
	});

	// we want it to be a child so that
	// it inherits al the same properties as the parent
	// except we don't want any of the parents streams
	// so this line removes them all
	((logger as any) as Logger).streams = _.filter((logger as any).streams, { path });

	return logger;
}

type Logger = { streams: Array<{ stream: Writable }> };
export function closeLogger(logger: Logger) {
	logger.streams.forEach(stream => {
		stream.stream.end();
	});
}