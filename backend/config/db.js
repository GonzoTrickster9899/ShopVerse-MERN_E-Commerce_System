const mongoose = require('mongoose');
const dns = require('node:dns');

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2 && connectionPromise) return connectionPromise;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  if (connectionPromise) connectionPromise = undefined;

  // Optional resolver override retained for environments where Node's default
  // resolver cannot resolve MongoDB Atlas SRV records.
  const dnsServers = (process.env.MONGODB_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers.length > 0) dns.setServers(dnsServers);

  try {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
    });
    const conn = await connectionPromise;
    console.log('MongoDB connection ready');
    return conn.connection;
  } catch (error) {
    connectionPromise = undefined;
    // Do not print the connection error: driver errors may contain host details.
    console.error('MongoDB connection failed');
    throw error;
  }
};

module.exports = connectDB;
