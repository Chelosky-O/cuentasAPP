import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    const { name } = req.body;

    try {
      const client = await clientPromise;
      const db = client.db("cuentasDB");

      await db.collection("usuarios").deleteOne({ name });

      res.status(200).json({ message: "Usuario eliminado" });
    } catch (error) {
      res.status(500).json({ error: "No se pudo eliminar el usuario" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
