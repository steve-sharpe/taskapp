import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { getDb, getBucket, MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD } from '@/lib/attachments';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid task id.' }, { status: 400 });

    const formData = await request.formData();
    const files = formData.getAll('files').filter(f => typeof f !== 'string' && f.size > 0);

    if (files.length === 0) return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json({ error: `You can upload up to ${MAX_FILES_PER_UPLOAD} files at a time.` }, { status: 400 });
    }
    const tooLarge = files.find(f => f.size > MAX_FILE_SIZE);
    if (tooLarge) {
      return NextResponse.json({ error: `"${tooLarge.name}" exceeds the ${MAX_FILE_SIZE / 1024 / 1024} MB limit.` }, { status: 400 });
    }

    const db = await getDb();
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
    if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });

    const bucket = await getBucket();
    const saved = [];

    for (const file of files) {
      const type = file.type || 'application/octet-stream';
      const upload = bucket.openUploadStream(file.name, { metadata: { taskId: id, type } });
      await pipeline(Readable.fromWeb(file.stream()), upload);
      saved.push({ id: upload.id.toString(), name: file.name, size: file.size, type, uploadedAt: new Date() });
    }

    await db.collection('tasks').updateOne(
      { _id: new ObjectId(id) },
      { $push: { attachments: { $each: saved } }, $set: { updatedAt: new Date() } }
    );
    const updatedTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });

    return NextResponse.json(updatedTask, { status: 201 });
  } catch (error) {
    console.error("Upload Attachments Error:", error);
    return NextResponse.json({ error: 'Failed to upload attachments.' }, { status: 500 });
  }
}
