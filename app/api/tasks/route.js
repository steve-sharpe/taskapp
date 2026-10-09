import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'work_tracker');
};

export async function GET() {
  try {
    const db = await getDb();
    const tasks = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET Tasks Error:", error);
    return NextResponse.json({ error: 'Failed to fetch tasks.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.task || data.task.trim() === '') {
      return NextResponse.json({ error: 'Task description is required.' }, { status: 400 });
    }

    const now = new Date();
    const newTask = {
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      task: data.task.trim(),
      notes: data.notes || '',
      ian: Boolean(data.ian),
      vendor: Boolean(data.vendor),
      done: Boolean(data.done),
      createdAt: now,
      updatedAt: now,
      completedAt: Boolean(data.done) ? now : null,
    };

    const db = await getDb();
    const result = await db.collection('tasks').insertOne(newTask);
    
    return NextResponse.json({ ...newTask, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("POST Task Error:", error);
    return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 });
  }
}