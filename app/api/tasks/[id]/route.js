import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getBucket } from '@/lib/attachments';

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'work_tracker');
};

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    if (!data.task || data.task.trim() === '') {
      return NextResponse.json({ error: 'Task description is required.' }, { status: 400 });
    }

    const now = new Date();
    const db = await getDb();
    
    // Check existing to manage completedAt logic
    const existingTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
    if (!existingTask) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });

    let completedAt = existingTask.completedAt;
    if (data.done && !existingTask.done) completedAt = now;
    if (!data.done) completedAt = null;

    const updateDoc = {
      $set: {
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        task: data.task.trim(),
        notes: data.notes || '',
        ian: Boolean(data.ian),
        vendor: Boolean(data.vendor),
        done: Boolean(data.done),
        updatedAt: now,
        completedAt: completedAt,
      }
    };

    await db.collection('tasks').updateOne({ _id: new ObjectId(id) }, updateDoc);
    const updatedTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("PUT Task Error:", error);
    return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'A single valid boolean status is required.' }, { status: 400 });
    }

    const statusFields = ['ian', 'vendor', 'done'];
    const fields = Object.keys(data);
    if (fields.length !== 1 || !statusFields.includes(fields[0]) || typeof data[fields[0]] !== 'boolean') {
      return NextResponse.json({ error: 'A single valid boolean status is required.' }, { status: 400 });
    }
    const status = fields[0];
    
    const db = await getDb();
    const existingTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
    if (!existingTask) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });

    const now = new Date();
    const statusUpdates = { [status]: data[status], updatedAt: now };
    if (status === 'done') statusUpdates.completedAt = data.done ? now : null;

    await db.collection('tasks').updateOne(
      { _id: new ObjectId(id) },
      { $set: statusUpdates }
    );
    const updatedTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("PATCH Task Error:", error);
    return NextResponse.json({ error: 'Failed to patch task status.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const existingTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
    if (existingTask?.attachments?.length) {
      const bucket = await getBucket();
      await Promise.all(
        existingTask.attachments.map(a => bucket.delete(new ObjectId(a.id)).catch(() => null))
      );
    }
    await db.collection('tasks').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: 'Failed to delete task.' }, { status: 500 });
  }
}