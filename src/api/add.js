import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name } = req.body;

    try {
      const client = await clientPromise;
      const db = client.db("cuentasDB");

      const user = await db.collection("usuarios").insertOne({
        name,
        debts: [],
      });

      res.status(200).json({ message: "Usuario agregado", user });
    } catch (error) {
      res.status(500).json({ error: "No se pudo agregar el usuario" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
