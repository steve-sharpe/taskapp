import { GridFSBucket } from 'mongodb';
import clientPromise from '@/lib/mongodb';

import { MAX_FILE_SIZE, MAX_FILES } from '@/lib/attachmentUtils';

export { MAX_FILE_SIZE };
export const MAX_FILES_PER_UPLOAD = MAX_FILES;

export const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'work_tracker');
};

export const getBucket = async () => {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: 'attachments' });
};
