import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db("cuentasDB");

      const usuarios = await db.collection("usuarios").find({}).toArray();
      res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({ error: "No se pudieron obtener los usuarios" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
