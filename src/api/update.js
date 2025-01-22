import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { name, debts } = req.body;

    try {
      const client = await clientPromise;
      const db = client.db("cuentasDB");

      await db.collection("usuarios").updateOne(
        { name },
        { $set: { debts } }
      );

      res.status(200).json({ message: "Deudas actualizadas" });
    } catch (error) {
      res.status(500).json({ error: "No se pudieron actualizar las deudas" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
