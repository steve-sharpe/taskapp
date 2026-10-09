import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { Readable } from 'node:stream';
import { getDb, getBucket } from '@/lib/attachments';

const findFile = async (fileId) => {
  if (!ObjectId.isValid(fileId)) return null;
  const db = await getDb();
  return db.collection('attachments.files').findOne({ _id: new ObjectId(fileId) });
};

export async function GET(request, { params }) {
  try {
    const { fileId } = await params;
    const file = await findFile(fileId);
    if (!file) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

    const bucket = await getBucket();
    const stream = bucket.openDownloadStream(file._id);
    const asciiName = file.filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');

    return new Response(Readable.toWeb(stream), {
      headers: {
        'Content-Type': file.metadata?.type || 'application/octet-stream',
        'Content-Length': String(file.length),
        'Content-Disposition': `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error("GET Attachment Error:", error);
    return NextResponse.json({ error: 'Failed to fetch attachment.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { fileId } = await params;
    const file = await findFile(fileId);
    if (!file) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

    const bucket = await getBucket();
    await bucket.delete(file._id);

    const taskId = file.metadata?.taskId;
    if (taskId && ObjectId.isValid(taskId)) {
      const db = await getDb();
      await db.collection('tasks').updateOne(
        { _id: new ObjectId(taskId) },
        { $pull: { attachments: { id: fileId } }, $set: { updatedAt: new Date() } }
      );
      const updatedTask = await db.collection('tasks').findOne({ _id: new ObjectId(taskId) });
      return NextResponse.json(updatedTask);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Attachment Error:", error);
    return NextResponse.json({ error: 'Failed to delete attachment.' }, { status: 500 });
  }
}
