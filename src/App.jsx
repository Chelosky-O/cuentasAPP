import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

function App() {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");

  // Obtener usuarios al cargar la aplicación
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Error fetching users:", error.message);
      } else {
        setUsers(data);
      }
    };
    fetchUsers();
  }, []);

  // Agregar un nuevo usuario
  const addUser = async () => {
    if (newUserName.trim() === "") {
      alert("El nombre no puede estar vacío.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ name: newUserName, debts: [] }]);

    if (error) {
      console.error("Error adding user:", error.message);
    } else {
      setUsers([...users, ...data]);
      setNewUserName("");
    }
  };

  // Eliminar un usuario
  const deleteUser = async (userId) => {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) {
      console.error("Error deleting user:", error.message);
    } else {
      setUsers(users.filter((user) => user.id !== userId));
    }
  };

  return (
    <div className="app">
      <h1>Supabase + React</h1>
      <div>
        <input
          type="text"
          placeholder="Nombre del usuario"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
        />
        <button onClick={addUser}>Agregar Usuario</button>
      </div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name}{" "}
            <button onClick={() => deleteUser(user.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
