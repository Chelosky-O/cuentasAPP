import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";
import UserList from "./components/UserList";
import ExpenseForm from "./components/ExpenseForm";
import LogView from "./components/LogView";
import UserDetails from "./components/UserDetails";

function App() {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("all"); // all, payment, expense

  // Fetch users from Supabase on load
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Error fetching users:", error.message);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const addUser = async () => {
    if (newUserName.trim() === "") {
      alert("El nombre del usuario no puede estar vacío.");
      return;
    }
    if (users.some((user) => user.name === newUserName)) {
      alert("El usuario ya existe.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ name: newUserName, debts: [] }])
      .select();

    if (error) {
      console.error("Error adding user:", error.message);
    } else if (Array.isArray(data)) {
      setUsers((prevUsers) => [...prevUsers, ...data]);
      setNewUserName("");
    }
  };

  const removeUser = async (userId) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar este usuario?`)) {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error.message);
      } else {
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      }
    }
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("payments_log")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching logs:", error.message);
    } else {
      setLogs(data);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleBackToMain = () => {
    setSelectedUser(null);
  };

  return (
    <div className="app-container">
      {!selectedUser ? (
        <>
          <h1>CuentasAPP</h1>

          {/* Agregar Gasto */}
          <ExpenseForm users={users} setUsers={setUsers} />

          {/* Lista de Usuarios */}
          <UserList
            users={users}
            onUserClick={handleUserClick}
            removeUser={removeUser}
          />

          {/* Botón para ver historial de pagos y gastos */}
          <button
            className="log-button"
            onClick={() => {
              fetchLogs();
              setSelectedUser("log");
            }}
          >
            Ver Historial de Pagos y Gastos
          </button>

          {/* Crear Usuario */}
          <div className="user-section">
            <h2>Crear Usuario</h2>
            <input
              type="text"
              placeholder="Nombre del usuario"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
            <button onClick={addUser}>Agregar Usuario</button>
          </div>
        </>
      ) : selectedUser === "log" ? (
        <LogView
          logs={logs}
          logFilter={logFilter}
          setLogFilter={setLogFilter}
          onBack={handleBackToMain}
        />

      ) : (
        <UserDetails
          user={selectedUser}
          users={users}
          setUsers={setUsers}
          setSelectedUser={setSelectedUser} // Pasar como prop
          onBack={handleBackToMain}
        />

      )}
    </div>
  );
}

export default App;
