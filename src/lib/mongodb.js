import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // URL de conexión desde las variables de entorno
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Por favor, agrega MONGODB_URI en tus variables de entorno");
}

if (process.env.NODE_ENV === "development") {
  // En desarrollo, reutilizamos la conexión
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, creamos una nueva conexión
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
