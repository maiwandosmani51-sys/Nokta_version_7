import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../database/connect';
import { User } from '../models/User';

async function createSuperAdmin() {
  console.log('Creating super admin...');
  const hashedPassword = await bcrypt.hash('12345678', 10);
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'admin@gmail.com',
    phone: '0780000000',
    password: hashedPassword,
    role: 'super_admin'
  });
  console.log('Super admin created successfully!');
  console.log('Email: admin@gmail.com');
  console.log('Password: 12345678');
  return superAdmin;
}

async function main() {
  try {
    await connectDatabase();
    await createSuperAdmin();
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main();